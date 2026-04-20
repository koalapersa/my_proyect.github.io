import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { KeyRound, User, Loader2, AlertCircle } from "lucide-react";
import { useLogin } from "@workspace/api-client-react";
import logoImg from "@assets/Diseño_sin_título_1774663393444.png";

const loginSchema = z.object({
  username: z.string().min(1, "El usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [authError, setAuthError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const { mutate: login, isPending } = useLogin({
    mutation: {
      onSuccess: () => {
        setLocation("/dashboard");
      },
      onError: (error) => {
        setAuthError((error.response?.data as any)?.error || "Credenciales inválidas. Intente nuevamente.");
      }
    }
  });

  const onSubmit = (data: LoginFormValues) => {
    setAuthError(null);
    login({ data });
  };

  return (
    <div className="min-h-screen w-full flex bg-background">

      {/* Left panel — dark navy with centered MA logo */}
      <div className="hidden lg:flex w-[420px] xl:w-[480px] flex-shrink-0 relative bg-sidebar flex-col items-center justify-center overflow-hidden">
        {/* Subtle diagonal texture */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "12px 12px" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center text-center px-10"
        >
          {/* Logo in white rounded container */}
          <div className="bg-white rounded-2xl shadow-2xl shadow-black/40 p-6 mb-8 w-48 h-48 flex items-center justify-center">
            <img
              src={logoImg}
              alt="Municipio de Malvinas Argentinas"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Institutional text */}
          <h1 className="text-2xl font-display font-bold text-white leading-tight tracking-wide">
            MALVINAS ARGENTINAS
          </h1>
          <p className="text-sm text-white/60 uppercase tracking-[0.2em] mt-1">Municipio</p>

          <div className="mt-6 w-10 h-0.5 bg-primary rounded-full" />

          <p className="text-sm text-white/50 mt-4 leading-relaxed max-w-xs">
            Sistema de Control y Seguimiento de Flota Municipal
          </p>
        </motion.div>
      </div>

      {/* Right side — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">

        {/* Mobile logo */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 lg:hidden flex flex-col items-center">
          <div className="bg-white rounded-xl shadow-md p-3 w-16 h-16 flex items-center justify-center mb-2">
            <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <p className="text-xs font-bold text-foreground tracking-wide uppercase">Malvinas Argentinas</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Heading with green underline — matches gov portal style */}
          <div className="mb-8">
            <h2 className="gov-heading text-2xl md:text-3xl font-display">
              Acceso al Sistema
            </h2>
            <span className="gov-heading-accent" />
            <p className="text-muted-foreground text-sm">
              Ingrese sus credenciales para acceder al panel de gestión.
            </p>
          </div>

          <div className="bg-white border border-border rounded shadow-sm p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {authError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 text-red-700 text-sm p-3 rounded flex items-start gap-2.5 border border-red-200"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{authError}</p>
                </motion.div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground block">Usuario</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    {...register("username")}
                    className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                    placeholder="usuario o email"
                    autoComplete="username"
                  />
                </div>
                {errors.username && <p className="text-xs text-red-600">{errors.username.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground block">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="password"
                    {...register("password")}
                    className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                    placeholder="contraseña"
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full mt-2 py-3 px-6 rounded font-bold bg-primary text-white hover:bg-primary/90 active:bg-primary/80 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2 text-sm shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
