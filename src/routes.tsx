import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages (lazy import can be added later for code splitting)
import Home from "@/pages/Home";
import Scan from "@/pages/Scan";
import ProductDetail from "@/pages/ProductDetail";
import GenericFinder from "@/pages/GenericFinder";
import Closet from "@/pages/Closet";
import SynergyCheck from "@/pages/SynergyCheck";
import Profile from "@/pages/Profile";
import Auth from "@/pages/Auth";

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <p className="text-2xl font-bold text-emerald-400">Cosmetic Auditor</p>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AuthOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  if (loading) return <Splash />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "scan",
        element: (
          <ProtectedRoute>
            <Scan />
          </ProtectedRoute>
        ),
      },
      {
        path: "products/:id",
        element: (
          <ProtectedRoute>
            <ProductDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "generic",
        element: (
          <ProtectedRoute>
            <GenericFinder />
          </ProtectedRoute>
        ),
      },
      {
        path: "closet",
        element: (
          <ProtectedRoute>
            <Closet />
          </ProtectedRoute>
        ),
      },
      {
        path: "synergy",
        element: (
          <ProtectedRoute>
            <SynergyCheck />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "auth",
    element: (
      <AuthOnlyRoute>
        <Auth />
      </AuthOnlyRoute>
    ),
  },
]);
