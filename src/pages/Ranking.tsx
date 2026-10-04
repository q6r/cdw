import { RankingBoards } from "../components/ranking/RankingBoards";

export default function Ranking() {
  return (
    <div className="container-x pb-20 pt-8 sm:pt-12">
      <div className="max-w-2xl">
        <h1 className="font-display text-[clamp(2rem,4.4vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.035em]">Ranking da CDW</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-muted">
          Tempo em call e mensagens no chat geral, por semana, mês e no total. Todo membro conta.
        </p>
      </div>
      <div className="mt-10">
        <RankingBoards />
      </div>
    </div>
  );
}
