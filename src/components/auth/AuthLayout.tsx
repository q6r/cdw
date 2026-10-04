import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "../Icon";
import { BrandMark, BrandMedia } from "../Brand";
import { useReducedMotion, useStats } from "../../lib/hooks";
import { int } from "../../lib/format";

const WORDS = ["Sua tag.", "Sua cor.", "Sua call.", "Seu status."];

/** Painel da marca ao lado dos formulários (só no computador). */
function BrandPanel() {
  const stats = useStats(60_000);
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2600);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-silver bg-[linear-gradient(160deg,#eef3f7_0%,#d9e2ea_55%,#cfd9e2_100%)] p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 bottom-24 h-80 w-80 rounded-full bg-[rgb(22_143_229/0.14)] blur-3xl" />
      <div className="relative flex items-center justify-between">
        <Link to="/" aria-label="Voltar ao início" className="rounded-[12px]">
          <BrandMark />
        </Link>
        <span className="chip bg-white/80">
          <span className="live-dot" aria-hidden="true" />
          {stats?.guild?.online ? `${int(stats.guild.online)} online` : "ao vivo"}
        </span>
      </div>
      <div className="relative grid flex-1 place-items-center py-8">
        <div className="w-full max-w-[360px] rounded-[30px] bg-gradient-to-b from-white to-[#e6edf2] p-2.5 shadow-float ring-1 ring-silver">
          <BrandMedia className="rounded-[24px]" />
        </div>
      </div>
      <div className="relative">
        <p className="eyebrow mb-3">CDW · VIP</p>
        <div className="relative h-[1.15em] overflow-hidden font-display text-[clamp(2rem,3.2vw,2.9rem)] font-extrabold leading-[1.1] tracking-[-0.035em]">
          {reduced ? (
            <span>Sua tag. Sua call.</span>
          ) : (
            <AnimatePresence initial={false}>
              <motion.span
                key={i}
                className={`absolute inset-x-0 top-0 ${i === 1 ? "text-liquid-deep" : ""}`}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {WORDS[i]}
              </motion.span>
            </AnimatePresence>
          )}
        </div>
        <p className="mt-3 max-w-sm text-[15px] text-muted">Entre para comprar, renovar e personalizar seu VIP em tempo real.</p>
      </div>
    </div>
  );
}

export function AuthLayout({
  children,
  back = { to: "/", label: "Voltar ao site" },
  tag,
}: {
  children: ReactNode;
  back?: { to: string; label: string };
  tag: string;
}) {
  return (
    <div className="grid min-h-[100svh] lg:grid-cols-[1.05fr_1fr]">
      <div className="sticky top-0 hidden h-[100svh] p-3 lg:block">
        <BrandPanel />
      </div>
      <div className="flex min-h-[100svh] flex-col px-4 py-5 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={back.to}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-[10px] text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <Icon name="arrow-left" size={17} />
            {back.label}
          </Link>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">{tag}</span>
        </div>
        <main id="conteudo" className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10">
          <Link to="/" className="mb-8 self-start lg:hidden" aria-label="CDW, página inicial">
            <BrandMark size={44} />
          </Link>
          {children}
        </main>
        <p className="flex items-center justify-center gap-2 text-center text-xs font-medium text-dim">
          <Icon name="lock" size={14} /> Protegido por captcha · conexão segura
        </p>
      </div>
    </div>
  );
}
