import { AnimatePresence, motion } from "motion/react";
import { Avatar, ConfirmButton, EmptyState, PageHeader, Skeleton } from "../components/ui";
import { TagPill } from "../components/tag/TagParts";
import { DiscordLinkCard } from "./DiscordLinkCard";
import { useAuth } from "../lib/auth";
import { api, errorMessage } from "../lib/api";
import { useApi } from "../lib/hooks";
import { useToast } from "../lib/toast";
import type { TagIcon } from "../lib/types";

interface ReceivedTag {
  vipId: string;
  tag: { name: string; color: string; icon: TagIcon | null };
  owner: { username: string; avatar: string | null };
}

export default function Received() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, setData, loading } = useApi<{ tags: ReceivedTag[] }>(user?.discord ? "/vip/received" : null);
  const tags = data?.tags ?? [];

  return (
    <>
      <PageHeader eyebrow="Loja" title="Tags recebidas">
        Tags que outros VIPs te deram. Você pode sair de qualquer uma.
      </PageHeader>
      {!user?.discord ? (
        <DiscordLinkCard text="Vincule seu Discord para ver as tags que te deram." />
      ) : loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 rounded-[14px]" />
          <Skeleton className="h-28 rounded-[14px]" />
        </div>
      ) : tags.length === 0 ? (
        <div className="card">
          <EmptyState icon="tag" title="Nenhuma tag ainda">
            Quando um VIP te der a tag dele, ela aparece aqui.
          </EmptyState>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence>
            {tags.map((t) => (
              <motion.div key={t.vipId} layout exit={{ opacity: 0, scale: 0.97 }} className="card p-5">
                <TagPill name={t.tag.name} color={t.tag.color} icon={t.tag.icon} />
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-muted">
                    <Avatar src={t.owner.avatar} name={t.owner.username} size={24} />
                    <span className="truncate">de {t.owner.username}</span>
                  </span>
                  <ConfirmButton
                    confirmLabel="Sair mesmo?"
                    className="btn btn-secondary btn-sm"
                    onConfirm={async () => {
                      try {
                        await api.del(`/vip/received/${t.vipId}`);
                        setData({ tags: tags.filter((x) => x.vipId !== t.vipId) });
                        toast("Você saiu da tag", "success");
                      } catch (e) {
                        toast(errorMessage(e), "error");
                      }
                    }}
                  >
                    Sair da tag
                  </ConfirmButton>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
