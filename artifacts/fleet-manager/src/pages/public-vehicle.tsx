import { useRoute } from "wouter";
import { useGetVehicle, useGetMaintenance } from "@workspace/api-client-react";
import { Loader2, Car, Calendar } from "lucide-react";
import { formatDate, formatKm } from "@/lib/utils";

export default function PublicVehicle() {
  const [, params] = useRoute("/public/:interno");
  const interno = params?.interno || "";

  const { data: vehicle, isLoading: isVehicleLoading, error: vehicleError } = useGetVehicle(interno);
  const { data: maintenanceRecords, isLoading: isMaintLoading } = useGetMaintenance(interno);

  if (isVehicleLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground text-sm">Cargando datos del vehículo...</p>
      </div>
    );
  }

  if (vehicleError || !vehicle) {
    return (
      <div className="bg-white border border-border rounded shadow-sm p-10 text-center mt-8">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Car className="w-7 h-7" />
        </div>
        <h2 className="gov-heading text-xl font-display mb-2">Vehículo No Encontrado</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          El código QR escaneado no corresponde a ningún vehículo activo en el sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">

      {/* Vehicle identity card */}
      <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
        {/* Dark navy header */}
        <div className="bg-sidebar px-6 py-5 text-white">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/10 rounded mt-0.5">
              <Car className="w-5 h-5 text-white/80" />
            </div>
            <div>
              <div className="text-xs text-white/50 uppercase tracking-widest mb-1">Interno #{vehicle.interno}</div>
              <h1 className="text-2xl font-display font-bold leading-tight">
                {vehicle.brand} {vehicle.model}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white/70">
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded tracking-widest text-white">{vehicle.plate}</span>
                <span>Año {vehicle.year}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Basic info grid */}
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-5 border-b border-border text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Interno</p>
            <p className="font-mono font-bold text-foreground">#{vehicle.interno}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Patente</p>
            <p className="font-mono font-semibold text-foreground uppercase">{vehicle.plate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Odómetro</p>
            <p className="font-semibold text-[#1a4f7a]">{formatKm(vehicle.currentKm)}</p>
          </div>
        </div>

        {/* Trust strip */}
        <div className="px-6 py-2.5 bg-green-50 flex items-center gap-2 text-xs text-green-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Datos de flota verificados — acceso público de solo lectura.
        </div>
      </div>

      {/* Maintenance history */}
      <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
        <div className="section-bar">
          Historial de Mantenimiento
        </div>

        {isMaintLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
          </div>
        ) : maintenanceRecords && maintenanceRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold text-left">
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Kilometraje</th>
                  <th className="px-5 py-3">Detalle</th>
                  <th className="px-5 py-3">Proveedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {maintenanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatDate(record.date)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono font-semibold text-[#1a4f7a]">
                      {formatKm(record.serviceKm)}
                    </td>
                    <td className="px-5 py-3.5 text-foreground max-w-[260px]">
                      <div className="truncate">{record.description}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {record.proveedor ? (
                        <span className="px-2 py-1 bg-secondary rounded text-xs font-semibold border border-border">
                          {record.proveedor}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">No hay registros de mantenimiento disponibles.</p>
          </div>
        )}
      </div>

    </div>
  );
}
