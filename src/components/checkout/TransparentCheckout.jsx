import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckoutElementsProvider, PaymentElement, useCheckout } from '@stripe/react-stripe-js/checkout';
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  CreditCard,
  Lock,
  Smartphone,
  Truck,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { stripePromise } from '../../utils/stripePublic';
import { getShippingOptionById, shippingOptions } from './shippingOptions';
import './TransparentCheckout.css';

const formatPrice = (value) => `${Number(value || 0).toFixed(2).replace('.', ',')} EUR`;
const advertisedPaymentMethods = [
  { id: 'mb_way', icon: Smartphone, label: 'MB WAY' },
  { id: 'card', icon: CreditCard, label: 'Cartao' },
];

const defaultFormState = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  notes: '',
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^\+?\d{9,15}$/.test(String(phone || '').replace(/[\s\-().]/g, ''));

const CheckoutPaymentCard = ({
  clientSecret,
  totalAmount,
  onError,
}) => {
  const checkoutState = useCheckout();
  const [submitting, setSubmitting] = useState(false);

  const handlePayment = async (event) => {
    event.preventDefault();
    console.log('[checkout] click - state type:', checkoutState?.type, checkoutState);

    if (checkoutState?.type === 'loading') {
      onError('O pagamento ainda esta a preparar o formulario. Tente novamente dentro de alguns segundos.');
      return;
    }

    if (checkoutState?.type === 'error') {
      console.error('[checkout] provider error:', checkoutState.error);
      onError(checkoutState.error?.message || 'Ocorreu um problema ao carregar o pagamento. Atualize a pagina e tente novamente.');
      return;
    }

    if (checkoutState?.type !== 'success' || !checkoutState.checkout) {
      onError('O pagamento ainda nao esta pronto. Aguarde um instante e tente novamente.');
      return;
    }

    setSubmitting(true);
    onError(null);

    try {
      const result = await checkoutState.checkout.confirm({
        redirect: 'always',
      });

      console.log('[checkout] confirm result:', result);

      if (result?.type === 'error') {
        onError(result.error?.message || 'Nao foi possivel concluir o pagamento. Verifique os dados e tente novamente.');
        setSubmitting(false);
      }
    } catch (error) {
      console.error('[checkout] confirm threw:', error);
      onError(error?.message || 'Erro inesperado ao confirmar pagamento.');
      setSubmitting(false);
    }
  };

  const paymentElement = clientSecret ? (
    <PaymentElement
      options={{
        layout: {
          type: 'accordion',
          defaultCollapsed: false,
        },
      }}
    />
  ) : null;

  return (
    <div className="tc-payment-shell">
      <div className="tc-method-row">
        {advertisedPaymentMethods.map((method) => {
          const Icon = method.icon;

          return (
            <span key={method.id} className="tc-method-pill">
              <Icon size={16} /> {method.label}
            </span>
          );
        })}
      </div>

      <p className="tc-method-disclaimer">
        Esta loja esta configurada para concluir pedidos com MB WAY e cartao diretamente no checkout Stripe.
      </p>

      <div className="tc-payment-inner">
        {paymentElement}
      </div>

      <div className="tc-payment-footer">
        <button
          type="button"
          className="tc-action-btn"
          onClick={handlePayment}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="tc-spinner" />
              A concluir pagamento...
            </>
          ) : (
            <>
              <Lock size={18} />
              Finalizar pagamento de {formatPrice(totalAmount)}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const TransparentCheckout = ({
  backTo,
  backLabel,
  logoTo,
  attribution,
  cartItems,
  cartTotal,
  onPrepareCheckout,
  initialErrorMessage = null,
  emptyTitle,
  emptyDescription,
  emptyActionTo,
  emptyActionLabel,
}) => {
  const [formData, setFormData] = useState(defaultFormState);
  const [selectedShippingId, setSelectedShippingId] = useState(shippingOptions[0]?.id || '');
  const [errorMsg, setErrorMsg] = useState(initialErrorMessage);
  const [preparing, setPreparing] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState(null);
  const paymentRef = useRef(null);

  useEffect(() => {
    setErrorMsg(initialErrorMessage);
  }, [initialErrorMessage]);

  const selectedShipping = useMemo(
    () => getShippingOptionById(selectedShippingId) || shippingOptions[0],
    [selectedShippingId],
  );

  const productsSubtotal = Number(cartTotal || 0);
  const shippingCost = Number(selectedShipping?.price || 0);
  const grandTotal = Number((productsSubtotal + shippingCost).toFixed(2));

  const providerOptions = useMemo(() => {
    if (!checkoutSession?.clientSecret) return null;

    return {
      clientSecret: checkoutSession.clientSecret,
      elementsOptions: {
        appearance: {
          variables: {
            colorPrimary: '#b5643c',
            colorText: '#2f231b',
            colorTextPlaceholder: '#8b7a6c',
            colorBackground: '#fffefb',
            borderRadius: '16px',
            spacingUnit: '4px',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        },
      },
    };
  }, [checkoutSession?.clientSecret]);

  const resetPreparedCheckout = () => {
    if (checkoutSession) {
      setCheckoutSession(null);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrorMsg(null);
  };

  const handleSelectShipping = (shippingId) => {
    setSelectedShippingId(shippingId);
    setErrorMsg(null);
    resetPreparedCheckout();
  };

  const validateForm = () => {
    if (!validateEmail(formData.email)) {
      setErrorMsg('Introduza um email valido para receber a confirmacao da encomenda.');
      return false;
    }

    if (!validatePhone(formData.phone)) {
      setErrorMsg('Introduza um telemovel valido para contacto e confirmacao do pedido.');
      return false;
    }

    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.postalCode.trim()) {
      setErrorMsg('Preencha todos os dados obrigatorios antes de continuar.');
      return false;
    }

    if (!selectedShipping) {
      setErrorMsg('Escolha um metodo de entrega antes de continuar.');
      return false;
    }

    return true;
  };

  const handlePrepareCheckout = async (event) => {
    event.preventDefault();
    setErrorMsg(null);

    if (!validateForm()) {
      return;
    }

    setPreparing(true);

    try {
      const session = await onPrepareCheckout({
        customer: formData,
        shippingMethod: selectedShipping,
      });
      setCheckoutSession(session);

      requestAnimationFrame(() => {
        paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (error) {
      console.error('Inline checkout preparation error:', error);
      setErrorMsg(error.message || 'Nao foi possivel preparar o pagamento. Tente novamente.');
    } finally {
      setPreparing(false);
    }
  };

  if (cartItems.length === 0 && !preparing) {
    return (
      <div className="tc-page">
        <div className="tc-empty">
          <div className="tc-card tc-empty-card">
            <h2>{emptyTitle}</h2>
            <p>{emptyDescription}</p>
            <Link to={emptyActionTo} className="tc-action-btn">
              {emptyActionLabel}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tc-page">
      <header className="tc-header">
        <div className="tc-header-inner">
          <Link to={backTo} className="tc-back-link">
            <ChevronLeft size={18} />
            {backLabel}
          </Link>
          <Link to={logoTo} className="tc-logo">LYRA</Link>
        </div>
      </header>

      <main className="tc-shell">
        {attribution ? (
          <div className="tc-attribution">
            {attribution.avatarUrl ? (
              <img src={attribution.avatarUrl} alt="" className="tc-mini-avatar" />
            ) : (
              <div className="tc-mini-avatar-placeholder"><User size={16} /></div>
            )}
            <div className="tc-attribution-text">
              <span className="tc-attribution-label">{attribution.label}</span>
              <strong className="tc-attribution-title">{attribution.title}</strong>
            </div>
          </div>
        ) : null}

        <div className="tc-grid">
          <div className="tc-main-column">
            <section className="tc-card tc-section">
              <div className="tc-section-head">
                <div className="tc-section-title-wrap">
                  <div className="tc-section-icon"><User size={20} /></div>
                  <div>
                    <h2 className="tc-section-title">Dados de contacto e entrega</h2>
                    <p className="tc-section-copy">
                      Complete os dados e escolha a forma de envio para desbloquear o pagamento.
                    </p>
                  </div>
                </div>
                {checkoutSession ? (
                  <span className="tc-badge">
                    <BadgeCheck size={14} />
                    Dados prontos
                  </span>
                ) : null}
              </div>

              {errorMsg ? <div className="tc-alert error">{errorMsg}</div> : null}

              <form onSubmit={handlePrepareCheckout}>
                <div className="tc-form-grid">
                  <div className="tc-field full">
                    <label htmlFor="checkout-name">Nome completo *</label>
                    <input id="checkout-name" name="name" type="text" value={formData.name} onChange={handleChange} required />
                  </div>

                  <div className="tc-field">
                    <label htmlFor="checkout-email">Email *</label>
                    <input id="checkout-email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                  </div>

                  <div className="tc-field">
                    <label htmlFor="checkout-phone">Telemovel *</label>
                    <input id="checkout-phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                  </div>

                  <div className="tc-field full">
                    <label htmlFor="checkout-address">Morada completa *</label>
                    <input id="checkout-address" name="address" type="text" value={formData.address} onChange={handleChange} required />
                  </div>

                  <div className="tc-field">
                    <label htmlFor="checkout-postalCode">Codigo postal *</label>
                    <input id="checkout-postalCode" name="postalCode" type="text" value={formData.postalCode} onChange={handleChange} required />
                  </div>

                  <div className="tc-field">
                    <label htmlFor="checkout-city">Cidade *</label>
                    <input id="checkout-city" name="city" type="text" value={formData.city} onChange={handleChange} required />
                  </div>
                </div>

                <div className="tc-subsection">
                  <div className="tc-subsection-head">
                    <div>
                      <h3>Metodo de entrega</h3>
                      <p>Escolha a transportadora e o formato de rececao da encomenda.</p>
                    </div>
                  </div>

                  <div className="tc-shipping-groups">
                    {(() => {
                      const groups = [];
                      shippingOptions.forEach(opt => {
                         let group = groups.find(g => g.carrier === opt.carrier);
                         if (!group) {
                            group = { carrier: opt.carrier, logo: opt.logo, options: [] };
                            groups.push(group);
                         }
                         group.options.push(opt);
                      });
                      
                      return groups.map(group => (
                        <div key={group.carrier} className="tc-shipping-group">
                          <div className="tc-shipping-group-head">
                             {group.logo ? (
                               <img src={group.logo} alt={group.carrier} className="tc-shipping-group-logo" />
                             ) : (
                               <strong className="tc-shipping-group-name">{group.carrier}</strong>
                             )}
                          </div>
                          <div className="tc-shipping-group-options">
                            {group.options.map((option, index) => {
                              const isSelected = option.id === selectedShippingId;
                              const isLast = index === group.options.length - 1;
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  className={`tc-shipping-option${isSelected ? ' is-selected' : ''}${isLast ? ' is-last' : ''}`}
                                  onClick={() => handleSelectShipping(option.id)}
                                >
                                  <div className="tc-shipping-copy">
                                    <div className="tc-shipping-topline">
                                      <strong>{option.label}</strong>
                                      <span className="tc-shipping-price">{formatPrice(option.price)}</span>
                                    </div>
                                    <span className="tc-shipping-subtitle">{option.subtitle}</span>
                                  </div>
                                  <span className="tc-shipping-check">
                                    {isSelected ? <Check size={15} /> : null}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                <div className="tc-subsection">
                  <div className="tc-subsection-head">
                    <div>
                      <h3>Observacoes</h3>
                      <p>Adicione alguma indicacao util para o envio, se precisar.</p>
                    </div>
                  </div>

                  <div className="tc-field">
                    <textarea
                      id="checkout-notes"
                      name="notes"
                      placeholder="Ex.: horario preferencial, referencia de entrega ou algum detalhe util para o pedido."
                      value={formData.notes}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="tc-prep-row">
                  <button type="submit" className="tc-secondary-btn" disabled={preparing}>
                    {preparing ? (
                      <>
                        <span className="tc-spinner" />
                        A preparar...
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        Continuar para pagamento
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            <section className="tc-card tc-section" ref={paymentRef}>
              <div className="tc-section-head">
                <div className="tc-section-title-wrap">
                  <div className="tc-section-icon"><CreditCard size={20} /></div>
                  <div>
                    <h2 className="tc-section-title">Pagamento</h2>
                    <p className="tc-section-copy">
                      Conclua a encomenda aqui mesmo, sem sair desta pagina.
                    </p>
                  </div>
                </div>
              </div>

              {!checkoutSession ? (
                <div className="tc-payment-placeholder">
                  <CreditCard size={18} />
                  <span>Os metodos de pagamento aparecem aqui assim que confirmar os dados e a entrega.</span>
                </div>
              ) : null}

              {checkoutSession && providerOptions ? (
                <CheckoutElementsProvider stripe={stripePromise} options={providerOptions}>
                  <CheckoutPaymentCard
                    clientSecret={checkoutSession.clientSecret}
                    totalAmount={grandTotal}
                    onError={setErrorMsg}
                  />
                </CheckoutElementsProvider>
              ) : null}
            </section>
          </div>

          <aside className="tc-summary-column">
            <div className="tc-card tc-summary-card">
              <div className="tc-summary-head">
                <h2 className="tc-summary-title">Resumo da encomenda</h2>
                <span className="tc-summary-badge">{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</span>
              </div>

              <div className="tc-summary-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="tc-summary-item">
                    <div className="tc-summary-item-media">
                      <img src={item.image_url || '/placeholder.svg'} alt={item.name} />
                      <span className="tc-summary-qty">{item.quantity}</span>
                    </div>
                    <div>
                      <h3 className="tc-summary-item-name">{item.name}</h3>
                      <p className="tc-summary-item-sub">{formatPrice(item.price)} cada</p>
                    </div>
                    <strong className="tc-summary-item-price">{formatPrice(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>

              <div className="tc-selected-shipping">
                <div className="tc-selected-shipping-head">
                  <Truck size={16} />
                  <span>Entrega selecionada</span>
                </div>
                <div className="tc-selected-shipping-card">
                  <img src={selectedShipping.logo} alt={selectedShipping.carrier} className="tc-selected-shipping-logo" />
                  <div className="tc-selected-shipping-copy">
                    <strong>{selectedShipping.label}</strong>
                    <span>{selectedShipping.subtitle}</span>
                  </div>
                  <strong className="tc-selected-shipping-price">{formatPrice(selectedShipping.price)}</strong>
                </div>
              </div>

              <div className="tc-summary-totals">
                <div className="tc-summary-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(productsSubtotal)}</span>
                </div>
                <div className="tc-summary-row">
                  <span>Portes</span>
                  <span>{formatPrice(shippingCost)}</span>
                </div>
                <div className="tc-summary-row total">
                  <span>Total a pagar</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default TransparentCheckout;
