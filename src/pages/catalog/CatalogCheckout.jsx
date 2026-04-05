import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, User } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useCart } from '../../context/CartContext';
import { createStripeCheckoutSession } from '../../utils/stripeCheckout';
import './Catalog.css';

const CatalogCheckout = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { cartItems, cartTotal } = useCart();

    const [reseller, setReseller] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

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
        const fetchReseller = async () => {
            const { data } = await supabase
                .from('resellers')
                .select('id, full_name, slug, catalog_title, avatar_url, is_active, status')
                .eq('slug', slug)
                .maybeSingle();

            const isAvailable =
                typeof data?.status === 'string'
                    ? data.status === 'active'
                    : data?.is_active === true;

            if (!data || !isAvailable) {
                navigate('/');
                return;
            }

            setReseller(data);
        };

        fetchReseller();

        if (new URLSearchParams(window.location.search).get('checkout') === 'cancelled') {
            setErrorMsg('O checkout Stripe foi cancelado. Pode retomar a compra quando quiser.');
        }
    }, [slug, navigate]);

    if (cartItems.length === 0 && !submitting) {
        return (
            <div className="catalog-not-found">
                <h2>O seu cesto esta vazio</h2>
                <p>Adicione produtos do catalogo antes de finalizar a compra.</p>
                <Link to={`/${slug}`} className="catalog-btn-primary">Voltar ao Catalogo</Link>
            </div>
        );
    }

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setErrorMsg('Por favor, introduza um email valido.');
            return false;
        }
        const phoneClean = formData.phone.replace(/\s/g, '');
        if (!/^\+?\d{9,15}$/.test(phoneClean)) {
            setErrorMsg('Por favor, introduza um numero de telefone valido.');
            return false;
        }
        if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.postalCode.trim()) {
            setErrorMsg('Por favor, preencha todos os campos obrigatorios.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMsg(null);
        if (!validate()) return;
        setSubmitting(true);

        try {
            const checkoutSession = await createStripeCheckoutSession({
                type: 'catalog_order',
                source: 'catalog',
                resellerId: reseller.id,
                resellerSlug: slug,
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
            console.error('Catalog Stripe checkout error:', error);
            setErrorMsg('Ocorreu um erro ao iniciar o pagamento. Tente novamente.');
            setSubmitting(false);
        }
    };

    return (
        <div className="catalog-page">
            <header className="catalog-header">
                <div className="catalog-header-inner">
                    <Link to={`/${slug}`} className="catalog-back-link">
                        <ChevronLeft size={18} /> Voltar ao catalogo
                    </Link>
                    <Link to={`/${slug}`} className="catalog-logo">LYRA</Link>
                    <div style={{ width: '140px' }}></div>
                </div>
            </header>

            {reseller && (
                <div className="catalog-checkout-attribution">
                    <div className="catalog-attribution-inner">
                        {reseller.avatar_url ? (
                            <img src={reseller.avatar_url} alt="" className="catalog-mini-avatar" />
                        ) : (
                            <div className="catalog-mini-avatar-placeholder"><User size={16} /></div>
                        )}
                        <div>
                            <span className="catalog-attribution-label">A comprar com:</span>
                            <strong>{reseller.catalog_title || `${reseller.full_name} - Consultora LYRA`}</strong>
                        </div>
                    </div>
                </div>
            )}

            <div className="catalog-checkout-grid">
                <div className="catalog-checkout-form">
                    <form onSubmit={handleSubmit}>
                        {errorMsg && <div className="catalog-checkout-error">{errorMsg}</div>}

                        <section className="catalog-checkout-section">
                            <h3>Informacao de Contacto</h3>
                            <div className="catalog-form-group">
                                <label>Email *</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleChange} />
                            </div>
                            <div className="catalog-form-group">
                                <label>Telemovel *</label>
                                <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                            </div>
                        </section>

                        <section className="catalog-checkout-section">
                            <h3>Morada de Envio</h3>
                            <div className="catalog-form-group">
                                <label>Nome Completo *</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleChange} />
                            </div>
                            <div className="catalog-form-group">
                                <label>Morada Completa *</label>
                                <input required type="text" name="address" value={formData.address} onChange={handleChange} />
                            </div>
                            <div className="catalog-form-row">
                                <div className="catalog-form-group">
                                    <label>Codigo Postal *</label>
                                    <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} />
                                </div>
                                <div className="catalog-form-group">
                                    <label>Cidade *</label>
                                    <input required type="text" name="city" value={formData.city} onChange={handleChange} />
                                </div>
                            </div>
                        </section>

                        <section className="catalog-checkout-section">
                            <h3>Pagamento</h3>
                            <div className="catalog-payment-options">
                                <label className="active">
                                    <input type="radio" name="paymentMethod" value="stripe" checked readOnly />
                                    <span>Cartao / Apple Pay / Google Pay via Stripe</span>
                                </label>
                            </div>
                        </section>

                        <button type="submit" className="catalog-btn-buy-large" disabled={submitting} style={{ width: '100%', marginTop: '1rem' }}>
                            {submitting ? 'A processar...' : 'Pagar com Stripe'}
                            {!submitting && <ShieldCheck size={18} />}
                        </button>
                    </form>
                </div>

                <div className="catalog-checkout-summary">
                    <div className="catalog-summary-card">
                        <h3>Resumo da Encomenda</h3>
                        <div className="catalog-summary-items">
                            {cartItems.map((item) => (
                                <div key={item.id} className="catalog-summary-item">
                                    <div className="catalog-summary-item-img">
                                        <img src={item.image_url || '/placeholder.svg'} alt={item.name} />
                                        <span className="catalog-summary-qty">{item.quantity}</span>
                                    </div>
                                    <div className="catalog-summary-item-info">
                                        <h4>{item.name}</h4>
                                    </div>
                                    <div className="catalog-summary-item-price">
                                        {(item.price * item.quantity).toFixed(2).replace('.', ',')} EUR
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="catalog-summary-totals">
                            <div className="catalog-summary-row">
                                <span>Subtotal</span>
                                <span>{cartTotal.toFixed(2).replace('.', ',')} EUR</span>
                            </div>
                            <div className="catalog-summary-row">
                                <span>Envio</span>
                                <span>Gratis</span>
                            </div>
                            <div className="catalog-summary-row catalog-summary-total">
                                <span>Total</span>
                                <span>{cartTotal.toFixed(2).replace('.', ',')} EUR</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CatalogCheckout;
