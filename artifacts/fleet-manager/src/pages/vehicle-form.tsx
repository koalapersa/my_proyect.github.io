import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Link } from "wouter";
import { useCreateVehicle, useGetVehicle, useUpdateVehicle } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const vehicleSchema = z.object({
  interno: z.string().min(1, "El interno es obligatorio"),
  plate: z.string().min(1, "La patente es obligatoria"),
  brand: z.string().min(1, "La marca es obligatoria"),
  model: z.string().min(1, "El modelo es obligatorio"),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  currentKm: z.coerce.number().min(0, "Debe ser un valor positivo"),
  secretaria: z.string().optional(),
  direccion: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export default function VehicleForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [matchEdit, paramsEdit] = useRoute("/vehicles/:interno/edit");
  const isEditing = matchEdit;
  const targetInterno = paramsEdit?.interno;

  const { data: vehicle, isLoading: isLoadingVehicle } = useGetVehicle(targetInterno || "", {
    query: { enabled: isEditing && !!targetInterno }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema)
  });

  useEffect(() => {
    if (isEditing && vehicle) {
      reset({
        interno: vehicle.interno,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        currentKm: vehicle.currentKm,
        secretaria: vehicle.secretaria ?? "",
        direccion: vehicle.direccion ?? "",
      });
    }
  }, [isEditing, vehicle, reset]);

  const { mutate: createVehicle, isPending: isCreating } = useCreateVehicle({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Éxito", description: "Vehículo creado correctamente." });
        setLocation(`/vehicles/${data.interno}`);
      },
      onError: (err) => {
        toast({ 
          title: "Error", 
          description: (err.response?.data as any)?.error || "Error al crear el vehículo", 
          variant: "destructive" 
        });
      }
    }
  });

  const { mutate: updateVehicle, isPending: isUpdating } = useUpdateVehicle({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Éxito", description: "Vehículo actualizado correctamente." });
        setLocation(`/vehicles/${data.interno}`);
      },
      onError: (err) => {
        toast({ 
          title: "Error", 
          description: (err.response?.data as any)?.error || "Error al actualizar el vehículo", 
          variant: "destructive" 
        });
      }
    }
  });

  const onSubmit = (data: VehicleFormValues) => {
    if (isEditing && targetInterno) {
      const { interno, ...updateData } = data;
      updateVehicle({ interno: targetInterno, data: updateData });
    } else {
      createVehicle({ data });
    }
  };

  const isPending = isCreating || isUpdating;

  if (isEditing && isLoadingVehicle) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={isEditing ? `/vehicles/${targetInterno}` : "/dashboard"}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold">
            {isEditing ? `Editar Vehículo #${targetInterno}` : "Agregar Nuevo Vehículo"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? "Actualiza los datos y kilometraje del vehículo." : "Ingresa los datos del nuevo vehículo de la flota."}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-2xl p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold block">Interno (ID Interno)</label>
              <input
                type="text"
                {...register("interno")}
                disabled={isEditing}
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:outline-none focus:border-primary disabled:opacity-50 disabled:bg-muted font-mono"
                placeholder="ej. 101"
              />
              {errors.interno && <p className="text-xs text-destructive">{errors.interno.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold block">Patente</label>
              <input
                type="text"
                {...register("plate")}
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:outline-none focus:border-primary font-mono uppercase"
                placeholder="ABC 123"
              />
              {errors.plate && <p className="text-xs text-destructive">{errors.plate.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold block">Marca</label>
              <input
                type="text"
                {...register("brand")}
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="ej. Toyota"
              />
              {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold block">Modelo</label>
              <input
                type="text"
                {...register("model")}
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="ej. Hilux"
              />
              {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold block">Año</label>
              <input
                type="number"
                {...register("year")}
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="2024"
              />
              {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold block">Kilometraje Actual (KM)</label>
              <input
                type="number"
                {...register("currentKm")}
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="0"
              />
              {errors.currentKm && <p className="text-xs text-destructive">{errors.currentKm.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold block">Secretaría</label>
              <input
                type="text"
                {...register("secretaria")}
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="ej. Secretaría de Obras"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold block">Dirección</label>
              <input
                type="text"
                {...register("direccion")}
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="ej. Dirección de Tránsito"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end gap-4">
            <Link
              href={isEditing ? `/vehicles/${targetInterno}` : "/dashboard"}
              className="px-6 py-3 rounded-xl font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-3 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isEditing ? "Guardar Cambios" : "Crear Vehículo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
