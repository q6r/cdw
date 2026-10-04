import { useState } from "react";
import clsx from "clsx";
import { Icon, Spinner } from "../components/Icon";
import { PlanIcon } from "../components/PlanIcon";
import { Avatar, ConfirmButton, EmptyState, Modal, PageHeader, StatusBadge } from "../components/ui";
import { TagIconView } from "../components/tag/TagParts";
import { MemberSearch } from "../painel/parts";
import { FilterTabs, FormField, Pager, SearchBox, TableSkeleton, Toggle, UserCell, type AdminUser, type Paged } from "./parts";
import { api, errorMessage } from "../lib/api";
import { useApi, useDebounced, usePlans } from "../lib/hooks";
import { useToast } from "../lib/toast";
import { date, daysLeft, isForever, rgba } from "../lib/format";
import type { Member, Plan, TagIcon } from "../lib/types";

interface VipRow {
  id: string;
  user: AdminUser | null;
  discordId: string;
  planKey: string;
  tag: { name: string; color: string; icon: TagIcon | null; members: number };
  expiresAt: string;
  status: string;
  onDiscord: boolean;
  viaRole?: boolean;
}

export default function AdminVips() {
  const [status, setStatus] = useState("active");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [granting, setGranting] = useState(false);
  const term = useDebounced(q);
  const plans = usePlans();
  const toast = useToast();
  const query = new URLSearchParams({ page: String(page), status, q: term }).toString();
  const { data, loading, reload } = useApi<Paged<VipRow>>(`/admin/vips?${query}`);

  const act = async (path: string, body: Record<string, unknown>, msg: string) => {
    try {
      const r = await api.post<{ warning?: string }>(path, body);
      toast(r?.warning ?? msg, r?.warning ? "info" : "success");
      await reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="VIPs"
        actions={
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setGranting(true)}>
            <Icon name="plus" size={16} /> Conceder VIP
          </button>
        }
      >
        VIPs comprados e concedidos (site ou cd!addvip). Vencidos ficam 3 dias em carência e depois são apagados.
      </PageHeader>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          label="Status"
          options={[
            ["active", "Ativos"],
            ["grace", "Em carência"],
            ["", "Todos"],
          ]}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <SearchBox
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          placeholder="Usuário, email ou ID do Discord"
        />
      </div>
      <div className="card overflow-hidden">
        {loading && !data ? (
          <TableSkeleton />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon="crown" title="Nenhum VIP encontrado" />
        ) : (
          <>
            <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
              <table className="table-x min-w-[1040px]">
                <thead>
                  <tr>
                    <th scope="col">Usuário</th>
                    <th scope="col">Plano</th>
                    <th scope="col">Tag</th>
                    <th scope="col">Vence</th>
                    <th scope="col">Status</th>
                    <th scope="col">Discord</th>
                    <th scope="col" className="text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((v) => {
                    const plan = plans?.find((p) => p.key === v.planKey);
                    const left = daysLeft(v.expiresAt);
                    return (
                      <tr key={v.id}>
                        <td className="max-w-[220px]">
                          {v.user ? (
                            <UserCell user={v.user} />
                          ) : (
                            <span className="block">
                              <span className="block text-sm text-muted">sem conta no site</span>
                              <span className="block font-mono text-xs text-dim">{v.discordId}</span>
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="flex items-center gap-2">
                            {plan && <PlanIcon name={plan.icon} size={20} hoverOnly />}
                            {plan?.name ?? v.planKey}
                          </span>
                        </td>
                        <td>
                          <span
                            className="inline-flex max-w-[200px] items-center gap-1.5 rounded-[8px] px-2 py-1 text-xs font-semibold"
                            style={{ background: rgba(v.tag.color, 0.12), boxShadow: `inset 0 0 0 1px ${rgba(v.tag.color, 0.4)}` }}
                          >
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: v.tag.color }} />
                            <TagIconView icon={v.tag.icon} size={14} animated={false} />
                            <span className="truncate">{v.tag.name}</span>
                          </span>
                          <span className="mt-1 block text-xs text-dim">{v.tag.members} com a tag</span>
                        </td>
                        <td className="whitespace-nowrap">
                          {isForever(v.expiresAt) ? (
                            <>
                              <span className="block">Sem vencimento</span>
                              <span className="text-xs text-dim">{v.viaRole ? "pelo cargo" : "concedido"}</span>
                            </>
                          ) : (
                            <>
                              <span className="block">{date(v.expiresAt)}</span>
                              {v.status === "active" && <span className={clsx("text-xs", left <= 3 ? "font-semibold text-warn" : "text-dim")}>{left} dias</span>}
                              {v.status === "grace" && <span className="text-xs font-semibold text-warn">carência</span>}
                            </>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={v.status} />
                        </td>
                        <td>
                          <span className={clsx("inline-flex items-center gap-1.5 text-xs font-semibold", v.onDiscord ? "text-success" : "text-dim")}>
                            <span className={clsx("h-1.5 w-1.5 rounded-full", v.onDiscord ? "bg-success" : "bg-chrome")} />
                            {v.onDiscord ? "aplicado" : "fora"}
                          </span>
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            {(v.status === "active" || v.status === "grace") && (
                              <>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => void act(`/admin/vips/${v.id}/extend`, { days: 30 }, "+30 dias aplicados")}>
                                  +30d
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  title="Reaplicar no Discord"
                                  aria-label="Reaplicar no Discord"
                                  onClick={() => void act(`/admin/vips/${v.id}/resync`, {}, "Reaplicado no Discord")}
                                >
                                  <Icon name="refresh" size={15} />
                                </button>
                                <ConfirmButton
                                  className="btn btn-danger btn-sm"
                                  confirmLabel="Apagar VIP?"
                                  onConfirm={() => act(`/admin/vips/${v.id}/revoke`, {}, "VIP, cargo e call removidos")}
                                >
                                  Remover
                                </ConfirmButton>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
          </>
        )}
      </div>
      <GrantModal open={granting} onClose={() => setGranting(false)} onDone={reload} />
    </>
  );
}

type GuildMember = Member & { vip?: { planKey: string } | null };

function GrantModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => Promise<void> }) {
  const { data } = useApi<{ plans: (Plan & { active: boolean })[] }>(open ? "/admin/plans" : null);
  const toast = useToast();
  const [member, setMember] = useState<GuildMember | null>(null);
  const [planKey, setPlanKey] = useState("classic");
  const [days, setDays] = useState(30);
  const [permanent, setPermanent] = useState(false);
  const [busy, setBusy] = useState(false);
  const list = data?.plans ? [...data.plans].sort((a, b) => b.tier - a.tier) : [];
  const nameOf = (k: string) => list.find((p) => p.key === k)?.name ?? k;

  const choose = (key: string) => {
    setPlanKey(key);
    const p = list.find((x) => x.key === key);
    if (p?.durationDays) setDays(p.durationDays);
  };

  const grant = async () => {
    if (!member) return;
    setBusy(true);
    try {
      await api.post("/admin/vips/grant", { discordId: member.id, planKey, days, permanent });
      toast(`VIP concedido para ${member.displayName ?? member.username}`, "success");
      setMember(null);
      onClose();
      await onDone();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} label="Conceder VIP" size="lg">
      <h2 className="pr-10 font-display text-xl font-extrabold">Conceder VIP</h2>
      <p className="mt-1 text-sm text-muted">Sem pagamento. Se a pessoa já tem VIP, soma os dias ou troca de plano.</p>
      <div className="mt-6 space-y-5">
        <div>
          <span className="label">Membro do servidor</span>
          {member ? (
            <div className="flex items-center gap-3 rounded-[12px] border border-liquid/40 bg-liquid-mist px-3 py-2.5">
              <Avatar src={member.avatar} name={member.displayName ?? member.username} size={36} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{member.displayName ?? member.username}</div>
                <div className="truncate text-xs text-muted">
                  @{member.username} · {member.id}
                  {member.vip && ` · já tem ${nameOf(member.vip.planKey)}`}
                </div>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMember(null)}>
                Trocar
              </button>
            </div>
          ) : (
            <MemberSearch
              endpoint="/admin/discord/members"
              autoFocus
              onPick={(m) => setMember(m as GuildMember)}
              extra={(m) => ((m as GuildMember).vip ? <span className="chip shrink-0">{nameOf((m as GuildMember).vip!.planKey)}</span> : null)}
            />
          )}
        </div>
        <div>
          <span className="label">Plano</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Plano">
            {list.map((p) => (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={planKey === p.key}
                onClick={() => choose(p.key)}
                className={clsx(
                  "flex flex-col items-center gap-1.5 rounded-[12px] border px-2 py-3 text-xs font-semibold transition-colors",
                  planKey === p.key ? "border-liquid bg-liquid-soft text-liquid-ink" : "border-silver text-ink-2 hover:border-silver-strong",
                )}
              >
                <PlanIcon name={p.icon} size={24} hoverOnly={planKey !== p.key} />
                {p.name}
                {!p.active && <span className="text-[11px] font-medium text-dim">fora da loja</span>}
              </button>
            ))}
          </div>
        </div>
        <Toggle on={permanent} onChange={setPermanent} label="Sem vencimento" hint="Para staff e parceiros. Fica até você remover." />
        {!permanent && (
          <FormField label="Dias" htmlFor="grant-days">
            <input
              id="grant-days"
              type="number"
              className="field"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
            />
          </FormField>
        )}
        <button type="button" className="btn btn-primary btn-lg w-full" disabled={!member || busy} onClick={() => void grant()}>
          {busy ? <Spinner /> : <Icon name="check" size={17} />}
          {busy ? "Concedendo…" : "Conceder"}
        </button>
      </div>
    </Modal>
  );
}
