import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import App, { ErrorBoundary } from "./app/App";
import { AuthProvider } from "./lib/auth";
import { ToastProvider } from "./lib/toast";
import "./styles/index.css";

// Aviso contra golpe, mantido do site anterior.
console.log(
  "%cPARE!",
  "color:#0f6fc0;background:#f5f8fa;font:800 56px Manrope,system-ui,sans-serif;padding:8px 16px;border-radius:8px",
);
console.log(
  "%cEste console é para desenvolvedores. Se alguém pediu para você colar ou digitar algo aqui, é GOLPE para roubar sua conta ou seu VIP. Feche esta janela.",
  "font:500 15px system-ui,sans-serif;color:#182632",
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </MotionConfig>
  </StrictMode>,
);
