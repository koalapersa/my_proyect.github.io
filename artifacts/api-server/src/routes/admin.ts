import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function requireAdmin(req: any, res: any, next: any) {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user || user.username !== "admin") {
    res.status(403).json({ error: "Acceso denegado. Solo el administrador puede realizar esta acción." });
    return;
  }

  next();
}

router.get("/users", requireAdmin, async (req, res) => {
  const users = await db
    .select({ id: usersTable.id, username: usersTable.username, createdAt: usersTable.createdAt })
    .from(usersTable)
    .orderBy(usersTable.createdAt);

  res.json(users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

router.post("/users", requireAdmin, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !username.trim()) {
    res.status(400).json({ error: "El nombre de usuario es obligatorio." });
    return;
  }

  if (!password || password.length < 4) {
    res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres." });
    return;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username.trim()))
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "Ya existe un usuario con ese nombre." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [created] = await db
    .insert(usersTable)
    .values({ username: username.trim(), passwordHash })
    .returning({ id: usersTable.id, username: usersTable.username, createdAt: usersTable.createdAt });

  res.status(201).json({ ...created, createdAt: created.createdAt.toISOString() });
});

router.put("/users/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido." });
    return;
  }

  const [target] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!target) {
    res.status(404).json({ error: "Usuario no encontrado." });
    return;
  }

  const { username, password } = req.body;

  if (!username?.trim() && !password) {
    res.status(400).json({ error: "Debe proporcionar un nombre de usuario o una nueva contraseña." });
    return;
  }

  const updates: Record<string, any> = {};

  if (username && username.trim() && username.trim() !== target.username) {
    const newName = username.trim();

    if (target.username === "admin" && newName !== "admin") {
      res.status(403).json({ error: "No se puede cambiar el nombre del usuario administrador." });
      return;
    }

    const [nameConflict] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, newName))
      .limit(1);

    if (nameConflict) {
      res.status(409).json({ error: "Ya existe un usuario con ese nombre." });
      return;
    }

    updates.username = newName;
  }

  if (password) {
    if (password.length < 4) {
      res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres." });
      return;
    }
    updates.passwordHash = await bcrypt.hash(password, 10);
  }

  if (Object.keys(updates).length === 0) {
    res.json({ id: target.id, username: target.username, createdAt: target.createdAt.toISOString() });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning({ id: usersTable.id, username: usersTable.username, createdAt: usersTable.createdAt });

  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/users/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido." });
    return;
  }

  const [target] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!target) {
    res.status(404).json({ error: "Usuario no encontrado." });
    return;
  }

  if (target.username === "admin") {
    res.status(403).json({ error: "No se puede eliminar al usuario administrador." });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ success: true });
});

export default router;
