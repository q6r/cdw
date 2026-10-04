import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon, Spinner } from "../components/Icon";
import { Avatar, CardHeader, PageHeader } from "../components/ui";
import { DiscordLinkCard } from "./DiscordLinkCard";
import { useAuth } from "../lib/auth";
import { api, errorMessage } from "../lib/api";
import { useToast } from "../lib/toast";
import { date } from "../lib/format";

export default function Profile() {
  const { user } = useAuth();
  const [changing, setChanging] = useState(false);
  const discordId = user?.discord?.id;
  useEffect(() => setChanging(false), [discordId]);
  if (!user) return null;

  return (
    <>
      <PageHeader eyebrow="Conta" title="Meu perfil">
        Seus dados, o Discord vinculado e a segurança da conta.
      </PageHeader>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="card p-5 sm:p-7">
          <CardHeader title="Conta" />
          <div className="flex items-center gap-4">
            <Avatar src={user.discord?.avatar} name={user.username} size={64} square />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-display text-xl font-extrabold">{user.username}</span>
                {user.role === "admin" && (
                  <span className="rounded-[5px] bg-liquid-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-liquid-ink">admin</span>
                )}
              </div>
              <div className="truncate text-sm text-muted">{user.email}</div>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-silver bg-silver text-sm">
            <div className="bg-frost p-4">
              <dt className="eyebrow">Membro desde</dt>
              <dd className="mt-1.5 font-medium">{date(user.createdAt)}</dd>
            </div>
            <div className="bg-frost p-4">
              <dt className="eyebrow">Discord</dt>
              <dd className="mt-1.5 truncate font-medium">
                {user.discord ? (user.discord.username ? `@${user.discord.username}` : "vinculado") : "não vinculado"}
              </dd>
            </div>
          </dl>
        </section>
        <PasswordForm />
      </div>

      <div className="mt-6">
        {user.discord && !changing ? (
          <section className="card flex flex-wrap items-center gap-4 p-5 sm:p-7">
            <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-discord text-white">
              <Icon name="discord" size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{user.discord.username ? `@${user.discord.username}` : "Discord vinculado"}</div>
              <div className="font-mono text-xs text-dim">{user.discord.id}</div>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setChanging(true)}>
              Trocar Discord
            </button>
          </section>
        ) : (
          <DiscordLinkCard
            title={user.discord ? "Trocar o Discord vinculado" : "Vincule seu Discord"}
            text={user.discord ? "Se você tem VIP ativo, a troca precisa ser feita pela staff." : undefined}
          />
        )}
      </div>
    </>
  );
}

function PasswordForm() {
  const toast = useToast();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mismatch = form.confirm.length > 0 && form.next !== form.confirm;
  const short = form.next.length > 0 && form.next.length < 8;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (mismatch || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/password", { current: form.current, next: form.next });
      setForm({ current: "", next: "", confirm: "" });
      toast("Senha alterada", "success");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof typeof form, label: string, autoComplete: string, invalid = false) => (
    <div>
      <label className="label" htmlFor={`pw-${key}`}>
        {label}
      </label>
      <input
        id={`pw-${key}`}
        type="password"
        className="field"
        value={form[key]}
        autoComplete={autoComplete}
        maxLength={128}
        aria-invalid={invalid || undefined}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <form onSubmit={submit} className="card space-y-4 p-5 sm:p-7" noValidate>
      <CardHeader title="Trocar senha" />
      {field("current", "Senha atual", "current-password")}
      {field("next", "Nova senha", "new-password", short)}
      {field("confirm", "Confirmar nova senha", "new-password", mismatch)}
      <AnimatePresence>
        {(mismatch || short || error) && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-sm font-medium text-danger"
            role="alert"
          >
            <Icon name="alert" size={16} />
            {mismatch ? "As senhas não conferem." : short ? "A senha nova precisa de pelo menos 8 caracteres." : error}
          </motion.p>
        )}
      </AnimatePresence>
      <button type="submit" className="btn btn-primary w-full" disabled={busy || mismatch || !form.current || form.next.length < 8 || !form.confirm}>
        {busy ? <Spinner size={16} /> : <Icon name="lock" size={16} />}
        {busy ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}
