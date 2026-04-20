import type { Maintenance, Vehicle } from "@workspace/db";

export const SERVICE_INTERVAL_KM = 10000;

export function computeServiceStatus(
  vehicle: Vehicle,
  records: Maintenance[]
): {
  lastServiceKm: number | null;
  lastServiceDate: string | null;
  kmSinceService: number | null;
  kmUntilService: number | null;
  serviceStatus: "ok" | "warning" | "overdue" | "no_service";
} {
  if (records.length === 0) {
    return {
      lastServiceKm: null,
      lastServiceDate: null,
      kmSinceService: null,
      kmUntilService: null,
      serviceStatus: "no_service",
    };
  }

  const sorted = [...records].sort((a, b) => b.serviceKm - a.serviceKm);
  const last = sorted[0];

  const kmSinceService = vehicle.currentKm - last.serviceKm;
  const kmUntilService = SERVICE_INTERVAL_KM - kmSinceService;

  let serviceStatus: "ok" | "warning" | "overdue";
  if (kmSinceService > SERVICE_INTERVAL_KM) {
    serviceStatus = "overdue";
  } else if (kmUntilService <= 2000) {
    serviceStatus = "warning";
  } else {
    serviceStatus = "ok";
  }

  return {
    lastServiceKm: last.serviceKm,
    lastServiceDate: last.date,
    kmSinceService,
    kmUntilService,
    serviceStatus,
  };
}
