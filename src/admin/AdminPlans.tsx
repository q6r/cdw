import { useEffect, useState } from "react";
import clsx from "clsx";
import { Icon, Spinner } from "../components/Icon";
import { PLAN_ICONS, PLAN_ICON_NAMES, PlanIcon } from "../components/PlanIcon";
import { Alert, EmptyState, Modal, PageHeader } from "../components/ui";
import { ColorPicker } from "../components/tag/ColorPicker";
import { PlanArt } from "../components/store/PlanArt";
import { FormField, SearchSelect, TableSkeleton, Toggle, centsToInput, parseBrl, type SelectOption } from "./parts";
import { api, errorMessage } from "../lib/api";
import { useApi } from "../lib/hooks";
import { useToast } from "../lib/toast";
import { brl, rgba } from "../lib/format";
import type { Plan, PlanKind } from "../lib/types";

type AdminPlan = Plan & { roleId: string | null; categoryId: string | null; autoRoleId: string | null; active: boolean; holders: number };
interface DiscordMeta {
  ready: boolean;
  roles: { id: string; name: string; color?: string }[];
  categories: { id: string; name: string }[];
}

interface Form {
  key: string;
  name: string;
  kind: PlanKind;
  tier: number;
  price: string;
  durationDays: number;
  color: string;
  icon: string;
  tagline: string;
  perks: string;
  tagMembers: number;
  voiceAllowed: number;
  firstLadies: number;
  mute: boolean;
  countHours: boolean;
  maxHolders: number;
  roleId: string;
  categoryId: string;
  autoRoleId: string;
  active: boolean;
}

const EMPTY: Form = {
  key: "",
  name: "",
  kind: "vip",
  tier: 1,
  price: "30,00",
  durationDays: 30,
  color: "#168fe5",
  icon: "star",
  tagline: "",
  perks: "",
  tagMembers: 0,
  voiceAllowed: 3,
  firstLadies: 0,
  mute: false,
  countHours: false,
  maxHolders: 0,
  roleId: "",
  categoryId: "",
  autoRoleId: "",
  active: true,
};

const STAFF = {
  key: "staff",
  name: "Staff",
  tier: 1,
  price: "1,00",
  durationDays: 30,
  color: "#8b9cf7",
  icon: "shield",
  tagline: "Equipe da CDW",
  perks: "Tag própria personalizável (nome, cor e ícone)\nCall de voz própria\nSem vencimento enquanto for da staff",
  mute: true,
};

const toForm = (p: AdminPlan): Form => ({
  key: p.key,
  name: p.name,
  kind: p.kind,
  tier: p.tier,
  price: centsToInput(p.priceCents),
  durationDays: p.durationDays,
  color: p.color,
  icon: p.icon,
  tagline: p.tagline,
  perks: p.perks.join("\n"),
  tagMembers: p.limits.tagMembers,
  voiceAllowed: p.limits.voiceAllowed,
  firstLadies: p.limits.firstLadies ?? 0,
  mute: p.features.mute,
  countHours: !!p.features.countHours,
  maxHolders: p.maxHolders,
  roleId: p.roleId ?? "",
  categoryId: p.categoryId ?? "",
  autoRoleId: p.autoRoleId ?? "",
  active: p.active,
});

const roleOptions = (roles: DiscordMeta["roles"]): SelectOption[] =>
  roles.map((r) => ({ value: r.id, label: r.name, color: r.color && r.color !== "#000000" ? r.color : undefined }));

