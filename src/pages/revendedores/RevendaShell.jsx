import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import './revendedores.css';

const navigation = [
  { to: '/', label: 'Início' },
  { to: '/explicacao', label: 'Explicação' },
  { to: '/beneficios', label: 'Benefícios' },
  { to: '/pagamento', label: 'Pagamento' },
];

export default function RevendaShell({
  children,
  ctaTo = '/pagamento',
  ctaLabel = 'Começar o negócio',
}) {
  const location = useLocation();
  const isHeroHeaderRoute = location.pathname === '/' || location.pathname === '/revendedores';
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(!isHeroHeaderRoute);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    if (!isHeroHeaderRoute) {
      setIsHeaderScrolled(true);
      return undefined;
    }

    const updateHeaderState = () => {
      setIsHeaderScrolled(window.scrollY > 72);
    };

    updateHeaderState();
    window.addEventListener('scroll', updateHeaderState, { passive: true });

    return () => window.removeEventListener('scroll', updateHeaderState);
  }, [isHeroHeaderRoute, location.pathname]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealItems = document.querySelectorAll('[data-reveal]');

    if (!revealItems.length) {
      return undefined;
    }

    if (reduceMotion) {
      revealItems.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    revealItems.forEach((element) => {
      element.classList.remove('is-visible');
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hero = document.querySelector('.sales-hero');
    const parallaxItems = hero?.querySelectorAll('[data-parallax]');

    if (reduceMotion || !hero || !parallaxItems?.length) {
      return undefined;
    }

    let ticking = false;

    const updateParallax = () => {
      const rect = hero.getBoundingClientRect();
      const progress = Math.max(Math.min(-rect.top / Math.max(rect.height, 1), 1), 0);

      parallaxItems.forEach((element) => {
        const speed = Number(element.dataset.parallax || 0);
        element.style.setProperty('--parallax-shift', `${(progress * speed).toFixed(2)}px`);
      });

      ticking = false;
    };

    const requestTick = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick);

    return () => {
      window.removeEventListener('scroll', requestTick);
      window.removeEventListener('resize', requestTick);
    };
  }, [location.pathname]);

  return (
    <div className={`sales-shell${isHeroHeaderRoute ? ' sales-shell-hero-header' : ''}`}>
      <header className={`sales-header${isHeaderScrolled ? ' is-scrolled' : ''}`}>
        <div className="sales-container sales-header-inner">
          <Link to="/" className="sales-brand" aria-label="Página principal da LYRA">
            <span className="sales-brand-text sales-brand-wordmark">LYRA</span>
          </Link>

          <nav className="sales-nav" aria-label="Navegação principal">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sales-nav-link${isActive ? ' active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="sales-header-actions">
            <Link to="/revendedores/login" className="sales-login-link">
              Entrar
            </Link>
            <Link to={ctaTo} className="sales-header-cta">
              {ctaLabel}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <main className="sales-main">{children}</main>

      <footer className="sales-footer">
        <div className="sales-container sales-footer-inner">
          <div>
            <p className="sales-footer-title">Painel de Revenda</p>
            <p className="sales-footer-copy">
              Um sistema de revenda pronto a usar para vender sem stock, logística ou complicação.
            </p>
          </div>

          <div className="sales-footer-links">
            <Link to="/explicacao">Como funciona</Link>
            <Link to="/pagamento">Começar negócio</Link>
            <Link to="/revendedores/login">Entrar no dashboard</Link>
            <Link to="/politicas/privacidade">Privacidade</Link>
            <Link to="/contacto">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
