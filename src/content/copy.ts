// Textos reais da loja, mantidos do front anterior.

export const HOME_FAQ: [string, string][] = [
  [
    "Em quanto tempo recebo meu VIP?",
    "Na hora. Assim que o Pix é confirmado, o bot te dá o cargo, cria sua tag e sua call. A tela de pagamento atualiza sozinha.",
  ],
  [
    "Por que preciso vincular meu Discord?",
    "Para o bot saber em quem aplicar o VIP e evitar fraude. Você informa seu ID e confirma com um código que chega na sua DM.",
  ],
  ["Posso mudar a cor, o nome e o ícone depois?", "Quantas vezes quiser enquanto o VIP estiver ativo, direto no painel."],
  [
    "O que acontece quando o VIP vence?",
    "O bot te avisa na DM antes de vencer. Depois do vencimento você tem 3 dias de carência para renovar, com tudo funcionando. Se não renovar, o VIP, o cargo e a call são removidos.",
  ],
  [
    "Dá para configurar pelo Discord?",
    "Dá. Mande cd!vip no servidor e o bot abre um painel com botões para mudar nome, cor, ícone, dar a tag e cuidar da sua call.",
  ],
  ["Posso trocar de plano?", "Pode. Os dias do plano novo entram somados ao tempo que você ainda tem."],
  [
    "O pagamento é seguro?",
    "O Pix é gerado e confirmado pelo nosso provedor de pagamentos. O site nunca vê nem guarda seus dados bancários.",
  ],
];

export const PROMO_FAQ: [string, string][] = [
  [
    "Preciso vincular meu Discord?",
    "Não. Basta ter uma conta no site. Com o Discord vinculado, você recebe os avisos do pedido na DM.",
  ],
  [
    "Quando a divulgação vai ao ar?",
    "Depois que o Pix é confirmado, o pedido entra na fila da staff, que publica por ordem de chegada. Você acompanha tudo em Minhas divulgações.",
  ],
  [
    "Como funciona a mensagem no privado?",
    "Durante o período do pacote, quem entra na CDW recebe a sua mensagem com o seu link. Chegam de 800 a 1.000 pessoas novas por dia.",
  ],
  [
    "O que posso divulgar?",
    "Servidores do Discord, projetos, lojas e perfis com link https. Golpes, conteúdo adulto, discurso de ódio e o que for contra as regras do Discord são recusados.",
  ],
  ["E se o meu pedido for recusado?", "A staff explica o motivo e combina o reembolso com você."],
  ["Posso mudar o texto depois de pagar?", "Enquanto o pedido está na fila, sim. Chame a staff no servidor."],
];

export const HOW_IT_WORKS = [
  {
    title: "Crie sua conta e vincule o Discord",
    text: "O bot manda um código na sua DM para confirmar que o Discord é seu. Leva menos de um minuto.",
  },
  {
    title: "Escolha o VIP e pague no Pix",
    text: "Escaneie o QR code ou use o copia e cola. A confirmação é automática e a tela atualiza sozinha.",
  },
  {
    title: "Deixe com a sua cara",
    text: "Nome da tag, cor HEX, ícone e sua call privada. Dá para mudar quantas vezes quiser pelo site ou pelo cd!vip.",
  },
];

export const PROMO_STEPS = [
  {
    title: "Escolha e escreva",
    text: "Cole o seu link, escreva a mensagem e veja na hora como ela vai aparecer no Discord.",
  },
  {
    title: "Pague no Pix",
    text: "O QR code vale por 30 minutos e a confirmação é automática. Não precisa mandar comprovante.",
  },
  {
    title: "A staff coloca no ar",
    text: "Seu pedido entra na fila. Com o Discord vinculado, você recebe um aviso na DM quando começar e quando terminar.",
  },
];

/** Exemplo de divulgação usado na página de pacotes (já existia no site). */
export const PROMO_EXAMPLE = {
  link: "https://discord.gg/cidadealta",
  channel: "A temporada 3 da Cidade Alta abriu hoje. Mapa novo, staff ativa e evento de estreia no sábado às 20h.",
  dm: "Oi! Você acabou de entrar na CDW. Conhece a Cidade Alta? Temporada nova aberta hoje, vem jogar com a gente.",
  invite: {
    status: "ok" as const,
    info: {
      code: "cidadealta",
      guild: { id: "0", name: "Cidade Alta RP", iconUrl: null, bannerUrl: null },
      members: 8930,
      online: 1204,
    },
  },
};

export const SUPPORT_LINE = "Não achou? Chama a staff no servidor.";
