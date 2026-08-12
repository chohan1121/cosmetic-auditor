import { motion } from "framer-motion";
import { FlaskConical, Home, ShoppingBag, User, Wallet } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "ホーム", icon: Home, end: true },
  { to: "/check", label: "成分", icon: FlaskConical, end: false },
  { to: "/cost", label: "コスパ", icon: Wallet, end: false },
  { to: "/pouch", label: "ポーチ", icon: ShoppingBag, end: false },
  { to: "/profile", label: "わたし", icon: User, end: false },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex min-h-dvh flex-col bg-background text-label">
      <main className="mx-auto w-full max-w-md flex-1 overflow-x-hidden px-4 pb-28 pt-6">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 16, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-separator bg-surface/80 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute top-0 h-0.5 w-8 rounded-full bg-accent"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <motion.span
                    animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.4 : 1.8}
                      className={cn(
                        "transition-colors",
                        isActive ? "text-accent" : "text-label-secondary"
                      )}
                    />
                  </motion.span>
                  <span className={cn(isActive ? "text-accent font-medium" : "text-label-secondary")}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
      <Toaster position="top-center" richColors />
    </div>
  );
}
