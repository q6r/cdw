import { Link } from "react-router";
import { Icon } from "../Icon";

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Você está em" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-dim">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <Icon name="chevron-right" size={14} className="text-silver-strong" />}
            {it.to ? (
              <Link to={it.to} className="rounded-[4px] font-medium text-muted transition-colors hover:text-liquid-ink">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold text-ink">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
