import { Elysia, t } from "elysia";
import { UserService } from "../services/users-service";

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
        name: t.String({ minLength: 1 }),
        email: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
      }),
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
        email: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .get(
    "/current",
    async ({ headers, set }) => {
      const authHeader = headers["authorization"];

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return {
          error: "Unauthorized",
        };
      }

      const token = authHeader.slice(7).trim();
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
    }
  );
