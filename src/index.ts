import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { usersRoute } from "./routes/users-route";

const port = Number(process.env.PORT) || 3000;

const app = new Elysia()
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Belajar Vibe Coding API Documentation",
          version: "1.0.0",
          description:
            "Dokumentasi REST API interaktif untuk aplikasi Belajar Vibe Coding menggunakan runtime Bun, ElysiaJS, Drizzle ORM, dan MySQL.",
        },
        tags: [
          { name: "General", description: "Endpoint umum dan status aplikasi" },
          { name: "Users", description: "Endpoint manajemen akun dan otentikasi session" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "UUID",
              description: "Masukkan token session UUID yang didapat dari endpoint login",
            },
          },
        },
      },
    })
  )
  .get(
    "/",
    () => ({
      message: "Server is running with ElysiaJS + Bun + Drizzle + MySQL!",
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
    {
      detail: {
        tags: ["General"],
        summary: "Root server status",
        description: "Mengembalikan status pesan selamat datang dan timestamp server.",
      },
    }
  )
  .get(
    "/health",
    () => ({ status: "healthy" }),
    {
      detail: {
        tags: ["General"],
        summary: "Health check",
        description: "Pemeriksaan kesiapan server.",
      },
    }
  )
  .use(usersRoute)
  .listen(port);

console.log(`🚀 Elysia server is running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
export { app };
