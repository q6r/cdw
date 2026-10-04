import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import { Icon, type IconName } from "../Icon";

/** Campo com ícone e rótulo; o ícone fica azul quando o campo está em foco. */
export function InputField({
  label,
  icon,
  hint,
  error,
  trailing,
  className,
  ...input
}: {
  label: string;
  icon: IconName;
  hint?: ReactNode;
  error?: string | null;
  trailing?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={className}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className="group relative">
        <Icon
          name={icon}
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim transition-colors group-focus-within:text-liquid-deep"
        />
        <input
          id={id}
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? hintId : undefined}
          {...input}
          className={clsx("field min-h-[50px] pl-11", trailing && "pr-14")}
        />
        {trailing && <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
      {error ? (
        <span id={hintId} role="alert" className="mt-2 flex items-start gap-1.5 text-[13px] font-medium text-danger">
          <Icon name="alert" size={15} className="mt-px" />
          {error}
        </span>
      ) : hint ? (
        <span id={hintId} className="mt-2 block text-[13px] text-dim">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Esconder senha" : "Mostrar senha"}
      aria-pressed={shown}
      className="grid h-10 w-10 place-items-center rounded-[8px] text-dim transition-colors hover:bg-frost hover:text-ink"
    >
      <Icon name={shown ? "eye-off" : "eye"} size={18} />
    </button>
  );
}

export function usePasswordVisibility() {
  const [shown, setShown] = useState(false);
  return { shown, toggle: () => setShown((s) => !s), type: shown ? "text" : "password" };
}

/** Mesma régua do site anterior: tamanho, maiúsculas e minúsculas, número e símbolo. */
export function passwordStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

const LEVELS = [
  { label: "muito fraca", color: "#c0283a" },
  { label: "fraca", color: "#c2410c" },
  { label: "ok", color: "#a16207" },
  { label: "boa", color: "#4d7c0f" },
  { label: "forte", color: "#0b7a54" },
];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const s = passwordStrength(password);
  const level = LEVELS[s];
  return (
    <div className="-mt-2 flex items-center gap-3" aria-live="polite">
      <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1.5 rounded-full transition-colors duration-300"
            style={{ background: i < s ? level.color : "var(--color-frost-2)" }}
          />
        ))}
      </div>
      <span className="w-24 text-right text-[13px] font-semibold" style={{ color: level.color }}>
        Senha {level.label}
      </span>
    </div>
  );
}

/** Campo-isca para robôs (o servidor recusa se vier preenchido). */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
    />
  );
}
