import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";

/**
 * Confirmação rápida em tela cheia (login, cadastro, senha nova): o círculo
 * enche de líquido e o check aparece. Fecha sozinha e chama `onDone`.
 */
export function SuccessOverlay({
  title,
  subtitle,
  onDone,
  duration = 1500,
}: {
  title: string;
  subtitle?: string;
  onDone: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[200] grid place-items-center bg-ice/90 px-6 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="status"
      aria-live="assertive"
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-full border border-silver-strong bg-gradient-to-b from-white to-frost shadow-float">
          <motion.div
            className="liquid-fill"
            initial={{ height: "0%" }}
            animate={{ height: "100%" }}
            transition={{ duration: 0.9, ease: [0.45, 0, 0.25, 1] }}
          />
          <svg width="52" height="52" viewBox="0 0 24 24" className="relative" aria-hidden="true">
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              fill="none"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.55, duration: 0.45, ease: "easeOut" }}
            />
          </svg>
        </div>
        <motion.h2
          className="mt-8 font-display text-2xl font-extrabold tracking-tight sm:text-3xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {title}
        </motion.h2>
        {subtitle && (
          <motion.p className="mt-2 text-muted" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            {subtitle}
          </motion.p>
        )}
      </div>
    </motion.div>,
    document.body,
  );
}
