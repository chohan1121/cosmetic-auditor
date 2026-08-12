import { useEffect } from "react";
import { motion } from "framer-motion";
import { Route, Routes } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useMasterDataStore } from "@/stores/masterDataStore";
import { useAuthStore } from "@/stores/authStore";
import HomePage from "@/pages/HomePage";
import CheckPage from "@/pages/CheckPage";
import ScanPage from "@/pages/ScanPage";
import CostPage from "@/pages/CostPage";
import PouchPage from "@/pages/PouchPage";
import ProfilePage from "@/pages/ProfilePage";
import GuidePage from "@/pages/GuidePage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  const { status, error, load } = useMasterDataStore();
  const initAuth = useAuthStore((s) => s.init);

  useEffect(() => {
    load();
    initAuth();
  }, [load, initAuth]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background text-label">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw size={28} className="text-accent" />
        </motion.div>
        <p className="text-sm text-label-secondary">データを読み込み中...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center text-label">
        <p className="text-sm font-medium">データの取得に失敗しました</p>
        <p className="text-xs text-label-secondary">{error}</p>
        <button
          onClick={() => load()}
          className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white active:opacity-80"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/check" element={<CheckPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/cost" element={<CostPage />} />
        <Route path="/pouch" element={<PouchPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
