import { useCallback, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import clsx from "clsx";
import { Icon, Spinner } from "../components/Icon";
import { Alert } from "../components/ui";
import { AuthLayout } from "../components/auth/AuthLayout";
import { Honeypot, InputField, PasswordStrength, PasswordToggle, usePasswordVisibility } from "../components/auth/fields";
import { Turnstile, type TurnstileHandle } from "../components/auth/Turnstile";
import { SuccessOverlay } from "../components/SuccessOverlay";
import { CheckoutSteps, planSteps, promoSteps } from "../components/store/CheckoutSteps";
import { PlanIcon } from "../components/PlanIcon";
import { useAuth } from "../lib/auth";
import { api, errorMessage } from "../lib/api";
import { usePlans, usePromos } from "../lib/hooks";
import { brl, safeNext } from "../lib/format";
import type { User } from "../lib/types";

type Mode = "login" | "register";

/** Se a pessoa veio de uma compra, mostra o que está comprando e em que etapa está. */
function PurchaseContext({ next }: { next: string | null }) {
  const plans = usePlans();
  const promos = usePromos();
  const planKey = next?.match(/^\/painel\/comprar\/([^/?#]+)/)?.[1];
  const promoKey = next?.match(/^\/painel\/divulgacao\/([^/?#]+)/)?.[1];
  const plan = planKey ? plans?.find((p) => p.key === decodeURIComponent(planKey)) : undefined;
  const promo = promoKey ? promos?.find((p) => p.key === decodeURIComponent(promoKey)) : undefined;
  if (!plan && !promo) return null;

  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center gap-3 rounded-[14px] border border-silver bg-porcelain p-3 shadow-card">
        {plan ? (
          <img src={`/intros/cards/${plan.key}.webp`} alt="" className="h-14 w-[70px] rounded-[10px] object-cover ring-1 ring-silver" />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-[12px] bg-liquid-soft text-liquid-deep">
            <Icon name="megaphone" size={24} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-dim">Você está comprando</p>
          <p className="flex items-center gap-1.5 truncate font-display text-[17px] font-extrabold">
            {plan && <PlanIcon name={plan.icon} size={20} animated={false} />}
            {plan ? plan.name : promo!.name}
          </p>
        </div>
        <span className="tabular shrink-0 font-display text-lg font-extrabold">{brl((plan ?? promo)!.priceCents)}</span>
      </div>
      <CheckoutSteps steps={plan ? planSteps("account") : promoSteps("account")} />
    </div>
  );
}

export default function Auth({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const { setUser } = useAuth();
  const register = mode === "register";

  const [form, setForm] = useState({ login: "", username: "", email: "", password: "" });
  const [website, setWebsite] = useState("");
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState<User | null>(null);
  const pw = usePasswordVisibility();
  const turnstile = useRef<TurnstileHandle>(null);
  const shake = useAnimationControls();

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const fieldErrors = {
    login: !register && !form.login.trim() ? "Informe seu email ou usuário." : null,
    username: register && !form.username.trim() ? "Escolha um nome de usuário." : null,
    email: register
      ? !form.email.trim()
        ? "Informe seu email."
        : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())
          ? "Esse email parece incompleto."
          : null
      : null,
    password: !form.password
      ? "Informe sua senha."
      : register && form.password.length < 8
        ? "A senha precisa de pelo menos 8 caracteres."
        : null,
  };
  const invalid = Object.values(fieldErrors).some(Boolean);

  const switchMode = (m: Mode) => {
    setError(null);
    setTouched(false);
    navigate(`/${m === "login" ? "entrar" : "criar-conta"}${next ? `?next=${encodeURIComponent(next)}` : ""}`, { replace: true });
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setTouched(true);
    if (invalid) {
      void shake.start({ x: [0, -8, 7, -5, 3, 0], transition: { duration: 0.45 } });
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const body = register
        ? { username: form.username, email: form.email, password: form.password, captcha: captcha ?? undefined, website }
        : { login: form.login, password: form.password, captcha: captcha ?? undefined, website };
      const { user } = await api.post<{ user: User }>(register ? "/auth/register" : "/auth/login", body);
      setDone(user);
    } catch (err) {
      setError(errorMessage(err));
      void shake.start({ x: [0, -8, 7, -5, 3, 0], transition: { duration: 0.45 } });
      turnstile.current?.reset();
    } finally {
      setBusy(false);
    }
  }

  const finish = useCallback(() => {
    if (!done) return;
    setUser(done);
    navigate(next ?? (done.role === "admin" ? "/admin" : "/painel"), { replace: true });
  }, [done, next, navigate, setUser]);

  const show = (k: keyof typeof fieldErrors) => (touched ? fieldErrors[k] : null);

  return (
    <AuthLayout tag={register ? "Novo por aqui" : "Área do membro"}>
      <PurchaseContext next={next} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          <h1 className="font-display text-[2rem] font-extrabold leading-tight tracking-[-0.035em]">
            {register ? "Crie sua conta" : "Bem-vindo de volta"}
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            {register ? "Leva menos de um minuto. Depois é só escolher seu VIP." : "Entre para gerenciar seu VIP, sua tag e sua call."}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-7 grid grid-cols-2 rounded-[12px] border border-silver bg-frost p-1" role="tablist" aria-label="Entrar ou criar conta">
        {(["login", "register"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={m === mode}
            onClick={() => m !== mode && switchMode(m)}
            className={clsx(
              "relative min-h-[42px] rounded-[9px] text-sm font-semibold transition-colors",
              m === mode ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {m === mode && (
              <motion.span
                layoutId="auth-tab"
                className="absolute inset-0 rounded-[9px] bg-porcelain shadow-[0_1px_3px_rgb(24_38_50/0.12)] ring-1 ring-silver"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{m === "login" ? "Entrar" : "Criar conta"}</span>
          </button>
        ))}
      </div>

      <motion.form animate={shake} onSubmit={submit} noValidate className="relative mt-7 space-y-5">
        {register ? (
          <>
            <InputField
              label="Usuário"
              icon="user"
              value={form.username}
              onChange={set("username")}
              placeholder="seu_nome"
              autoComplete="username"
              maxLength={24}
              hint="Letras, números, _ ou ."
              error={show("username")}
            />
            <InputField
              label="Email"
              icon="mail"
              type="email"
              inputMode="email"
              value={form.email}
              onChange={set("email")}
              placeholder="voce@email.com"
              autoComplete="email"
              maxLength={120}
              error={show("email")}
            />
          </>
        ) : (
          <InputField
            label="Email ou usuário"
            icon="at"
            value={form.login}
            onChange={set("login")}
            placeholder="voce@email.com"
            autoComplete="username"
            maxLength={120}
            error={show("login")}
          />
        )}
        <InputField
          label="Senha"
          icon="lock"
          type={pw.type}
          value={form.password}
          onChange={set("password")}
          placeholder={register ? "mínimo 8 caracteres" : "••••••••"}
          autoComplete={register ? "new-password" : "current-password"}
          maxLength={128}
          error={show("password")}
          trailing={<PasswordToggle shown={pw.shown} onToggle={pw.toggle} />}
        />
        {register ? (
          <PasswordStrength password={form.password} />
        ) : (
          <div className="-mt-2 text-right">
            <Link to="/esqueci-senha" className="text-sm font-semibold text-liquid-ink underline-offset-4 hover:underline">
              Esqueci minha senha
            </Link>
          </div>
        )}
        <Honeypot value={website} onChange={setWebsite} />
        <Turnstile ref={turnstile} onToken={setCaptcha} />
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <Alert tone="error">{error}</Alert>
            </motion.div>
          )}
        </AnimatePresence>
        <button type="submit" disabled={busy || captcha === null} className="btn btn-primary btn-lg group w-full">
          {busy ? (
            <>
              <Spinner /> {register ? "Criando sua conta…" : "Entrando…"}
            </>
          ) : (
            <>
              {register ? "Criar minha conta" : "Entrar"}
              <Icon name="arrow-right" size={18} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
        {captcha === null && !busy && <p className="-mt-2 text-center text-[13px] text-dim">Aguardando a verificação anti-robô…</p>}
      </motion.form>

      <p className="mt-8 text-center text-[15px] text-muted">
        {register ? "Já tem conta? " : "Ainda não tem conta? "}
        <button type="button" onClick={() => switchMode(register ? "login" : "register")} className="link">
          {register ? "Entrar" : "Criar agora"}
        </button>
      </p>

      {done && (
        <SuccessOverlay
          title={register ? `Bem-vindo, ${done.username}` : `Oi de novo, ${done.username}`}
          subtitle={register ? (next ? "Conta criada. Bora para o pagamento?" : "Conta criada. Bora escolher seu VIP?") : next ? "Voltando para onde você estava…" : "Entrando no seu painel…"}
          onDone={finish}
        />
      )}
    </AuthLayout>
  );
}
