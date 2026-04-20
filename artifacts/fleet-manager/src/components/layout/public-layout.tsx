import { ReactNode } from "react";
import { Gauge } from "lucide-react";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Dark navy header — matches gov portal style */}
      <header className="bg-sidebar sticky top-0 z-50 shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-1.5 rounded">
              <Gauge className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm text-white leading-tight">Control de Flota</div>
              <div className="text-[10px] text-white/50 uppercase tracking-widest leading-tight">Sistema Municipal</div>
            </div>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-xs text-white/70 font-medium">
            <span>Portal Público</span>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:py-6">
        {children}
      </main>
      
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border bg-white">
        <p>Sistema de Gestión de Flota Municipal — Acceso público de solo lectura.</p>
      </footer>
    </div>
  );
}
