import { useState } from "react";
import { EmptyState, PageHeader } from "../components/ui";
import { ColumnChart, FilterTabs, ShareBar, StatTile, TableSkeleton, UserCell, type AdminUser } from "./parts";
import { useApi } from "../lib/hooks";
import { brl, dateTime, int } from "../lib/format";

type Group = "vip" | "owner" | "promo";
interface Revenue {
  total: number;
  count: number;
  avgTicket: number;
  bucket: "day" | "month";
  series: { key: string; revenue: number; count: number }[];
  groups: Record<Group, { revenue: number; count: number }>;
  recent: { id: string; user: AdminUser; name: string; group: Group; amountCents: number; paidAt: string }[];
}

const GROUPS: [Group, string][] = [
  ["vip", "VIP"],
  ["owner", "Cargo de dono"],
  ["promo", "Divulgação"],
];
const GROUP_LABEL = Object.fromEntries(GROUPS) as Record<Group, string>;
const RANGE: Record<string, string> = {
  "7": "nos últimos 7 dias",
  "30": "nos últimos 30 dias",
  "90": "nos últimos 90 dias",
  all: "desde o início",
};
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const shortLabel = (key: string, bucket: Revenue["bucket"]) => {
  const [y, m, d] = key.split("-");
  return bucket === "month" ? `${MONTHS[Number(m) - 1]}/${y.slice(2)}` : `${d}/${m}`;
};
const longLabel = (key: string, bucket: Revenue["bucket"]) => {
  const [y, m, d] = key.split("-");
  return bucket === "month" ? `${MONTHS[Number(m) - 1]} de ${y}` : `${d}/${m}/${y}`;
};

export default function AdminRevenue() {
  const [days, setDays] = useState("30");
  const { data, loading } = useApi<Revenue>(`/admin/revenue?days=${days}`);

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Receita"
        actions={
          <FilterTabs
            label="Período"
            value={days}
            onChange={setDays}
            options={[
              ["7", "7 dias"],
              ["30", "30 dias"],
              ["90", "90 dias"],
              ["all", "Tudo"],
            ]}
          />
        }
      >
        Tudo o que entrou pelo Pix {RANGE[days]}. Só pagamentos confirmados.
      </PageHeader>

      {loading && !data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="skeleton h-28 rounded-[14px]" />
            ))}
          </div>
          <div className="skeleton h-80 rounded-[14px]" />
        </div>
      ) : !data ? (
        <div className="card">
          <TableSkeleton rows={3} />
        </div>
      ) : (
        <div className={`space-y-6 transition-opacity duration-300 ${loading ? "opacity-60" : ""}`}>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile label="Recebido" value={brl(data.total)} icon="wallet" accent />
            <StatTile label="Pedidos pagos" value={int(data.count)} icon="receipt" />
            <StatTile label="Ticket médio" value={brl(data.avgTicket)} icon="chart" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
            <section className="card min-w-0 p-5 sm:p-6" aria-labelledby="rev-chart">
              <h2 id="rev-chart" className="font-display text-base font-extrabold">
                Recebido por {data.bucket === "month" ? "mês" : "dia"}
              </h2>
              <p className="mb-5 mt-1 text-sm text-muted">
                {brl(data.total)} {RANGE[days]}
              </p>
              {data.total === 0 ? (
                <div className="grid h-[220px] place-items-center rounded-[12px] border border-dashed border-silver-strong text-sm text-dim">
                  Nenhuma venda no período
                </div>
              ) : (
                <ColumnChart
                  caption={`Recebido por ${data.bucket === "month" ? "mês" : "dia"} ${RANGE[days]}`}
                  points={data.series.map((s) => ({
                    key: s.key,
                    label: shortLabel(s.key, data.bucket),
                    fullLabel: longLabel(s.key, data.bucket),
                    value: s.revenue,
                    count: s.count,
                  }))}
                />
              )}
            </section>
            <section className="card p-5 sm:p-6" aria-labelledby="rev-groups">
              <h2 id="rev-groups" className="font-display text-base font-extrabold">
                Por produto
              </h2>
              <p className="mb-5 mt-1 text-sm text-muted">Quanto cada tipo de compra trouxe.</p>
              <ul className="space-y-5">
                {GROUPS.map(([key, label]) => {
                  const g = data.groups[key];
                  const share = data.total ? g.revenue / data.total : 0;
                  return (
                    <li key={key}>
                      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium">{label}</span>
                        <span className="tabular text-xs font-semibold text-muted">{Math.round(share * 100)}%</span>
                      </div>
                      <ShareBar value={share} />
                      <div className="mt-2 flex justify-between text-xs text-dim">
                        <span>
                          {g.count} {g.count === 1 ? "pedido" : "pedidos"}
                        </span>
                        <span className="tabular font-semibold text-ink-2">{brl(g.revenue)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <section className="card overflow-hidden" aria-labelledby="rev-recent">
            <div className="px-5 py-4 sm:px-6">
              <h2 id="rev-recent" className="font-display text-base font-extrabold">
                Pagamentos recentes
              </h2>
              <p className="mt-1 text-sm text-muted">Os últimos confirmados no período.</p>
            </div>
            {data.recent.length === 0 ? (
              <EmptyState icon="receipt" title="Nenhum pagamento no período" />
            ) : (
              <div className="overflow-x-auto">
                <table className="table-x min-w-[640px]">
                  <thead>
                    <tr>
                      <th scope="col">Comprador</th>
                      <th scope="col">Produto</th>
                      <th scope="col">Valor</th>
                      <th scope="col">Pago em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((r) => (
                      <tr key={r.id}>
                        <td className="max-w-[240px]">
                          <UserCell user={r.user} />
                        </td>
                        <td>
                          <span className="block font-medium">{r.name}</span>
                          <span className="block text-xs text-dim">{GROUP_LABEL[r.group]}</span>
                        </td>
                        <td className="tabular font-semibold">{brl(r.amountCents)}</td>
                        <td className="whitespace-nowrap text-muted">{dateTime(r.paidAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
