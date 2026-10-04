import { PageHeader } from "../components/ui";
import { RankingBoards } from "../components/ranking/RankingBoards";

export default function RankingPage() {
  return (
    <>
      <PageHeader eyebrow="Comunidade" title="Ranking">
        Os mais ativos da CDW em call e no chat geral.
      </PageHeader>
      <RankingBoards />
    </>
  );
}
