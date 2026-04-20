import { Router, type IRouter } from "express";
import { db, vehiclesTable, maintenanceTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const requireAuth = (req: any, res: any, next: any) => {
  if (!(req.session as any).userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
};

router.get("/", requireAuth, async (req, res) => {
  const { mes, anio, secretaria, direccion } = req.query as Record<string, string | undefined>;

  const allVehicles = await db.select().from(vehiclesTable);
  const allRecords = await db.select().from(maintenanceTable);

  const vehicleMap = new Map(allVehicles.map((v) => [v.id, v]));

  let rows = allRecords.map((r) => {
    const v = vehicleMap.get(r.vehicleId);
    return {
      id: r.id,
      vehicleId: r.vehicleId,
      interno: v?.interno ?? "",
      brand: v?.brand ?? "",
      model: v?.model ?? "",
      secretaria: v?.secretaria ?? "",
      direccion: v?.direccion ?? "",
      date: r.date,
      serviceKm: r.serviceKm,
      description: r.description,
      mechanic: r.mechanic,
      proveedor: r.proveedor,
      tipo: r.tipo,
      monto: r.monto != null ? parseFloat(r.monto as unknown as string) : 0,
      createdAt: r.createdAt.toISOString(),
    };
  });

  if (anio) {
    rows = rows.filter((r) => r.date.startsWith(anio));
  }
  if (mes && anio) {
    const prefix = `${anio}-${mes.padStart(2, "0")}`;
    rows = rows.filter((r) => r.date.startsWith(prefix));
  }
  if (secretaria) {
    rows = rows.filter((r) => r.secretaria === secretaria);
  }
  if (direccion) {
    rows = rows.filter((r) => r.direccion === direccion);
  }

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalMonto = rows.reduce((sum, r) => sum + r.monto, 0);

  res.json({ rows, totalMonto });
});

export default router;
