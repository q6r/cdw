import { Link } from "react-router";
import { BrandMark } from "../Brand";
import { PixLogo } from "../Icon";
import { useAuth } from "../../lib/auth";
import { categoryHref } from "../../lib/catalog";

// Só links que existem de verdade na loja: ela não tem páginas de política
// nem canal de contato próprio; o suporte é a staff no servidor.
export function SiteFooter() {
  const { user } = useAuth();
  const account: [string, string][] = user
    ? [
        ["/painel", "Meu painel"],
        ["/painel/pagamentos", "Minhas compras"],
        ["/painel/divulgacoes", "Minhas divulgações"],
        ["/painel/perfil", "Meu perfil"],
      ]
    : [
        ["/entrar", "Entrar"],
        ["/criar-conta", "Criar conta"],
        ["/esqueci-senha", "Esqueci minha senha"],
      ];

  const cols: [string, [string, string][]][] = [
    [
      "Loja",
      [
        ["/planos", "Todos os planos"],
        [categoryHref("dono"), "Cargos de dono"],
        [categoryHref("vip"), "VIPs"],
        ["/divulgacoes", "Divulgação"],
      ],
    ],
    [
      "Ajuda",
      [
        ["/#como-funciona", "Como funciona"],
        ["/#personalize", "Teste sua tag"],
        ["/#faq", "Dúvidas"],
        ["/ranking", "Ranking"],
      ],
    ],
    ["Sua conta", account],
  ];

  return (
    <footer className="relative z-10 mt-auto border-t border-silver bg-porcelain">
      <div className="container-x grid gap-10 py-12 sm:py-14 lg:grid-cols-[1.2fr_2fr]">
        <div className="max-w-sm">
          <BrandMark />
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            VIP da CDW com tag, cor, ícone e call própria. Ativado na hora pelo Pix.
          </p>
          <p className="mt-4 text-sm text-ink-2">
            Dúvidas sobre um pedido? <span className="font-semibold">Chame a staff no servidor da CDW.</span>
          </p>
        </div>
        <nav aria-label="Rodapé" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {cols.map(([title, links]) => (
            <div key={title}>
              <p className="eyebrow mb-3">{title}</p>
              <ul className="space-y-1">
                {links.map(([to, label]) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="inline-flex min-h-[36px] items-center text-[15px] text-ink-2 transition-colors hover:text-liquid-ink"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-silver">
        <div className="container-x flex flex-col gap-2 py-5 text-[13px] text-dim sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} CDW · cdwloja.com</span>
          <span className="inline-flex items-center gap-2">
            <PixLogo size={16} /> Pagamentos via Pix
          </span>
        </div>
      </div>
    </footer>
  );
}
