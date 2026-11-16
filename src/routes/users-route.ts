import { Elysia, t } from "elysia";
import { UserService } from "../services/users-service";
import { extractBearerToken } from "../utils/auth";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post(
    "/",
    async ({ body, set }) => {
      const result = await UserService.registerUser({
        name: body.name,
        email: body.email,
        password: body.password,
      });

      if (!result.success) {
        set.status = 400;
        return {
          error: result.error,
        };
      }

      set.status = 200;
      return {
        data: "OK",
      };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        email: t.String({ minLength: 1, maxLength: 255 }),
        password: t.String({ minLength: 1, maxLength: 255 }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Registrasi pengguna baru",
        description:
          "Mendaftarkan user baru dengan name (max 255), email unik (max 255), dan password (max 255).",
      },
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      const result = await UserService.loginUser({
        email: body.email,
        password: body.password,
      });

      if (!result.success) {
        set.status = 400;
        return {
          error: result.error,
        };
      }

      set.status = 200;
      return {
        data: result.token,
      };
    },
    {
      body: t.Object({
        email: t.String({ minLength: 1, maxLength: 255 }),
        password: t.String({ minLength: 1, maxLength: 255 }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Login pengguna",
        description:
          "Memverifikasi kredensial pengguna dan menerbitkan session token UUID baru.",
      },
    }
  )
  .get(
    "/current",
    async ({ headers, set }) => {
      const token = extractBearerToken(headers["authorization"]);
      if (!token) {
        set.status = 401;
        return {
          error: "Unauthorized",
        };
      }

      const result = await UserService.getCurrentUser(token);
      if (!result.success) {
        set.status = 401;
        return {
          error: result.error,
        };
      }

      set.status = 200;
      return {
        data: result.user,
      };
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Ambil profil user saat ini",
        description:
          "Mengambil data profil pengguna yang sedang login berdasarkan Bearer token.",
        security: [{ bearerAuth: [] }],
      },
    }
  )
  .delete(
    "/logout",
    async ({ headers, set }) => {
      const token = extractBearerToken(headers["authorization"]);
      if (!token) {
        set.status = 401;
        return {
          error: "Unauthorized",
        };
      }

      const result = await UserService.logoutUser(token);
      if (!result.success) {
        set.status = 401;
        return {
          error: result.error,
        };
      }

      set.status = 200;
      return {
        data: "ok",
      };
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Logout pengguna",
        description:
          "Menghapus session aktif pengguna berdasarkan Bearer token dari database.",
        security: [{ bearerAuth: [] }],
      },
    }
  );
