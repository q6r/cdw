import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import clsx from "clsx";
import { Icon } from "../Icon";
import { useCopy } from "../../lib/hooks";
import { readableOn } from "../../lib/format";
import { SUGGESTED_COLORS, clearRecentColors, hexToHsv, hsvToHex, readRecentColors } from "../../lib/color";

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** Arraste com ponteiro, devolvendo coordenadas de 0 a 1. */
function dragHandlers(onMove: (x: number, y: number) => void) {
  const at = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onMove(clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height));
  };
  return {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      at(e);
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) at(e);
    },
  };
}

export function ColorPicker({ value, onChange, compact = false }: { value: string; onChange: (hex: string) => void; compact?: boolean }) {
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [text, setText] = useState(value.slice(1));
  const [recent, setRecent] = useState(readRecentColors);
  const [expanded, setExpanded] = useState(false);
  const last = useRef(value);
  const { copied, copy } = useCopy();

  useEffect(() => {
    if (value !== last.current) {
      last.current = value;
      setHsv(hexToHsv(value));
      setText(value.slice(1));
    }
  }, [value]);

  const fromHsv = (next: [number, number, number]) => {
    setHsv(next);
    const hex = hsvToHex(...next);
    last.current = hex;
    setText(hex.slice(1));
    onChange(hex);
  };
  const fromHex = (hex: string) => {
    last.current = hex;
    setHsv(hexToHsv(hex));
    setText(hex.slice(1));
    onChange(hex);
  };

  const area = dragHandlers((x, y) => fromHsv([hsv[0], x, 1 - y]));
  const hue = dragHandlers((x) => fromHsv([x * 359.9, hsv[1], hsv[2]]));
  const pure = hsvToHex(hsv[0], 1, 1);

  const areaKeys = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const map: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    fromHsv([hsv[0], clamp(hsv[1] + d[0]), clamp(hsv[2] + d[1])]);
  };
  const hueKeys = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 30 : 4;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const dir = e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 1;
    fromHsv([(hsv[0] + dir * step + 360) % 360, hsv[1], hsv[2]]);
  };

  const hexInput = (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-dim">#</span>
      <input
        className="field pl-8 font-mono uppercase"
        value={text}
        maxLength={6}
        spellCheck={false}
        aria-label="Cor em hexadecimal"
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
          setText(v);
          if (v.length === 6) fromHex(`#${v.toLowerCase()}`);
        }}
      />
    </div>
  );

  const surfaces = (areaHeight: string) => (
    <>
      <div
        {...area}
        role="slider"
        tabIndex={0}
        aria-label="Saturação e brilho"
        aria-valuetext={`saturação ${Math.round(hsv[1] * 100)}%, brilho ${Math.round(hsv[2] * 100)}%`}
        aria-valuenow={Math.round(hsv[1] * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        onKeyDown={areaKeys}
        className={clsx("relative w-full cursor-crosshair touch-none overflow-hidden rounded-[12px] ring-1 ring-silver-strong", areaHeight)}
        style={{ background: pure }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #fff, transparent)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #000, transparent)" }} />
        <div
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_2px_8px_rgb(0_0_0/0.35)]"
          style={{ left: `${hsv[1] * 100}%`, top: `${(1 - hsv[2]) * 100}%`, background: value }}
        />
      </div>
      <div
        {...hue}
        role="slider"
        tabIndex={0}
        aria-label="Matiz"
        aria-valuenow={Math.round(hsv[0])}
        aria-valuemin={0}
        aria-valuemax={360}
        onKeyDown={hueKeys}
        className="relative h-4 w-full cursor-pointer touch-none rounded-full ring-1 ring-silver-strong"
        style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
      >
        <div
          className="pointer-events-none absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_2px_8px_rgb(0_0_0/0.35)]"
          style={{ left: `${(hsv[0] / 360) * 100}%`, background: pure }}
        />
      </div>
    </>
  );

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setExpanded((x) => !x)}
            aria-expanded={expanded}
            aria-label={expanded ? "Fechar seletor de cor" : "Abrir seletor de cor"}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] ring-1 ring-silver-strong"
            style={{ background: value, color: readableOn(value) }}
          >
            <Icon name={expanded ? "chevron-down" : "palette"} size={16} />
          </button>
          <div className="w-36">{hexInput}</div>
          <Swatches colors={SUGGESTED_COLORS} value={value} onPick={fromHex} small />
        </div>
        {expanded && <div className="max-w-sm space-y-3">{surfaces("h-32")}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {surfaces("h-40")}
      <div className="flex items-center gap-2">
        <div
          className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[10px] font-mono text-[10px] font-bold ring-1 ring-silver-strong"
          style={{ background: value, color: readableOn(value) }}
          aria-hidden="true"
        >
          HEX
        </div>
        <div className="flex-1">{hexInput}</div>
        <button
          type="button"
          className="btn btn-secondary btn-icon h-[46px] w-[46px]"
          onClick={() => copy(value)}
          aria-label={copied ? "HEX copiado" : "Copiar HEX"}
        >
          <Icon name={copied ? "check" : "copy"} size={17} className={copied ? "text-success" : undefined} />
        </button>
      </div>
      <div>
        <p className="eyebrow mb-2">Sugeridas</p>
        <Swatches colors={SUGGESTED_COLORS} value={value} onPick={fromHex} />
      </div>
      {recent.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="eyebrow">Recentes</p>
            <button
              type="button"
              onClick={() => {
                clearRecentColors();
                setRecent([]);
              }}
              className="text-xs font-semibold text-dim hover:text-ink"
            >
              Limpar
            </button>
          </div>
          <Swatches colors={recent} value={value} onPick={fromHex} />
        </div>
      )}
    </div>
  );
}

function Swatches({ colors, value, onPick, small = false }: { colors: string[]; value: string; onPick: (c: string) => void; small?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => {
        const selected = c.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            aria-label={`Cor ${c}`}
            aria-pressed={selected}
            className={clsx(
              "rounded-[8px] ring-1 ring-black/10 transition-transform duration-200 hover:scale-110",
              small ? "h-7 w-7" : "h-8 w-8",
              selected && "ring-2 ring-liquid ring-offset-2 ring-offset-white",
            )}
            style={{ background: c }}
          />
        );
      })}
    </div>
  );
}
