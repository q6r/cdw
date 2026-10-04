import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router";
import clsx from "clsx";
import { Icon } from "../Icon";
import { useApi } from "../../lib/hooks";
import { callDuration } from "../../lib/format";
import type { RankingResponse, RankingRow } from "../../lib/types";

type Spot = readonly [x: number, y: number, scale: number];

/**
 * Lugares em volta do medalhão, em % do tamanho dele (centro do avatar).
 * `m` é o celular e `t` o tablet, só nas laterais, porque o texto vem logo
 * abaixo; `d` é o computador, em volta toda. Todos desviam das etiquetas de
 * preço (cantos superior direito e inferior esquerdo) e da legenda embaixo.
 * `back` são os menores, mais "longe": sem selo e com sombra mais leve.
 */
const SPOTS: { d: Spot; t?: Spot; m?: Spot; back?: boolean }[] = [
  { d: [44, -13, 1.05], t: [122, 58, 1], m: [121, 52, 1] },
  { d: [-10, 56, 1], t: [-14, 10, 1], m: [-17, 12, 1] },
  { d: [111, 36, 0.95], t: [-16, 70, 0.95], m: [-15, 80, 0.9] },
  { d: [16, -18, 0.7], t: [-27, 38, 0.75], m: [-23, 44, 0.75], back: true },
  { d: [108, 62, 0.7], t: [127, 8, 0.7], m: [118, 18, 0.75], back: true },
  { d: [-12, 30, 0.75], t: [-25, 96, 0.7], m: [114, 86, 0.75], back: true },
  { d: [110, 88, 1], t: [114, 30, 0.9] },
  { d: [-12, -8, 1], t: [112, 90, 0.8] },
  { d: [74, -19, 0.75], back: true },
  { d: [90, 112, 0.85] },
  { d: [-6, 108, 0.8] },
];

/** Avatar do Discord estático, em WebP de 128 px (leve e nítido nesse tamanho). */
function crowdAvatar(src: string | null) {
  if (!src) return null;
  try {
    const u = new URL(src);
    if (u.protocol !== "https:" || !/^(cdn\.discordapp\.com|media\.discordapp\.net)$/.test(u.host)) return null;
    if (/^\/(avatars|guilds)\//.test(u.pathname)) {
      u.pathname = u.pathname.replace(/\.(png|jpe?g|gif|webp)$/i, ".webp");
      u.search = "?size=128";
    }
    return u.toString();
  } catch {
    return null;
  }
}

function initials(name: string) {
  return Array.from(name.replace(/[^\p{L}\p{N}]/gu, "")).slice(0, 2).join("").toUpperCase() || "?";
}

function Bubble({ person, spot, index }: { person: RankingRow; spot: (typeof SPOTS)[number]; index: number }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : crowdAvatar(person.avatar);
  const style = {
    "--dx": spot.d[0],
    "--dy": spot.d[1],
    "--ds": spot.d[2],
    ...(spot.t && { "--tx": spot.t[0], "--ty": spot.t[1], "--ts": spot.t[2] }),
    ...(spot.m && { "--mx": spot.m[0], "--my": spot.m[1], "--ms": spot.m[2] }),
    "--i": index,
    "--drift": `${7 + ((index * 1.7) % 4)}s`,
    "--drift-delay": `${-((index * 1.3) % 7)}s`,
  } as CSSProperties;

  return (
    <Link
      to="/ranking"
      tabIndex={-1}
      aria-hidden="true"
      draggable={false}
      className={clsx(
        "crowd-bubble",
        spot.back && "crowd-back",
        !spot.m && "max-sm:hidden",
        !spot.t && "sm:max-lg:hidden",
      )}
      style={style}
    >
      <span className="crowd-pop">
        <span className="crowd-drift">
          <span className="crowd-face">
            {src ? (
              <img
                src={src}
                alt=""
                width={128}
                height={128}
                loading="lazy"
                decoding="async"
                draggable={false}
                onError={() => setFailed(true)}
              />
            ) : (
              <span className="crowd-initials">{initials(person.displayName)}</span>
            )}
          </span>
          {!spot.back && (
            <span className="crowd-badge">
              <Icon name="voice" size={12} strokeWidth={2.6} />
            </span>
          )}
          <span className="crowd-name">
            {person.displayName}
            <span className="font-medium text-white/70"> · {callDuration(person.value)}</span>
          </span>
        </span>
      </span>
    </Link>
  );
}

/**
 * Rostos de quem mais fica em call na CDW, espalhados em volta do medalhão.
 * A API pública diz quantas pessoas estão em call agora, mas não quem; os
 * rostos vêm do ranking de tempo em call da semana, e a legenda diz isso.
 */
export function CallCrowd() {
  const { data } = useApi<RankingResponse>("/ranking?period=week&metric=voice");
  const people = useMemo(() => {
    const rows = data?.rows ?? [];
    const withFace = rows.filter((r) => crowdAvatar(r.avatar));
    return (withFace.length >= 6 ? withFace : rows).slice(0, SPOTS.length);
  }, [data]);

  if (people.length < 3) return null;

  return (
    <>
      {people.map((p, i) => (
        <Bubble key={`${p.rank}-${p.username}`} person={p} spot={SPOTS[i]} index={i} />
      ))}
      <Link
        to="/ranking"
        className="crowd-caption inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-silver bg-porcelain/95 px-3 py-1 text-[12px] font-semibold text-ink-2 shadow-lift backdrop-blur transition-colors hover:border-liquid/40 hover:text-liquid-ink sm:gap-2 sm:px-3.5 sm:py-1.5 sm:text-[13px]"
      >
        <Icon name="voice" size={14} strokeWidth={2.2} className="text-liquid-deep" />
        <span>
          Quem mais fica em call <span className="font-medium text-dim">esta semana</span>
        </span>
      </Link>
    </>
  );
}
