import { useId, useMemo, type CSSProperties } from "react";
import clsx from "clsx";
import type { PlanIconName } from "../lib/types";

// Ícones dos planos, portados do front anterior: cada um é um desenho com
// gradiente próprio, brilho e faíscas. São a identidade de cada plano.

interface Palette {
  light: string;
  mid: string;
  dark: string;
  outline: string;
}

interface IconDef {
  name: string;
  colors: [string, string, string, string];
  body: string;
  detail?: (p: Palette) => string;
  sparks?: [number, number, number][];
  anim?: "float" | "tilt" | "pulse" | "flicker";
}

const ring = (cx: number, cy: number, r1: number, r2: number) =>
  `M${cx - r1} ${cy}a${r1} ${r1} 0 1 1 ${r1 * 2} 0a${r1} ${r1} 0 1 1 ${-r1 * 2} 0zM${cx - r2} ${cy}a${r2} ${r2} 0 1 0 ${r2 * 2} 0a${r2} ${r2} 0 1 0 ${-r2 * 2} 0z`;

export const PLAN_ICONS: Record<PlanIconName, IconDef> = {
  crown: {
    name: "Coroa",
    colors: ["#fff6cf", "#f7c948", "#b7791f", "#7a4a0c"],
    body: "M7 15l9 8 8-13 8 13 9-8-3 22H10z",
    detail: (p) =>
      `<path d="M10.6 32.5h26.8" stroke="#fff" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round"/><circle cx="24" cy="27" r="2.4" fill="#fff" fill-opacity=".9"/><circle cx="16.5" cy="28.5" r="1.5" fill="${p.light}"/><circle cx="31.5" cy="28.5" r="1.5" fill="${p.light}"/><circle cx="7" cy="15" r="2.3" fill="${p.mid}" stroke="${p.outline}" stroke-width="1.2"/><circle cx="24" cy="10" r="2.5" fill="${p.mid}" stroke="${p.outline}" stroke-width="1.2"/><circle cx="41" cy="15" r="2.3" fill="${p.mid}" stroke="${p.outline}" stroke-width="1.2"/>`,
    sparks: [
      [40, 6, 1.1],
      [7, 40, 0.75],
    ],
    anim: "float",
  },
  gem: {
    name: "Gema",
    colors: ["#f3e3ff", "#b46bff", "#6b21a8", "#3b0d63"],
    body: "M14 10h20l8 11-18 19L6 21z",
    detail: () =>
      '<path d="M6 21h36M14 10l4 11 6 19 6-19 4-11M18 21l6-11 6 11" stroke="#fff" stroke-opacity=".5" stroke-width="1.2" stroke-linejoin="round" fill="none"/><path d="M14 10l4 11H6z" fill="#fff" fill-opacity=".28"/>',
    sparks: [
      [40, 8, 1],
      [9, 36, 0.7],
    ],
    anim: "float",
  },
  flame: {
    name: "Chama",
    colors: ["#ffe08a", "#ff7a1a", "#c2410c", "#7c2d12"],
    body: "M24 5c1.5 6.5 11 10.5 11 21.5C35 33.4 30.1 41 24 41S13 33.4 13 26.5c0-5 2.6-8.4 5.2-10.6.2 3.6 1.6 6.1 3.8 7.1-.9-6.3.2-12.6 2-18z",
    detail: () =>
      '<path d="M24 25c2.6 2.4 5 4.6 5 8.2A5 5 0 0 1 24 38a5 5 0 0 1-5-4.8c0-2.6 1.6-4.2 3.2-5.6.3 1.4.9 2.2 1.8 2.5-.3-2 .1-3.6 0-5.1z" fill="#fff6d5" fill-opacity=".92"/>',
    sparks: [
      [37, 11, 0.9],
      [10, 14, 0.6],
    ],
    anim: "flicker",
  },
  bolt: {
    name: "Raio",
    colors: ["#e6fbff", "#38bdf8", "#0369a1", "#073b5c"],
    body: "M27 4L10 27h11l-3 17 19-24H26z",
    detail: () => '<path d="M25 9L15.5 23" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/>',
    sparks: [
      [39, 9, 1],
      [9, 39, 0.7],
    ],
    anim: "tilt",
  },
  star: {
    name: "Estrela",
    colors: ["#ffffff", "#d5dde8", "#7b8798", "#3f4856"],
    body: "M24 7l4.41 11.93 12.71.51-9.99 7.88 3.45 12.24L24 32.5l-10.58 7.06 3.45-12.24-9.99-7.88 12.71-.51z",
    detail: () => '<path d="M24 12.5l2.6 7.2" stroke="#fff" stroke-opacity=".8" stroke-width="1.4" stroke-linecap="round"/>',
    sparks: [
      [40, 8, 0.9],
      [8, 38, 0.65],
    ],
    anim: "tilt",
  },
  heart: {
    name: "Coração",
    colors: ["#ffd6ea", "#ff4d9d", "#be185d", "#6b0f35"],
    body: "M24 40S7 30 7 18.5A8.5 8.5 0 0 1 24 14a8.5 8.5 0 0 1 17 4.5C41 30 24 40 24 40z",
    detail: () =>
      '<path d="M12.5 17.5a4.5 4.5 0 0 1 5-3.4" stroke="#fff" stroke-opacity=".75" stroke-width="1.8" stroke-linecap="round" fill="none"/>',
    sparks: [
      [41, 7, 0.9],
      [6, 34, 0.6],
    ],
    anim: "pulse",
  },
  shield: {
    name: "Brasão",
    colors: ["#e3e6ff", "#6366f1", "#3730a3", "#1e1b5c"],
    body: "M24 5l15 5v12c0 9.5-6.4 16.8-15 20-8.6-3.2-15-10.5-15-20V10z",
    detail: () =>
      '<path d="M24 14.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="#fff" fill-opacity=".9"/><path d="M13 12.5v9.5c0 6.8 4.3 12.4 11 15.4" stroke="#fff" stroke-opacity=".35" stroke-width="1.3" fill="none" stroke-linecap="round"/>',
    sparks: [
      [40, 6, 0.9],
      [7, 38, 0.65],
    ],
    anim: "float",
  },
  trophy: {
    name: "Troféu",
    colors: ["#ffd3dc", "#f43f5e", "#9f1239", "#5c0a20"],
    body: "M14 8h20v8c0 6.6-4.5 11.5-10 11.5S14 22.6 14 16zM21.5 27h5v6h-5zM15 38c0-2.8 2.2-5 5-5h8c2.8 0 5 2.2 5 5v2H15z",
    detail: (p) =>
      `<path d="M14 11H9.5v2.5c0 3 2.3 5.5 5.3 5.6M34 11h4.5v2.5c0 3-2.3 5.5-5.3 5.6" stroke="${p.outline}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M18 11.5v4.5c0 2.5 1.2 4.7 3 6" stroke="#fff" stroke-opacity=".6" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
    sparks: [
      [41, 6, 1],
      [7, 30, 0.6],
    ],
    anim: "float",
  },
  rings: {
    name: "Aliança",
    colors: ["#d7fbe8", "#10b981", "#047857", "#023d2c"],
    body: ring(17, 24, 10.5, 6) + ring(31, 24, 10.5, 6),
    detail: () =>
      '<path d="M10 19.5a8 8 0 0 1 6-4" stroke="#fff" stroke-opacity=".7" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M24 19.5a8 8 0 0 1 6-4" stroke="#fff" stroke-opacity=".7" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
    sparks: [
      [42, 9, 0.9],
      [6, 39, 0.6],
    ],
    anim: "tilt",
  },
  moon: {
    name: "Lua",
    colors: ["#f7f4ff", "#c4b5fd", "#6d28d9", "#35136e"],
    body: "M31.5 6.5A18 18 0 1 0 41.5 33 14.5 14.5 0 0 1 31.5 6.5z",
    detail: () =>
      '<circle cx="17" cy="20" r="2.6" fill="#fff" fill-opacity=".35"/><circle cx="21" cy="31" r="1.8" fill="#fff" fill-opacity=".3"/><circle cx="12" cy="29" r="1.3" fill="#fff" fill-opacity=".3"/>',
    sparks: [
      [39, 11, 1],
      [33, 20, 0.6],
    ],
    anim: "tilt",
  },
  skull: {
    name: "Caveira",
    colors: ["#ffffff", "#e5e7eb", "#8b919c", "#3b3f47"],
    body: "M24 6c-9.4 0-16 6.6-16 15.2 0 5.2 2.5 8.6 6 10.6V38c0 1.7 1.3 3 3 3h14c1.7 0 3-1.3 3-3v-6.2c3.5-2 6-5.4 6-10.6C40 12.6 33.4 6 24 6z",
    detail: (p) =>
      `<ellipse cx="18" cy="22" rx="4" ry="4.4" fill="${p.outline}"/><ellipse cx="30" cy="22" rx="4" ry="4.4" fill="${p.outline}"/><circle cx="19.2" cy="20.8" r="1.1" fill="#fff"/><circle cx="31.2" cy="20.8" r="1.1" fill="#fff"/><path d="M24 27.5l-2.2 3.8h4.4z" fill="${p.outline}"/><path d="M20 41v-4.5M24 41v-4.5M28 41v-4.5" stroke="${p.outline}" stroke-width="1.6" stroke-linecap="round"/>`,
    sparks: [
      [41, 8, 0.85],
      [6, 36, 0.6],
    ],
    anim: "tilt",
  },
  headphones: {
    name: "Fones",
    colors: ["#e3e8ff", "#818cf8", "#4338ca", "#1f1a66"],
    body: "M8 30v-4a16 16 0 0 1 32 0v4h-4v-4a12 12 0 0 0-24 0v4zM7 29h9v12h-5a4 4 0 0 1-4-4zM32 29h9v8a4 4 0 0 1-4 4h-5z",
    detail: () =>
      '<path d="M10 32v4.5M38 32v4.5" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/><path d="M13 19a13 13 0 0 1 9-7" stroke="#fff" stroke-opacity=".55" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
    sparks: [
      [42, 10, 0.9],
      [24, 4, 0.55],
    ],
    anim: "tilt",
  },
  note: {
    name: "Nota",
    colors: ["#ffe4f2", "#f472b6", "#9d174d", "#4f0b27"],
    body: "M19 9l20-4v24.5a5.5 5.5 0 1 1-4-5.3V12.6l-12 2.4v18.5A5.5 5.5 0 1 1 19 28.2z",
    detail: () => '<path d="M22 11.5l14-2.8" stroke="#fff" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round"/>',
    sparks: [
      [8, 10, 0.9],
      [43, 40, 0.6],
    ],
    anim: "tilt",
  },
  ghost: {
    name: "Fantasma",
    colors: ["#ffffff", "#e2e8f0", "#94a3b8", "#3c4655"],
    body: "M24 6c-8.3 0-14 6.2-14 14.5V41l4.7-3.5 4.6 3.5 4.7-3.5 4.7 3.5 4.6-3.5L38 41V20.5C38 12.2 32.3 6 24 6z",
    detail: (p) =>
      `<ellipse cx="19" cy="21" rx="2.3" ry="3.2" fill="${p.outline}"/><ellipse cx="29" cy="21" rx="2.3" ry="3.2" fill="${p.outline}"/><ellipse cx="24" cy="28" rx="2" ry="1.4" fill="${p.outline}" fill-opacity=".7"/>`,
    sparks: [
      [42, 9, 0.9],
      [6, 30, 0.6],
    ],
    anim: "float",
  },
  rocket: {
    name: "Foguete",
    colors: ["#f8fafc", "#cbd5e1", "#64748b", "#2a3342"],
    body: "M24 4c6 4.5 9 11 9 19v9l4 5v4l-7-3H18l-7 3v-4l4-5v-9c0-8 3-14.5 9-19z",
    detail: (p) =>
      `<circle cx="24" cy="19" r="4.2" fill="#38bdf8" stroke="${p.outline}" stroke-width="1.4"/><circle cx="22.8" cy="17.8" r="1.2" fill="#fff"/><path d="M20 39c0 3 2 6 4 7 2-1 4-4 4-7z" fill="#ff8a1f"/><path d="M19.5 11c-1.3 2.4-2 5-2.2 7.8" stroke="#fff" stroke-opacity=".8" stroke-width="1.4" stroke-linecap="round" fill="none"/>`,
    sparks: [
      [40, 8, 0.9],
      [8, 14, 0.6],
    ],
    anim: "float",
  },
  planet: {
    name: "Planeta",
    colors: ["#fff0b8", "#f59e0b", "#b45309", "#5c2a04"],
    body: "M13 24a11 11 0 1 1 22 0a11 11 0 1 1 -22 0z",
    detail: (p) =>
      `<ellipse cx="24" cy="25" rx="21" ry="6" fill="none" stroke="${p.outline}" stroke-width="3.6" transform="rotate(-18 24 25)"/><ellipse cx="24" cy="25" rx="21" ry="6" fill="none" stroke="${p.light}" stroke-width="1.8" transform="rotate(-18 24 25)"/><path d="M17 18.5a8 8 0 0 1 5.5-3.8" stroke="#fff" stroke-opacity=".75" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
    sparks: [
      [40, 7, 1],
      [8, 40, 0.6],
    ],
    anim: "tilt",
  },
};

