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
        name: t.String({
          minLength: 1,
          maxLength: 255,
          examples: ["John Doe"],
        }),
        email: t.String({
          minLength: 1,
          maxLength: 255,
          examples: ["john@example.com"],
        }),
        password: t.String({
          minLength: 1,
          maxLength: 255,
          examples: ["password123"],
        }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Registrasi pengguna baru",
        description:
          "Mendaftarkan user baru dengan name (max 255), email unik (max 255), dan password (max 255).",
        responses: {
          200: {
            description: "Registrasi user berhasil",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "string", example: "OK" },
                  },
                },
                example: {
                  data: "OK",
                },
              },
            },
          },
          400: {
            description: "Validasi gagal atau email sudah terdaftar",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Email already registered" },
                  },
                },
                example: {
                  error: "Email already registered",
                },
              },
            },
          },
        },
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
        email: t.String({
          minLength: 1,
          maxLength: 255,
          examples: ["john@example.com"],
        }),
        password: t.String({
          minLength: 1,
          maxLength: 255,
          examples: ["password123"],
        }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Login pengguna",
        description:
          "Memverifikasi kredensial pengguna dan menerbitkan session token UUID baru.",
        responses: {
          200: {
            description: "Login berhasil, mengembalikan token session UUID",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "string",
                      example: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                    },
                  },
                },
                example: {
                  data: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                },
              },
            },
          },
          400: {
            description: "Kredensial tidak valid atau user tidak ditemukan",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Invalid credentials" },
                  },
                },
                example: {
                  error: "Invalid credentials",
                },
              },
            },
          },
        },
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
        responses: {
          200: {
            description: "Profil pengguna berhasil didapatkan",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "integer", example: 1 },
                        name: { type: "string", example: "John Doe" },
                        email: { type: "string", example: "john@example.com" },
                      },
                    },
                  },
                },
                example: {
                  data: {
                    id: 1,
                    name: "John Doe",
                    email: "john@example.com",
                  },
                },
              },
            },
          },
          401: {
            description: "Token tidak disediakan atau tidak valid",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Unauthorized" },
                  },
                },
                example: {
                  error: "Unauthorized",
                },
              },
            },
          },
        },
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
        responses: {
          200: {
            description: "Logout berhasil, sesi dinonaktifkan",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "string", example: "ok" },
                  },
                },
                example: {
                  data: "ok",
                },
              },
            },
          },
          401: {
            description: "Token tidak valid atau tidak disediakan",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Unauthorized" },
                  },
                },
                example: {
                  error: "Unauthorized",
                },
              },
            },
          },
        },
      },
    }
  );
