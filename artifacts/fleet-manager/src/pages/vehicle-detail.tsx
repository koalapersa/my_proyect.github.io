import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, Edit, Trash2, QrCode, ExternalLink, 
  Calendar, Wrench, Download, Plus, Loader2, Car
} from "lucide-react";
import { 
  useGetVehicle, 
  useGetMaintenance, 
  useCreateMaintenance, 
  useDeleteMaintenance,
  useDeleteVehicle,
  useGetVehicleQr,
  getGetVehicleQueryKey,
  getGetMaintenanceQueryKey
} from "@workspace/api-client-react";
import { formatDate, formatKm } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const maintenanceSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria"),
  serviceKm: z.coerce.number().min(0, "Debe ser un valor positivo"),
  proveedor: z.string().optional(),
  description: z.string().min(1, "La descripción es obligatoria"),
  mechanic: z.string().min(1, "El mecánico es obligatorio"),
  tipo: z.string().optional(),
  monto: z.coerce.number().min(0).optional(),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

export default function VehicleDetail() {
  const [, params] = useRoute("/vehicles/:interno");
  const [, setLocation] = useLocation();
  const interno = params?.interno || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [maintDialogOpen, setMaintDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data: vehicle, isLoading: isLoadingVehicle } = useGetVehicle(interno);
  const { data: maintenanceRecords, isLoading: isLoadingRecords } = useGetMaintenance(interno);
  const { data: qrData } = useGetVehicleQr(interno);

  const { mutate: addMaintenance, isPending: isAddingMaint } = useCreateMaintenance({
    mutation: {
      onSuccess: () => {
        toast({ title: "Éxito", description: "Registro de mantenimiento agregado." });
        setMaintDialogOpen(false);
        maintForm.reset();
        queryClient.invalidateQueries({ queryKey: getGetVehicleQueryKey(interno) });
        queryClient.invalidateQueries({ queryKey: getGetMaintenanceQueryKey(interno) });
      }
    }
  });

  const { mutate: deleteRecord } = useDeleteMaintenance({
    mutation: {
      onSuccess: () => {
        toast({ title: "Eliminado", description: "Registro eliminado correctamente." });
        queryClient.invalidateQueries({ queryKey: getGetVehicleQueryKey(interno) });
        queryClient.invalidateQueries({ queryKey: getGetMaintenanceQueryKey(interno) });
      }
    }
  });

  const { mutate: deleteVehicle, isPending: isDeletingVehicle } = useDeleteVehicle({
    mutation: {
      onSuccess: () => {
        toast({ title: "Eliminado", description: "Vehículo eliminado completamente." });
        setLocation("/dashboard");
      }
    }
  });

  const maintForm = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  });

  if (isLoadingVehicle) {
    return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!vehicle) {
    return (
      <div className="text-center p-20">
        <h2 className="text-2xl font-bold">Vehículo No Encontrado</h2>
        <Link href="/dashboard" className="text-primary hover:underline mt-4 inline-block">Volver al Panel</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
        <div className="bg-sidebar px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold">{vehicle.brand} {vehicle.model}</h1>
                <span className="px-2 py-0.5 bg-white/15 text-white rounded font-mono font-bold text-xs">#{vehicle.interno}</span>
              </div>
              <p className="text-white/60 text-xs mt-0.5">
                <span className="font-mono uppercase">{vehicle.plate}</span> · Año {vehicle.year}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/vehicles/${interno}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold transition-colors"
            >
              <Edit className="w-3.5 h-3.5" /> Editar
            </Link>
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded text-xs font-semibold transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Eliminar Vehículo</DialogTitle></DialogHeader>
                <div className="py-4">
                  <p>¿Estás seguro de que deseas eliminar el vehículo <strong>#{vehicle.interno}</strong>? Esto eliminará permanentemente todos los registros de mantenimiento. Esta acción no se puede deshacer.</p>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setDeleteConfirmOpen(false)} className="px-4 py-2 bg-secondary rounded font-semibold text-sm">Cancelar</button>
                  <button
                    onClick={() => deleteVehicle({ interno })}
                    disabled={isDeletingVehicle}
                    className="px-4 py-2 bg-rose-600 text-white rounded font-semibold text-sm hover:bg-rose-700 flex items-center gap-2"
                  >
                    {isDeletingVehicle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Sí, Eliminar
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Basic vehicle info row */}
        <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Interno</p>
            <p className="font-mono font-bold text-foreground">#{vehicle.interno}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Patente</p>
            <p className="font-mono font-semibold text-foreground uppercase">{vehicle.plate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Año</p>
            <p className="font-semibold text-foreground">{vehicle.year}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Odómetro</p>
            <p className="font-semibold text-[#1a4f7a]">{formatKm(vehicle.currentKm)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: QR Code */}
        <div>
          <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
            <div className="section-bar flex items-center gap-2">
              <QrCode className="w-4 h-4" /> Código QR
            </div>
            <div className="p-5 flex flex-col items-center text-center">
              <p className="text-xs text-muted-foreground mb-4">Escanee para ver los detalles públicos del vehículo.</p>
              {qrData ? (
                <div className="space-y-4 w-full">
                  <div className="bg-white p-3 rounded border border-border inline-block mx-auto">
                    <img src={qrData.qrUrl} alt="Código QR" className="w-44 h-44 object-contain" />
                  </div>
                  <div className="flex gap-2 w-full">
                    <a
                      href={qrData.qrUrl}
                      download={`qr-interno-${interno}.png`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-secondary text-secondary-foreground rounded text-xs font-semibold hover:bg-secondary/80 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar
                    </a>
                    <a
                      href={qrData.publicUrl}
                      target="_blank" rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-white rounded text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Abrir <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" /></div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Maintenance History */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-border rounded shadow-sm overflow-hidden h-full flex flex-col">
            <div className="section-bar flex items-center justify-between">
              <span className="flex items-center gap-2"><Wrench className="w-4 h-4" /> Historial de Mantenimiento</span>
              <Dialog open={maintDialogOpen} onOpenChange={setMaintDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-semibold transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Agregar Registro
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Agregar Registro de Mantenimiento</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={maintForm.handleSubmit((data) => addMaintenance({ interno, data }))} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Fecha</label>
                        <input type="date" {...maintForm.register("date")} className="w-full px-3 py-2 border border-border rounded bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                        {maintForm.formState.errors.date && <p className="text-xs text-destructive">{maintForm.formState.errors.date.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Kilometraje</label>
                        <input type="number" {...maintForm.register("serviceKm")} className="w-full px-3 py-2 border border-border rounded bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm" placeholder="ej. 15000" />
                        {maintForm.formState.errors.serviceKm && <p className="text-xs text-destructive">{maintForm.formState.errors.serviceKm.message}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Proveedor</label>
                      <input type="text" {...maintForm.register("mechanic")} className="w-full px-3 py-2 border border-border rounded bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm" placeholder="ej. Taller García" />
                      {maintForm.formState.errors.mechanic && <p className="text-xs text-destructive">{maintForm.formState.errors.mechanic.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Descripción</label>
                      <textarea {...maintForm.register("description")} rows={3} className="w-full px-3 py-2 border border-border rounded bg-background focus:ring-2 focus:ring-primary/20 outline-none resize-none text-sm" placeholder="ej. Cambio de aceite, reemplazo de filtros" />
                      {maintForm.formState.errors.description && <p className="text-xs text-destructive">{maintForm.formState.errors.description.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Tipo de Gasto</label>
                        <select {...maintForm.register("tipo")} className="w-full px-3 py-2 border border-border rounded bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm">
                          <option value="">Sin especificar</option>
                          <option value="mano_de_obra">Mano de Obra</option>
                          <option value="repuesto">Repuesto</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Monto ($)</label>
                        <input type="number" step="0.01" min="0" {...maintForm.register("monto")} className="w-full px-3 py-2 border border-border rounded bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm" placeholder="0.00" />
                      </div>
                    </div>
                    <button type="submit" disabled={isAddingMaint} className="w-full py-2.5 mt-2 bg-primary text-white rounded font-bold text-sm flex justify-center items-center gap-2 hover:bg-primary/90">
                      {isAddingMaint ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Registro"}
                    </button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex-1 flex flex-col overflow-auto">
              {isLoadingRecords ? (
                <div className="flex-1 flex justify-center items-center min-h-[200px]">
                  <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
                </div>
              ) : maintenanceRecords && maintenanceRecords.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-left">
                      <th className="px-5 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Fecha</th>
                      <th className="px-5 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Kilometraje</th>
                      <th className="px-5 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Detalle</th>
                      <th className="px-5 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Proveedor</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {maintenanceRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-5 py-3.5 text-foreground whitespace-nowrap">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-muted-foreground" />{formatDate(record.date)}</span>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-semibold text-[#1a4f7a] whitespace-nowrap">
                          {formatKm(record.serviceKm)}
                        </td>
                        <td className="px-5 py-3.5 text-foreground">
                          {record.description}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {record.proveedor ? (
                            <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-semibold border border-border">
                              {record.proveedor}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-right">
                          <button
                            onClick={() => {
                              if (confirm("¿Eliminar este registro de mantenimiento?")) {
                                deleteRecord({ interno, id: record.id });
                              }
                            }}
                            className="text-muted-foreground hover:text-rose-600 transition-colors p-1 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] text-muted-foreground p-8 text-center">
                  <Wrench className="w-10 h-10 text-border mb-3" />
                  <p className="font-semibold text-foreground text-sm">Sin historial de mantenimiento</p>
                  <p className="text-xs mt-1">Agrega registros para documentar los trabajos realizados.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