export default function AdminPlans() {
  const { data, loading, reload } = useApi<{ plans: AdminPlan[] }>("/admin/plans");
  const limit = useApi<{ limit: { limitCents: number; rankName?: string } | null }>("/admin/pagci/limit").data?.limit ?? null;
  const [editing, setEditing] = useState<{ plan: AdminPlan | null } | null>(null);
  const [staffOpen, setStaffOpen] = useState(false);
  const plans = data?.plans ?? [];
  const staff = plans.find((p) => p.key === "staff");
  const overLimit = (p: AdminPlan) => !!(limit && p.active && p.priceCents > limit.limitCents);

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Planos"
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStaffOpen(true)}>
              <Icon name="shield" size={16} /> {staff ? "VIP Staff" : "Criar VIP Staff"}
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing({ plan: null })}>
              <Icon name="plus" size={16} /> Novo plano
            </button>
          </>
        }
      >
        Preço, duração, benefícios, cargo e categoria do Discord de cada plano. Um plano fora da loja (ex.: VIP Staff) pode ser dado pelo cargo
        ou por “Conceder VIP”.
      </PageHeader>

      {limit && plans.some(overLimit) && (
        <Alert tone="warn" icon="alert" className="mb-6">
          Sua conta Pagci{limit.rankName ? ` (nível ${limit.rankName})` : ""} aceita Pix de até <strong>{brl(limit.limitCents)}</strong>. Os planos
          marcados abaixo passam disso e ficam bloqueados no site até a Pagci liberar um nível maior. Até lá, venda pela staff e use “Conceder
          VIP”.
        </Alert>
      )}

      <div className="card overflow-hidden">
        {loading && !data ? (
          <TableSkeleton />
        ) : plans.length === 0 ? (
          <EmptyState icon="grid" title="Nenhum plano" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-x min-w-[920px]">
              <thead>
                <tr>
                  <th scope="col">Plano</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Preço</th>
                  <th scope="col">Duração</th>
                  <th scope="col">Vantagens</th>
                  <th scope="col">Discord</th>
                  <th scope="col">Ativos</th>
                  <th scope="col">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.key} className={p.active ? undefined : "opacity-55"}>
                    <td>
                      <span className="flex items-center gap-3">
                        <PlanIcon name={p.icon} size={26} hoverOnly />
                        <span>
                          <span className="block font-semibold">{p.name}</span>
                          <span className="block font-mono text-[11px] text-dim">{p.key}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <span
                        className="rounded-[6px] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-2"
                        style={{ background: rgba(p.color, 0.18) }}
                      >
                        {p.kind === "owner" ? "Cargo de dono" : "VIP"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="tabular block font-semibold">{brl(p.priceCents)}</span>
                      {overLimit(p) && <span className="block text-xs font-semibold text-warn">acima do limite Pagci</span>}
                    </td>
                    <td className="text-muted">{p.durationDays} dias</td>
                    <td className="text-xs text-muted">{p.features.mute ? "mutar/mover" : "—"}</td>
                    <td className="text-xs font-semibold">
                      <span className={clsx("block", p.roleId ? "text-success" : "text-warn")}>{p.roleId ? "cargo ok" : "sem cargo"}</span>
                      <span className={clsx("block", p.categoryId ? "text-success" : "text-dim")}>{p.categoryId ? "categoria ok" : "categoria padrão"}</span>
                      {p.autoRoleId && <span className="block text-liquid-ink">VIP pelo cargo</span>}
                    </td>
                    <td className="tabular text-sm">
                      {p.holders}
                      {p.maxHolders > 0 && <span className="text-dim">/{p.maxHolders}</span>}
                    </td>
                    <td className="text-right">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing({ plan: p })}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {staffOpen && (
        <StaffModal
          plan={staff ?? null}
          onClose={() => setStaffOpen(false)}
          onSaved={async () => {
            setStaffOpen(false);
            await reload();
          }}
          onAdvanced={() => {
            setStaffOpen(false);
            if (staff) setEditing({ plan: staff });
          }}
        />
      )}
      {editing && (
        <PlanEditor
          plan={editing.plan}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      )}
    </>
  );
}

function IconGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,2.75rem)] gap-1.5" role="radiogroup" aria-label="Ícone do plano">
      {PLAN_ICON_NAMES.map((name) => {
        const selected = value === name;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={selected}
            title={PLAN_ICONS[name].name}
            aria-label={PLAN_ICONS[name].name}
            onClick={() => onChange(name)}
            className={clsx(
              "grid aspect-square place-items-center rounded-[10px] border transition-colors",
              selected ? "border-liquid bg-liquid-soft" : "border-silver bg-porcelain hover:border-silver-strong",
            )}
          >
            <PlanIcon name={name} size="62%" hoverOnly={!selected} />
          </button>
        );
      })}
    </div>
  );
}

