import { useState } from "react";
import { Link } from "wouter";
import { useGetVehicles, getMaintenance } from "@workspace/api-client-react";
import { Search, Plus, CarFront, ChevronRight, Download, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDate } from "@/lib/utils";

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const { data: vehicles, isLoading } = useGetVehicles({
    search: debouncedSearch || undefined
  });

  const totalVehicles = vehicles?.length || 0;
  const [isDownloading, setIsDownloading] = useState(false);

  const escapeCSV = (val: unknown) => {
    const str = String(val ?? "");
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const downloadCSV = async () => {
    if (!vehicles || vehicles.length === 0) return;
    setIsDownloading(true);
    try {
      const maintenanceByVehicle = await Promise.all(
        vehicles.map((v) =>
          getMaintenance(String(v.interno)).catch(() => [])
        )
      );

      const headers = [
        "Interno", "Marca", "Modelo", "Patente", "Año",
        "Fecha Mantenimiento", "Kilometraje (km)", "Detalle", "Proveedor"
      ];

      const rows: string[][] = [];
      vehicles.forEach((v, i) => {
        const records = maintenanceByVehicle[i];
        if (records.length === 0) {
          rows.push([String(v.interno), v.brand, v.model, v.plate, String(v.year), "", "", "", ""]);
        } else {
          records.forEach((r) => {
            rows.push([
              String(v.interno), v.brand, v.model, v.plate, String(v.year),
              formatDate(r.date), String(r.serviceKm), r.description, r.proveedor ?? ""
            ]);
          });
        }
      });

      const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv, ""], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "directorio_flota.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };

  const item = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 28 } }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-border rounded shadow-sm p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="gov-heading text-2xl md:text-3xl font-display">Resumen de Flota</h1>
          <span className="gov-heading-accent" />
          <p className="text-muted-foreground text-sm">Administre y consulte los vehículos de la flota municipal.</p>
        </div>
        <Link
          href="/vehicles/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors whitespace-nowrap shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Agregar Vehículo
        </Link>
      </div>

      {/* Fleet count card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-border rounded shadow-sm p-5 flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded text-blue-700">
            <CarFront className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Flota Total</p>
            <p className="text-3xl font-display font-bold mt-0.5 text-[#1a4f7a]">{isLoading ? '-' : totalVehicles}</p>
          </div>
        </motion.div>
      </div>

      {/* Vehicle Table */}
      <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
        {/* Section header bar */}
        <div className="section-bar flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span>Directorio de Vehículos</span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={downloadCSV}
              disabled={!vehicles || vehicles.length === 0 || isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isDownloading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Descargando...</>
                : <><Download className="w-3.5 h-3.5" /> Descargar CSV</>
              }
            </button>
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-white/60" />
            </div>
            <input
              type="text"
              placeholder="Buscar interno o patente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white/15 border border-white/30 rounded text-sm text-white placeholder-white/50 focus:outline-none focus:bg-white/25 transition-all"
            />
          </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
            <p className="text-sm">Cargando datos de flota...</p>
          </div>
        ) : vehicles && vehicles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-secondary/60 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <th className="px-5 py-3">Interno</th>
                  <th className="px-5 py-3">Marca / Modelo</th>
                  <th className="px-5 py-3">Patente</th>
                  <th className="px-5 py-3">Año</th>
                  <th className="px-5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <motion.tbody variants={container} initial="hidden" animate="show" className="divide-y divide-border">
                {vehicles.map((vehicle) => (
                  <motion.tr
                    key={vehicle.id}
                    variants={item}
                    className="hover:bg-secondary/30 transition-colors group"
                  >
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 bg-secondary text-secondary-foreground rounded font-mono font-bold text-xs border border-border">
                        #{vehicle.interno}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-foreground">
                      {vehicle.brand} {vehicle.model}
                    </td>
                    <td className="px-5 py-3 font-mono text-sm text-muted-foreground">
                      {vehicle.plate}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {vehicle.year}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      <Link
                        href={`/vehicles/${vehicle.interno}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#1a4f7a] text-white hover:bg-[#1a4f7a]/90 transition-colors"
                      >
                        Ver detalle
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        ) : (
          <div className="p-14 text-center">
            <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">No se encontraron vehículos</h3>
            <p className="text-muted-foreground mt-1 text-sm">Ajusta la búsqueda o agrega un nuevo vehículo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
