import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Package } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';
import { syncStripeCheckoutSession } from '../utils/stripeCheckout';
import './OrderConfirmation.css';

const isPaidOrder = (order) =>
  order?.payment_status === 'paid' || order?.status === 'paid';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const pollAfterStripe = searchParams.get('checkout') === 'success';
    let isCancelled = false;

    const fetchOrderDetails = async () => {
      try {
        if (sessionId) {
          try {
            await syncStripeCheckoutSession(sessionId);
          } catch (error) {
            console.error('Stripe session sync on confirmation failed:', error);
          }
        }

        for (let attempt = 0; attempt < (pollAfterStripe ? 6 : 1); attempt += 1) {
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

          if (orderError) throw orderError;

          setOrder(orderData);

          const { data: customerData } = await supabase
            .from('customers')
            .select('*')
            .eq('id', orderData.customer_id)
            .single();
          setCustomer(customerData);

          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*, products(name, image_url)')
            .eq('order_id', orderId);
          setOrderItems(itemsData || []);

          if (isPaidOrder(orderData) || !pollAfterStripe) {
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.error('Error fetching order confirmation:', error);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }

    return () => {
      isCancelled = true;
    };
  }, [orderId, searchParams]);

  useEffect(() => {
    if (isPaidOrder(order)) {
      clearCart();
    }
  }, [clearCart, order]);

  const refSlug = searchParams.get('ref');
  const backPath = refSlug ? `/${refSlug}` : '/loja';

  if (loading) {
    return (
      <div className="confirmation-page">
        <Header onMenuClick={() => {}} />
        <div className="confirmation-loading">A carregar os detalhes da sua encomenda...</div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="confirmation-page">
        <Header onMenuClick={() => {}} />
        <div className="confirmation-error">
          <h2>Encomenda nao encontrada</h2>
          <p>Nao foi possivel localizar os detalhes desta encomenda.</p>
          <button className="btn-primary mt-4" onClick={() => navigate(backPath)}>
            Voltar
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <Header onMenuClick={() => {}} />

      <main className="confirmation-main">
        <div className="confirmation-container">
          <div className="confirmation-success-header">
            <CheckCircle2 size={64} className="success-icon" />
            <h1>Obrigado pela sua encomenda, {customer?.name?.split(' ')[0]}!</h1>
            <p className="order-number-badge">Encomenda #{order.id.split('-')[0]}</p>
            <p>
              {isPaidOrder(order)
                ? 'Pagamento confirmado com Stripe. A sua encomenda ja esta em processamento.'
                : 'Recebemos o seu pedido. Estamos a confirmar o pagamento Stripe.'}
            </p>
          </div>

          <div className="confirmation-grid">
            <div className="confirmation-details">
              <section className="detail-section">
                <h3>Informacao de Envio</h3>
                <div className="detail-box">
                  <p>
                    <strong>{customer?.name}</strong>
                  </p>
                  <p>{customer?.address}</p>
                  <p>{customer?.phone}</p>
                  <p>{customer?.email}</p>
                </div>
              </section>

              <section className="detail-section">
                <h3>Metodo de Pagamento</h3>
                <div className="detail-box">
                  <p>Stripe</p>
                  <p className="payment-status">
                    Estado: {isPaidOrder(order) ? 'Pago' : 'A confirmar pagamento'}
                  </p>
                  {order.stripe_checkout_session_id && (
                    <p>Sessao Stripe: {order.stripe_checkout_session_id}</p>
                  )}
                </div>
              </section>
            </div>

            <div className="confirmation-items">
              <h3>
                Resumo dos Produtos <Package size={18} />
              </h3>
              <div className="items-list">
                {orderItems.map((item) => (
                  <div key={item.id} className="conf-item">
                    <div className="conf-item-img">
                      <img src={item.products?.image_url || '/placeholder.svg'} alt="" />
                    </div>
                    <div className="conf-item-info">
                      <h4>{item.products?.name}</h4>
                      <p className="conf-item-qty">Qtd: {item.quantity}</p>
                    </div>
                    <div className="conf-item-price">
                      {(item.price_at_time * item.quantity).toFixed(2).replace('.', ',')} EUR
                    </div>
                  </div>
                ))}
              </div>

              <div className="conf-total">
                <span>Total Pago</span>
                <span>{Number(order.total_amount || 0).toFixed(2).replace('.', ',')} EUR</span>
              </div>
            </div>
          </div>

          <div className="confirmation-actions">
            <button className="btn-secondary" onClick={() => navigate(backPath)}>
              Continuar a explorar <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderConfirmation;
