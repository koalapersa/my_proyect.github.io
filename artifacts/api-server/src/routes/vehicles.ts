import { Router, type IRouter } from "express";
import { db, vehiclesTable, maintenanceTable } from "@workspace/db";
import { eq, or, ilike } from "drizzle-orm";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";

const router: IRouter = Router();

const requireAuth = (req: any, res: any, next: any) => {
  if (!(req.session as any).userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
};

const QR_DIR = path.join(process.cwd(), "static", "qrcodes");

function ensureQrDir() {
  if (!fs.existsSync(QR_DIR)) {
    fs.mkdirSync(QR_DIR, { recursive: true });
  }
}

async function generateQr(interno: string): Promise<string> {
  ensureQrDir();
  const domains = process.env.REPLIT_DOMAINS || "localhost";
  const domain = domains.split(",")[0].trim();
  const publicUrl = `https://${domain}/public/${interno}`;
  const qrFile = path.join(QR_DIR, `${interno}.png`);
  await QRCode.toFile(qrFile, publicUrl, { width: 300 });
  return `/api/static/qrcodes/${interno}.png`;
}

function serializeVehicle(vehicle: typeof vehiclesTable.$inferSelect) {
  return {
    ...vehicle,
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const search = req.query.search as string | undefined;

  let vehicles;
  if (search && search.trim()) {
    const pattern = `%${search.trim()}%`;
    vehicles = await db
      .select()
      .from(vehiclesTable)
      .where(or(ilike(vehiclesTable.interno, pattern), ilike(vehiclesTable.plate, pattern)));
  } else {
    vehicles = await db.select().from(vehiclesTable);
  }

  const results = vehicles.map(serializeVehicle);

  results.sort((a, b) => {
    const numA = parseInt(a.interno) || 0;
    const numB = parseInt(b.interno) || 0;
    return numA - numB || a.interno.localeCompare(b.interno);
  });

  res.json(results);
});

router.get("/:interno", async (req, res) => {
  const { interno } = req.params;
  const [vehicle] = await db
    .select()
    .from(vehiclesTable)
    .where(eq(vehiclesTable.interno, interno))
    .limit(1);

  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  res.json(serializeVehicle(vehicle));
});

router.post("/", requireAuth, async (req, res) => {
  const { interno, plate, brand, model, year, currentKm, secretaria, direccion } = req.body;

  if (!interno || !plate || !brand || !model || !year || currentKm == null) {
    res.status(400).json({ error: "All fields required" });
    return;
  }

  const existing = await db
    .select()
    .from(vehiclesTable)
    .where(eq(vehiclesTable.interno, interno))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Interno already exists" });
    return;
  }

  const [vehicle] = await db
    .insert(vehiclesTable)
    .values({ interno, plate, brand, model, year, currentKm, secretaria: secretaria ?? "", direccion: direccion ?? "" })
    .returning();

  const qrPath = await generateQr(interno);
  const [updated] = await db
    .update(vehiclesTable)
    .set({ qrPath, updatedAt: new Date() })
    .where(eq(vehiclesTable.id, vehicle.id))
    .returning();

  res.status(201).json(serializeVehicle(updated));
});

router.put("/:interno", requireAuth, async (req, res) => {
  const { interno } = req.params;
  const { plate, brand, model, year, currentKm, secretaria, direccion } = req.body;

  const [existing] = await db
    .select()
    .from(vehiclesTable)
    .where(eq(vehiclesTable.interno, interno))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  const updateData: any = { updatedAt: new Date() };
  if (plate !== undefined) updateData.plate = plate;
  if (brand !== undefined) updateData.brand = brand;
  if (model !== undefined) updateData.model = model;
  if (year !== undefined) updateData.year = year;
  if (currentKm !== undefined) updateData.currentKm = currentKm;
  if (secretaria !== undefined) updateData.secretaria = secretaria;
  if (direccion !== undefined) updateData.direccion = direccion;

  const [updated] = await db
    .update(vehiclesTable)
    .set(updateData)
    .where(eq(vehiclesTable.interno, interno))
    .returning();

  await generateQr(interno);

  res.json(serializeVehicle(updated));
});

router.delete("/:interno", requireAuth, async (req, res) => {
  const { interno } = req.params;
  const [vehicle] = await db
    .select()
    .from(vehiclesTable)
    .where(eq(vehiclesTable.interno, interno))
    .limit(1);

  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  await db.delete(vehiclesTable).where(eq(vehiclesTable.interno, interno));

  const qrFile = path.join(QR_DIR, `${interno}.png`);
  if (fs.existsSync(qrFile)) {
    fs.unlinkSync(qrFile);
  }

  res.json({ success: true, message: "Vehicle deleted" });
});

router.get("/:interno/qr", async (req, res) => {
  const { interno } = req.params;
  const [vehicle] = await db
    .select()
    .from(vehiclesTable)
    .where(eq(vehiclesTable.interno, interno))
    .limit(1);

  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  const qrPath = await generateQr(interno);
  const domains = process.env.REPLIT_DOMAINS || "localhost";
  const domain = domains.split(",")[0].trim();
  const publicUrl = `https://${domain}/public/${interno}`;

  res.json({ interno, qrUrl: qrPath, publicUrl });
});

export default router;
