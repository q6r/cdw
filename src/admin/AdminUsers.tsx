import { useState } from "react";
import { Icon } from "../components/Icon";
import { PlanIcon } from "../components/PlanIcon";
import { Avatar, ConfirmButton, EmptyState, Modal, PageHeader, StatusBadge } from "../components/ui";
import { FilterTabs, Pager, SearchBox, TableSkeleton, type Paged } from "./parts";
import { useAuth } from "../lib/auth";
import { api, errorMessage } from "../lib/api";
import { useApi, useCopy, useDebounced, usePlans } from "../lib/hooks";
import { useToast } from "../lib/toast";
import { brl, date, dateTime } from "../lib/format";
import type { DiscordAccount } from "../lib/types";

interface UserRow {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  owner?: boolean;
  banned?: boolean;
  discord: DiscordAccount | null;
  vip: { planKey: string; status: string } | null;
  spentCents: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const term = useDebounced(q);
  const plans = usePlans();
  const toast = useToast();
  const query = new URLSearchParams({ page: String(page), role, q: term }).toString();
  const { data, loading, reload } = useApi<Paged<UserRow> & { canManageAdmins?: boolean }>(`/admin/users?${query}`);
  const canManage = !!data?.canManageAdmins;
  const [reset, setReset] = useState<{ username: string; url: string; expiresAt: string } | null>(null);
  const { copied, copy } = useCopy();

  const resetLink = async (u: UserRow) => {
    try {
      const r = await api.post<{ url: string; expiresAt: string }>(`/admin/users/${u.id}/reset-link`);
      setReset({ username: u.username, ...r });
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };
  const patch = async (id: string, body: Record<string, unknown>, msg: string) => {
    try {
      await api.patch(`/admin/users/${id}`, body);
      toast(msg, "success");
      await reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  return (
    <>
      <PageHeader eyebrow="Administração" title="Usuários" />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          label="Papel"
          options={[
            ["", "Todos"],
            ["admin", "Admins"],
            ["user", "Membros"],
          ]}
          value={role}
          onChange={(v) => {
            setRole(v);
            setPage(1);
          }}
        />
        <SearchBox
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          placeholder="Nome, email ou ID do Discord"
        />
      </div>
      <div className="card overflow-hidden">
        {loading && !data ? (
          <TableSkeleton />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon="users" title="Nenhum usuário encontrado" />
        ) : (
          <>
            <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
              <table className="table-x min-w-[1000px]">
                <thead>
                  <tr>
                    <th scope="col">Usuário</th>
                    <th scope="col">Discord</th>
                    <th scope="col">VIP</th>
                    <th scope="col">Gasto</th>
                    <th scope="col">Cadastro</th>
                    <th scope="col">Último login</th>
                    <th scope="col" className="text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u) => {
                    const plan = u.vip && plans?.find((p) => p.key === u.vip!.planKey);
                    return (
                      <tr key={u.id} className={u.banned ? "opacity-55" : undefined}>
                        <td>
                          <span className="flex items-center gap-3">
                            <Avatar src={u.discord?.avatar} name={u.username} size={30} />
                            <span className="min-w-0">
                              <span className="flex flex-wrap items-center gap-1.5 font-semibold">
                                {u.username}
                                {u.owner ? (
                                  <span className="rounded-[5px] bg-liquid-deep px-1.5 py-0.5 text-[11px] font-bold text-white">dono</span>
                                ) : (
                                  u.role === "admin" && (
                                    <span className="rounded-[5px] bg-liquid-soft px-1.5 py-0.5 text-[11px] font-bold text-liquid-ink">admin</span>
                                  )
                                )}
                                {u.banned && <span className="rounded-[5px] bg-danger-soft px-1.5 py-0.5 text-[11px] font-bold text-danger">banido</span>}
                              </span>
                              <span className="block truncate text-xs text-dim">{u.email}</span>
                            </span>
                          </span>
                        </td>
                        <td className="font-mono text-xs text-muted">
                          {u.discord ? (u.discord.username ? `@${u.discord.username}` : u.discord.id) : "—"}
                        </td>
                        <td>
                          {u.vip && plan ? (
                            <span className="flex items-center gap-2">
                              <PlanIcon name={plan.icon} size={18} hoverOnly />
                              <span className="text-sm">{plan.name}</span>
                              <StatusBadge status={u.vip.status} />
                            </span>
                          ) : (
                            <span className="text-dim">—</span>
                          )}
                        </td>
                        <td className="tabular font-semibold">{brl(u.spentCents)}</td>
                        <td className="whitespace-nowrap text-muted">{date(u.createdAt)}</td>
                        <td className="whitespace-nowrap text-muted">{dateTime(u.lastLoginAt)}</td>
                        <td>
                          {u.id !== me?.id && !u.owner && (
                            <div className="flex justify-end gap-2">
                              {!u.banned && (u.role !== "admin" || canManage) && (
                                <ConfirmButton className="btn btn-secondary btn-sm" confirmLabel="Gerar link?" onConfirm={() => resetLink(u)}>
                                  Link de senha
                                </ConfirmButton>
                              )}
                              {canManage && (
                                <ConfirmButton
                                  className="btn btn-secondary btn-sm"
                                  onConfirm={() =>
                                    patch(u.id, { role: u.role === "admin" ? "user" : "admin" }, u.role === "admin" ? "Admin removido" : "Agora é admin")
                                  }
                                >
                                  {u.role === "admin" ? "Remover admin" : "Tornar admin"}
                                </ConfirmButton>
                              )}
                              {(u.role !== "admin" || canManage) && (
                                <ConfirmButton
                                  className={u.banned ? "btn btn-secondary btn-sm" : "btn btn-danger btn-sm"}
                                  onConfirm={() => patch(u.id, { banned: !u.banned }, u.banned ? "Usuário desbanido" : "Usuário banido")}
                                >
                                  {u.banned ? "Desbanir" : "Banir"}
                                </ConfirmButton>
                              )}
                            </div>
                          )}
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

      <Modal open={!!reset} onClose={() => setReset(null)} label="Link de redefinição de senha">
        {reset && (
          <>
            <h2 className="pr-10 font-display text-xl font-extrabold">Link de senha de {reset.username}</h2>
            <p className="mt-2 text-sm text-muted">
              Mande <strong className="text-ink">só no privado</strong> para a pessoa. Vale até{" "}
              {new Date(reset.expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} e funciona uma vez. Quem abrir o link
              define a senha da conta.
            </p>
            <div className="mt-5 break-all rounded-[10px] border border-silver bg-frost p-3 font-mono text-xs text-ink-2">{reset.url}</div>
            <button type="button" onClick={() => void copy(reset.url)} className="btn btn-primary btn-lg mt-5 w-full">
              <Icon name={copied ? "check" : "copy"} size={17} />
              {copied ? "Copiado" : "Copiar link"}
            </button>
          </>
        )}
      </Modal>
    </>
  );
}