export const PLAN_ICON_NAMES = Object.keys(PLAN_ICONS) as PlanIconName[];

export const isPlanIcon = (v: unknown): v is PlanIconName => typeof v === "string" && v in PLAN_ICONS;

const sparkPath = (x: number, y: number, s: number) => {
  const r = 3.2 * s;
  return `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
};

function renderSvg(name: PlanIconName, uid: string, animated: boolean) {
  const def = PLAN_ICONS[name];
  const [light, mid, dark, outline] = def.colors;
  const palette = { light, mid, dark, outline };
  const animClass = animated && def.anim ? ` ic-${def.anim}` : "";
  const shine = animated
    ? `<g clip-path="url(#${uid}c)"><g transform="skewX(-18)"><rect class="ic-shine" x="-22" y="-8" width="12" height="64" fill="url(#${uid}s)"/></g></g>`
    : "";
  const sparks = (def.sparks ?? [])
    .map(
      ([x, y, s], i) =>
        `<path class="ic-spark" style="animation-delay:${(i * 1.1).toFixed(1)}s" d="${sparkPath(x, y, s)}" fill="#fff"/>`,
    )
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" aria-hidden="true"><defs>` +
    `<linearGradient id="${uid}g" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="0.5" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient>` +
    `<linearGradient id="${uid}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="${uid}h" cx="0.3" cy="0.18" r="0.65"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
    `<clipPath id="${uid}c"><path d="${def.body}"/></clipPath></defs>` +
    `<g class="ic-body${animClass}"><path d="${def.body}" fill="url(#${uid}g)" stroke="${outline}" stroke-width="1.6" stroke-linejoin="round"/><path d="${def.body}" fill="url(#${uid}h)"/>` +
    (def.detail?.(palette) ?? "") +
    shine +
    `</g>${sparks}</svg>`
  );
}

interface PlanIconProps {
  name: string;
  size?: number | string;
  /** false: desenho parado. */
  animated?: boolean;
  /** Anima só quando o elemento pai recebe hover. */
  hoverOnly?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function PlanIcon({ name, size = 32, animated = true, hoverOnly = false, className, style }: PlanIconProps) {
  const uid = "i" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const icon = isPlanIcon(name) ? name : "star";
  const html = useMemo(() => renderSvg(icon, uid, animated), [icon, uid, animated]);
  return (
    <span
      className={clsx("cdw-icon", className)}
      style={{ width: size, height: size, ...style }}
      data-static={animated ? undefined : ""}
      data-hover={hoverOnly ? "" : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
