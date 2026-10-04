import { useState } from "react";
import { Icon, Spinner } from "../components/Icon";
import { PlanIcon } from "../components/PlanIcon";
import { EmptyState, PageHeader, StatusBadge } from "../components/ui";
import { FilterTabs, Pager, SearchBox, TableSkeleton, UserCell, type AdminUser, type Paged } from "./parts";
import { api, errorMessage } from "../lib/api";
import { useApi, useDebounced, usePlans } from "../lib/hooks";
import { useToast } from "../lib/toast";
import { KIND_LABEL, brl, dateTime } from "../lib/format";
import type { PaymentKind } from "../lib/types";

interface OrderRow {
  id: string;
  user: AdminUser;
  planKey: string;
  planName: string;
  kind: PaymentKind;
  amountCents: number;
  status: string;
  error: string | null;
  createdAt: string;
  paidAt: string | null;
  pagciId: string | null;
}

const STATUS: [string, string][] = [
  ["", "Todos"],
  ["paid", "Pagos"],
  ["pending", "Aguardando"],
  ["expired", "Expirados"],
  ["failed", "Falhou"],
  ["cancelled", "Cancelados"],
  ["refunded", "Reembolsados"],
];

export default function AdminOrders() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const term = useDebounced(q);
  const plans = usePlans();
  const toast = useToast();
  const [syncing, setSyncing] = useState<string | null>(null);
  const query = new URLSearchParams({ page: String(page), status, q: term }).toString();
  const { data, loading, reload } = useApi<Paged<OrderRow>>(`/admin/payments?${query}`);
  const iconOf = (key: string) => plans?.find((p) => p.key === key)?.icon ?? "star";

  const sync = async (id: string) => {
    setSyncing(id);
    try {
      const r = await api.post<{ payment: { status: string } }>(`/admin/payments/${id}/sync`);
      toast(`Status: ${r.payment.status}`, "success");
      await reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSyncing(null);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Administração" title="Pedidos">
        Todos os Pix gerados. “Sincronizar” consulta o status direto na Pagci.
      </PageHeader>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          label="Status"
          options={STATUS}
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
          placeholder="Usuário, email, Discord ou ID"
        />
      </div>
      <div className="card overflow-hidden">
        {loading && !data ? (
          <TableSkeleton />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon="receipt" title="Nenhum pedido encontrado" />
        ) : (
          <>
            <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
              <table className="table-x min-w-[920px]">
                <thead>
                  <tr>
                    <th scope="col">Usuário</th>
                    <th scope="col">Plano</th>
                    <th scope="col">Valor</th>
                    <th scope="col">Status</th>
                    <th scope="col">Criado</th>
                    <th scope="col">Pago</th>
                    <th scope="col">Pagci</th>
                    <th scope="col">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((o) => (
                    <tr key={o.id}>
                      <td className="max-w-[220px]">
                        <UserCell user={o.user} />
                      </td>
                      <td>
                        <span className="flex items-center gap-2">
                          <PlanIcon name={iconOf(o.planKey)} size={20} hoverOnly />
                          <span>
                            <span className="block font-medium">{o.planName}</span>
                            <span className="block text-xs text-dim">{KIND_LABEL[o.kind] ?? o.kind}</span>
                          </span>
                        </span>
                      </td>
                      <td className="tabular font-semibold">{brl(o.amountCents)}</td>
                      <td>
                        <StatusBadge status={o.status} />
                        {o.error && (
                          <span className="mt-1 block max-w-[180px] truncate text-xs text-danger" title={o.error}>
                            {o.error}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-muted">{dateTime(o.createdAt)}</td>
                      <td className="whitespace-nowrap text-muted">{dateTime(o.paidAt)}</td>
                      <td className="max-w-[140px] truncate font-mono text-xs text-dim" title={o.pagciId ?? ""}>
                        {o.pagciId ?? "—"}
                      </td>
                      <td className="text-right">
                        {o.status !== "paid" && o.pagciId && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => void sync(o.id)}
                            disabled={syncing === o.id}
                            title="Consultar na Pagci"
                          >
                            {syncing === o.id ? <Spinner size={14} /> : <Icon name="refresh" size={14} />}
                            Sincronizar
                          </button>
                        )}
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
    </>
  );
}
