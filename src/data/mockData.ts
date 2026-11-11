import { Product, Ticket } from '../types';

export const PRODUCTS: Product[] = [];

// Clean queue: tickets are only created when an actual user/client submits an enquiry
export const INITIAL_TICKETS: Ticket[] = [];

export const TESTIMONIALS = [
  {
    id: '1',
    name: 'Felipe Santana',
    role: 'Competidor & Streamer',
    quote: 'O ganho de FPS e a estabilidade com o Fiveware Optimizer Pro foram inacreditáveis. O input lag do FiveM caiu pela metade e a fluidez é incomparável.',
    metric: '+120 FPS Estáveis'
  },
  {
    id: '2',
    name: 'Beatriz Vasconcelos',
    role: 'Usuária Fiveware Full Suite',
    quote: 'Com o Fiveware Full Suite VIP, meu computador ficou muito mais rápido e o ping nos servidores nunca mais oscilou. O suporte via chat é super rápido e atencioso.',
    metric: 'Zero perda de pacotes'
  },
  {
    id: '3',
    name: 'Lucas Brandão',
    role: 'Jogador FiveM',
    quote: 'A estética limpa e o foco total em desempenho sem enrolação me conquistaram imediatamente. As ferramentas de limpeza e os otimizadores mudaram o desempenho da minha máquina.',
    metric: 'Ganho imediato de 40% FPS'
  }
];

export const DIFFERENTIATORS = [
  {
    number: '01',
    title: 'Engenharia de Produção Real',
    description: 'Nada de exemplos de brinquedo ("to-do list"). Nossos produtos e formações abordam concorrência real, escalabilidade global, falhas de rede e resiliência corporativa.'
  },
  {
    number: '02',
    title: 'Zero Slop & Código Limpo',
    description: 'Código artesanal, tipagem estrita com TypeScript, arquitetura desacoplada e conformidade absoluta com padrões de alta performance e baixo consumo de memória.'
  },
  {
    number: '03',
    title: 'Boilerplates de Lançamento Imediato',
    description: 'Templates prontos com autenticação, banco de dados, design system dark e gateway de pagamentos para você monetizar suas ideias em questão de horas.'
  },
  {
    number: '04',
    title: 'Ecossistema & Suporte Dedicado',
    description: 'Canal de atendimento direto com engenheiros sêniores, resolução ágil de dúvidas e comunidade exclusiva no Discord para networking de alto calibre.'
  }
];
