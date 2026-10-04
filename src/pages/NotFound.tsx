import { Link } from "react-router";
import { Icon } from "../components/Icon";
import { PlanIcon } from "../components/PlanIcon";
import { LiquidWord } from "../components/Liquid";

export default function NotFound() {
  return (
    <div className="container-x grid min-h-[70svh] place-items-center py-16 text-center">
      <div>
        <PlanIcon name="ghost" size={84} className="mx-auto" />
        <p className="mt-4 font-display text-[clamp(5rem,20vw,10rem)] font-extrabold leading-none tracking-[-0.06em]" aria-hidden="true">
          <LiquidWord>404</LiquidWord>
        </p>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">Essa página sumiu do servidor.</h1>
        <p className="mt-2 text-muted">O endereço pode ter mudado. Os planos e a divulgação continuam aqui.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn btn-primary">
            <Icon name="arrow-left" size={16} /> Voltar ao início
          </Link>
          <Link to="/planos" className="btn btn-secondary">
            Ver planos
          </Link>
        </div>
      </div>
    </div>
  );
}
