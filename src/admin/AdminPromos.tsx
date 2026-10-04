import { useEffect, useState, type ReactNode } from "react";
import { Icon, Spinner } from "../components/Icon";
import { Alert, ConfirmButton, EmptyState, Modal, PageHeader, StatusBadge } from "../components/ui";
import { FilterTabs, FormField, Pager, SearchBox, TableSkeleton, Toggle, UserCell, centsToInput, parseBrl, type AdminUser, type Paged } from "./parts";
import { api, errorMessage } from "../lib/api";
import { useApi, useCopy, useDebounced } from "../lib/hooks";
import { useToast } from "../lib/toast";
import { brl, date, dateTime } from "../lib/format";
import type { Promo, PromoOrderStatus } from "../lib/types";

interface AdminOrder {
  id: string;
  promoName: string;
  amountCents: number;
  includes: { everyone: boolean; dm: boolean };
  durationDays: number;
  user: (AdminUser & { discordId?: string | null }) | null;
  contact: string | null;
  link: string;
  message: string;
  status: PromoOrderStatus;
  paidAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  doneAt: string | null;
  createdAt: string;
  rejectReason: string | null;
  staffNote: string | null;
}

export default function AdminPromos() {
  const [status, setStatus] = useState("queued");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const term = useDebounced(q);
  const query = new URLSearchParams({ page: String(page), status, q: term }).toString();
  const { data, loading, reload, setData } = useApi<Paged<AdminOrder> & { counts?: Record<string, number> }>(`/admin/promo-orders?${query}`);
  const [open, setOpen] = useState<AdminOrder | null>(null);
  const [packages, setPackages] = useState(false);
  const counts = data?.counts ?? {};
  const withCount = (label: string, n?: number) => (n ? `${label} (${n})` : label);

  const updated = (o: AdminOrder) => {
    setOpen(o);
    if (data) setData({ ...data, items: data.items.map((x) => (x.id === o.id ? o : x)) });
  };

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Divulgações"
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void reload()}>
              <Icon name="refresh" size={16} /> Atualizar
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPackages(true)}>
              <Icon name="sliders" size={16} /> Pacotes
            </button>
          </>
        }
      >
        Fila de entrega. A staff publica o anúncio e as mensagens à mão; o site só organiza os pedidos e avisa quem comprou.
      </PageHeader>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          label="Status"
          options={[
            ["queued", withCount("Na fila", counts.queued)],
            ["running", withCount("No ar", counts.running)],
            ["done", "Finalizadas"],
            ["rejected", "Recusadas"],
            ["", "Todas"],
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
          placeholder="Comprador, contato ou link"
        />
      </div>
      <div className="card overflow-hidden">
        {loading && !data ? (
          <TableSkeleton />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon="message" title={status === "queued" ? "Fila vazia" : "Nenhum pedido aqui"}>
            {status === "queued" ? "Quando alguém pagar um pacote, o pedido aparece aqui." : undefined}
          </EmptyState>
        ) : (
          <>
            <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
              <table className="table-x min-w-[880px]">
                <thead>
                  <tr>
                    <th scope="col">Pacote</th>
                    <th scope="col">Comprador</th>
                    <th scope="col">Link</th>
                    <th scope="col">Status</th>
                    <th scope="col">Datas</th>
                    <th scope="col">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <span className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-liquid-soft text-liquid-deep">
                            <Icon name="megaphone" size={16} />
                          </span>
                          <span>
                            <span className="block font-medium">{o.promoName}</span>
                            <span className="block text-xs text-dim">{brl(o.amountCents)}</span>
                          </span>
                        </span>
                      </td>
                      <td className="max-w-[220px]">
                        <UserCell user={o.user} />
                      </td>
                      <td className="max-w-[200px] truncate font-mono text-xs text-muted" title={o.link}>
                        {o.link}
                      </td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="whitespace-nowrap text-xs text-muted">
                        <OrderDates o={o} />
                      </td>
                      <td className="text-right">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(o)}>
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
          </>
        )}
      </div>
      {open && <OrderModal order={open} onClose={() => setOpen(null)} onChange={updated} onMoved={() => void reload()} />}
      {packages && <PackagesModal onClose={() => setPackages(false)} />}
    </>
  );
}

function OrderDates({ o }: { o: AdminOrder }) {
  if (o.status === "queued") return <span>pago {dateTime(o.paidAt)}</span>;
  if (o.status === "running") return <span>{o.endsAt ? `até ${date(o.endsAt)}` : `desde ${dateTime(o.startsAt)}`}</span>;
  if (o.doneAt) return <span>{o.status === "rejected" ? "recusado" : "finalizado"} {dateTime(o.doneAt)}</span>;
  return <span>pedido {dateTime(o.createdAt)}</span>;
}

function Box({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[12px] border border-silver bg-frost p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-dim">{title}</p>
      {children}
    </div>
  );
}

function Row({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className={mono ? "truncate font-mono text-[11px] text-dim" : "truncate text-ink"}>{v}</dd>
    </div>
  );
}

