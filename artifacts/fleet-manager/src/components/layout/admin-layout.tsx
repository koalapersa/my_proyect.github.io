import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Car, 
  LayoutDashboard, 
  LogOut, 
  Menu,
  X,
  Gauge,
  Users,
  DollarSign
} from "lucide-react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: user } = useGetMe();
  const queryClient = useQueryClient();
  const { mutate: logout } = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
      }
    }
  });

  const isAdmin = user?.username === "admin";

  const navigation = [
    { name: 'Panel de Control', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Agregar Vehículo', href: '/vehicles/new', icon: Car },
    { name: 'Gestión de Gastos', href: '/gastos', icon: DollarSign },
    ...(isAdmin ? [{ name: 'Gestionar Usuarios', href: '/admin/usuarios', icon: Users }] : []),
  ];

  const NavLinks = () => (
    <>
      {navigation.map((item) => {
        const isActive = location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href));
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "group flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-150 rounded-sm",
              isActive 
                ? "bg-primary text-white" 
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white"
            )}
          >
            <item.icon className={cn(
              "w-4 h-4 flex-shrink-0",
              isActive ? "text-white" : "text-sidebar-foreground/50 group-hover:text-white"
            )} />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-sidebar text-sidebar-foreground sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary p-1.5 rounded">
            <Gauge className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">Control de Flota</div>
            <div className="text-[10px] opacity-60 uppercase tracking-wider leading-tight">Municipio</div>
          </div>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded hover:bg-sidebar-accent transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="md:hidden fixed inset-0 z-40 bg-sidebar text-sidebar-foreground pt-16 px-4 pb-4 flex flex-col"
          >
            <nav className="flex-1 space-y-1 pt-4">
              <NavLinks />
            </nav>
            <div className="mt-auto border-t border-sidebar-border pt-4">
              <div className="px-3 py-2.5 mb-2 flex items-center gap-3 bg-sidebar-accent/50 rounded">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-white flex items-center justify-center font-bold text-xs">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="text-sm font-medium truncate">{user?.username}</div>
              </div>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-60 lg:w-64 bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border h-screen sticky top-0">
        {/* Logo / Institution brand */}
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="bg-primary p-1.5 rounded">
              <Gauge className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base leading-tight">Control de Flota</span>
          </div>
          <div className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider pl-9">
            Sistema Municipal
          </div>
        </div>
        
        <div className="px-3 py-4 flex-1">
          <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-2 mb-2">Menú</p>
          <nav className="space-y-0.5">
            <NavLinks />
          </nav>
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <div className="bg-sidebar-accent/60 rounded p-3 flex items-center gap-2.5 mb-2">
             <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-white text-xs">
                {user?.username?.[0]?.toUpperCase() || 'U'}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-xs font-bold text-sidebar-foreground truncate">{user?.username}</p>
               <p className="text-[10px] text-sidebar-foreground/50 truncate">Administrador</p>
             </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-medium text-sidebar-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full min-w-0">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
