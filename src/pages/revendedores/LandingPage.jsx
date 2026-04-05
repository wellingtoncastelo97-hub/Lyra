import {
  ArrowRight,
  Boxes,
  ChartNoAxesCombined,
  CheckCircle2,
  CreditCard,
  Megaphone,
  Package,
  ShieldCheck,
  Smartphone,
  Star,
  Store,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '../../../pagina de venda renda extra - Cópia/images/hero-bg.png';
import showcaseImage from '../../../pagina de venda renda extra - Cópia/images/products-lifestyle.png';
import testimonialImage from '../../../pagina de venda renda extra - Cópia/images/testimonial-1.png';
import RevendaShell from './RevendaShell';
import './revendedores.css';

const problemPoints = [
  {
    icon: ChartNoAxesCombined,
    title: 'Quer aumentar o rendimento',
    desc: 'Sem acrescentar mais complicação ao seu dia.',
  },
  {
    icon: Smartphone,
    title: 'Precisa de flexibilidade',
    desc: 'Uma forma realista de trabalhar a partir do telemóvel, no seu ritmo.',
  },
  {
    icon: Package,
    title: 'Quer independência sem peso',
    desc: 'Sem lidar com stock, envios ou burocracia.',
  },
];

const systemHighlights = [
  {
    icon: ChartNoAxesCombined,
    title: 'Dashboard completo',
    description:
      'Entra numa área de gestão pronta a usar, onde acompanha o negócio, os produtos e os seus ganhos com clareza.',
  },
  {
    icon: Boxes,
    title: 'Mais de 12.000 produtos',
    description:
      'Um catálogo amplo, organizado por categoria e marca, para escolher o que faz sentido para o seu público.',
  },
  {
    icon: Store,
    title: 'Catálogo digital personalizado',
    description:
      'Tem a sua própria montra digital para partilhar, vender e construir presença sem começar do zero.',
  },
  {
    icon: ShieldCheck,
    title: 'Lucro visível e controlo total',
    description:
      'Decide o que vender, define preços e vê o potencial de rendimento de forma simples e direta.',
  },
];

const steps = [
  { num: '01', text: 'Entra no dashboard e ativa o seu sistema.' },
  { num: '02', text: 'Escolhe produtos, categorias e o preço de venda.' },
  { num: '03', text: 'Partilha o seu catálogo digital personalizado.' },
  { num: '04', text: 'Faz vendas e fica com o lucro enquanto a LYRA trata do resto.' },
];

const supportItems = [
  {
    icon: Users,
    title: 'Chamadas semanais em grupo',
    description:
      'Um espaço regular para esclarecer dúvidas, ajustar estratégia e ganhar confiança a vender.',
  },
  {
    icon: Megaphone,
    title: 'Materiais de marketing',
    description:
      'Recebe apoio com conteúdos e recursos para comunicar melhor a oportunidade e os produtos.',
  },
  {
    icon: Smartphone,
    title: 'Orientação prática',
    description:
      'Não precisa descobrir tudo sozinha. Há suporte real para ajudar a transformar intenção em ação.',
  },
];

const objections = [
  {
    question: '"Não tenho experiência."',
    answer:
      'Não precisa começar especialista. O sistema já vem estruturado para encurtar o caminho e tornar o processo mais simples desde o primeiro dia.',
  },
  {
    question: '"Não sei vender."',
    answer:
      'Vender aqui não significa criar uma operação complexa. Significa escolher bons produtos, partilhar o seu catálogo e aprender com apoio contínuo.',
  },
  {
    question: '"Será que isto funciona para mim?"',
    answer:
      'Se procura rendimento extra com mais flexibilidade e menos peso operacional, esta é precisamente a diferença do sistema: começar com estrutura pronta em vez de improvisar tudo sozinha.',
  },
];

const testimonials = [
  {
    text: '"Comecei sem saber nada de vendas e em duas semanas já tinha os primeiros resultados. A plataforma faz quase tudo por nós."',
    name: 'Ana S.',
    role: 'Consultora LYRA',
    initial: 'A',
  },
  {
    text: '"O que mais gosto é a liberdade. Trabalho quando quero, do telemóvel, e o sistema trata dos envios."',
    name: 'Mariana L.',
    role: 'Consultora LYRA',
    initial: 'M',
  },
  {
    text: '"Nunca pensei que 29€ me dessem acesso a tanta coisa. O catálogo é enorme e o dashboard é muito intuitivo."',
    name: 'Sofia R.',
    role: 'Consultora LYRA',
    initial: 'S',
  },
];

export default function LandingPage() {
  return (
    <RevendaShell ctaTo="/pagamento" ctaLabel="Começar o negócio">
      {/* ═══════ HERO ═══════ */}
      <section className="lp-hero">
        <div className="lp-hero-bg" data-parallax="34">
          <img src={heroImage} alt="" aria-hidden="true" />
          <div className="lp-hero-overlay" />
        </div>

        <div className="lp-hero-inner sales-container">
          <div className="lp-hero-content">
            <span className="lp-kicker" data-reveal="up">
              <span className="lp-kicker-dot" />
              Sistema de negócio pronto a usar
            </span>

            <h1 className="lp-headline" data-reveal="up" style={{ '--reveal-delay': '0.1s' }}>
              Parar de procurar renda extra…
              <br />
              começa quando você entra num{' '}
              <em>negócio pronto.</em>
            </h1>

            <p className="lp-subheadline" data-reveal="up" style={{ '--reveal-delay': '0.2s' }}>
              Com a LYRA, você não começa do zero. Você ativa um sistema completo com mais de
              12.000 produtos, catálogo próprio e estrutura pronta para vender — sem stock, sem
              burocracia e sem complicação.
            </p>

            <div className="lp-hero-actions" data-reveal="up" style={{ '--reveal-delay': '0.3s' }}>
              <Link to="/pagamento" className="lp-btn lp-btn-primary lp-btn-lg">
                Começar agora com LYRA
                <ArrowRight size={18} />
              </Link>
              <Link to="/explicacao" className="lp-btn lp-btn-ghost">
                Ver como funciona
              </Link>
            </div>

            <div className="lp-trust-row" data-reveal="up" style={{ '--reveal-delay': '0.4s' }}>
              <div className="lp-trust-badge">
                <Boxes size={16} />
                <span>12.000+ produtos</span>
              </div>
              <div className="lp-trust-badge">
                <Store size={16} />
                <span>Catálogo próprio</span>
              </div>
              <div className="lp-trust-badge">
                <ShieldCheck size={16} />
                <span>Sem stock</span>
              </div>
              <div className="lp-trust-badge">
                <CreditCard size={16} />
                <span>Sem burocracia</span>
              </div>
            </div>
          </div>

          <div className="lp-hero-card" data-reveal="right" style={{ '--reveal-delay': '0.2s' }}>
            <span className="lp-card-eyebrow">Sistema LYRA</span>
            <h2>Não é uma subscrição.</h2>
            <h2>É o seu sistema de revenda.</h2>
            <ul className="lp-check-list">
              <li>
                <CheckCircle2 size={18} />
                <span>Catálogo digital com o seu nome</span>
              </li>
              <li>
                <CheckCircle2 size={18} />
                <span>Controlo total sobre o que vender e quanto lucrar</span>
              </li>
              <li>
                <CheckCircle2 size={18} />
                <span>Estrutura pronta para começar hoje</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="lp-scroll-hint">
          <div className="lp-scroll-line" />
        </div>
      </section>

      {/* ═══════ PROBLEMA ═══════ */}
      <section className="lp-section">
        <div className="sales-container">
          <div className="lp-two-col">
            <div className="lp-col-text" data-reveal="left">
              <span className="lp-label">O problema</span>
              <h2 className="lp-section-title">
                O que trava quase toda a gente não é a vontade.{' '}
                <em>É a complexidade.</em>
              </h2>
              <p className="lp-text">
                Falta tempo. O rendimento não chega. A ideia de independência parece boa, mas quase
                sempre vem acompanhada de decisões difíceis, custos iniciais e tarefas que roubam
                energia antes mesmo da primeira venda.
              </p>

              <div className="lp-problem-cards">
                {problemPoints.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="lp-problem-card">
                    <span className="lp-problem-icon">
                      <Icon size={20} />
                    </span>
                    <div>
                      <strong>{title}</strong>
                      <span>{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lp-col-visual" data-reveal="right" style={{ '--reveal-delay': '0.1s' }}>
              <div className="lp-image-showcase">
                <img src={showcaseImage} alt="Produtos organizados visualmente para venda digital" />
                <span className="lp-image-tag">Uma estrutura que reduz atrito desde o início</span>
              </div>
              <div className="lp-mini-quote">
                <img src={testimonialImage} alt="" />
                <div>
                  <p className="lp-mini-quote-title">Menos complicação. Mais foco no que gera rendimento.</p>
                  <p className="lp-mini-quote-text">
                    Em vez de montar tudo do zero, começa com uma base já preparada para vender.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ SOLUÇÃO ═══════ */}
      <section className="lp-section lp-section-warm">
        <div className="sales-container">
          <div className="lp-section-header" data-reveal="up">
            <span className="lp-label">A solução</span>
            <h2 className="lp-section-title lp-section-title-center">
              A LYRA transforma essa vontade num sistema{' '}
              <em>simples para começar a ganhar.</em>
            </h2>
            <p className="lp-text lp-text-center">
              Por 29€, entra num modelo pronto a usar. Não precisa tratar de inventário, nem de
              envios, nem de tarefas administrativas. O sistema já vem montado para que a sua energia
              vá para a divulgação e para as vendas.
            </p>
          </div>

          <div className="lp-features-grid">
            {systemHighlights.map(({ icon: Icon, title, description }, i) => (
              <article
                key={title}
                className="lp-feature-card"
                data-reveal="up"
                style={{ '--reveal-delay': `${0.05 + i * 0.08}s` }}
              >
                <span className="lp-feature-icon">
                  <Icon size={24} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ NÚMEROS ═══════ */}
      <section className="lp-section lp-section-dark">
        <div className="sales-container">
          <div className="lp-stats-band" data-reveal="up">
            <div className="lp-stat">
              <strong>12.000+</strong>
              <span>produtos disponíveis</span>
            </div>
            <div className="lp-stat">
              <strong>Sem stock</strong>
              <span>não precisa investir em inventário</span>
            </div>
            <div className="lp-stat">
              <strong>Sem logística</strong>
              <span>a LYRA trata da operação e envios</span>
            </div>
            <div className="lp-stat">
              <strong>Sem burocracia</strong>
              <span>mais leve para começar e avançar</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ COMO FUNCIONA ═══════ */}
      <section className="lp-section">
        <div className="sales-container">
          <div className="lp-section-header" data-reveal="up">
            <span className="lp-label">Como funciona</span>
            <h2 className="lp-section-title lp-section-title-center">
              Simples o suficiente para <em>começar já</em>
            </h2>
          </div>

          <div className="lp-steps">
            {steps.map(({ num, text }, i) => (
              <div
                key={num}
                className="lp-step"
                data-reveal="up"
                style={{ '--reveal-delay': `${0.04 + i * 0.1}s` }}
              >
                <span className="lp-step-num">{num}</span>
                <div className="lp-step-line" />
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ OFERTA ═══════ */}
      <section className="lp-section lp-section-warm">
        <div className="sales-container">
          <div className="lp-offer-block" data-reveal="up">
            <div className="lp-offer-text">
              <span className="lp-label">A oferta</span>
              <h2 className="lp-section-title">
                Por 29€, recebe a estrutura que normalmente demora{' '}
                <em>semanas a construir.</em>
              </h2>
              <p className="lp-text">
                Em vez de pagar para "ver uma plataforma", entra com um negócio digital preparado:
                dashboard administrativo, catálogo gigante, a sua própria loja digital, produtos por
                categoria e marca, lucros visíveis, liberdade para definir preços e uma operação por
                trás que não depende de si.
              </p>
              <p className="lp-text" style={{ marginTop: '1rem' }}>
                O valor não está num login. Está no tempo que poupa, na clareza que ganha e na
                facilidade de começar com algo concreto.
              </p>
            </div>

            <div className="lp-price-box" data-reveal="right" style={{ '--reveal-delay': '0.1s' }}>
              <span className="lp-price-eyebrow">Sistema LYRA</span>
              <div className="lp-price-old">De €49</div>
              <strong className="lp-price-value">29€</strong>
              <p>Pagamento único para ligar o seu sistema de revenda e começar hoje.</p>
              <Link to="/pagamento" className="lp-btn lp-btn-primary lp-btn-full">
                Começar o meu negócio LYRA
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ CONTROLO VS LYRA ═══════ */}
      <section className="lp-section">
        <div className="sales-container">
          <div className="lp-section-header" data-reveal="up">
            <span className="lp-label">Controlo e liberdade</span>
            <h2 className="lp-section-title lp-section-title-center">
              Você decide o negócio. A LYRA segura a estrutura.
            </h2>
          </div>

          <div className="lp-comparison">
            <article className="lp-comparison-card" data-reveal="left">
              <h3>Você controla</h3>
              <ul className="lp-check-list">
                <li><CheckCircle2 size={18} /><span>O que quer vender</span></li>
                <li><CheckCircle2 size={18} /><span>O preço que quer praticar</span></li>
                <li><CheckCircle2 size={18} /><span>Como e onde quer promover</span></li>
                <li><CheckCircle2 size={18} /><span>O ritmo do seu crescimento</span></li>
              </ul>
            </article>

            <article className="lp-comparison-card lp-comparison-accent" data-reveal="right" style={{ '--reveal-delay': '0.1s' }}>
              <h3>A LYRA trata de</h3>
              <ul className="lp-check-list">
                <li><CheckCircle2 size={18} /><span>Logística</span></li>
                <li><CheckCircle2 size={18} /><span>Expedição e envio</span></li>
                <li><CheckCircle2 size={18} /><span>Operação por trás da estrutura</span></li>
                <li><CheckCircle2 size={18} /><span>Organização do sistema de revenda</span></li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* ═══════ SUPORTE ═══════ */}
      <section className="lp-section lp-section-warm">
        <div className="sales-container">
          <div className="lp-section-header" data-reveal="up">
            <span className="lp-label">Suporte</span>
            <h2 className="lp-section-title lp-section-title-center">
              Não entra sozinha. <em>Entra acompanhada.</em>
            </h2>
            <p className="lp-text lp-text-center">
              Além da estrutura, recebe apoio contínuo para vender melhor e ganhar segurança no
              processo.
            </p>
          </div>

          <div className="lp-support-grid">
            {supportItems.map(({ icon: Icon, title, description }, i) => (
              <article
                key={title}
                className="lp-support-card"
                data-reveal="up"
                style={{ '--reveal-delay': `${0.05 + i * 0.08}s` }}
              >
                <span className="lp-support-icon">
                  <Icon size={22} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ EXEMPLO DE LUCRO ═══════ */}
      <section className="lp-section">
        <div className="sales-container">
          <div className="lp-profit-block" data-reveal="up">
            <div className="lp-profit-text">
              <span className="lp-label">Exemplo visual de lucro</span>
              <h2 className="lp-section-title">
                Um exemplo simples para perceber <em>o potencial</em>
              </h2>
              <p className="lp-text">
                Imagine um produto no seu catálogo digital com preço de venda de 29€. Se o custo for
                18€, o seu lucro nessa venda é 11€. É esta lógica que o sistema ajuda a tornar mais
                clara e mais fácil de trabalhar.
              </p>
            </div>

            <div className="lp-profit-example">
              <div className="lp-profit-row">
                <span>Preço de venda</span>
                <strong>29€</strong>
              </div>
              <div className="lp-profit-row">
                <span>Custo</span>
                <strong>18€</strong>
              </div>
              <div className="lp-profit-row lp-profit-result">
                <span>O seu lucro</span>
                <strong>11€</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ TESTEMUNHOS ═══════ */}
      <section className="lp-section lp-section-warm">
        <div className="sales-container">
          <div className="lp-section-header" data-reveal="up">
            <span className="lp-label">Quem já começou</span>
            <h2 className="lp-section-title lp-section-title-center">
              Quem já começou está a <em>ver resultados</em>
            </h2>
          </div>

          <div className="lp-testimonials">
            {testimonials.map(({ text, name, role, initial }, i) => (
              <article
                key={name}
                className="lp-testimonial"
                data-reveal="up"
                style={{ '--reveal-delay': `${0.04 + i * 0.1}s` }}
              >
                <div className="lp-testimonial-stars">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="lp-testimonial-text">{text}</p>
                <div className="lp-testimonial-author">
                  <span className="lp-avatar">{initial}</span>
                  <div>
                    <strong>{name}</strong>
                    <span>{role}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ OBJEÇÕES ═══════ */}
      <section className="lp-section">
        <div className="sales-container lp-faq-container">
          <div className="lp-section-header" data-reveal="up">
            <span className="lp-label">Objeções comuns</span>
            <h2 className="lp-section-title lp-section-title-center">
              Se está a pensar <em>"isto será para mim?"</em>, leia isto.
            </h2>
          </div>

          <div className="lp-faq-list">
            {objections.map(({ question, answer }, i) => (
              <details
                key={question}
                className="lp-faq"
                data-reveal="up"
                style={{ '--reveal-delay': `${0.04 + i * 0.08}s` }}
              >
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ URGÊNCIA ═══════ */}
      <section className="lp-section lp-section-flush">
        <div className="sales-container">
          <div className="lp-urgency" data-reveal="up">
            <span className="lp-urgency-icon">🚨</span>
            <p>
              <strong>Atenção:</strong> Estamos a aceitar apenas um número limitado de novos parceiros
              esta semana para garantir a qualidade do suporte inicial.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════ CTA FINAL ═══════ */}
      <section className="lp-section lp-section-dark lp-final-cta">
        <div className="sales-container">
          <div className="lp-cta-card" data-reveal="zoom">
            <div className="lp-cta-glow" />
            <span className="lp-label lp-label-light">Decisão</span>
            <h2 className="lp-cta-headline">
              Não precisa de esperar pelo momento perfeito para começar com algo{' '}
              <em>simples e real.</em>
            </h2>
            <p className="lp-cta-desc">
              Quanto mais cedo entra num sistema estruturado, mais cedo percebe o que funciona para
              si. Sem promessas mágicas. Apenas uma oportunidade concreta para começar hoje.
            </p>
            <Link to="/pagamento" className="lp-btn lp-btn-primary lp-btn-lg">
              Começar o meu negócio LYRA
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </RevendaShell>
  );
}
