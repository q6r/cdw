import { useEffect, useId, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import clsx from "clsx";
import { Icon, type IconName } from "../Icon";
import { PlanIcon } from "../PlanIcon";
import { Avatar, Skeleton } from "../ui";
import { LiquidBar } from "../Liquid";
import { useAuth } from "../../lib/auth";
import { useApi } from "../../lib/hooks";
import { callDuration, int, rgba } from "../../lib/format";
import type { RankingMetric, RankingPeriod, RankingResponse, RankingRow, RankingVipRow } from "../../lib/types";

const MEDALS = {
  1: { hi: "#fff6cf", mid: "#f7c948", lo: "#a86b0c", ribbon: "#b8862a", text: "#3d2604" },
  2: { hi: "#ffffff", mid: "#cfd6e0", lo: "#6b7686", ribbon: "#5d6573", text: "#1f2630" },
  3: { hi: "#ffe4c9", mid: "#e59a5c", lo: "#7e3f14", ribbon: "#8a4a22", text: "#3a1a06" },
} as const;

export function Medal({ place, size = 28, className }: { place: 1 | 2 | 3; size?: number; className?: string }) {
  const uid = "m" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const m = MEDALS[place];
  return (
    <span className={clsx("cdw-icon", className)} style={{ width: size, height: size * 1.25 }}>
      <svg viewBox="0 0 40 50" role="img" aria-label={`${place}º lugar`}>
        <defs>
          <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor={m.hi} />
            <stop offset="0.55" stopColor={m.mid} />
            <stop offset="1" stopColor={m.lo} />
          </linearGradient>
        </defs>
        <path d="M11 2h7l4 14h-7z" fill={m.ribbon} opacity=".9" />
        <path d="M29 2h-7l-4 14h7z" fill={m.ribbon} />
        <circle cx="20" cy="30" r="15" fill={`url(#${uid}g)`} stroke={m.lo} strokeWidth="1.4" />
        <circle cx="20" cy="30" r="11" fill="none" stroke={m.hi} strokeOpacity=".7" strokeWidth="1.2" strokeDasharray="2 1.6" />
        <text x="20" y="35.2" textAnchor="middle" fontFamily="Manrope Variable, system-ui, sans-serif" fontWeight="800" fontSize="14" fill={m.text}>
          {place}
        </text>
      </svg>
    </span>
  );
}

const PERIODS: [RankingPeriod, string][] = [
  ["week", "Semanal"],
  ["month", "Mensal"],
  ["all", "Total"],
];

const valueLabel = (metric: RankingMetric, v: number) => (metric === "voice" ? callDuration(v) : `${int(v)} msgs`);

function sinceLabel(period: RankingPeriod, since: string | null) {
  if (period === "all" || !since) return "desde o início da contagem";
  const d = new Date(`${since}T12:00:00`);
  return period === "week"
    ? `desde ${d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" })}`
    : `desde ${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}`;
}

export function RankingBoards() {
  const [period, setPeriod] = useState<RankingPeriod>("week");
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-[12px] border border-silver bg-frost p-1" role="tablist" aria-label="Período do ranking">
          {PERIODS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={period === key}
              onClick={() => setPeriod(key)}
              className={clsx(
                "relative min-h-[40px] rounded-[9px] px-5 text-sm font-semibold transition-colors",
                period === key ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {period === key && (
                <motion.span
                  layoutId="rank-period"
                  className="absolute inset-0 rounded-[9px] bg-porcelain shadow-[0_1px_3px_rgb(24_38_50/0.12)] ring-1 ring-silver"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
        <span className="chip">
          <span className="live-dot" aria-hidden="true" /> atualiza sozinho a cada minuto
        </span>
      </div>
      <TopVips />
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
        <Board period={period} metric="voice" title="Tempo em call" icon="voice" />
        <Board period={period} metric="messages" title="Mensagens no chat geral" icon="message" />
      </div>
    </div>
  );
}

function PlanBadge({ plan, big = false }: { plan: RankingVipRow["plan"]; big?: boolean }) {
  return (
    <span
      className={clsx("inline-flex items-center gap-1.5 font-semibold text-ink-2", big ? "rounded-full border bg-porcelain px-3 py-1.5 text-sm" : "text-xs")}
      style={big ? { borderColor: rgba(plan.color, 0.5) } : undefined}
    >
      <PlanIcon name={plan.icon} size={big ? 22 : 14} animated={big} />
      {plan.kind === "owner" ? `Cargo ${plan.name}` : `VIP ${plan.name}`}
    </span>
  );
}

function TopVips() {
  const { data, loading } = useApi<{ total: number; rows: RankingVipRow[] }>("/ranking/vips");
  const [all, setAll] = useState(false);
  const rows = data?.rows ?? [];
  const [leader, ...rest] = rows;
  const shown = all ? rest : rest.slice(0, 8);
  const daysSince = (d: string) => Math.max(1, Math.floor((Date.now() - new Date(d).getTime()) / 864e5));

  return (
    <section className="card overflow-hidden" aria-labelledby="top-vips-t">
      <header className="flex items-center justify-between gap-3 border-b border-silver px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[12px] border border-silver bg-frost">
            <PlanIcon name="crown" size={22} />
          </span>
          <div>
            <h2 id="top-vips-t" className="font-display text-base font-extrabold tracking-tight">
              Os melhores VIPs
            </h2>
            <p className="text-[13px] text-dim">quem tem o VIP mais alto da CDW agora</p>
          </div>
        </div>
        {data && data.total > 0 && (
          <span className="shrink-0 text-[13px] font-semibold text-dim">{data.total === 1 ? "1 VIP ativo" : `${int(data.total)} VIPs ativos`}</span>
        )}
      </header>
      {loading && !data ? (
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !leader ? (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <PlanIcon name="crown" size={56} />
          <p className="mt-5 font-display text-base font-bold">Ainda não tem VIP no ranking</p>
          <p className="mt-2 max-w-xs text-sm text-muted">O primeiro a assinar aparece aqui em destaque.</p>
          <Link to="/planos" className="btn btn-primary btn-sm mt-6">
            Ver planos
          </Link>
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          <div
            className={clsx("relative flex flex-wrap items-center gap-x-5 gap-y-4 overflow-hidden rounded-[14px] border p-4 sm:p-5", leader.isMe && "ring-2 ring-liquid/40")}
            style={{ borderColor: rgba(leader.plan.color, 0.45), background: `linear-gradient(90deg, ${rgba(leader.plan.color, 0.14)}, #ffffff 65%)` }}
          >
            <div className="relative">
              <Avatar src={leader.avatar} name={leader.displayName} size={64} square />
              <Medal place={1} size={24} className="absolute -bottom-3 -right-3" />
            </div>
            <div className="min-w-[10rem] flex-1">
              <p className="eyebrow">Topo dos VIPs</p>
              <p className="truncate font-display text-xl font-extrabold tracking-tight">{leader.displayName}</p>
              <p className="text-[13px] text-dim">
                {leader.username ? `@${leader.username} · ` : ""}VIP há {daysSince(leader.since)} {daysSince(leader.since) === 1 ? "dia" : "dias"}
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <PlanBadge plan={leader.plan} big />
            </div>
          </div>
          {rest.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {shown.map((r) => (
                <li key={r.rank} className={clsx("flex items-center gap-3 rounded-[12px] border bg-porcelain px-3 py-2.5", r.isMe ? "border-liquid/50 bg-liquid-mist" : "border-silver")}>
                  <span className="tabular w-6 shrink-0 font-mono text-[11px] text-dim">{String(r.rank).padStart(2, "0")}</span>
                  <Avatar src={r.avatar} name={r.displayName} size={32} square />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{r.displayName}</div>
                    <PlanBadge plan={r.plan} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {rest.length > 8 && (
            <button type="button" className="mt-3 text-sm font-semibold text-liquid-ink hover:underline" onClick={() => setAll((a) => !a)}>
              {all ? "Mostrar menos" : `Ver todos os ${rows.length}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function Board({ period, metric, title, icon }: { period: RankingPeriod; metric: RankingMetric; title: string; icon: IconName }) {
  const { user } = useAuth();
  const { data, loading, reload } = useApi<RankingResponse>(`/ranking?period=${period}&metric=${metric}`);
  useEffect(() => {
    const id = setInterval(() => !document.hidden && void reload(), 60_000);
    return () => clearInterval(id);
  }, [reload]);

  const rows = data?.rows ?? [];
  const top = rows[0]?.value || 1;
  const podium = rows.slice(0, 3);
  const others = rows.slice(3);
  const me = data?.me;
  const meOutside = me && (me.rank === null || me.rank > 30);
  const headingId = `board-${metric}`;

  return (
    <section className="card overflow-hidden" aria-labelledby={headingId}>
      <header className="flex items-center justify-between gap-3 border-b border-silver px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-liquid-soft text-liquid-deep">
            <Icon name={icon} size={19} />
          </span>
          <div>
            <h2 id={headingId} className="font-display text-base font-extrabold tracking-tight">
              Top 30 · {title}
            </h2>
            <p className="text-[13px] text-dim">{sinceLabel(period, data?.since ?? null)}</p>
          </div>
        </div>
        {data && data.total > 0 && (
          <span className="shrink-0 text-[13px] font-semibold text-dim">{data.total === 1 ? "1 pessoa" : `${int(data.total)} pessoas`}</span>
        )}
      </header>

      {loading && !data ? (
        <div className="space-y-2 p-5">
          <Skeleton className="h-40" />
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <PlanIcon name="trophy" size={60} />
          <p className="mt-6 font-display text-base font-bold">Ninguém pontuou ainda</p>
          <p className="mt-2 max-w-xs text-sm text-muted">
            {metric === "voice" ? "Entre numa call e seja o primeiro do ranking." : "Mande mensagem no chat geral e apareça aqui."}
          </p>
        </div>
      ) : (
        <>
          <ol className="grid grid-cols-3 items-end gap-2 px-4 pb-2 pt-10 sm:gap-3 sm:px-6" aria-label="Pódio">
            {[podium[1], podium[0], podium[2]].map((r, i) => (r ? <Podium key={r.rank} row={r} metric={metric} /> : <li key={`vazio-${i}`} />))}
          </ol>
          {others.length > 0 && (
            <ol className="mt-4 divide-y divide-silver border-t border-silver" start={4}>
              {others.map((r) => (
                <li key={r.rank} className={clsx("flex items-center gap-3 px-5 py-3 sm:px-6", r.isMe && "bg-liquid-mist")}>
                  <span className="tabular w-7 shrink-0 font-mono text-xs text-dim">{String(r.rank).padStart(2, "0")}</span>
                  <Avatar src={r.avatar} name={r.displayName} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{r.displayName}</span>
                      {r.isMe && <span className="rounded-[5px] bg-liquid-deep px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">você</span>}
                    </div>
                    <LiquidBar className="mt-1.5 !h-1.5" value={r.value / top} />
                  </div>
                  <span className="tabular shrink-0 font-mono text-sm font-semibold">{valueLabel(metric, r.value)}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      <footer className="border-t border-silver bg-frost px-5 py-3.5 text-sm sm:px-6">
        {!user ? (
          <span className="text-muted">
            <Link to="/entrar?next=/ranking" className="link">
              Entre
            </Link>{" "}
            para ver sua posição.
          </span>
        ) : !user.discord ? (
          <span className="text-muted">
            <Link to="/painel" className="link">
              Vincule seu Discord
            </Link>{" "}
            para ver sua posição.
          </span>
        ) : meOutside ? (
          <span className="flex items-center justify-between gap-3">
            <span className="text-muted">{me.rank ? `Você está em #${me.rank}` : "Você ainda não pontuou neste período"}</span>
            {me.rank && <span className="tabular font-mono font-semibold">{valueLabel(metric, me.value)}</span>}
          </span>
        ) : me?.rank ? (
          <span className="text-muted">
            Você está no top 30: <strong className="text-liquid-ink">#{me.rank}</strong>
          </span>
        ) : (
          <span className="text-muted">Carregando sua posição…</span>
        )}
      </footer>
    </section>
  );
}

function Podium({ row, metric }: { row: RankingRow; metric: RankingMetric }) {
  const place = row.rank as 1 | 2 | 3;
  const first = place === 1;
  const color = { 1: "#f7c948", 2: "#b8c4d2", 3: "#e59a5c" }[place];
  return (
    <li
      className={clsx(
        "relative flex min-w-0 flex-col items-center rounded-[16px] border px-2 pb-4 text-center sm:px-3",
        first ? "pt-9 sm:-translate-y-3" : "pt-7",
        row.isMe && "ring-2 ring-liquid/40",
      )}
      style={{ borderColor: rgba(color, 0.5), background: `linear-gradient(180deg, ${rgba(color, 0.18)}, #ffffff 70%)` }}
    >
      {first && <PlanIcon name="crown" size={34} className="absolute -top-5 left-1/2 -translate-x-1/2" />}
      <div className="relative">
        <Avatar src={row.avatar} name={row.displayName} size={first ? 64 : 52} className="!ring-2 !ring-white" />
        <Medal place={place} size={first ? 24 : 20} className="absolute -bottom-3 -right-3" />
      </div>
      <div className="mt-5 w-full truncate text-sm font-semibold">{row.displayName}</div>
      {row.username && <div className="w-full truncate text-[11px] text-dim">@{row.username}</div>}
      <div className={clsx("tabular mt-2 font-display font-extrabold", first ? "text-lg" : "text-base")}>{valueLabel(metric, row.value)}</div>
    </li>
  );
}
