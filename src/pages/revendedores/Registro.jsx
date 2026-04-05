import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { createStripeCheckoutSession, syncStripeCheckoutSession } from '../../utils/stripeCheckout';
import RevendaShell from './RevendaShell';
import './revendedores.css';

const includedItems = [
  'Dashboard administrativo completo',
  'Catalogo com mais de 12.000 produtos',
  'Catalogo digital personalizado para vender',
  'Controlo sobre precos, lucro e produtos',
  'Chamadas semanais, suporte e materiais',
];

const isResellerActive = (row) =>
  typeof row?.status === 'string'
    ? row.status === 'active'
    : row?.is_active === true;

export default function Registro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSlug = (name) =>
    `${name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${Math.random().toString(36).substring(2, 6)}`;

  useEffect(() => {
    const checkoutState = searchParams.get('checkout');
    const sessionId = searchParams.get('session_id');

    if (checkoutState === 'pending') {
      setErrorMsg('A sua conta ainda esta pendente de pagamento ou confirmacao. Conclua o checkout Stripe para ativar o painel.');
      setSuccessMsg(null);
      return;
    }

    if (checkoutState === 'cancelled') {
      setErrorMsg('O checkout Stripe foi cancelado. Pode retomar o pagamento quando quiser.');
      setSuccessMsg(null);
      return;
    }

    if (checkoutState !== 'success' || !sessionId) {
      return;
    }

    let isCancelled = false;

    const confirmStripePayment = async () => {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg('A confirmar o seu pagamento e a ativar o sistema LYRA...');

      try {
        await syncStripeCheckoutSession(sessionId);

        const { data: authSessionData } = await supabase.auth.getSession();
        const userId = authSessionData?.session?.user?.id;

        if (userId) {
          for (let attempt = 0; attempt < 8; attempt += 1) {
            const { data: resellerData } = await supabase
              .from('resellers')
              .select('id, slug, is_active, status')
              .eq('id', userId)
              .maybeSingle();

            if (isCancelled) return;

            if (isResellerActive(resellerData)) {
              navigate('/revendedores/painel', { replace: true });
              return;
            }

            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }

        if (!isCancelled) {
          setSuccessMsg(
            'Pagamento confirmado. Se a ativacao ainda nao refletiu no painel, aguarde alguns segundos e entre novamente.'
          );
        }
      } catch (error) {
        console.error('Stripe checkout sync error:', error);
        if (!isCancelled) {
          setSuccessMsg(
            'O pagamento foi recebido. A confirmacao final pode demorar alguns segundos. Depois, entre no dashboard.'
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    confirmStripePayment();

    return () => {
      isCancelled = true;
    };
  }, [navigate, searchParams]);

  const handleActivation = async (event) => {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'reseller' },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Nao foi possivel criar a conta. Tente novamente.');

      const { error: profileError } = await supabase.from('resellers').upsert([
        {
          id: authData.user.id,
          full_name: fullName,
          email,
          slug: generateSlug(fullName),
          is_active: false,
          status: 'pending_payment',
          payment_status: 'pending',
          payment_gateway: 'stripe',
          commission_rate: 0.3,
        },
      ]);

      if (profileError) throw profileError;

      setSuccessMsg('Conta criada. A abrir o checkout Stripe seguro...');

      const { url } = await createStripeCheckoutSession({
        type: 'reseller_access',
        resellerId: authData.user.id,
        email,
        fullName,
      });

      window.location.assign(url);
    } catch (error) {
      console.error('Registration + Stripe error:', error);
      setErrorMsg(error.message || 'Ocorreu um erro ao iniciar o pagamento.');
      setLoading(false);
    }
  };

  return (
    <RevendaShell ctaTo="/pagamento" ctaLabel="Comecar o negocio">
      <section className="sales-section sales-top-section">
        <div className="sales-container sales-auth-grid">
          <div className="sales-auth-panel" data-reveal="left">
            <span className="sales-section-label">Pagamento unico</span>
            <h1 className="sales-section-title">Comece hoje o seu negocio LYRA</h1>
            <p className="sales-text">
              Por 29EUR, ativa um sistema de revenda pronto a usar. Nao comeca com teoria nem com
              uma pagina vazia. Comeca com estrutura, catalogo, loja digital e apoio.
            </p>

            <div className="sales-price-card wide">
              <span className="sales-price-label">Sistema pronto</span>
              <strong className="sales-price-value">29EUR</strong>
              <p>Pagamento unico com checkout Stripe para ativar o seu negocio digital LYRA.</p>
            </div>

            <ul className="sales-bullet-list">
              {includedItems.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={18} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="sales-form-card" data-reveal="right" style={{ '--reveal-delay': '0.08s' }}>
            <div className="sales-form-header">
              <span className="sales-form-chip">
                <ShieldCheck size={16} />
                Ativacao segura
              </span>
              <h2>Crie a sua conta</h2>
              <p>Preencha os seus dados e conclua o pagamento Stripe para ativar o painel.</p>
            </div>

            {errorMsg && <div className="sales-alert error">{errorMsg}</div>}
            {successMsg && <div className="sales-alert success">{successMsg}</div>}

            <form className="sales-form" onSubmit={handleActivation}>
              <label className="sales-form-field">
                <span>Nome completo</span>
                <input
                  className="sales-input"
                  type="text"
                  placeholder="Maria Fernandes"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </label>

              <label className="sales-form-field">
                <span>Email</span>
                <input
                  className="sales-input"
                  type="email"
                  placeholder="maria@email.com"
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
                  placeholder="Crie uma password segura"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              <button type="submit" className="sales-button primary full-width" disabled={loading}>
                <CreditCard size={18} />
                {loading ? 'A processar...' : 'Pagar e ativar com Stripe'}
              </button>
            </form>

            <p className="sales-form-note">
              Ja tem conta?{' '}
              <Link to="/revendedores/login">
                Entrar no dashboard <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </div>
      </section>
    </RevendaShell>
  );
}
