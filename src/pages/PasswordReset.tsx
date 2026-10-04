import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Icon, Spinner } from "../components/Icon";
import { Alert } from "../components/ui";
import { AuthLayout } from "../components/auth/AuthLayout";
import { Honeypot, InputField, PasswordStrength, PasswordToggle, usePasswordVisibility } from "../components/auth/fields";
import { Turnstile, type TurnstileHandle } from "../components/auth/Turnstile";
import { SuccessOverlay } from "../components/SuccessOverlay";
import { useAuth } from "../lib/auth";
import { ApiError, api, errorMessage } from "../lib/api";
import type { User } from "../lib/types";

/** O token chega no fragmento (#t=...) para não ir parar em logs do servidor. */
function readToken() {
  const t = new URLSearchParams(window.location.hash.slice(1)).get("t");
  return t && /^[A-Za-z0-9_-]{43}$/.test(t) ? t : null;
}

export default function PasswordReset({ mode }: { mode: "forgot" | "reset" }) {
  return (
    <AuthLayout tag="Recuperar acesso" back={{ to: "/entrar", label: "Voltar ao login" }}>
      {mode === "forgot" ? <Forgot /> : <Reset />}
    </AuthLayout>
  );
}

function Note({ icon, title, children }: { icon: "clock" | "shield"; title: string; children: string }) {
  return (
    <div className="flex gap-3 rounded-[14px] border border-silver bg-porcelain px-4 py-3.5">
      <Icon name={icon} size={19} className="mt-0.5 text-liquid-deep" />
      <div className="text-sm">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-muted">{children}</p>
      </div>
    </div>
  );
}

function Forgot() {
  const [login, setLogin] = useState("");
  const [website, setWebsite] = useState("");
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const turnstile = useRef<TurnstileHandle>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !login.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await api.post("/auth/password/forgot", { login, captcha: captcha ?? undefined, website });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
      turnstile.current?.reset();
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <>
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-discord text-white shadow-[0_10px_24px_-10px_rgb(88_101_242/0.8)]">
          <Icon name="discord" size={26} />
        </div>
        <h1 className="font-display text-[2rem] font-extrabold leading-tight tracking-[-0.035em]">Confira seu Discord</h1>
        <p className="mt-2 text-[15px] text-muted">
          Se essa conta existir e tiver Discord vinculado, o bot da CDW te mandou o link no privado.
        </p>
        <div className="mt-8 space-y-3">
          <Note icon="clock" title="O link vale 15 minutos">
            Só funciona uma vez. Não chegou? Libere mensagens diretas de membros do servidor e peça de novo em 1 minuto.
          </Note>
          <Note icon="shield" title="Sua conta não tem Discord vinculado?">
            Chame um adm no servidor da CDW. Ele gera um link de redefinição e te manda no privado.
          </Note>
        </div>
        <button type="button" onClick={() => setSent(false)} className="btn btn-secondary btn-lg mt-8 w-full">
          Pedir de novo
        </button>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-[2rem] font-extrabold leading-tight tracking-[-0.035em]">Esqueceu a senha?</h1>
      <p className="mt-2 text-[15px] text-muted">
        Digite seu usuário ou email. O link para criar uma senha nova chega no privado do Discord vinculado à conta.
      </p>
      <form onSubmit={submit} noValidate className="relative mt-8 space-y-5">
        <InputField
          label="Email ou usuário"
          icon="at"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="voce@email.com"
          autoComplete="username"
          maxLength={120}
        />
        <Honeypot value={website} onChange={setWebsite} />
        <Turnstile ref={turnstile} onToken={setCaptcha} />
        {error && <Alert tone="error">{error}</Alert>}
        <button type="submit" disabled={busy || captcha === null || !login.trim()} className="btn btn-primary btn-lg w-full">
          {busy ? (
            <>
              <Spinner /> Enviando…
            </>
          ) : (
            <>
              Mandar link no Discord <Icon name="discord" size={18} />
            </>
          )}
        </button>
      </form>
      <p className="mt-8 text-center text-[15px] text-muted">
        Sem Discord vinculado na conta? <span className="font-semibold text-ink">Chame um adm do servidor.</span>
      </p>
    </>
  );
}

function Reset() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [token] = useState(readToken);
  const [valid, setValid] = useState<boolean | null>(token ? null : false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<User | null>(null);
  const pw = usePasswordVisibility();

  useEffect(() => {
    // Tira o token da barra de endereço logo depois de ler.
    if (window.location.hash) navigate("/redefinir-senha", { replace: true });
    if (token)
      api
        .post<{ valid: boolean }>("/auth/password/reset/check", { token })
        .then((r) => setValid(r.valid))
        .catch(() => setValid(false));
  }, [token, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !token) return;
    if (password !== confirm) return setError("As senhas não são iguais.");
    setError(null);
    setBusy(true);
    try {
      const { user } = await api.post<{ user: User }>("/auth/password/reset", { token, password });
      setDone(user);
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError && err.code === "reset_invalid") setValid(false);
    } finally {
      setBusy(false);
    }
  }

  const finish = useCallback(() => {
    if (!done) return;
    setUser(done);
    navigate(done.role === "admin" ? "/admin" : "/painel", { replace: true });
  }, [done, navigate, setUser]);

  if (valid === null) {
    return (
      <p className="flex items-center gap-3 text-muted" role="status">
        <Spinner /> Conferindo o link…
      </p>
    );
  }

  if (!valid) {
    return (
      <>
        <h1 className="font-display text-[2rem] font-extrabold leading-tight tracking-[-0.035em]">Link expirado</h1>
        <p className="mt-2 text-[15px] text-muted">
          Esse link já foi usado, venceu ou está incompleto. Peça um novo: ele chega no privado do Discord.
        </p>
        <Link to="/esqueci-senha" className="btn btn-primary btn-lg mt-8 w-full">
          Pedir outro link
        </Link>
      </>
    );
  }

  const mismatch = confirm.length > 0 && password !== confirm;
  return (
    <>
      <h1 className="font-display text-[2rem] font-extrabold leading-tight tracking-[-0.035em]">Crie uma senha nova</h1>
      <p className="mt-2 text-[15px] text-muted">Depois de salvar, as outras sessões abertas da sua conta são desconectadas.</p>
      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <InputField
          label="Senha nova"
          icon="lock"
          type={pw.type}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="mínimo 8 caracteres"
          autoComplete="new-password"
          maxLength={128}
          trailing={<PasswordToggle shown={pw.shown} onToggle={pw.toggle} />}
        />
        <PasswordStrength password={password} />
        <InputField
          label="Repita a senha"
          icon="lock"
          type={pw.type}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          maxLength={128}
          error={mismatch ? "As senhas não são iguais." : null}
        />
        {error && <Alert tone="error">{error}</Alert>}
        <button type="submit" disabled={busy || password.length < 8 || !confirm} className="btn btn-primary btn-lg w-full">
          {busy ? (
            <>
              <Spinner /> Salvando…
            </>
          ) : (
            <>
              Salvar senha nova <Icon name="arrow-right" size={18} />
            </>
          )}
        </button>
      </form>
      {done && <SuccessOverlay title="Senha alterada" subtitle="Entrando no seu painel…" onDone={finish} />}
    </>
  );
}
