import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Icon, Spinner } from "../components/Icon";
import { Avatar, CardHeader, ConfirmButton, EmptyState, PageHeader, Skeleton } from "../components/ui";
import { MemberList } from "./parts";
import { useVip } from "./Shell";
import { useAuth } from "../lib/auth";
import { api, errorMessage } from "../lib/api";
import { useToast } from "../lib/toast";
import type { Member, Vip } from "../lib/types";

type VipResponse = { vip: Vip; warning?: string };

export default function VoiceEditor() {
  const { vip, setVip, loading } = useVip();
  const { user } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [limit, setLimit] = useState(0);
  const [saving, setSaving] = useState(false);
  const [live, setLive] = useState<Member[] | null>(null);
  const active = !!vip?.active;

  useEffect(() => {
    if (!vip) return;
    setName(vip.voice.name);
    setLimit(vip.voice.limit);
  }, [vip?.id, vip?.voice.name, vip?.voice.limit]);

  // Quem está na call agora, atualizado a cada 8 s com a aba visível.
  useEffect(() => {
    if (!active) return;
    let alive = true;
    const load = () => {
      if (document.hidden) return;
      api
        .get<{ members: Member[] }>("/vip/voice/live")
        .then((r) => alive && setLive(r.members))
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 8000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [active]);

  if (loading) return <Skeleton className="h-96 rounded-[14px]" />;
  if (!vip?.active) {
    return (
      <>
        <PageHeader eyebrow="Seu VIP" title="Minha call" />
        <div className="card">
          <EmptyState icon="voice" title="Você precisa de um VIP ativo">
            Todos os VIPs incluem uma call privada.
            <div className="mt-6">
              <Link to="/painel/planos" className="btn btn-primary">
                Ver planos
              </Link>
            </div>
          </EmptyState>
        </div>
      </>
    );
  }

  const dirty = name.trim() !== vip.voice.name || limit !== vip.voice.limit;
  const applied = (res: VipResponse, msg: string) => {
    setVip(res.vip);
    toast(res.warning ?? msg, res.warning ? "info" : "success");
  };

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (name.trim() !== vip.voice.name) body.name = name;
      if (limit !== vip.voice.limit) body.limit = limit;
      applied(await api.patch<VipResponse>("/vip/voice", body), "Call atualizada");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Seu VIP" title="Minha call">
        Sua sala de voz privada. Quem tem sua tag e quem você liberar pode entrar.
      </PageHeader>

      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="card p-5 sm:p-7">
          <CardHeader title="Configuração" />
          <label className="label" htmlFor="voice-name">
            Nome da call
          </label>
          <div className="relative">
            <Icon name="voice" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
            <input
              id="voice-name"
              className="field min-h-[50px] pl-11 pr-16"
              value={name}
              maxLength={90}
              aria-invalid={!name.trim() ? true : undefined}
              onChange={(e) => setName(e.target.value)}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-dim">{name.length}/90</span>
          </div>

          <div className="mt-8 flex items-end justify-between">
            <label className="label !mb-0" htmlFor="voice-limit">
              Limite de pessoas
            </label>
            <span className="tabular font-display text-3xl font-extrabold" aria-hidden="true">
              {limit === 0 ? "∞" : limit}
            </span>
          </div>
          <input
            id="voice-limit"
            type="range"
            min={0}
            max={99}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            aria-valuetext={limit === 0 ? "sem limite" : `${limit} pessoas`}
            className="mt-4 w-full accent-[#0f6fc0]"
          />
          <div className="mt-1 flex justify-between text-xs text-dim">
            <span>0 = sem limite</span>
            <span>máx. 99</span>
          </div>

          <div className="mt-8 flex justify-end gap-2">
            <AnimatePresence>
              {dirty && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="btn btn-ghost"
                  onClick={() => {
                    setName(vip.voice.name);
                    setLimit(vip.voice.limit);
                  }}
                >
                  Descartar
                </motion.button>
              )}
            </AnimatePresence>
            <button type="button" className="btn btn-primary" disabled={!dirty || saving || !name.trim()} onClick={save}>
              {saving ? <Spinner size={15} /> : <Icon name="check" size={16} />}
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </section>

        <section className="card p-5 sm:p-7">
          <CardHeader
            title="Na call agora"
            right={
              <span className="chip">
                <span className="live-dot" aria-hidden="true" /> ao vivo
              </span>
            }
          />
          {live === null ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : live.length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-silver-strong px-4 py-8 text-center text-sm text-muted">
              Ninguém conectado agora.
            </p>
          ) : (
            <ul className="space-y-2">
              {live.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-[12px] border border-silver bg-porcelain px-3 py-2.5">
                  <Avatar src={m.avatar} name={m.displayName ?? m.username} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.displayName ?? m.username}</span>
                  {m.id !== user?.discord?.id && (
                    <ConfirmButton
                      className="btn btn-danger btn-sm"
                      confirmLabel="Desconectar?"
                      title={`Desconectar ${m.displayName ?? m.username}`}
                      onConfirm={async () => {
                        try {
                          await api.post("/vip/voice/disconnect", { discordId: m.id });
                          setLive((list) => list?.filter((x) => x.id !== m.id) ?? null);
                          toast("Membro desconectado", "success");
                        } catch (e) {
                          toast(errorMessage(e), "error");
                        }
                      }}
                    >
                      <Icon name="phone-off" size={16} />
                      <span className="sr-only">Desconectar {m.displayName ?? m.username}</span>
                    </ConfirmButton>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card mt-6 p-5 sm:p-7">
        <CardHeader title="Quem tem sua tag">Quem você adicionar ganha sua tag no servidor e entra na sua call.</CardHeader>
        <MemberList
          members={vip.tag.members}
          limit={vip.limits.tagMembers}
          empty="Ninguém com sua tag ainda."
          removeLabel="Tirar tag"
          onAdd={async (id) => applied(await api.post<VipResponse>("/vip/tag/members", { discordId: id }), "Tag entregue")}
          onRemove={async (id) => applied(await api.del<VipResponse>(`/vip/tag/members/${id}`), "Tag removida")}
        />
      </section>
    </>
  );
}
