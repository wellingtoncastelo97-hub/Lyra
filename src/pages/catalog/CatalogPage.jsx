import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Search, ShoppingBag, MessageCircle, Filter, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useCart } from '../../context/CartContext';
import './Catalog.css';

const ITEMS_PER_PAGE = 24;

const getCategoryLeaf = (value = '') => {
    const parts = value.split(' > ').map((item) => item.trim()).filter(Boolean);
    return parts.at(-1) || value;
};

const getDescriptionPreview = (value = '') =>
    value
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 150);

const CatalogPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [reseller, setReseller] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Fetch reseller by slug
    useEffect(() => {
        const fetchReseller = async () => {
            const { data, error } = await supabase
                .from('resellers')
                .select('id, full_name, slug, whatsapp, bio, avatar_url, catalog_title, is_active, status')
                .eq('slug', slug)
                .maybeSingle();

            const isAvailable =
                typeof data?.status === 'string'
                    ? data.status === 'active'
                    : data?.is_active === true;

            if (error || !data || !isAvailable) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            setReseller(data);
        };
        fetchReseller();
    }, [slug]);

    // Fetch catalog products
    const fetchProducts = useCallback(async () => {
        if (!reseller?.id) return;
        setLoading(true);

        // First get reseller's visible products with custom prices
        let rpQuery = supabase
            .from('reseller_products')
            .select('product_id, custom_price')
            .eq('reseller_id', reseller.id)
            .eq('is_visible', true);

        const { data: rpData } = await rpQuery;
        if (!rpData || rpData.length === 0) {
            setProducts([]);
            setTotalCount(0);
            setLoading(false);
            return;
        }

        const priceMap = {};
        rpData.forEach(rp => { priceMap[rp.product_id] = rp.custom_price; });
        const productIds = Object.keys(priceMap);

        // Then fetch product details
        let query = supabase
            .from('products')
            .select('id, name, slug, description, image_url, image_url_2, image_url_3, category, subcategory, brand, price, cost_price, stock', { count: 'exact' })
            .in('id', productIds)
            .eq('status', 'active')
            .order('name', { ascending: true })
            .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

        if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);
        if (selectedCategory) query = query.eq('category', selectedCategory);
        if (selectedBrand) query = query.eq('brand', selectedBrand);

        const { data, count } = await query;

        // Merge custom prices into products
        const merged = (data || []).map(p => ({
            ...p,
            price: priceMap[p.id] || p.price
        }));

        setProducts(merged);
        setTotalCount(count || 0);

        // Extract categories/brands for filters
        if (categories.length === 0) {
            const uniqueCats = [...new Set((data || []).map(p => p.category).filter(Boolean))];
            const uniqueBrands = [...new Set((data || []).map(p => p.brand).filter(Boolean))];
            if (uniqueCats.length > 0) setCategories(uniqueCats);
            if (uniqueBrands.length > 0) setBrands(uniqueBrands);
        }

        setLoading(false);
    }, [reseller?.id, page, searchTerm, selectedCategory, selectedBrand]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);
    useEffect(() => { setPage(0); }, [searchTerm, selectedCategory, selectedBrand]);

    // WhatsApp link builder
    const openWhatsApp = (product = null) => {
        if (!reseller?.whatsapp) return;
        const phone = reseller.whatsapp.replace(/\D/g, '');
        let message = product
            ? `Olá ${reseller.full_name}! Vi o produto "${product.name}" no seu catálogo LYRA e gostaria de saber mais. ${window.location.origin}/${slug}/produto/${product.id}`
            : `Olá ${reseller.full_name}! Estou a ver o seu catálogo LYRA e gostaria de saber mais.`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    // Buy now
    const handleBuyNow = (product) => {
        addToCart({ ...product, image_url: product.image_url }, 1);
        navigate(`/${slug}/checkout`);
    };

    if (notFound) {
        return (
            <div className="catalog-not-found">
                <h2>Catálogo não encontrado</h2>
                <p>Este catálogo não existe ou não está disponível.</p>
                <Link to="/" className="catalog-btn-primary">Voltar ao Início</Link>
            </div>
        );
    }

    if (loading && !reseller) {
        return <div className="catalog-loading">A carregar catálogo...</div>;
    }

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <div className="catalog-page">
            {/* Header */}
            <header className="catalog-header">
                <div className="catalog-header-inner">
                    <div className="catalog-brand">
                        <Link to={`/${slug}`} className="catalog-logo">LYRA</Link>
                    </div>
                    <div className="catalog-search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar produtos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="catalog-header-actions">
                        {reseller?.whatsapp && (
                            <button className="catalog-btn-whatsapp" onClick={() => openWhatsApp()}>
                                <MessageCircle size={18} /> Contactar
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Reseller Banner */}
            <div className="catalog-reseller-banner">
                <div className="catalog-reseller-info">
                    {reseller?.avatar_url ? (
                        <img src={reseller.avatar_url} alt={reseller.full_name} className="catalog-reseller-avatar" />
                    ) : (
                        <div className="catalog-reseller-avatar-placeholder">
                            <User size={28} />
                        </div>
                    )}
                    <div>
                        <h2 className="catalog-reseller-name">
                            {reseller?.catalog_title || `${reseller?.full_name} — Consultora LYRA`}
                        </h2>
                        {reseller?.bio && <p className="catalog-reseller-bio">{reseller.bio}</p>}
                    </div>
                </div>
                <div className="catalog-trust-badge">
                    Catálogo verificado LYRA
                </div>
            </div>

            {/* Filters */}
            <div className="catalog-toolbar">
                <div className="catalog-results-count">
                    {totalCount} {totalCount === 1 ? 'produto' : 'produtos'}
                </div>
                <button className="catalog-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                    <Filter size={16} /> Filtrar
                </button>
            </div>

            {showFilters && (
                <div className="catalog-filters">
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        <option value="">Todas as Categorias</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
                        <option value="">Todas as Marcas</option>
                        {brands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    {(selectedCategory || selectedBrand) && (
                        <button
                            className="catalog-clear-filters"
                            onClick={() => { setSelectedCategory(''); setSelectedBrand(''); }}
                        >
                            Limpar filtros
                        </button>
                    )}
                </div>
            )}

            {/* Products Grid */}
            {loading ? (
                <div className="catalog-loading">A carregar...</div>
            ) : products.length === 0 ? (
                <div className="catalog-empty">
                    <ShoppingBag size={48} color="#ccc" />
                    <p>Nenhum produto encontrado.</p>
                </div>
            ) : (
                <div className="catalog-grid">
                    {products.map(product => (
                        <div key={product.id} className="catalog-product-card">
                            <Link to={`/${slug}/produto/${product.id}`} className="catalog-card-image">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} onError={(e) => { e.target.src = '/placeholder.svg'; }} />
                                ) : (
                                    <div className="catalog-card-placeholder">
                                        <ShoppingBag size={32} color="#ccc" />
                                    </div>
                                )}
                            </Link>
                            <div className="catalog-card-body">
                                <Link to={`/${slug}/produto/${product.id}`} className="catalog-card-name">
                                    {product.name}
                                </Link>
                                <div className="catalog-card-kickers">
                                    {product.brand && <span className="catalog-card-brand">{product.brand}</span>}
                                    {(product.subcategory || product.category) && (
                                        <span className="catalog-card-category">
                                            {product.subcategory || getCategoryLeaf(product.category)}
                                        </span>
                                    )}
                                </div>
                                {product.description && (
                                    <p className="catalog-card-description">
                                        {getDescriptionPreview(product.description)}
                                    </p>
                                )}
                                <div className="catalog-card-price">
                                    {parseFloat(product.price).toFixed(2).replace('.', ',')} €
                                </div>
                                <div className="catalog-card-actions">
                                    <button className="catalog-btn-buy" onClick={() => handleBuyNow(product)}>
                                        Comprar
                                    </button>
                                    {reseller?.whatsapp && (
                                        <button className="catalog-btn-contact" onClick={() => openWhatsApp(product)}>
                                            <MessageCircle size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="catalog-pagination">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                        <ChevronLeft size={16} /> Anterior
                    </button>
                    <span>Página {page + 1} de {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                        Seguinte <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Footer */}
            <footer className="catalog-footer">
                <p>
                    Está a ver o catálogo de <strong>{reseller?.full_name}</strong> — Consultora LYRA
                </p>
                <p className="catalog-footer-sub">
                    Powered by LYRA
                </p>
            </footer>
        </div>
    );
};

export default CatalogPage;
