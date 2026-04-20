import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetMe } from "@workspace/api-client-react";
import { Users, UserPlus, Trash2, Loader2, ShieldAlert, Pencil, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: number;
  username: string;
  createdAt: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error desconocido");
  return data as T;
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface EditModalProps {
  user: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}

function EditModal({ user, onClose, onSaved }: EditModalProps) {
  const [nuevoNombre, setNuevoNombre] = useState(user.username);
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const { mutate: editarUsuario, isPending } = useMutation({
    mutationFn: (body: { username?: string; password?: string }) =>
      apiFetch<AdminUser>(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: (updated) => {
      toast({ title: "Usuario actualizado", description: `Los datos de "${updated.username}" fueron guardados correctamente.` });
      onSaved();
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const nombreCambiado = nuevoNombre.trim() !== user.username;
    const contrasenaIngresada = nuevaContrasena.length > 0;

    if (!nombreCambiado && !contrasenaIngresada) {
      setError("No se realizaron cambios. Modifique el nombre de usuario o ingrese una nueva contraseña.");
      return;
    }

    if (contrasenaIngresada && nuevaContrasena.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    const body: { username?: string; password?: string } = {};
    if (nombreCambiado) body.username = nuevoNombre.trim();
    if (contrasenaIngresada) body.password = nuevaContrasena;

    editarUsuario(body);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
        {/* Modal header */}
        <div className="bg-sidebar px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Pencil className="w-4 h-4 text-white/70" />
            <span className="font-bold">Editar Usuario</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User badge */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-secondary/60 rounded border border-border">
            <div className="w-8 h-8 rounded-full bg-[#1a4f7a] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Editando usuario</p>
              <p className="font-semibold text-sm text-foreground">{user.username}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Nombre de Usuario
            </label>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              disabled={user.username === "admin"}
              className="w-full px-3 py-2.5 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:bg-muted disabled:cursor-not-allowed"
              autoComplete="off"
            />
            {user.username === "admin" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                El nombre del administrador no puede modificarse.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
              placeholder="Dejar vacío para no cambiar"
              className="w-full px-3 py-2.5 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">Mínimo 4 caracteres. Dejar vacío para mantener la contraseña actual.</p>
          </div>

          {error && (
            <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground rounded font-semibold text-sm hover:bg-secondary/80 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              ) : (
                <><Check className="w-4 h-4" /> Guardar Cambios</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const { data: currentUser } = useGetMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [nuevoUsuario, setNuevoUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [formError, setFormError] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const isAdmin = currentUser?.username === "admin";

  if (currentUser && !isAdmin) {
    setLocation("/dashboard");
    return null;
  }

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch<AdminUser[]>("/api/admin/users"),
    enabled: isAdmin,
  });

  const { mutate: crearUsuario, isPending: creando } = useMutation({
    mutationFn: (body: { username: string; password: string }) =>
      apiFetch<AdminUser>("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: (nuevo) => {
      toast({ title: "Usuario creado", description: `El usuario "${nuevo.username}" fue registrado exitosamente.` });
      setNuevoUsuario("");
      setContrasena("");
      setFormError("");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  const { mutate: eliminarUsuario } = useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ success: boolean }>(`/api/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Usuario eliminado", description: "El usuario fue eliminado correctamente." });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!nuevoUsuario.trim()) {
      setFormError("El nombre de usuario es obligatorio.");
      return;
    }
    if (contrasena.length < 4) {
      setFormError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }
    crearUsuario({ username: nuevoUsuario.trim(), password: contrasena });
  }

  function handleEliminar(user: AdminUser) {
    if (confirm(`¿Está seguro de que desea eliminar al usuario "${user.username}"? Esta acción no se puede deshacer.`)) {
      eliminarUsuario(user.id);
    }
  }

  return (
    <>
      {editingUser && (
        <EditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}
        />
      )}

      <div className="space-y-6 max-w-3xl mx-auto">

        {/* Page header */}
        <div className="bg-white border border-border rounded shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1a4f7a]/10 rounded">
              <Users className="w-5 h-5 text-[#1a4f7a]" />
            </div>
            <div>
              <h1 className="gov-heading text-2xl font-display">Gestión de Usuarios</h1>
              <span className="gov-heading-accent" />
              <p className="text-muted-foreground text-sm mt-0.5">Registre y administre los usuarios con acceso al sistema.</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 font-medium">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            Esta sección es de acceso exclusivo para el administrador del sistema.
          </div>
        </div>

        {/* Add user form */}
        <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
          <div className="section-bar flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Agregar Nuevo Usuario
          </div>
          <form onSubmit={handleGuardar} className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Nuevo Usuario
                </label>
                <input
                  type="text"
                  value={nuevoUsuario}
                  onChange={(e) => setNuevoUsuario(e.target.value)}
                  placeholder="ej. inspector01"
                  className="w-full px-3 py-2.5 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full px-3 py-2.5 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {formError && (
              <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creando}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {creando ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Guardar Usuario</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* User list */}
        <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
          <div className="section-bar flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuarios Registrados
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
            </div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold text-left">
                    <th className="px-5 py-3">Usuario</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Fecha de Alta</th>
                    <th className="px-5 py-3">Rol</th>
                    <th className="px-3 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-secondary/20 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#1a4f7a] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {user.username[0].toUpperCase()}
                          </div>
                          <span className="font-semibold text-foreground">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                        {formatFecha(user.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        {user.username === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1a4f7a]/10 text-[#1a4f7a] rounded text-xs font-bold border border-[#1a4f7a]/20">
                            <ShieldAlert className="w-3 h-3" /> Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs font-semibold border border-border">
                            Operador
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit button — available for all users including admin (to change password) */}
                          <button
                            onClick={() => setEditingUser(user)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#1a4f7a] bg-[#1a4f7a]/10 hover:bg-[#1a4f7a]/20 rounded transition-colors"
                            title="Editar usuario"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>

                          {/* Delete button — not available for admin */}
                          {user.username !== "admin" && (
                            <button
                              onClick={() => handleEliminar(user)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded transition-colors"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Eliminar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="w-10 h-10 text-border mx-auto mb-3" />
              <p className="text-sm">No hay usuarios registrados aún.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
