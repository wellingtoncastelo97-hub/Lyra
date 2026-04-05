import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  LayoutDashboard,
  Megaphone,
  Store,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import showcaseImage from '../../../pagina de venda renda extra - Cópia/images/products-lifestyle.png';
import RevendaShell from './RevendaShell';
import './revendedores.css';

const steps = [
  {
    icon: LayoutDashboard,
    title: '1. Entra no dashboard',
    description:
      'Começa com um painel completo para gerir o seu negócio, acompanhar produtos e ter visão clara da operação.',
  },
  {
    icon: Boxes,
    title: '2. Escolhe o que vender',
    description:
      'Seleciona entre mais de 12.000 produtos, organizados por categoria e marca, e define o preço que quer praticar.',
  },
  {
    icon: Store,
    title: '3. Partilha o seu catálogo digital',
    description:
      'Recebe a sua montra digital personalizada para divulgar os produtos de forma simples e profissional.',
  },
  {
    icon: Megaphone,
    title: '4. Faz vendas e gera lucro',
    description:
      'Enquanto promove e vende, a LYRA trata de logística, expedição e operação por trás do sistema.',
  },
];

export default function ComoFunciona() {
  return (
    <RevendaShell ctaTo="/pagamento" ctaLabel="Começar o negócio">
      <section className="sales-section sales-top-section">
        <div className="sales-container sales-grid sales-grid-balanced">
          <div className="sales-content-card" data-reveal="left">
            <span className="sales-section-label">Como funciona</span>
            <h1 className="sales-section-title">
              Um sistema simples o suficiente para começar hoje e sólido o suficiente para crescer
            </h1>
            <p className="sales-text">
              O objetivo da LYRA é tirar da frente o que costuma travar muita gente: stock,
              logística, envios, tarefas operacionais e excesso de complexidade.
            </p>

            <div className="sales-inline-actions">
              <Link to="/pagamento" className="sales-button primary">
                Começar o meu negócio LYRA
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="sales-image-frame" data-reveal="right" style={{ '--reveal-delay': '0.08s' }}>
            <img src={showcaseImage} alt="Catálogo de produtos organizado e pronto para divulgação" />
            <span className="sales-image-badge">Sistema pronto a usar desde o primeiro dia</span>
          </div>
        </div>
      </section>

      <section className="sales-section sales-section-soft">
        <div className="sales-container">
          <div className="sales-card-grid">
            {steps.map(({ icon: Icon, title, description }, index) => (
              <article
                key={title}
                className="sales-feature-card"
                data-reveal="up"
                style={{ '--reveal-delay': `${0.04 + index * 0.08}s` }}
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
          <div className="sales-comparison-grid">
            <article className="sales-comparison-card" data-reveal="left">
              <h3>O que fica nas suas mãos</h3>
              <ul className="sales-bullet-list compact">
                <li>
                  <CheckCircle2 size={18} />
                  <span>Escolher produtos</span>
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  <span>Definir preços</span>
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  <span>Partilhar o catálogo</span>
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  <span>Gerar vendas</span>
                </li>
              </ul>
            </article>

            <article className="sales-comparison-card accent" data-reveal="right" style={{ '--reveal-delay': '0.08s' }}>
              <h3>O que a LYRA assume por si</h3>
              <ul className="sales-bullet-list compact">
                <li>
                  <CheckCircle2 size={18} />
                  <span>Logística</span>
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  <span>Expedição e envio</span>
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  <span>Operação do sistema</span>
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  <span>Estrutura pronta para revenda</span>
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>
    </RevendaShell>
  );
}
