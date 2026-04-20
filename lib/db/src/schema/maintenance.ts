import { pgTable, text, integer, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { vehiclesTable } from "./vehicles";

export const maintenanceTable = pgTable("maintenance", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehiclesTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  serviceKm: integer("service_km").notNull(),
  proveedor: text("proveedor").default("").notNull(),
  description: text("description").notNull(),
  mechanic: text("mechanic").notNull(),
  tipo: text("tipo").default("").notNull(),
  monto: numeric("monto", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMaintenanceSchema = createInsertSchema(maintenanceTable).omit({
  id: true,
  createdAt: true,
});

export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;
export type Maintenance = typeof maintenanceTable.$inferSelect;
