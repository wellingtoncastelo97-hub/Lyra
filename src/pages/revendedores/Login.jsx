import { useState } from 'react';
import { ArrowRight, LayoutDashboard, ShieldCheck, WalletCards } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import RevendaShell from './RevendaShell';
import './revendedores.css';

const panelItems = [
  {
    icon: LayoutDashboard,
    text: 'Dashboard principal do negócio',
  },
  {
    icon: WalletCards,
    text: 'Visão geral de vendas e rendimento',
  },
  {
    icon: ShieldCheck,
    text: 'Área segura para revendedoras',
  },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg(
        error.message === 'Invalid login credentials'
          ? 'Email ou password incorretos.'
          : error.message
      );
      setLoading(false);
      return;
    }

    const { data: resellerData } = await supabase
      .from('resellers')
      .select('is_active, status')
      .eq('id', data.user.id)
      .maybeSingle();

    const isActive =
      typeof resellerData?.status === 'string'
        ? resellerData.status === 'active'
        : resellerData?.is_active === true;

    if (!isActive) {
      await supabase.auth.signOut();
      setErrorMsg('O seu pagamento ainda nao foi confirmado. Assim que a ativacao Stripe terminar, pode entrar no painel.');
      setLoading(false);
      return;
    }

    navigate('/revendedores/painel');
  };

  return (
    <RevendaShell ctaTo="/pagamento" ctaLabel="Começar o negócio">
      <section className="sales-section sales-top-section">
        <div className="sales-container sales-auth-grid">
          <div className="sales-auth-panel" data-reveal="left">
            <span className="sales-section-label">Entrar no dashboard</span>
            <h1 className="sales-section-title">Aceda à sua área de revendedora</h1>
            <p className="sales-text">
              Se o seu sistema LYRA já está ativo, entre aqui para acompanhar o negócio e continuar a
              vender com clareza.
            </p>

            <div className="sales-card-grid compact-grid">
              {panelItems.map(({ icon: Icon, text }, index) => (
                <article
                  key={text}
                  className="sales-feature-card compact-card"
                  data-reveal="up"
                  style={{ '--reveal-delay': `${0.04 + index * 0.08}s` }}
                >
                  <span className="sales-feature-icon">
                    <Icon size={20} />
                  </span>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="sales-form-card" data-reveal="right" style={{ '--reveal-delay': '0.08s' }}>
            <div className="sales-form-header">
              <h2>Iniciar sessão</h2>
              <p>Introduza as credenciais usadas quando criou o seu negócio LYRA.</p>
            </div>

            {errorMsg && <div className="sales-alert error">{errorMsg}</div>}

            <form className="sales-form" onSubmit={handleLogin}>
              <label className="sales-form-field">
                <span>Email</span>
                <input
                  className="sales-input"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label className="sales-form-field">
                <span>Password</span>
                <input
                  className="sales-input"
                  type="password"
                  placeholder="Introduza a sua password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              <button type="submit" className="sales-button primary full-width" disabled={loading}>
                {loading ? 'A entrar...' : 'Entrar no dashboard'}
              </button>
            </form>

            <p className="sales-form-note">
              Ainda não começou?{' '}
              <Link to="/pagamento">
                Criar o meu negócio LYRA <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </div>
      </section>
    </RevendaShell>
  );
}
