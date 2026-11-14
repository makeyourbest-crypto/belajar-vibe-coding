import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface RegisterUserResult {
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
}
