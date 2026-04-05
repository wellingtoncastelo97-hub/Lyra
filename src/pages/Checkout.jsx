import React, { useEffect, useState } from 'react';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';
import { createStripeCheckoutSession } from '../utils/stripeCheckout';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, cartTotal } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [resellerId, setResellerId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'stripe',
  });

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      supabase
        .from('resellers')
        .select('id')
        .eq('slug', ref)
        .single()
        .then(({ data }) => {
          if (data) setResellerId(data.id);
        });
    }

    if (searchParams.get('checkout') === 'cancelled') {
      setErrorMsg('O checkout Stripe foi cancelado. Pode retomar o pagamento quando quiser.');
    }
  }, [searchParams]);

  if (cartItems.length === 0 && !submitting) {
    return (
      <div className="checkout-empty">
        <h2>O seu cesto está vazio</h2>
        <button className="btn-primary" onClick={() => navigate('/loja')}>
          Voltar à Loja
        </button>
      </div>
    );
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMsg('Por favor, introduza um email válido.');
      return false;
    }

    const phoneClean = formData.phone.replace(/\s/g, '');
    if (!/^\+?\d{9,15}$/.test(phoneClean)) {
      setErrorMsg('Por favor, introduza um número de telefone válido (9-15 dígitos).');
      return false;
    }

    if (
      !formData.name.trim() ||
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.postalCode.trim()
    ) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg(null);

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const checkoutSession = await createStripeCheckoutSession({
        type: 'catalog_order',
        source: 'shop',
        resellerId,
        resellerSlug: searchParams.get('ref'),
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
        },
        cartItems: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      });

      window.location.assign(checkoutSession.url);
    } catch (error) {
      console.error('Checkout error:', error);
      setErrorMsg('Ocorreu um erro ao processar a encomenda. Por favor, tente novamente.');
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <div className="checkout-container header-layout">
          <button className="back-link" onClick={() => navigate('/loja')}>
            <ChevronLeft size={20} /> Continuar a comprar
          </button>
          <a href="/loja" className="checkout-logo">
            LYRA
          </a>
          <div style={{ width: '130px' }} />
        </div>
      </div>

      <div className="checkout-container checkout-grid">
        <div className="checkout-form-col">
          <form onSubmit={handleSubmit}>
            {errorMsg && <div className="checkout-error">{errorMsg}</div>}

            <section className="checkout-section">
              <h3 className="checkout-subtitle">Informação de Contacto</h3>
              <div className="form-group">
                <label>Email *</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Telemóvel *</label>
                <input
                  required
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
            </section>

            <section className="checkout-section">
              <h3 className="checkout-subtitle">Morada de Envio</h3>
              <div className="form-group">
                <label>Nome Completo *</label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Morada Completa *</label>
                <input
                  required
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Código Postal *</label>
                  <input
                    required
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Cidade *</label>
                  <input
                    required
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </section>

            <section className="checkout-section">
              <h3 className="checkout-subtitle">Pagamento</h3>
              <div className="payment-options">
                <label className="payment-label active">
                  <input type="radio" name="paymentMethod" value="stripe" checked readOnly />
                  <span>Cartao / Apple Pay / Google Pay via Stripe</span>
                </label>
              </div>
            </section>

            <button type="submit" className="btn-primary checkout-submit-btn" disabled={submitting}>
              {submitting ? 'A processar...' : 'Pagar com Stripe'}
              {!submitting && <ShieldCheck size={20} style={{ marginLeft: '8px' }} />}
            </button>
          </form>
        </div>

        <div className="checkout-summary-col">
          <div className="checkout-summary-card">
            <h3 className="checkout-subtitle">Resumo da Encomenda</h3>

            <div className="summary-items">
              {cartItems.map((item) => (
                <div key={item.id} className="summary-item">
                  <div className="summary-item-img">
                    <img src={item.image_url || '/placeholder.svg'} alt={item.name} />
                    <span className="summary-item-qty">{item.quantity}</span>
                  </div>
                  <div className="summary-item-info">
                    <h4>{item.name}</h4>
                  </div>
                  <div className="summary-item-price">
                    {(item.price * item.quantity).toFixed(2).replace('.', ',')} €
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{cartTotal.toFixed(2).replace('.', ',')} €</span>
              </div>
              <div className="summary-row">
                <span>Envio</span>
                <span>Grátis</span>
              </div>
              <div className="summary-row summary-total">
                <span>Total a Pagar</span>
                <span>{cartTotal.toFixed(2).replace('.', ',')} €</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
