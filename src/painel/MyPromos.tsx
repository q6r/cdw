import { Link } from "react-router";
import { Icon } from "../components/Icon";
import { EmptyState, PageHeader, Skeleton, StatusBadge } from "../components/ui";
import { useApi } from "../lib/hooks";
import { brl, date } from "../lib/format";
import type { PromoOrder } from "../lib/types";

function statusText(o: PromoOrder) {
  switch (o.status) {
    case "awaiting_payment":
      return "Pix aberto. Pague para entrar na fila.";
    case "queued":
      return "Pago. A staff vai colocar no ar por ordem de chegada.";
    case "running":
      return o.endsAt ? `No ar até ${date(o.endsAt)}.` : "No ar.";
    case "done":
      return o.doneAt ? `Finalizada em ${date(o.doneAt)}.` : "Finalizada.";
    case "rejected":
      return o.rejectReason ? `Recusada: ${o.rejectReason}` : "Recusada pela staff.";
  }
}

export default function MyPromos() {
  const { data, loading } = useApi<{ orders: PromoOrder[] }>("/promos/orders/mine");
  const orders = data?.orders ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Loja"
        title="Minhas divulgações"
        actions={
          <Link to="/divulgacoes" className="btn btn-secondary btn-sm">
            Ver pacotes <Icon name="arrow-right" size={15} />
          </Link>
        }
      >
        Acompanhe seus pedidos. A staff coloca no ar à mão, por ordem de chegada.
      </PageHeader>
      {loading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-[14px]" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card">
          <EmptyState icon="message" title="Nenhuma divulgação ainda">
            Quando você comprar um pacote, ele aparece aqui com o status.
            <div className="mt-6">
              <Link to="/divulgacoes" className="btn btn-primary">
                Ver pacotes
              </Link>
            </div>
          </EmptyState>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-liquid-soft text-liquid-deep">
                    <Icon name="megaphone" size={19} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{o.promoName}</h2>
                    <p className="text-[13px] text-dim">
                      {brl(o.amountCents)} · pedido de {date(o.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={o.status} />
                  {o.pixOpen && (
                    <Link to={`/painel/divulgacao/${o.promoKey}`} className="btn btn-primary btn-sm">
                      Pagar
                    </Link>
                  )}
                </div>
              </div>
              <p className="mt-4 text-sm text-ink-2">{statusText(o)}</p>
              <div className="mt-4 rounded-[12px] border border-silver bg-frost px-4 py-3 text-sm">
                <p className="line-clamp-3 whitespace-pre-wrap break-words text-ink-2">{o.message}</p>
                <p className="mt-2 truncate font-mono text-xs text-liquid-ink">{o.link}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