function PlanEditor({ plan, onClose, onSaved }: { plan: AdminPlan | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const meta = useApi<DiscordMeta>("/admin/discord/meta");
  const [form, setForm] = useState<Form>(() => (plan ? toForm(plan) : EMPTY));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const creating = !plan;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const ready = !!meta.data?.ready;

  useEffect(() => {
    if (creating) set("durationDays", form.kind === "owner" ? 45 : 30);
  }, [form.kind]);

  const save = async () => {
    setBusy(true);
    setError(null);
    const body = {
      ...(creating ? { key: form.key } : {}),
      name: form.name,
      kind: form.kind,
      tier: form.tier,
      priceCents: parseBrl(form.price),
      durationDays: form.durationDays,
      color: form.color,
      icon: form.icon,
      tagline: form.tagline,
      perks: form.perks
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      limits: { tagMembers: form.tagMembers, voiceAllowed: form.voiceAllowed, firstLadies: form.firstLadies },
      features: { mute: form.mute, countHours: form.countHours },
      maxHolders: form.maxHolders,
      roleId: form.roleId || null,
      categoryId: form.categoryId || null,
      autoRoleId: form.autoRoleId || null,
      active: form.active,
    };
    try {
      const r = creating ? await api.post<{ resynced?: number }>("/admin/plans", body) : await api.patch<{ resynced?: number }>(`/admin/plans/${plan!.key}`, body);
      const resynced = r && "resynced" in r ? (r.resynced ?? 0) : 0;
      toast(creating ? "Plano criado" : resynced ? `Plano salvo, reaplicado em ${resynced} VIP(s)` : "Plano salvo", "success");
      await onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const idField = (value: string, key: "roleId" | "categoryId" | "autoRoleId", placeholder: string) => (
    <input className="field font-mono" placeholder={placeholder} value={value} onChange={(e) => set(key, e.target.value.replace(/\D/g, ""))} />
  );
  const preview = { key: form.key || "novo", name: form.name || "Plano", icon: form.icon, color: form.color };

  return (
    <Modal open onClose={onClose} size="lg" label={creating ? "Novo plano" : `Editar ${plan!.name}`} className="!max-w-4xl !p-0">
      <div className="flex max-h-[88svh] flex-col">
        <div className="border-b border-silver px-5 py-4 pr-14">
          <h2 className="font-display text-lg font-extrabold">{creating ? "Novo plano" : `Editar ${plan!.name}`}</h2>
        </div>
        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_230px]">
          <div className="min-h-0 space-y-4 overflow-y-auto px-5 py-4">
            <div className={clsx("grid gap-3", creating ? "sm:grid-cols-[1fr_1fr_190px]" : "sm:grid-cols-[1fr_190px]")}>
              {creating && (
                <FormField label="Identificador" hint="na URL, ex.: royal" htmlFor="pl-key">
                  <input
                    id="pl-key"
                    className="field font-mono"
                    value={form.key}
                    maxLength={24}
                    onChange={(e) => set("key", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  />
                </FormField>
              )}
              <FormField label="Nome" htmlFor="pl-name">
                <input id="pl-name" className="field" value={form.name} maxLength={32} onChange={(e) => set("name", e.target.value)} />
              </FormField>
              <div>
                <span className="label">Tipo</span>
                <div className="grid grid-cols-2 gap-1 rounded-[10px] border border-silver-strong bg-frost p-1" role="radiogroup" aria-label="Tipo">
                  {(
                    [
                      ["vip", "VIP"],
                      ["owner", "Dono"],
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={form.kind === k}
                      onClick={() => set("kind", k)}
                      className={clsx("min-h-[36px] rounded-[8px] text-sm font-semibold", form.kind === k ? "bg-porcelain text-liquid-ink shadow-hairline" : "text-muted hover:text-ink")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <FormField label="Preço (R$)" htmlFor="pl-price">
                <input
                  id="pl-price"
                  className="field font-mono"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value.replace(/[^0-9.,]/g, ""))}
                />
              </FormField>
              <FormField label="Dias" htmlFor="pl-days">
                <input id="pl-days" type="number" className="field" min={1} max={365} value={form.durationDays} onChange={(e) => set("durationDays", Number(e.target.value))} />
              </FormField>
              <FormField label="Nível" hint="maior = mais alto" htmlFor="pl-tier">
                <input id="pl-tier" type="number" className="field" min={1} max={999} value={form.tier} onChange={(e) => set("tier", Number(e.target.value))} />
              </FormField>
              <FormField label="Vagas" hint="0 = sem limite" htmlFor="pl-max">
                <input id="pl-max" type="number" className="field" min={0} value={form.maxHolders} onChange={(e) => set("maxHolders", Number(e.target.value))} />
              </FormField>
            </div>
            <FormField label="Frase" htmlFor="pl-tagline">
              <input
                id="pl-tagline"
                className="field"
                value={form.tagline}
                maxLength={80}
                placeholder="Ex.: O top 1 do servidor"
                onChange={(e) => set("tagline", e.target.value)}
              />
            </FormField>
            <FormField label="Benefícios" hint="um por linha (até 15)" htmlFor="pl-perks">
              <textarea id="pl-perks" className="field min-h-24 leading-relaxed" rows={4} value={form.perks} onChange={(e) => set("perks", e.target.value)} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tag para até" hint="0 = sem limite" htmlFor="pl-tag">
                <input id="pl-tag" type="number" className="field" min={0} max={100} value={form.tagMembers} onChange={(e) => set("tagMembers", Number(e.target.value))} />
              </FormField>
              <FormField label="Primeiras Damas" hint="0 = não inclui" htmlFor="pl-fl">
                <input id="pl-fl" type="number" className="field" min={0} max={20} value={form.firstLadies} onChange={(e) => set("firstLadies", Number(e.target.value))} />
              </FormField>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Toggle on={form.mute} onChange={(v) => set("mute", v)} label="Mutar/mover" hint="na própria call" />
              <Toggle on={form.countHours} onChange={(v) => set("countHours", v)} label="Contar horas" hint="cd!tempo" />
              <Toggle on={form.active} onChange={(v) => set("active", v)} label="À venda" hint="aparece no site" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="Cargo do plano">
                {ready ? (
                  <SearchSelect value={form.roleId} onChange={(v) => set("roleId", v)} emptyLabel="Nenhum" options={roleOptions(meta.data!.roles)} ariaLabel="Cargo do plano" />
                ) : (
                  idField(form.roleId, "roleId", "ID do cargo")
                )}
              </FormField>
              <FormField label="Categoria das calls">
                {ready ? (
                  <SearchSelect
                    value={form.categoryId}
                    onChange={(v) => set("categoryId", v)}
                    emptyLabel="Padrão do .env"
                    options={meta.data!.categories.map((c) => ({ value: c.id, label: c.name }))}
                    ariaLabel="Categoria das calls"
                  />
                ) : (
                  idField(form.categoryId, "categoryId", "ID da categoria")
                )}
              </FormField>
              <FormField label="VIP pelo cargo" hint="quem tiver ganha, sem vencimento">
                {ready ? (
                  <SearchSelect
                    value={form.autoRoleId}
                    onChange={(v) => set("autoRoleId", v)}
                    emptyLabel="Desligado"
                    options={roleOptions(meta.data!.roles.filter((r) => r.id !== form.roleId))}
                    ariaLabel="VIP pelo cargo"
                  />
                ) : (
                  idField(form.autoRoleId, "autoRoleId", "ID do cargo")
                )}
              </FormField>
            </div>
            {meta.data && !meta.data.ready && <p className="text-xs font-semibold text-warn">Bot offline: cole os IDs manualmente.</p>}
            <div>
              <span className="label">Cor</span>
              <ColorPicker compact value={form.color} onChange={(v) => set("color", v)} />
            </div>
            <div>
              <span className="label">Ícone</span>
              <IconGrid value={form.icon} onChange={(v) => set("icon", v)} />
            </div>
          </div>
          <aside className="flex flex-col gap-3 border-t border-silver bg-frost px-5 py-4 lg:border-l lg:border-t-0">
            <div className="hidden lg:block">
              <span className="label text-xs">Prévia</span>
              <div className="rounded-[14px] border border-silver bg-porcelain p-1.5">
                <PlanArt plan={preview} className="rounded-[10px]" />
                <div className="flex items-center gap-2 px-1.5 pb-1 pt-2.5">
                  <PlanIcon name={form.icon} size={22} />
                  <span className="truncate font-display font-extrabold">{form.name || "Plano"}</span>
                </div>
                <div className="tabular px-1.5 pb-1.5 text-sm font-semibold text-ink-2">{brl(parseBrl(form.price) || 0)}</div>
              </div>
            </div>
            {error && <Alert tone="error">{error}</Alert>}
            <button type="button" className="btn btn-primary w-full" onClick={() => void save()} disabled={busy || !form.name || (creating && form.key.length < 2)}>
              {busy ? <Spinner size={16} /> : <Icon name="check" size={16} />}
              {creating ? "Criar plano" : "Salvar"}
            </button>
          </aside>
        </div>
      </div>
    </Modal>
  );
}

function StaffModal({ plan, onClose, onSaved, onAdvanced }: { plan: AdminPlan | null; onClose: () => void; onSaved: () => Promise<void>; onAdvanced: () => void }) {
  const toast = useToast();
  const meta = useApi<DiscordMeta>("/admin/discord/meta");
  const [name, setName] = useState(plan?.name ?? STAFF.name);
  const [roleId, setRoleId] = useState(plan?.autoRoleId ?? "");
  const [color, setColor] = useState(plan?.color ?? STAFF.color);
  const [mute, setMute] = useState(plan?.features.mute ?? STAFF.mute);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      if (plan) {
        await api.patch(`/admin/plans/${plan.key}`, { name, color, autoRoleId: roleId || null, features: { mute } });
      } else {
        await api.post("/admin/plans", {
          key: STAFF.key,
          name,
          kind: "vip",
          tier: STAFF.tier,
          priceCents: parseBrl(STAFF.price),
          durationDays: STAFF.durationDays,
          color,
          icon: STAFF.icon,
          tagline: STAFF.tagline,
          perks: STAFF.perks.split("\n"),
          limits: { tagMembers: 0, voiceAllowed: 0, firstLadies: 0 },
          features: { mute },
          maxHolders: 0,
          roleId: null,
          categoryId: null,
          autoRoleId: roleId || null,
          active: false,
        });
      }
      toast(plan ? "VIP Staff salvo" : "VIP Staff criado", "success");
      await onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} label="VIP Staff">
      <div className="flex items-center gap-3 pr-10">
        <PlanIcon name="shield" size={30} animated={false} />
        <h2 className="font-display text-xl font-extrabold">VIP Staff</h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Fica fora da loja. Quem tiver o cargo da staff ganha sozinho, sem vencimento, com tag e call. Se o cargo sair, o VIP sai junto.
      </p>
      <div className="mt-6 space-y-5">
        <FormField label="Cargo da staff">
          {meta.data?.ready ? (
            <SearchSelect value={roleId} onChange={setRoleId} placeholder="Escolha o cargo" options={roleOptions(meta.data.roles)} ariaLabel="Cargo da staff" />
          ) : (
            <input className="field font-mono" placeholder="ID do cargo" value={roleId} onChange={(e) => setRoleId(e.target.value.replace(/\D/g, ""))} />
          )}
        </FormField>
        <FormField label="Nome" htmlFor="staff-name">
          <input id="staff-name" className="field" value={name} maxLength={32} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <div>
          <span className="label">Cor da tag</span>
          <ColorPicker compact value={color} onChange={setColor} />
        </div>
        <Toggle on={mute} onChange={setMute} label="Poder mutar/mover" hint="na própria call" />
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {plan ? (
            <button type="button" className="text-sm font-semibold text-liquid-ink underline-offset-4 hover:underline" onClick={onAdvanced}>
              Edição completa
            </button>
          ) : (
            <span className="text-xs text-dim">Dá para ajustar o resto depois.</span>
          )}
          <button type="button" className="btn btn-primary" disabled={busy || !roleId || name.trim().length < 2} onClick={() => void save()}>
            {busy ? <Spinner size={16} /> : <Icon name="check" size={16} />}
            {plan ? "Salvar" : "Criar VIP Staff"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
