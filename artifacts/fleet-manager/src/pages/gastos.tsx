import { useState, useMemo } from "react";
import { useGetGastos, useGetVehicles } from "@workspace/api-client-react";
import { DollarSign, Filter, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

const MESES = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const currentYear = new Date().getFullYear();
const ANIOS = Array.from({ length: 6 }, (_, i) => String(currentYear - i));

function formatMonto(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n);
}

const selectClass = "px-3 py-1.5 bg-white/15 border border-white/30 rounded text-sm text-white placeholder-white/50 focus:outline-none focus:bg-white/25 transition-all";
const selectClassLight = "px-3 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full";

export default function Gastos() {
  const [anio, setAnio] = useState("");
  const [mes, setMes] = useState("");
  const [secretaria, setSecretaria] = useState("");
  const [direccion, setDireccion] = useState("");

  const params: Record<string, string> = {};
  if (anio) params.anio = anio;
  if (mes && anio) params.mes = mes;
  if (secretaria) params.secretaria = secretaria;
  if (direccion) params.direccion = direccion;

  const { data, isLoading } = useGetGastos(params);
  const { data: vehicles } = useGetVehicles({});

  const secretarias = useMemo(() => {
    const set = new Set<string>();
    vehicles?.forEach((v) => { if (v.secretaria) set.add(v.secretaria); });
    return Array.from(set).sort();
  }, [vehicles]);

  const direcciones = useMemo(() => {
    const set = new Set<string>();
    vehicles?.forEach((v) => { if (v.direccion) set.add(v.direccion); });
    return Array.from(set).sort();
  }, [vehicles]);

  const rows = data?.rows ?? [];
  const totalMonto = data?.totalMonto ?? 0;

  const totalManoDeObra = rows.filter((r) => r.tipo === "mano_de_obra").reduce((s, r) => s + r.monto, 0);
  const totalRepuestos = rows.filter((r) => r.tipo === "repuesto").reduce((s, r) => s + r.monto, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-border rounded shadow-sm p-5">
        <h1 className="gov-heading text-2xl md:text-3xl font-display">Gestión de Gastos</h1>
        <span className="gov-heading-accent" />
        <p className="text-muted-foreground text-sm">Consulte y filtre los gastos de mantenimiento de la flota.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded shadow-sm p-5 flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded text-blue-700">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Gastos</p>
            <p className="text-2xl font-display font-bold mt-0.5 text-[#1a4f7a]">{formatMonto(totalMonto)}</p>
          </div>
        </div>
        <div className="bg-white border border-border rounded shadow-sm p-5 flex items-start gap-4">
          <div className="p-3 bg-amber-50 rounded text-amber-700">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mano de Obra</p>
            <p className="text-2xl font-display font-bold mt-0.5 text-amber-700">{formatMonto(totalManoDeObra)}</p>
          </div>
        </div>
        <div className="bg-white border border-border rounded shadow-sm p-5 flex items-start gap-4">
          <div className="p-3 bg-green-50 rounded text-green-700">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Repuestos</p>
            <p className="text-2xl font-display font-bold mt-0.5 text-green-700">{formatMonto(totalRepuestos)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
        <div className="section-bar flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2"><Filter className="w-4 h-4" /> Filtros</span>
          <select value={anio} onChange={(e) => { setAnio(e.target.value); if (!e.target.value) setMes(""); }} className={selectClass}>
            <option value="">Todos los años</option>
            {ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={mes} onChange={(e) => setMes(e.target.value)} disabled={!anio} className={selectClass + (anio ? "" : " opacity-40 cursor-not-allowed")}>
            <option value="">Todos los meses</option>
            {MESES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={secretaria} onChange={(e) => setSecretaria(e.target.value)} className={selectClass}>
            <option value="">Todas las secretarías</option>
            {secretarias.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={direccion} onChange={(e) => setDireccion(e.target.value)} className={selectClass}>
            <option value="">Todas las direcciones</option>
            {direcciones.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {(anio || mes || secretaria || direccion) && (
            <button
              onClick={() => { setAnio(""); setMes(""); setSecretaria(""); setDireccion(""); }}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded text-xs font-semibold transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center items-center text-muted-foreground">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-14 text-center text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto text-border mb-3" />
            <p className="font-semibold text-foreground">Sin registros de gastos</p>
            <p className="text-sm mt-1">Ajusta los filtros o agrega registros de mantenimiento con monto.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-secondary/60 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Interno</th>
                  <th className="px-5 py-3">Vehículo</th>
                  <th className="px-5 py-3">Secretaría</th>
                  <th className="px-5 py-3">Dirección</th>
                  <th className="px-5 py-3">Detalle</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">{formatDate(row.date)}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded font-mono font-bold text-xs border border-border">#{row.interno}</span>
                    </td>
                    <td className="px-5 py-3 font-semibold whitespace-nowrap">{row.brand} {row.model}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.secretaria || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.direccion || "—"}</td>
                    <td className="px-5 py-3">{row.description}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {row.tipo === "mano_de_obra" ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-semibold">Mano de Obra</span>
                      ) : row.tipo === "repuesto" ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-semibold">Repuesto</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-[#1a4f7a] whitespace-nowrap">
                      {row.monto > 0 ? formatMonto(row.monto) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-secondary/40 border-t-2 border-border font-bold">
                  <td colSpan={7} className="px-5 py-3 text-right text-sm">Total</td>
                  <td className="px-5 py-3 text-right text-[#1a4f7a]">{formatMonto(totalMonto)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
