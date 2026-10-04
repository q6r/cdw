import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon, Spinner } from "../components/Icon";
import { Alert, Avatar } from "../components/ui";
import { OtpInput } from "./parts";
import { useAuth } from "../lib/auth";
import { api, errorMessage } from "../lib/api";
import { useToast } from "../lib/toast";
import type { User } from "../lib/types";

/**
 * Vínculo do Discord em dois passos: ID → código de 6 dígitos na DM.
 * É o que permite ao bot aplicar o VIP na conta certa.
 */
export function DiscordLinkCard({ title = "Vincule seu Discord", text }: { title?: string; text?: string }) {
  const { setUser } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState<"id" | "code">("id");
  const [discordId, setDiscordId] = useState("");
  const [code, setCode] = useState("");
  const [member, setMember] = useState<{ username: string; avatar: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const validId = /^\d{17,20}$/.test(discordId);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.post<{ member: { username: string; avatar: string | null } }>("/auth/discord/start", { discordId });
      setMember(r.member);
      setStep("code");
      toast("Código enviado na sua DM do Discord", "success");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { user } = await api.post<{ user: User }>("/auth/discord/verify", { code: value });
      setUser(user);
      toast("Discord vinculado", "success");
    } catch (e) {
      setError(errorMessage(e));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card relative overflow-hidden p-5 sm:p-7" aria-labelledby="discord-link-t">
      <div className="flex flex-col gap-7 md:flex-row md:items-start">
        <div className="md:w-[44%]">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-discord text-white shadow-[0_10px_24px_-10px_rgb(88_101_242/0.8)]">
            <Icon name="discord" size={24} />
          </span>
          <h2 id="discord-link-t" className="mt-5 font-display text-xl font-extrabold tracking-tight">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {text ?? "Precisamos confirmar que o Discord é seu para aplicar o VIP. O bot da CDW manda um código na sua DM, como proteção contra fraude."}
          </p>
          <ol className="mt-5 space-y-2 text-[13px] text-ink-2">
            <li className="flex gap-2">
              <span className="font-bold text-liquid-deep">1.</span> No Discord: Configurações → Avançado → ative o Modo desenvolvedor
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-liquid-deep">2.</span> Clique no seu perfil → Copiar ID do usuário
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-liquid-deep">3.</span> Libere DMs de membros do servidor da CDW
            </li>
          </ol>
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait" initial={false}>
            {step === "id" ? (
              <motion.div key="id" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <label className="label" htmlFor="discord-id">
                  Seu ID do Discord
                </label>
                <input
                  id="discord-id"
                  className="field min-h-[50px] font-mono"
                  placeholder="ex: 123456789012345678"
                  inputMode="numeric"
                  maxLength={20}
                  value={discordId}
                  aria-invalid={discordId.length > 0 && !validId ? true : undefined}
                  onChange={(e) => setDiscordId(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && validId && void start()}
                />
                <p className="mt-2 text-[13px] text-dim">
                  {discordId.length > 0 && !validId ? "O ID tem de 17 a 20 números." : "Só números. Não é o seu nome de usuário."}
                </p>
                <button type="button" className="btn btn-primary btn-lg mt-4 w-full" disabled={!validId || busy} onClick={() => void start()}>
                  {busy ? (
                    <>
                      <Spinner /> Enviando código…
                    </>
                  ) : (
                    <>
                      Enviar código na DM <Icon name="arrow-right" size={17} />
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div key="code" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                {member && (
                  <div className="mb-5 flex items-center gap-3 rounded-[12px] border border-silver bg-frost px-3 py-2.5">
                    <Avatar src={member.avatar} name={member.username} size={32} />
                    <p className="min-w-0 flex-1 text-sm">
                      Código enviado para <span className="font-semibold">@{member.username}</span>
                    </p>
                    <button
                      type="button"
                      className="text-sm font-semibold text-liquid-ink underline-offset-4 hover:underline"
                      onClick={() => {
                        setStep("id");
                        setCode("");
                        setError(null);
                      }}
                    >
                      Trocar
                    </button>
                  </div>
                )}
                <span className="label">Código recebido na DM</span>
                <OtpInput value={code} onChange={setCode} onComplete={(v) => void verify(v)} />
                <button type="button" className="btn btn-primary btn-lg mt-4 w-full" disabled={code.length !== 6 || busy} onClick={() => void verify()}>
                  {busy ? (
                    <>
                      <Spinner /> Confirmando…
                    </>
                  ) : (
                    "Confirmar vínculo"
                  )}
                </button>
                <button
                  type="button"
                  className="mt-3 min-h-[40px] w-full text-center text-sm font-medium text-muted hover:text-ink"
                  disabled={busy}
                  onClick={() => void start()}
                >
                  Não chegou? Reenviar código
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
                <Alert tone="error">{error}</Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
