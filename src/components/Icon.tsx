import clsx from "clsx";

// Glifos de traço da loja (mesmos desenhos do front anterior, mais alguns novos).
const PATHS = {
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  x: ["M6 6l12 12", "M18 6L6 18"],
  plus: ["M12 5v14", "M5 12h14"],
  minus: ["M5 12h14"],
  "arrow-right": ["M5 12h14", "M13 6l6 6-6 6"],
  "arrow-left": ["M19 12H5", "M11 6l-6 6 6 6"],
  "arrow-up-right": ["M7 17L17 7", "M8 7h9v9"],
  "chevron-down": ["M6 9l6 6 6-6"],
  "chevron-right": ["M9 6l6 6-6 6"],
  "chevron-left": ["M15 6l-6 6 6 6"],
  alert: ["M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18z", "M12 7.5v5.5", "M12 16.6v.01"],
  info: ["M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18z", "M12 11v5.5", "M12 7.6v.01"],
  spark: ["M12 3c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8z"],
  copy: ["M10 8h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z", "M15 4H5a1 1 0 0 0-1 1v10"],
  logout: ["M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3", "M14 16l4-4-4-4", "M18 12H9"],
  user: ["M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8z", "M4.5 20a7.5 7.5 0 0 1 15 0"],
  users: [
    "M9 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 1 0 0 7z",
    "M2.5 20a6.5 6.5 0 0 1 13 0",
    "M16 4.3a3.5 3.5 0 0 1 0 6.4",
    "M18 14.2a6.5 6.5 0 0 1 3.5 5.8",
  ],
  home: ["M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"],
  tag: ["M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.6 6.6a1.5 1.5 0 0 1-2.1 0z", "M8 8v.01"],
  voice: ["M4 10v4", "M8 6v12", "M12 3v18", "M16 7v10", "M20 10v4"],
  receipt: ["M6 3h12v18l-3-2-3 2-3-2-3 2z", "M9 8h6", "M9 12h6", "M9 16h3"],
  grid: ["M4 4h7v7H4z", "M13 4h7v7h-7z", "M4 13h7v7H4z", "M13 13h7v7h-7z"],
  shield: ["M12 3l7.5 3v5.5c0 4.6-3.1 8.2-7.5 9.5-4.4-1.3-7.5-4.9-7.5-9.5V6z", "M9 12l2 2 4-4"],
  search: ["M11 18a7 7 0 1 0 0-14a7 7 0 1 0 0 14z", "M20 20l-4-4"],
  refresh: ["M20 11a8 8 0 0 0-14.3-4.9L4 8", "M4 4v4h4", "M4 13a8 8 0 0 0 14.3 4.9L20 16", "M20 20v-4h-4"],
  eye: ["M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z", "M12 15a3 3 0 1 0 0-6a3 3 0 1 0 0 6z"],
  "eye-off": [
    "M3 3l18 18",
    "M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4",
    "M6.6 6.6C4 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.3-.5 4.6-1.3",
    "M9.9 9.9a3 3 0 0 0 4.2 4.2",
  ],
  lock: [
    "M7 11h10a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 17 20H7a1.5 1.5 0 0 1-1.5-1.5v-6A1.5 1.5 0 0 1 7 11z",
    "M8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  ],
  mail: ["M4.5 6h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z", "M4 7l8 6 8-6"],
  at: ["M12 16a4 4 0 1 0 0-8a4 4 0 1 0 0 8z", "M16 8v5a2.5 2.5 0 0 0 5 0v-1a9 9 0 1 0-3.5 7.1"],
  clock: ["M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18z", "M12 7v5l3 2"],
  trash: ["M4.5 7h15", "M9.5 7V4.5h5V7", "M6.5 7l1 13h9l1-13", "M10 11v5", "M14 11v5"],
  menu: ["M4 7h16", "M4 12h16", "M4 17h16"],
  chart: ["M4 20h16", "M6.5 16v-5", "M11 16V6", "M15.5 16v-8", "M20 16v-3"],
  link: ["M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1", "M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"],
  palette: [
    "M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.9 1.4-1.9-.3-1.1.4-2.1 1.6-2.1H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z",
    "M7.5 11v.01",
    "M10 7v.01",
    "M14.5 7v.01",
    "M17 11v.01",
  ],
  mic: ["M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z", "M5.5 11a6.5 6.5 0 0 0 13 0", "M12 17.5V21"],
  "phone-off": ["M3.5 14.5c4.7-4.7 12.3-4.7 17 0l-2 2.5-3.2-1.2v-2.6a10.4 10.4 0 0 0-6.6 0v2.6L5.5 17z"],
  sliders: ["M4 7h10", "M18 7h2", "M16 5v4", "M4 17h4", "M12 17h8", "M10 15v4"],
  external: ["M14 4h6v6", "M20 4l-9 9", "M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"],
  calendar: [
    "M5.5 6h13a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z",
    "M4.5 10h15",
    "M9 3.5v4",
    "M15 3.5v4",
  ],
  ban: ["M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18z", "M5.6 5.6l12.8 12.8"],
  crown: ["M4 19h16", "M4.6 16L3.5 7l5 4 3.5-6 3.5 6 5-4-1.1 9z"],
  wallet: [
    "M4 7.5A1.5 1.5 0 0 1 5.5 6H18a1 1 0 0 1 1 1v2",
    "M4 7.5V18a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H5.5A1.5 1.5 0 0 1 4 7.5z",
    "M16 14v.01",
  ],
  message: [
    "M5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9.5l-4.6 3.7a.5.5 0 0 1-.9-.4V5.5A1.5 1.5 0 0 1 5.5 4z",
    "M8 8.5h8",
    "M8 12h5",
  ],
  trophy: [
    "M8 4h8v5a4 4 0 0 1-8 0z",
    "M8 6H5v1.5A3.5 3.5 0 0 0 8.5 11",
    "M16 6h3v1.5A3.5 3.5 0 0 1 15.5 11",
    "M12 13v4",
    "M8 20.5h8",
    "M9.5 17h5v3.5h-5z",
  ],
  qr: ["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h2v2h-2z", "M18 18h2v2h-2z", "M14 18v2", "M18 14h2"],
  bolt: ["M13 3L5 13.5h6L10 21l8-10.5h-6z"],
  layers: ["M12 4l8.5 4.5L12 13 3.5 8.5z", "M3.5 12.5L12 17l8.5-4.5", "M3.5 16.5L12 21l8.5-4.5"],
  megaphone: [
    "M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1z",
    "M17 9a4 4 0 0 1 0 6",
    "M19.5 6.5a7.5 7.5 0 0 1 0 11",
  ],
  help: ["M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18z", "M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.3-2.5 3.8", "M12 17v.01"],
  sort: ["M7 4v16", "M4 7l3-3 3 3", "M17 20V4", "M14 17l3 3 3-3"],
  hourglass: ["M7 3h10", "M7 21h10", "M8 3c0 5 8 5 8 9s-8 4-8 9", "M16 3c0 5-8 5-8 9s8 4 8 9"],
} satisfies Record<string, string[]>;

export type IconName = keyof typeof PATHS | "discord";

const DISCORD =
  "M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.25a18.3 18.3 0 0 0-5.49 0 12.6 12.6 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.7 19.7 0 0 0-4.88 1.52.07.07 0 0 0-.04.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .09-.03c.46-.63.87-1.3 1.22-1.99a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1-.01-.13l.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01l.37.29a.08.08 0 0 1-.01.13c-.6.35-1.22.65-1.87.89a.08.08 0 0 0-.04.11c.36.7.77 1.36 1.22 1.99a.08.08 0 0 0 .09.03 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.09-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.15-1.09-2.15-2.42s.95-2.42 2.15-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42z";

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  title?: string;
}

export function Icon({ name, size = 20, strokeWidth = 1.75, className, title }: IconProps) {
  const a11y = title ? { role: "img", "aria-label": title } : { "aria-hidden": true as const };
  if (name === "discord") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={clsx("shrink-0", className)} {...a11y}>
        <path d={DISCORD} />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx("shrink-0", className)}
      {...a11y}
    >
      {PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export function PixLogo({ size = 20, className, mono = false }: { size?: number; className?: string; mono?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={clsx("shrink-0", className)} role="img" aria-label="Pix">
      <path
        fill={mono ? "currentColor" : "#32BCAD"}
        d="M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156"
      />
    </svg>
  );
}

export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={clsx("animate-spin shrink-0", className)} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity=".22" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
