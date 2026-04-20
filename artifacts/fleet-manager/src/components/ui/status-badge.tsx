import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";
import type { VehicleWithStatusServiceStatus } from "@workspace/api-client-react/src/generated/api.schemas";

interface StatusBadgeProps {
  status: VehicleWithStatusServiceStatus;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = {
    ok: {
      label: "Servicio al Día",
      icon: CheckCircle2,
      styles: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-500/10",
      iconColor: "text-emerald-500"
    },
    warning: {
      label: "Servicio Próximo",
      icon: AlertTriangle,
      styles: "bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-500/10",
      iconColor: "text-amber-500"
    },
    overdue: {
      label: "Vencido",
      icon: AlertCircle,
      styles: "bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-500/10",
      iconColor: "text-rose-500"
    },
    no_service: {
      label: "Sin Registros",
      icon: HelpCircle,
      styles: "bg-slate-100 text-slate-600 border-slate-200",
      iconColor: "text-slate-400"
    }
  };

  const current = config[status];
  const Icon = current.icon;

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors",
        current.styles,
        className
      )}
    >
      {showIcon && <Icon className={cn("w-3.5 h-3.5", current.iconColor)} />}
      {current.label}
    </span>
  );
}
