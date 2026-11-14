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
}
