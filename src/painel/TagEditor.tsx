import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Icon, Spinner } from "../components/Icon";
import { Alert, CardHeader, EmptyState, PageHeader, Skeleton } from "../components/ui";
import { ColorPicker } from "../components/tag/ColorPicker";
import { DiscordTagPreview, EmojiPicker } from "../components/tag/TagParts";
import { MemberList } from "./parts";
import { useVip } from "./Shell";
import { useAuth } from "../lib/auth";
import { api, errorMessage } from "../lib/api";
import { useToast } from "../lib/toast";
import { pushRecentColor } from "../lib/color";
import type { TagIcon, Vip } from "../lib/types";

const iconKey = (i: TagIcon | null | undefined) => (i ? `${i.kind}:${i.key}` : "");
type VipResponse = { vip: Vip; warning?: string };

export default function TagEditor() {
  const { vip, setVip, loading } = useVip();
  const { user } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#168fe5");
  const [icon, setIcon] = useState<TagIcon | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!vip) return;
    setName(vip.tag.name);
    setColor(vip.tag.color);
    setIcon(vip.tag.icon);
  }, [vip?.id, vip?.tag.name, vip?.tag.color, vip?.tag.icon?.key]);

  if (loading) return <Skeleton className="h-96 rounded-[14px]" />;
  if (!vip?.active) {
    return (
      <>
        <PageHeader eyebrow="Seu VIP" title="Minha tag" />
        <div className="card">
          <EmptyState icon="tag" title="Você precisa de um VIP ativo">
            A tag personalizada vem em todos os VIPs.
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

  const dirty = name.trim() !== vip.tag.name || color !== vip.tag.color || iconKey(icon) !== iconKey(vip.tag.icon);
  const applied = (res: VipResponse, msg: string) => {
    setVip(res.vip);
    toast(res.warning ?? msg, res.warning ? "info" : "success");
  };

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (name.trim() !== vip.tag.name) body.name = name;
      if (color !== vip.tag.color) body.color = color;
      if (iconKey(icon) !== iconKey(vip.tag.icon)) body.icon = icon;
      const res = await api.patch<VipResponse>("/vip/tag", body);
      pushRecentColor(color);
      applied(res, "Tag atualizada no Discord");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setName(vip.tag.name);
    setColor(vip.tag.color);
    setIcon(vip.tag.icon);
  };

  return (
    <>
      <PageHeader eyebrow="Seu VIP" title="Minha tag">
        Nome, cor e ícone do seu cargo no servidor. A prévia mostra exatamente como fica no Discord.
      </PageHeader>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-7">
            <CardHeader title="Nome da tag" />
            <div className="relative">
              <input
                className="field min-h-[50px] pr-16"
                value={name}
                maxLength={32}
                aria-label="Nome da tag"
                aria-invalid={!name.trim() ? true : undefined}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Realeza"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-dim">{name.length}/32</span>
            </div>
            {!name.trim() && <p className="mt-2 text-[13px] font-medium text-danger">Dê um nome para a tag.</p>}
          </section>
          <section className="card p-5 sm:p-7">
            <CardHeader title="Cor">Qualquer cor HEX. Arraste, digite ou escolha uma sugestão.</CardHeader>
            <ColorPicker value={color} onChange={setColor} />
          </section>
          <section className="card p-5 sm:p-7">
            <CardHeader title="Ícone">Aparece ao lado do seu nome no servidor.</CardHeader>
            <EmojiPicker value={icon} onChange={setIcon} />
          </section>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24">
          <DiscordTagPreview
            name={name}
            color={color}
            icon={icon}
            username={user?.discord?.username ?? user?.username ?? "você"}
            avatar={user?.discord?.avatar}
            members={vip.tag.members.length + 1}
          />
          <AnimatePresence>
            {dirty && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-liquid/30 bg-liquid-mist p-3 pl-4"
                role="status"
              >
                <span className="text-sm font-semibold text-liquid-ink">Alterações não salvas</span>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={discard} disabled={saving}>
                    Descartar
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={saving || !name.trim()}>
                    {saving ? <Spinner size={15} /> : <Icon name="check" size={16} />}
                    {saving ? "Salvando…" : "Salvar"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!vip.tag.onDiscord && <Alert tone="warn">O bot ainda está criando sua tag no Discord. Atualize em instantes.</Alert>}
        </div>
      </div>

      <section className="card mt-6 p-5 sm:p-7">
        <CardHeader title="Quem tem sua tag">Quem você adicionar ganha sua tag no servidor e entra na sua call.</CardHeader>
        <MemberList
          members={vip.tag.members}
          limit={vip.limits.tagMembers}
          removeLabel="Tirar tag"
          empty="Ninguém com sua tag ainda."
          onAdd={async (id) => applied(await api.post<VipResponse>("/vip/tag/members", { discordId: id }), "Tag entregue")}
          onRemove={async (id) => applied(await api.del<VipResponse>(`/vip/tag/members/${id}`), "Tag removida")}
        />
      </section>

      {vip.limits.firstLadies > 0 && (
        <section className="card mt-6 p-5 sm:p-7">
          <CardHeader title={vip.limits.firstLadies === 1 ? "Primeira Dama" : "Primeiras Damas"}>
            Quem você indicar recebe o cargo de Primeira Dama no servidor. Seu plano permite {vip.limits.firstLadies}.
          </CardHeader>
          <MemberList
            members={vip.firstLadies ?? []}
            limit={vip.limits.firstLadies}
            removeLabel="Remover"
            empty="Ninguém indicada ainda."
            onAdd={async (id) => applied(await api.post<VipResponse>("/vip/first-ladies", { discordId: id }), "Primeira Dama indicada")}
            onRemove={async (id) => applied(await api.del<VipResponse>(`/vip/first-ladies/${id}`), "Indicação removida")}
          />
        </section>
      )}
    </>
  );
}
