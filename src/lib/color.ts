import { hexToRgb, isHex } from "./format";

/** HSV (h 0–360, s e v 0–1) para hex. */
export function hsvToHex(h: number, s: number, v: number) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const to = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(f(5))}${to(f(3))}${to(f(1))}`;
}

export function hexToHsv(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max];
}

export const SUGGESTED_COLORS = [
  "#168fe5",
  "#e7b84f",
  "#f2f1ed",
  "#4cc38a",
  "#2dd4bf",
  "#5865f2",
  "#8b7cf6",
  "#c084fc",
  "#f472b6",
  "#f43f5e",
  "#fb923c",
  "#a3e635",
];

const RECENT_KEY = "cdw-recent-colors";

export function readRecentColors(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((c): c is string => typeof c === "string" && isHex(c)).slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function pushRecentColor(hex: string) {
  try {
    const list = [hex, ...readRecentColors().filter((c) => c !== hex)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* armazenamento indisponível: só não guarda */
  }
}

export function clearRecentColors() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* idem */
  }
}
