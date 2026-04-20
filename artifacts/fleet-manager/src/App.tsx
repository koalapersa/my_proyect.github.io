import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetMe } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

import { AdminLayout } from "@/components/layout/admin-layout";
import { PublicLayout } from "@/components/layout/public-layout";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import VehicleForm from "@/pages/vehicle-form";
import VehicleDetail from "@/pages/vehicle-detail";
import PublicVehicle from "@/pages/public-vehicle";
import AdminUsers from "@/pages/admin-users";
import Gastos from "@/pages/gastos";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Wrapper to protect admin routes
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading, isError } = useGetMe();

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      setLocation("/login");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isError, user]);

  if (isLoading || !user) {
    return <Spinner />;
  }

  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

// Wrapper for login to redirect if already authed
function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user]);

  if (isLoading) {
    return <Spinner />;
  }

  if (user) return null;

  return <Component />;
}

// Redirect root
function RootRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/dashboard");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      
      {/* Auth Route */}
      <Route path="/login">
        {() => <AuthRoute component={Login} />}
      </Route>

      {/* Public Route (QR targets) */}
      <Route path="/public/:interno">
        {() => (
          <PublicLayout>
            <PublicVehicle />
          </PublicLayout>
        )}
      </Route>

      {/* Protected Admin Routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/vehicles/new">
        {() => <ProtectedRoute component={VehicleForm} />}
      </Route>
      <Route path="/vehicles/:interno/edit">
        {() => <ProtectedRoute component={VehicleForm} />}
      </Route>
      <Route path="/vehicles/:interno">
        {() => <ProtectedRoute component={VehicleDetail} />}
      </Route>
      <Route path="/admin/usuarios">
        {() => <ProtectedRoute component={AdminUsers} />}
      </Route>
      <Route path="/gastos">
        {() => <ProtectedRoute component={Gastos} />}
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
