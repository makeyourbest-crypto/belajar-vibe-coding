import { db, connectionPool } from "../../src/db";
import { users, sessions, posts } from "../../src/db/schema";

export async function resetDatabase() {
  // Hapus data tabel yang memiliki foreign key terlebih dahulu
  await db.delete(sessions);
  await db.delete(users);
  await db.delete(posts);
}

export async function closeDatabase() {
  await connectionPool.end();
}
