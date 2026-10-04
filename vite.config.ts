import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { mockApi } from "./dev/mock-api";

// `npm run dev` repassa /api para a API de produção (só leitura pública).
// `npm run dev:mock` usa a API simulada de dev/mock-api.ts para testar
// login, Pix e ativação sem criar pedidos reais.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.CDW_API_TARGET || "https://cdwloja.com";
  const useMock = mode === "mock";
  // Túneis para abrir no celular ou mandar o link: qualquer *.trycloudflare.com,
  // mais os hosts de CDW_ALLOWED_HOSTS (separados por vírgula, ex.: ".ngrok-free.app").
  const allowedHosts = [".trycloudflare.com", ...(env.CDW_ALLOWED_HOSTS?.split(",").map((h) => h.trim()).filter(Boolean) ?? [])];

  return {
    plugins: [react(), tailwindcss(), useMock && mockApi()],
    server: {
      port: 5173,
      allowedHosts,
      proxy: useMock
        ? undefined
        : {
            "/api": { target, changeOrigin: true, secure: true },
          },
    },
    preview: {
      allowedHosts,
    },
    build: {
      target: "es2022",
      cssMinify: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          // Bibliotecas em arquivos próprios: mudam pouco e ficam em cache entre deploys.
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (/node_modules\/(react|react-dom|scheduler|react-router)\//.test(id)) return "react";
            if (/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(id)) return "motion";
          },
        },
      },
    },
  };
});
