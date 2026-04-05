import {
  ArrowRight,
  Boxes,
  LayoutDashboard,
  ShieldCheck,
  Store,
  TimerReset,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import RevendaShell from './RevendaShell';
import './revendedores.css';

const benefits = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard completo',
    description:
      'Um centro de controlo para acompanhar o negócio com mais clareza e menos improviso.',
  },
  {
    icon: Boxes,
    title: '12.000+ produtos organizados',
    description:
      'Categorias, marcas e variedade para vender de forma mais estratégica e profissional.',
  },
  {
    icon: Store,
    title: 'Catálogo digital personalizado',
    description:
      'A sua própria loja digital para partilhar, vender e ganhar presença sem construir tudo do zero.',
  },
  {
    icon: ShieldCheck,
    title: 'Controlo sobre preços e lucro',
    description:
      'Decide o que vender, por quanto vender e vê o potencial de rendimento com mais transparência.',
  },
  {
    icon: TimerReset,
    title: 'Sem stock, sem logística, sem burocracia',
    description:
      'A operação foi desenhada para poupar tempo e libertar energia para a parte que realmente gera vendas.',
  },
  {
    icon: Users,
    title: 'Acompanhamento contínuo',
    description:
      'Chamadas semanais, apoio de vendas, materiais e orientação prática para não caminhar sozinha.',
  },
];

export default function Beneficios() {
  return (
    <RevendaShell ctaTo="/pagamento" ctaLabel="Começar o negócio">
      <section className="sales-section sales-top-section">
        <div className="sales-container sales-section-heading" data-reveal="up">
          <span className="sales-section-label">O que torna isto diferente</span>
          <h1 className="sales-section-title">
            Não está a comprar uma oportunidade vaga. Está a entrar num sistema de negócio real.
          </h1>
          <p className="sales-text section-center">
            A força da proposta está em juntar estrutura, variedade, simplicidade e suporte num único
            ponto de partida.
          </p>
        </div>
      </section>

      <section className="sales-section sales-section-soft">
        <div className="sales-container">
          <div className="sales-card-grid">
            {benefits.map(({ icon: Icon, title, description }, index) => (
              <article
                key={title}
                className="sales-feature-card"
                data-reveal="up"
                style={{ '--reveal-delay': `${0.04 + index * 0.07}s` }}
              >
                <span className="sales-feature-icon">
                  <Icon size={22} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sales-section">
        <div className="sales-container">
          <div className="sales-offer-card">
            <div className="sales-offer-copy" data-reveal="left">
              <span className="sales-section-label">Em resumo</span>
              <h2 className="sales-section-title">
                Vende com liberdade, mas sem carregar o peso de gerir tudo.
              </h2>
              <p className="sales-text">
                O sistema foi pensado para quem quer rendimento extra, flexibilidade e independência,
                mas com um caminho credível, elegante e possível de seguir.
              </p>
            </div>

            <div className="sales-price-card" data-reveal="right" style={{ '--reveal-delay': '0.08s' }}>
              <span className="sales-price-label">Próximo passo</span>
              <strong className="sales-price-value">29€</strong>
              <p>Um valor simples para começar com a estrutura pronta e entrar em ação.</p>
              <Link to="/pagamento" className="sales-button primary full-width">
                Começar o meu negócio LYRA
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </RevendaShell>
  );
}
