import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, sessions } from "../db/schema";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface RegisterUserResult {
  success: boolean;
  error?: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface CurrentUserResponse {
  id: number;
  name: string;
  email: string;
  created_at: Date | string;
}

export interface GetCurrentUserResult {
  success: boolean;
  user?: CurrentUserResponse;
  error?: string;
}

export interface LogoutUserResult {
  success: boolean;
  error?: string;
}

export class UserService {
  static async registerUser(input: RegisterUserInput): Promise<RegisterUserResult> {
    // 1. Cek apakah email sudah terdaftar
    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingUsers.length > 0) {
      return {
        success: false,
        error: "Email sudah terdaftar",
      };
    }

    // 2. Hash password menggunakan bcrypt bawaan Bun
    const hashedPassword = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    // 3. Simpan user baru ke database
    await db.insert(users).values({
      name: input.name,
      email: input.email,
      password: hashedPassword,
    });

    return {
      success: true,
    };
  }

  static async loginUser(input: LoginUserInput): Promise<LoginUserResult> {
    // 1. Cari user berdasarkan email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (!user) {
      return {
        success: false,
        error: "Email atau password salah",
      };
    }

    // 2. Verifikasi password dengan hash bcrypt
    const isPasswordValid = await Bun.password.verify(input.password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        error: "Email atau password salah",
      };
    }

    // 3. Buat token session UUID
    const token = crypto.randomUUID();

    // 4. Simpan session ke database
    await db.insert(sessions).values({
      token,
      userId: user.id,
    });

    return {
      success: true,
      token,
    };
  }

  static async getCurrentUser(token: string): Promise<GetCurrentUserResult> {
    if (!token) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // 1. Cari session berdasarkan token
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // 2. Ambil data user berdasarkan session.userId
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        created_at: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    return {
      success: true,
      user,
    };
  }

  static async logoutUser(token: string): Promise<LogoutUserResult> {
    if (!token) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // 1. Periksa apakah session dengan token tersebut ada
    const [session] = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // 2. Hapus data session dari tabel sessions
    await db.delete(sessions).where(eq(sessions.token, token));

    return {
      success: true,
    };
  }
}
