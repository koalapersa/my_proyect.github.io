import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import vehiclesRouter from "./vehicles.js";
import maintenanceRouter from "./maintenance.js";
import adminRouter from "./admin.js";
import gastosRouter from "./gastos.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/vehicles", vehiclesRouter);
router.use("/vehicles/:interno/maintenance", maintenanceRouter);
router.use("/admin", adminRouter);
router.use("/gastos", gastosRouter);

export default router;
