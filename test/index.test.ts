import { describe, test, expect } from "bun:test";
import { app } from "../src/index";

describe("Root & Health Check API", () => {
  test("GET / harus mengembalikan status ok dan pesan selamat datang", async () => {
    const res = await app.handle(new Request("http://localhost:3000/"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.status).toBe("ok");
    expect(body.message).toBe("Server is running with ElysiaJS + Bun + Drizzle + MySQL!");
    expect(body.timestamp).toBeDefined();
  });

  test("GET /health harus mengembalikan status healthy", async () => {
    const res = await app.handle(new Request("http://localhost:3000/health"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.status).toBe("healthy");
  });

  test("GET /swagger harus mengembalikan halaman Swagger UI (status 200)", async () => {
    const res = await app.handle(new Request("http://localhost:3000/swagger"));
    expect(res.status).toBe(200);
  });

  test("GET /swagger/json harus mengembalikan spesifikasi OpenAPI JSON valid", async () => {
    const res = await app.handle(new Request("http://localhost:3000/swagger/json"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.openapi).toBeDefined();
    expect(body.info.title).toBe("Belajar Vibe Coding API Documentation");
    expect(body.paths["/api/users/"]).toBeDefined();
    expect(body.paths["/api/users/login"]).toBeDefined();
    expect(body.paths["/api/users/current"]).toBeDefined();
    expect(body.paths["/api/users/logout"]).toBeDefined();
    expect(body.components.securitySchemes.bearerAuth).toBeDefined();
  });
});
