import { Link } from "react-router";
import { Icon } from "../components/Icon";
import { PlanIcon } from "../components/PlanIcon";
import { PageHeader, StatusBadge } from "../components/ui";
import { ColumnChart, ShareBar, StatTile, TableSkeleton, UserCell, type AdminUser } from "./parts";
import { useApi, usePlans } from "../lib/hooks";
import { brl, dateTime, int } from "../lib/format";

interface Overview {
  revenueTotal: number;
  revenue30d: number;
  paidCount: number;
  pending: number;
  activeVips: number;
  users: number;
  daily: { day: string; revenue: number; count: number }[];
  byPlan: { planKey: string; name: string; count: number; revenue: number }[];
  recent: { id: string; user: AdminUser; planKey: string; planName: string; amountCents: number; status: string; createdAt: string }[];
}

const shortDay = (d: string) => {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
};

export default function AdminOverview() {
  const { data, loading, reload } = useApi<Overview>("/admin/overview");
  const plans = usePlans();
  const iconOf = (key: string) => plans?.find((p) => p.key === key)?.icon ?? "star";

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Visão geral"
        actions={
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void reload()}>
            <Icon name="refresh" size={16} /> Atualizar
          </button>
        }
      >
        Vendas, VIPs e usuários da CDW.
      </PageHeader>

      {loading && !data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-32 rounded-[14px]" />
          ))}
        </div>
      ) : !data ? (
        <div className="card">
          <TableSkeleton rows={3} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatTile label="Receita total" value={brl(data.revenueTotal)} icon="wallet" accent />
            <StatTile label="Receita 30 dias" value={brl(data.revenue30d)} icon="chart" />
            <StatTile label="Pedidos pagos" value={int(data.paidCount)} icon="receipt" />
            <StatTile label="Pix aguardando" value={int(data.pending)} icon="clock" />
            <StatTile label="VIPs ativos" value={int(data.activeVips)} icon="crown" />
            <StatTile label="Usuários" value={int(data.users)} icon="users" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="card min-w-0 p-5 sm:p-6" aria-labelledby="ov-daily">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="ov-daily" className="font-display text-base font-extrabold">
                  Receita por dia
                </h2>
                <span className="text-xs font-semibold text-dim">últimos 14 dias</span>
              </div>
              <p className="mb-5 mt-1 text-sm text-muted">{brl(data.daily.reduce((s, d) => s + d.revenue, 0))} no período</p>
              <ColumnChart
                caption="Receita por dia nos últimos 14 dias"
                points={data.daily.map((d) => ({
                  key: d.day,
                  label: shortDay(d.day),
                  fullLabel: new Date(`${d.day}T12:00:00`).toLocaleDateString("pt-BR"),
                  value: d.revenue,
                  count: d.count,
                }))}
              />
            </section>
            <section className="card p-5 sm:p-6" aria-labelledby="ov-plan">
              <h2 id="ov-plan" className="mb-5 font-display text-base font-extrabold">
                Vendas por plano
              </h2>
              <ul className="space-y-4">
                {[...data.byPlan]
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((p) => {
                    const max = Math.max(1, ...data.byPlan.map((x) => x.revenue));
                    return (
                      <li key={p.planKey}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                          <span className="flex items-center gap-2 font-medium">
                            <PlanIcon name={iconOf(p.planKey)} size={20} hoverOnly />
                            {p.name}
                          </span>
                          <span className="tabular text-xs text-muted">
                            {p.count} · {brl(p.revenue)}
                          </span>
                        </div>
                        <ShareBar value={p.revenue / max} />
                      </li>
                    );
                  })}
                {data.byPlan.length === 0 && <li className="text-sm text-dim">Nenhuma venda ainda.</li>}
              </ul>
            </section>
          </div>

          <section className="card overflow-hidden" aria-labelledby="ov-recent">
            <div className="flex items-center justify-between px-5 py-4 sm:px-6">
              <h2 id="ov-recent" className="font-display text-base font-extrabold">
                Pedidos recentes
              </h2>
              <Link to="/admin/pedidos" className="link text-sm">
                Ver todos
              </Link>
            </div>
            {data.recent.length === 0 ? (
              <p className="px-6 pb-8 text-sm text-dim">Nenhum pedido ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-x min-w-[680px]">
                  <thead>
                    <tr>
                      <th scope="col">Usuário</th>
                      <th scope="col">Plano</th>
                      <th scope="col">Valor</th>
                      <th scope="col">Status</th>
                      <th scope="col">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((r) => (
                      <tr key={r.id}>
                        <td className="max-w-[240px]">
                          <UserCell user={r.user} />
                        </td>
                        <td>
                          <span className="flex items-center gap-2">
                            <PlanIcon name={iconOf(r.planKey)} size={20} hoverOnly />
                            {r.planName}
                          </span>
                        </td>
                        <td className="tabular font-semibold">{brl(r.amountCents)}</td>
                        <td>
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="whitespace-nowrap text-muted">{dateTime(r.createdAt)}</td>
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
