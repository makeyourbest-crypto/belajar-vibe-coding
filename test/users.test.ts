import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { app } from "../src/index";
import { resetDatabase, closeDatabase } from "./helpers/reset-db";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("Users API", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await closeDatabase();
  });

  describe("POST /api/users (Registration)", () => {
    test("Skenario 2.1: Registrasi sukses (Happy Path)", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "eko",
            email: "eko@localhost",
            password: "rahasia",
          }),
        })
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as any;
      expect(json.data).toBe("OK");

      // Verifikasi di database
      const [savedUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, "eko@localhost"))
        .limit(1);

      expect(savedUser).toBeDefined();
      expect(savedUser?.name).toBe("eko");
      expect(savedUser?.password).not.toBe("rahasia");
      const isMatch = await Bun.password.verify("rahasia", savedUser?.password ?? "");
      expect(isMatch).toBe(true);
    });

    test("Skenario 2.2: Email duplikat", async () => {
      // Registrasi awal
      await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "eko",
            email: "eko@localhost",
            password: "rahasia",
          }),
        })
      );

      // Registrasi kedua dengan email yang sama
      const res = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "eko kedua",
            email: "eko@localhost",
            password: "rahasialain",
          }),
        })
      );

      expect(res.status).toBe(400);
      const json = (await res.json()) as any;
      expect(json.error).toBe("Email sudah terdaftar");
    });

    test("Skenario 2.3: Validasi input kosong (Empty fields)", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "",
            email: "eko@localhost",
            password: "rahasia",
          }),
        })
      );

      expect(res.status).toBe(422);
    });

    test("Skenario 2.4: Validasi field hilang (Missing fields)", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "eko",
            email: "eko@localhost",
          }),
        })
      );

      expect(res.status).toBe(422);
    });

    test("Skenario 2.5: Validasi batas panjang maksimum (> 255 karakter)", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "a".repeat(256),
            email: "eko@localhost",
            password: "rahasia",
          }),
        })
      );

      expect(res.status).toBe(422);
    });
  });

  describe("POST /api/users/login (Login)", () => {
    beforeEach(async () => {
      // Daftarkan 1 user default untuk pengujian login
      await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "eko",
            email: "eko@localhost",
            password: "rahasia",
          }),
        })
      );
    });

    test("Skenario 3.1: Login sukses (Happy Path)", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "eko@localhost",
            password: "rahasia",
          }),
        })
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as any;
      expect(json.data).toBeDefined();
      expect(typeof json.data).toBe("string");

      // Verifikasi di database sessions
      const [savedSession] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, json.data))
        .limit(1);

      expect(savedSession).toBeDefined();
      expect(savedSession?.token).toBe(json.data);
    });

    test("Skenario 3.2: Password salah", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "eko@localhost",
            password: "passwordsalah",
          }),
        })
      );

      expect(res.status).toBe(400);
      const json = (await res.json()) as any;
      expect(json.error).toBe("Email atau password salah");
    });

    test("Skenario 3.3: Email tidak terdaftar", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "tidakada@localhost",
            password: "rahasia",
          }),
        })
      );

      expect(res.status).toBe(400);
      const json = (await res.json()) as any;
      expect(json.error).toBe("Email atau password salah");
    });

    test("Skenario 3.4: Validasi input login", async () => {
      const resEmpty = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "",
            password: "",
          }),
        })
      );
      expect(resEmpty.status).toBe(422);

      const resTooLong = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "a".repeat(256),
            password: "rahasia",
          }),
        })
      );
      expect(resTooLong.status).toBe(422);
    });
  });

  describe("GET /api/users/current (Get Current User)", () => {
    let token = "";

    beforeEach(async () => {
      // Registrasi dan login user
      await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "eko",
            email: "eko@localhost",
            password: "rahasia",
          }),
        })
      );

      const loginRes = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "eko@localhost",
            password: "rahasia",
          }),
        })
      );

      const loginJson = (await loginRes.json()) as any;
      token = loginJson.data;
    });

    test("Skenario 4.1: Ambil profil user saat ini sukses (Happy Path)", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as any;
      expect(json.data).toBeDefined();
      expect(json.data.name).toBe("eko");
      expect(json.data.email).toBe("eko@localhost");
      expect(json.data.created_at).toBeDefined();
      expect(json.data.password).toBeUndefined();
    });

    test("Skenario 4.2: Tanpa header Authorization", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
        })
      );

      expect(res.status).toBe(401);
      const json = (await res.json()) as any;
      expect(json.error).toBe("Unauthorized");
    });

    test("Skenario 4.3: Format header Authorization tidak valid", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
          },
        })
      );

      expect(res.status).toBe(401);
      const json = (await res.json()) as any;
      expect(json.error).toBe("Unauthorized");
    });

    test("Skenario 4.4: Token salah / palsu / tidak ada di database", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: {
            Authorization: "Bearer token-palsu-ngawur",
          },
        })
      );

      expect(res.status).toBe(401);
      const json = (await res.json()) as any;
      expect(json.error).toBe("Unauthorized");
    });
  });

  describe("DELETE /api/users/logout (Logout)", () => {
    let token = "";

    beforeEach(async () => {
      // Registrasi dan login user
      await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "eko",
            email: "eko@localhost",
            password: "rahasia",
          }),
        })
      );

      const loginRes = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "eko@localhost",
            password: "rahasia",
          }),
        })
      );

      const loginJson = (await loginRes.json()) as any;
      token = loginJson.data;
    });

    test("Skenario 5.1: Logout sukses (Happy Path)", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as any;
      expect(json.data).toBe("ok");

      // Verifikasi di database session sudah terhapus
      const [sessionInDb] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token))
        .limit(1);
      expect(sessionInDb).toBeUndefined();

      // Token tidak bisa digunakan lagi di /current
      const currentRes = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
      expect(currentRes.status).toBe(401);
    });

    test("Skenario 5.2: Double logout (Token sudah tidak aktif)", async () => {
      // Logout pertama
      await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      // Logout kedua dengan token yang sama
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(res.status).toBe(401);
      const json = (await res.json()) as any;
      expect(json.error).toBe("Unauthorized");
    });

    test("Skenario 5.3: Logout tanpa header Authorization", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
        })
      );

      expect(res.status).toBe(401);
      const json = (await res.json()) as any;
      expect(json.error).toBe("Unauthorized");
    });

    test("Skenario 5.4: Logout dengan token palsu / tidak valid", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer token-palsu-123",
          },
        })
      );

      expect(res.status).toBe(401);
      const json = (await res.json()) as any;
      expect(json.error).toBe("Unauthorized");
    });
  });
});
