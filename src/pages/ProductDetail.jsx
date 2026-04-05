import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import { ChevronLeft, ShoppingBag, Minus, Plus, Leaf, Heart, ShieldCheck, Truck } from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import './ProductDetail.css';

const ProductDetail = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState([]);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (!error && data) {
                setProduct(data);
                const { data: related } = await supabase
                    .from('products')
                    .select('id, name, price, image_url, category')
                    .eq('status', 'active')
                    .eq('category', data.category)
                    .neq('id', data.id)
                    .limit(4);
                setRelatedProducts(related || []);
            }
            setLoading(false);
        };
        if (productId) fetchProduct();
        window.scrollTo(0, 0);
    }, [productId]);

    if (loading) {
        return (
            <div className="app">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <div className="product-detail-loading">A carregar produto...</div>
                <Footer />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="app">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <div className="product-detail-empty">
                    <h2>Produto não encontrado</h2>
                    <button className="btn-primary" onClick={() => navigate('/loja')}>Voltar à Loja</button>
                </div>
                <Footer />
            </div>
        );
    }

    const formatPrice = (price) => {
        if (!price) return 'Preço sob consulta';
        return `${parseFloat(price).toFixed(2).replace('.', ',')} €`;
    };

    return (
        <div className="app">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            <Header onMenuClick={() => setSidebarOpen(true)} />

            <main className="product-detail-page">
                <div className="container">
                    <button className="product-back-link" onClick={() => navigate(-1)}>
                        <ChevronLeft size={18} /> Voltar
                    </button>

                    <div className="product-detail-grid">
                        <div className="product-detail-image">
                            <img
                                src={product.image_url || '/placeholder.svg'}
                                alt={product.name}
                                onError={(e) => { e.target.src = '/placeholder.svg'; }}
                            />
                            {product.is_bestseller && <span className="product-detail-badge">Mais Vendido</span>}
                            {product.is_new && <span className="product-detail-badge new">Novidade</span>}
                        </div>

                        <div className="product-detail-info">
                            {product.category && <span className="product-detail-category">{product.category}</span>}
                            <h1 className="product-detail-title">{product.name}</h1>

                            <div className="product-detail-rating">
                                <span className="stars">★★★★★</span>
                                <span>(4.8)</span>
                            </div>

                            <div className="product-detail-price">{formatPrice(product.price)}</div>

                            {product.description && (
                                <p className="product-detail-description">{product.description}</p>
                            )}

                            <div className="product-detail-quantity">
                                <span>Quantidade:</span>
                                <div className="quantity-selector">
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>
                                        <Minus size={16} />
                                    </button>
                                    <span>{quantity}</span>
                                    <button onClick={() => setQuantity(q => q + 1)}>
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="product-detail-actions">
                                <button className="btn-primary product-detail-add" onClick={() => addToCart(product, quantity)}>
                                    <ShoppingBag size={18} />
                                    Adicionar ao Cesto
                                </button>
                                <button className="btn-wishlist" aria-label="Adicionar aos favoritos">
                                    <Heart size={20} />
                                </button>
                            </div>

                            <div className="product-detail-trust">
                                <div className="trust-item">
                                    <Truck size={16} />
                                    <span>Envio grátis acima de 50€</span>
                                </div>
                                <div className="trust-item">
                                    <ShieldCheck size={16} />
                                    <span>Pagamento seguro</span>
                                </div>
                                <div className="trust-item">
                                    <Leaf size={16} />
                                    <span>100% Natural & Vegan</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {relatedProducts.length > 0 && (
                        <section className="related-products">
                            <h2 className="section-title text-center">Também poderá gostar</h2>
                            <div className="related-grid">
                                {relatedProducts.map(rp => (
                                    <div key={rp.id} className="related-card" onClick={() => navigate(`/produto/${rp.id}`)}>
                                        <img src={rp.image_url || '/placeholder.svg'} alt={rp.name} loading="lazy" onError={(e) => { e.target.src = '/placeholder.svg'; }} />
                                        <h4>{rp.name}</h4>
                                        <span>{formatPrice(rp.price)}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProductDetail;
