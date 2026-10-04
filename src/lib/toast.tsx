import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Icon, type IconName } from "../components/Icon";

type Tone = "success" | "error" | "info";
type Toast = { id: number; tone: Tone; text: string };
type Notify = (text: string, tone?: Tone) => void;

const ToastContext = createContext<Notify | null>(null);

const TONES: Record<Tone, { icon: IconName; cls: string }> = {
  success: { icon: "check", cls: "text-success" },
  error: { icon: "alert", cls: "text-danger" },
  info: { icon: "info", cls: "text-liquid-deep" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback<Notify>((text, tone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-3), { id, tone, text }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), tone === "error" ? 6000 : 4000);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 bottom-4 z-[250] flex flex-col items-center gap-2 px-4 sm:bottom-6"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-live="polite"
        >
          <AnimatePresence initial={false}>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                role={t.tone === "error" ? "alert" : "status"}
                className="pointer-events-auto flex max-w-md items-center gap-3 rounded-[12px] border border-silver bg-porcelain px-4 py-3 text-sm font-medium text-ink shadow-pop"
              >
                <span
                  className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-full bg-frost", TONES[t.tone].cls)}
                >
                  <Icon name={TONES[t.tone].icon} size={15} strokeWidth={2.2} />
                </span>
                {t.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast fora do ToastProvider");
  return ctx;
}
