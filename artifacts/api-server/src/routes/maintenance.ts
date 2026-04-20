import { Router, type IRouter } from "express";
import { db, vehiclesTable, maintenanceTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router({ mergeParams: true });

const requireAuth = (req: any, res: any, next: any) => {
  if (!(req.session as any).userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
};

function serializeRecord(r: typeof maintenanceTable.$inferSelect) {
  return {
    ...r,
    monto: r.monto != null ? parseFloat(r.monto as unknown as string) : 0,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const { interno } = req.params as { interno: string };

  const [vehicle] = await db
    .select()
    .from(vehiclesTable)
    .where(eq(vehiclesTable.interno, interno))
    .limit(1);

  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  const records = await db
    .select()
    .from(maintenanceTable)
    .where(eq(maintenanceTable.vehicleId, vehicle.id));

  const sorted = records.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  res.json(sorted.map(serializeRecord));
});

router.post("/", requireAuth, async (req, res) => {
  const { interno } = req.params as { interno: string };
  const { date, serviceKm, proveedor, description, mechanic, tipo, monto } = req.body;

  if (!date || serviceKm == null || !description || !mechanic) {
    res.status(400).json({ error: "All fields required" });
    return;
  }

  const [vehicle] = await db
    .select()
    .from(vehiclesTable)
    .where(eq(vehiclesTable.interno, interno))
    .limit(1);

  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  const [record] = await db
    .insert(maintenanceTable)
    .values({
      vehicleId: vehicle.id,
      date,
      serviceKm,
      proveedor: proveedor ?? "",
      description,
      mechanic,
      tipo: tipo ?? "",
      monto: monto != null ? String(monto) : "0",
    })
    .returning();

  res.status(201).json(serializeRecord(record));
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  await db.delete(maintenanceTable).where(eq(maintenanceTable.id, parseInt(id)));
  res.json({ success: true, message: "Record deleted" });
});

export default router;
