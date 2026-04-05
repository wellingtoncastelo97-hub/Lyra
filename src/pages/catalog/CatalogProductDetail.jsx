import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ShoppingBag, MessageCircle, Minus, Plus, User, ShieldCheck } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useCart } from '../../context/CartContext';
import './Catalog.css';

const getProductImages = (product) =>
    [product?.image_url, product?.image_url_2, product?.image_url_3, ...(Array.isArray(product?.images) ? product.images : [])]
        .filter(Boolean)
        .filter((image, index, list) => list.indexOf(image) === index);

const CatalogProductDetail = () => {
    const { slug, productId } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [reseller, setReseller] = useState(null);
    const [product, setProduct] = useState(null);
    const [customPrice, setCustomPrice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch reseller
            const { data: resellerData } = await supabase
                .from('resellers')
                .select('id, full_name, slug, whatsapp, bio, avatar_url, catalog_title, is_active, status')
                .eq('slug', slug)
                .maybeSingle();

            const isAvailable =
                typeof resellerData?.status === 'string'
                    ? resellerData.status === 'active'
                    : resellerData?.is_active === true;

            if (!resellerData || !isAvailable) {
                navigate('/');
                return;
            }
            setReseller(resellerData);

            // Fetch product
            const { data: productData } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .eq('status', 'active')
                .single();

            if (!productData) {
                navigate(`/${slug}`);
                return;
            }

            // Fetch reseller's custom price
            const { data: rpData } = await supabase
                .from('reseller_products')
                .select('custom_price, is_visible')
                .eq('reseller_id', resellerData.id)
                .eq('product_id', productId)
                .eq('is_visible', true)
                .single();

            if (!rpData) {
                navigate(`/${slug}`);
                return;
            }

            setProduct(productData);
            setCustomPrice(rpData.custom_price);
            setLoading(false);
        };

        fetchData();
    }, [slug, productId, navigate]);

    const openWhatsApp = () => {
        if (!reseller?.whatsapp) return;
        const phone = reseller.whatsapp.replace(/\D/g, '');
        const message = `Olá ${reseller.full_name}! Vi o produto "${product.name}" no seu catálogo LYRA e gostaria de saber mais. ${window.location.href}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleBuyNow = () => {
        addToCart({
            ...product,
            price: customPrice,
            reseller_id: reseller.id,
            reseller_slug: slug
        }, quantity);
        navigate(`/${slug}/checkout`);
    };

    const handleAddToCart = () => {
        addToCart({
            ...product,
            price: customPrice,
            reseller_id: reseller.id,
            reseller_slug: slug
        }, quantity);
    };

    if (loading) {
        return <div className="catalog-loading">A carregar produto...</div>;
    }

    // Build images array
    const images = getProductImages(product);
    if (images.length === 0) images.push('/placeholder.svg');

    return (
        <div className="catalog-page">
            {/* Header */}
            <header className="catalog-header">
                <div className="catalog-header-inner">
                    <Link to={`/${slug}`} className="catalog-logo">LYRA</Link>
                    <div className="catalog-header-actions">
                        <Link to={`/${slug}`} className="catalog-back-link">
                            <ChevronLeft size={18} /> Voltar ao catálogo
                        </Link>
                    </div>
                </div>
            </header>

            {/* Product Detail */}
            <div className="catalog-detail">
                <div className="catalog-detail-images">
                    <div className="catalog-detail-main-image">
                        <img src={images[selectedImage]} alt={product.name} onError={(e) => { e.target.src = '/placeholder.svg'; }} />
                    </div>
                    {images.length > 1 && (
                        <div className="catalog-detail-thumbs">
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    className={`catalog-thumb ${i === selectedImage ? 'active' : ''}`}
                                    onClick={() => setSelectedImage(i)}
                                >
                                    <img src={img} alt="" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="catalog-detail-info">
                    {product.brand && <span className="catalog-detail-brand">{product.brand}</span>}
                    <h1 className="catalog-detail-name">{product.name}</h1>
                    {(product.subcategory || product.category) && (
                        <div className="catalog-detail-category">
                            {product.subcategory || product.category}
                        </div>
                    )}

                    <div className="catalog-detail-price">
                        {parseFloat(customPrice).toFixed(2).replace('.', ',')} €
                    </div>

                    {product.description && (
                        <div className="catalog-detail-desc">
                            <p>{product.description}</p>
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="catalog-detail-qty">
                        <span>Quantidade:</span>
                        <div className="catalog-qty-controls">
                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus size={16} /></button>
                            <span>{quantity}</span>
                            <button onClick={() => setQuantity(q => q + 1)}><Plus size={16} /></button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="catalog-detail-actions">
                        <button className="catalog-btn-buy-large" onClick={handleBuyNow}>
                            <ShoppingBag size={18} /> Comprar Agora
                        </button>
                        {reseller?.whatsapp && (
                            <button className="catalog-btn-contact-large" onClick={openWhatsApp}>
                                <MessageCircle size={18} /> Falar com Consultora
                            </button>
                        )}
                    </div>

                    <button className="catalog-btn-add-cart" onClick={handleAddToCart}>
                        Adicionar ao Cesto
                    </button>

                    {/* Trust */}
                    <div className="catalog-detail-trust">
                        <ShieldCheck size={16} />
                        <span>Compra segura via LYRA</span>
                    </div>

                    {/* Reseller info */}
                    <div className="catalog-detail-reseller">
                        <div className="catalog-detail-reseller-info">
                            {reseller?.avatar_url ? (
                                <img src={reseller.avatar_url} alt="" className="catalog-mini-avatar" />
                            ) : (
                                <div className="catalog-mini-avatar-placeholder"><User size={16} /></div>
                            )}
                            <div>
                                <span className="catalog-detail-reseller-label">A comprar com:</span>
                                <strong>{reseller?.catalog_title || `${reseller?.full_name} — Consultora LYRA`}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="catalog-footer">
                <p>
                    Está a ver o catálogo de <strong>{reseller?.full_name}</strong> — Consultora LYRA
                </p>
                <p className="catalog-footer-sub">Powered by LYRA</p>
            </footer>
        </div>
    );
};

export default CatalogProductDetail;
