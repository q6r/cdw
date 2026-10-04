import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { api } from "../../lib/api";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadScript() {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    if (window.turnstile) return resolve();
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("captcha indisponível"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

let keyPromise: Promise<string | null> | null = null;
const siteKey = () =>
  (keyPromise ??= api
    .get<{ turnstileSiteKey: string | null }>("/config")
    .then((c) => c.turnstileSiteKey)
    .catch(() => {
      keyPromise = null;
      return null;
    }));

export interface TurnstileHandle {
  reset: () => void;
}

/**
 * Captcha do Cloudflare. `onToken(null)` = ainda sem token (bloqueia o envio);
 * `onToken("")` = captcha desligado no servidor (libera o envio).
 */
export function Turnstile({ onToken, ref }: { onToken: (token: string | null) => void; ref?: Ref<TurnstileHandle> }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const cb = useRef(onToken);
  cb.current = onToken;
  const [state, setState] = useState<"loading" | "off" | "error" | "ready">("loading");

  useImperativeHandle(ref, () => ({
    reset() {
      cb.current(null);
      if (widget.current && window.turnstile) window.turnstile.reset(widget.current);
    },
  }));

  useEffect(() => {
    let alive = true;
    (async () => {
      const key = await siteKey();
      if (!alive) return;
      if (!key) {
        setState("off");
        cb.current("");
        return;
      }
      try {
        await loadScript();
      } catch {
        if (alive) setState("error");
        return;
      }
      if (!alive || !box.current || !window.turnstile) return;
      widget.current = window.turnstile.render(box.current, {
        sitekey: key,
        theme: "light",
        size: "flexible",
        language: "pt-br",
        callback: (t: string) => cb.current(t),
        "expired-callback": () => cb.current(null),
        "error-callback": () => cb.current(null),
      });
      setState("ready");
    })();
    return () => {
      alive = false;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, []);

  if (state === "off") return null;
  return (
    <div className="relative min-h-[65px] overflow-hidden rounded-[10px]">
      {state === "loading" && <div className="skeleton absolute inset-0" aria-label="Carregando verificação" />}
      {state === "error" && (
        <div className="grid h-[65px] place-items-center rounded-[10px] border border-danger/30 bg-danger-soft px-4 text-center text-[13px] font-medium text-danger" role="alert">
          Não foi possível carregar a verificação. Recarregue a página.
        </div>
      )}
      <div ref={box} />
    </div>
  );
}