function OrderModal({ order: o, onClose, onChange, onMoved }: { order: AdminOrder; onClose: () => void; onChange: (o: AdminOrder) => void; onMoved: () => void }) {
  const toast = useToast();
  const linkCopy = useCopy();
  const msgCopy = useCopy();
  const [note, setNote] = useState(o.staffNote ?? "");
  const [savingNote, setSavingNote] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setNote(o.staffNote ?? ""), [o.id, o.staffNote]);
  const open = o.status === "queued" || o.status === "running";
  const dm = o.includes.dm;

  const move = async (action: string, body?: Record<string, unknown>, msg = "Pedido atualizado") => {
    setBusy(true);
    try {
      const r = await api.post<{ order: AdminOrder }>(`/admin/promo-orders/${o.id}/${action}`, body);
      onChange(r.order);
      onMoved();
      setRejecting(false);
      toast(msg, "success");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  const saveNote = async () => {
    setSavingNote(true);
    try {
      const r = await api.patch<{ order: AdminOrder }>(`/admin/promo-orders/${o.id}`, { staffNote: note });
      onChange(r.order);
      toast("Nota salva", "success");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSavingNote(false);
    }
  };
  const copy = async (c: ReturnType<typeof useCopy>, text: string, what: string) => {
    const ok = await c.copy(text);
    toast(ok ? `${what} copiado` : "Não consegui copiar. Selecione e copie manualmente", ok ? "success" : "error");
  };

  return (
    <Modal open onClose={onClose} size="lg" label={`Pedido ${o.promoName}`}>
      <div className="flex flex-wrap items-center gap-3 pr-10">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-extrabold leading-tight">{o.promoName}</h2>
          <p className="text-sm text-muted">
            {brl(o.amountCents)}
            {dm ? ` · ${o.durationDays} dias no privado` : ""}
            {o.includes.everyone ? " · anúncio com @everyone" : ""}
          </p>
        </div>
        <StatusBadge status={o.status} />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Box title="Comprador">
          <UserCell user={o.user} />
          <p className="mt-3 text-xs text-muted">
            Contato: <span className="font-semibold text-ink">{o.contact ?? "não informado"}</span>
          </p>
          <p className="mt-1 text-xs text-muted">{o.user?.discordId ? "Discord vinculado: recebe os avisos na DM" : "Sem Discord vinculado: não recebe DM"}</p>
        </Box>
        <Box title="Andamento">
          <dl className="space-y-1.5 text-xs">
            {o.paidAt && <Row k="Pago" v={dateTime(o.paidAt)} />}
            {o.startsAt && <Row k="No ar desde" v={dateTime(o.startsAt)} />}
            {o.endsAt && <Row k="Termina" v={dateTime(o.endsAt)} />}
            {o.doneAt && <Row k={o.status === "rejected" ? "Recusado" : "Finalizado"} v={dateTime(o.doneAt)} />}
            <Row k="ID" v={o.id} mono />
          </dl>
        </Box>
      </div>
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="label !mb-0">Link</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void copy(linkCopy, o.link, "Link")}>
            <Icon name={linkCopy.copied ? "check" : "copy"} size={15} /> {linkCopy.copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <p className="break-all rounded-[10px] border border-silver bg-frost px-4 py-3 font-mono text-sm text-liquid-ink">{o.link}</p>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="label !mb-0">Mensagem</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void copy(msgCopy, o.message, "Mensagem")}>
            <Icon name={msgCopy.copied ? "check" : "copy"} size={15} /> {msgCopy.copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <p className="max-h-60 overflow-y-auto whitespace-pre-wrap break-words rounded-[10px] border border-silver bg-frost px-4 py-3 text-sm leading-relaxed">{o.message}</p>
      </div>
      {o.status === "rejected" && o.rejectReason && (
        <Alert tone="error" className="mt-5">
          <strong>Motivo da recusa:</strong> {o.rejectReason}
        </Alert>
      )}
      <div className="mt-5">
        <label className="label" htmlFor="staff-note">
          Nota da staff
        </label>
        <textarea
          id="staff-note"
          className="field min-h-20 text-sm leading-relaxed"
          value={note}
          maxLength={500}
          placeholder="Só a staff vê. Ex: postado no #anúncios às 20h"
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void saveNote()} disabled={savingNote || note === (o.staffNote ?? "")}>
            {savingNote ? <Spinner size={14} /> : <Icon name="check" size={15} />} Salvar nota
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-6 border-t border-silver pt-6">
          {rejecting ? (
            <div>
              <label className="label" htmlFor="reject-reason">
                Motivo da recusa
              </label>
              <textarea
                id="reject-reason"
                className="field min-h-20 text-sm"
                value={reason}
                maxLength={300}
                placeholder="Vai na DM de quem comprou"
                autoFocus
                onChange={(e) => setReason(e.target.value)}
              />
              <Alert tone="warn" icon="alert" className="mt-3">
                O reembolso não é automático. Combine com o comprador e devolva o Pix pela conta da Pagci.
              </Alert>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRejecting(false)} disabled={busy}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-danger btn-sm" disabled={busy || reason.trim().length < 3} onClick={() => void move("reject", { reason }, "Pedido recusado")}>
                  {busy ? <Spinner size={14} /> : <Icon name="ban" size={15} />} Recusar pedido
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button type="button" className="btn btn-danger btn-sm" onClick={() => setRejecting(true)} disabled={busy}>
                <Icon name="ban" size={15} /> Recusar
              </button>
              <div className="flex flex-wrap gap-2">
                {o.status === "queued" && dm && (
                  <ConfirmButton className="btn btn-secondary btn-sm" confirmLabel="Finalizar sem pôr no ar?" disabled={busy} onConfirm={() => move("done", undefined, "Pedido finalizado")}>
                    Finalizar
                  </ConfirmButton>
                )}
                {o.status === "running" && (
                  <ConfirmButton className="btn btn-secondary btn-sm" confirmLabel="Finalizar agora?" disabled={busy} onConfirm={() => move("done", undefined, "Pedido finalizado")}>
                    Finalizar agora
                  </ConfirmButton>
                )}
                {o.status === "queued" && dm && (
                  <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void move("start", undefined, "Divulgação no ar")}>
                    {busy ? <Spinner size={14} /> : <Icon name="arrow-right" size={15} />} Colocar no ar
                  </button>
                )}
                {o.status === "queued" && !dm && (
                  <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void move("done", undefined, "Anúncio marcado como publicado")}>
                    {busy ? <Spinner size={14} /> : <Icon name="check" size={15} />} Marcar como publicado
                  </button>
                )}
              </div>
            </div>
          )}
          {!rejecting && o.status === "queued" && dm && (
            <p className="mt-4 text-xs text-dim">
              Colocar no ar começa a contar os {o.durationDays} dias agora. No fim, o pedido é finalizado sozinho e o comprador recebe um aviso.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

function PackagesModal({ onClose }: { onClose: () => void }) {
  const { data } = useApi<{ promos: (Promo & { active: boolean })[] }>("/admin/promos");
  const [key, setKey] = useState("everyone");
  const promo = data?.promos.find((p) => p.key === key);
  return (
    <Modal open onClose={onClose} size="lg" label="Pacotes de divulgação">
      <h2 className="pr-10 font-display text-xl font-extrabold">Pacotes</h2>
      <p className="mt-1 text-sm text-muted">O valor cobrado vem sempre daqui. Pedidos já pagos não mudam.</p>
      {data ? (
        <>
          <div className="mt-6">
            <FilterTabs label="Pacote" value={key} onChange={setKey} options={data.promos.map((p) => [p.key, p.name] as [string, string])} />
          </div>
          {promo && <PackageForm key={promo.key} promo={promo} />}
        </>
      ) : (
        <div className="skeleton mt-6 h-80" />
      )}
    </Modal>
  );
}

function PackageForm({ promo }: { promo: Promo & { active: boolean } }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: promo.name,
    tagline: promo.tagline,
    price: centsToInput(promo.priceCents),
    durationDays: promo.durationDays,
    perks: promo.perks.join("\n"),
    active: promo.active,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.patch(`/admin/promos/${promo.key}`, {
        name: form.name,
        tagline: form.tagline,
        priceCents: parseBrl(form.price),
        ...(promo.includes.dm ? { durationDays: form.durationDays } : {}),
        perks: form.perks
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        active: form.active,
      });
      toast("Pacote salvo", "success");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_140px_120px]">
        <FormField label="Nome" htmlFor="pk-name">
          <input id="pk-name" className="field" value={form.name} maxLength={48} onChange={(e) => set("name", e.target.value)} />
        </FormField>
        <FormField label="Preço (R$)" htmlFor="pk-price">
          <input id="pk-price" className="field font-mono" inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value.replace(/[^0-9.,]/g, ""))} />
        </FormField>
        {promo.includes.dm ? (
          <FormField label="Dias" htmlFor="pk-days">
            <input id="pk-days" type="number" className="field" min={1} max={365} value={form.durationDays} onChange={(e) => set("durationDays", Number(e.target.value))} />
          </FormField>
        ) : (
          <div>
            <span className="label">Dias</span>
            <p className="field text-dim">1 anúncio</p>
          </div>
        )}
      </div>
      <FormField label="Frase" htmlFor="pk-tagline">
        <input id="pk-tagline" className="field" value={form.tagline} maxLength={80} onChange={(e) => set("tagline", e.target.value)} />
      </FormField>
      <FormField label="Benefícios" hint="um por linha, até 10" htmlFor="pk-perks">
        <textarea id="pk-perks" className="field min-h-32 leading-relaxed" value={form.perks} onChange={(e) => set("perks", e.target.value)} />
      </FormField>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Toggle on={form.active} onChange={(v) => set("active", v)} label="À venda" />
        <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={busy || form.name.trim().length < 2}>
          {busy ? <Spinner size={16} /> : <Icon name="check" size={16} />} Salvar
        </button>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}
