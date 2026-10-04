import { Link } from "react-router";
import { Icon } from "../components/Icon";
import { PlanIcon } from "../components/PlanIcon";
import { EmptyState, PageHeader, Skeleton, StatusBadge } from "../components/ui";
import { useApi, usePlans } from "../lib/hooks";
import { KIND_LABEL, brl, dateTime } from "../lib/format";
import type { PaymentRow } from "../lib/types";

const isPromo = (p: PaymentRow) => p.productType === "promo";

export default function Payments() {
  const { data, loading, error, reload } = useApi<{ payments: PaymentRow[] }>("/payments/mine");
  const plans = usePlans();
  const iconOf = (p: PaymentRow) => plans?.find((x) => x.key === p.planKey)?.icon ?? "star";
  const rows = data?.payments ?? [];
  const pending = rows.filter((r) => r.status === "pending");

  const resume = (p: PaymentRow) => (isPromo(p) ? `/painel/divulgacao/${p.promoKey}` : `/painel/comprar/${p.planKey}`);

  return (
    <>
      <PageHeader eyebrow="Loja" title="Minhas compras">
        A confirmação é automática: você não precisa enviar comprovante.
      </PageHeader>

      {pending.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-warn/30 bg-warn-soft px-5 py-4">
          <p className="flex items-center gap-3 text-sm font-semibold text-warn">
            <Icon name="clock" size={19} />
            {pending.length === 1 ? "Você tem um Pix esperando pagamento." : `Você tem ${pending.length} Pix esperando pagamento.`}
          </p>
          <Link to={resume(pending[0])} className="btn btn-primary btn-sm">
            Continuar pagamento <Icon name="arrow-right" size={15} />
          </Link>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading && !data ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon="alert" title="Não foi possível carregar suas compras">
            {error}
            <div className="mt-5">
              <button type="button" className="btn btn-secondary" onClick={() => void reload()}>
                <Icon name="refresh" size={16} /> Tentar de novo
              </button>
            </div>
          </EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState icon="receipt" title="Nenhuma compra ainda">
            Quando você comprar um VIP ou uma divulgação, ela aparece aqui.
            <div className="mt-6">
              <Link to="/painel/planos" className="btn btn-primary">
                Ver planos
              </Link>
            </div>
          </EmptyState>
        ) : (
          <>
            {/* Celular: lista em cartões */}
            <ul className="divide-y divide-silver md:hidden">
              {rows.map((p) => (
                <li key={p.id} className="flex items-start gap-3 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-silver bg-frost">
                    {isPromo(p) ? <Icon name="megaphone" size={19} className="text-liquid-deep" /> : <PlanIcon name={iconOf(p)} size={26} hoverOnly />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold">{p.planName}</p>
                      <span className="tabular shrink-0 font-semibold">{brl(p.amountCents)}</span>
                    </div>
                    <p className="text-[13px] text-muted">
                      {isPromo(p) ? "Divulgação" : KIND_LABEL[p.kind]} · {dateTime(p.paidAt ?? p.createdAt)}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <StatusBadge status={p.status} />
                      {p.status === "pending" && (
                        <Link to={resume(p)} className="btn btn-primary btn-sm">
                          Pagar
                        </Link>
                      )}
                      {isPromo(p) && p.status === "paid" && (
                        <Link to="/painel/divulgacoes" className="btn btn-secondary btn-sm">
                          Ver status
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {/* Computador: tabela */}
            <div className="hidden overflow-x-auto md:block">
              <table className="table-x">
                <thead>
                  <tr>
                    <th scope="col">Produto</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Valor</th>
                    <th scope="col">Status</th>
                    <th scope="col">Data</th>
                    <th scope="col">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="flex items-center gap-3 font-semibold">
                          {isPromo(p) ? (
                            <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-liquid-soft text-liquid-deep">
                              <Icon name="megaphone" size={15} />
                            </span>
                          ) : (
                            <PlanIcon name={iconOf(p)} size={26} hoverOnly />
                          )}
                          {p.planName}
                        </span>
                      </td>
                      <td className="text-muted">{isPromo(p) ? "Divulgação" : KIND_LABEL[p.kind]}</td>
                      <td className="tabular font-semibold">{brl(p.amountCents)}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="whitespace-nowrap text-muted">{dateTime(p.paidAt ?? p.createdAt)}</td>
                      <td className="text-right">
                        {p.status === "pending" && (
                          <Link to={resume(p)} className="btn btn-primary btn-sm">
                            Pagar
                          </Link>
                        )}
                        {isPromo(p) && p.status === "paid" && (
                          <Link to="/painel/divulgacoes" className="btn btn-secondary btn-sm">
                            Ver status
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
