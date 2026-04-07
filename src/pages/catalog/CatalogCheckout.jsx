import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useCart } from '../../context/CartContext';
import { createStripeCheckoutSession } from '../../utils/stripeCheckout';
import { canAccessResellerArea, isResellerActive } from '../../utils/resellerAccess';
import TransparentCheckout from '../../components/checkout/TransparentCheckout';
import './Catalog.css';

const CatalogCheckout = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, cartTotal } = useCart();
  const isDemoCatalog = location.pathname.startsWith('/demo/');
  const catalogBasePath = isDemoCatalog ? `/demo/${slug}` : `/${slug}`;
  const upgradePath = `/revendedores/login?next=${encodeURIComponent('/pagamento?mode=upgrade')}`;

  const [reseller, setReseller] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchReseller = async () => {
      const { data } = await supabase
        .from('resellers')
        .select('id, full_name, slug, catalog_title, avatar_url, is_active, status')
        .eq('slug', slug)
        .maybeSingle();

      const isAvailable = isDemoCatalog ? canAccessResellerArea(data) : isResellerActive(data);

      if (!data || !isAvailable) {
        navigate('/');
        return;
      }

      setReseller(data);
    };

    fetchReseller();

    if (new URLSearchParams(window.location.search).get('checkout') === 'cancelled') {
      setErrorMsg('O pagamento foi cancelado. Pode retomar a compra quando quiser.');
    }
  }, [isDemoCatalog, navigate, slug]);

  if (isDemoCatalog) {
    return (
      <div className="catalog-page">
        <div className="catalog-checkout-demo-lock">
          <div className="catalog-checkout-demo-card">
            <span className="catalog-demo-eyebrow">Checkout bloqueado no demo</span>
            <h2>O pagamento real fica disponivel depois da ativacao completa.</h2>
            <p>
              A pessoa ja viu o painel, os produtos e o funcionamento do catalogo. Agora basta ativar o acesso completo para liberar pedidos, checkout e operacao ao vivo.
            </p>
            <div className="catalog-checkout-demo-actions">
              <Link to={upgradePath} className="catalog-btn-buy-large">
                <Lock size={18} /> Ativar acesso completo
              </Link>
              <Link to={catalogBasePath} className="catalog-btn-add-cart catalog-btn-add-cart-link">
                Voltar ao catalogo demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!reseller) {
    return <div className="catalog-loading">A preparar o checkout...</div>;
  }

  const handlePrepareCheckout = async ({ customer, shippingMethod }) => createStripeCheckoutSession({
    type: 'catalog_order',
    uiMode: 'custom',
    source: 'catalog',
    resellerId: reseller.id,
    resellerSlug: slug,
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      postalCode: customer.postalCode,
      notes: customer.notes,
    },
    shippingMethod,
    cartItems: cartItems.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    })),
  });

  return (
    <TransparentCheckout
      backTo={catalogBasePath}
      backLabel="Voltar ao catalogo"
      logoTo={catalogBasePath}
      attribution={reseller ? {
        avatarUrl: reseller.avatar_url || null,
        label: 'A comprar com',
        title: reseller.catalog_title || `${reseller.full_name} - Consultora LYRA`,
      } : null}
      cartItems={cartItems}
      cartTotal={cartTotal}
      onPrepareCheckout={handlePrepareCheckout}
      initialErrorMessage={errorMsg}
      emptyTitle="O seu cesto esta vazio"
      emptyDescription="Adicione produtos do catalogo antes de finalizar a compra."
      emptyActionTo={catalogBasePath}
      emptyActionLabel="Voltar ao catalogo"
    />
  );
};

export default CatalogCheckout;
