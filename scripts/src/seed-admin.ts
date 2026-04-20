import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Admin user '${username}' already exists.`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(usersTable).values({ username, passwordHash });

  console.log(`Admin user '${username}' created successfully.`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
