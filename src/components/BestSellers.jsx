import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import './BestSellers.css';

// Fallback static products (used when Supabase has no data yet)
const fallbackProducts = [
    {
        id: 1,
        name: 'Amber da Meia-Noite',
        category: 'Rituals',
        price: '45,00 €',
        img: '/placeholder.svg',
        badge: 'Mais Vendido',
        rating: 4.9
    },
    {
        id: 2,
        name: 'Essência de Seda',
        category: 'Discovery',
        price: '32,00 €',
        img: '/placeholder.svg',
        rating: 4.8
    },
    {
        id: 3,
        name: 'Vela Veludo & Conexão',
        category: 'Atmosphere',
        price: '48,00 €',
        img: '/placeholder.svg',
        badge: 'Novidade',
        rating: 5.0
    },
    {
        id: 4,
        name: 'Ritual Orvalho da Manhã',
        category: 'Rituals',
        price: '28,00 €',
        img: '/placeholder.svg',
        rating: 4.7
    }
];

const SORT_OPTIONS = [
    { value: 'popular', label: 'Populares' },
    { value: 'newest', label: 'Mais Recentes' },
    { value: 'price_asc', label: 'Preço: Menor → Maior' },
    { value: 'price_desc', label: 'Preço: Maior → Menor' },
    { value: 'bestseller', label: 'Mais Vendidos' }
];

const BestSellers = ({ activeCategory, activeSearch, forceShowAll }) => {
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usingFallback, setUsingFallback] = useState(false);

    // Filters
    const [sortBy, setSortBy] = useState('popular');
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const ITEMS_PER_PAGE = 24;

    const isFiltering = activeCategory || activeSearch || forceShowAll;

    // Reset page when filters change
    useEffect(() => {
        setPage(0);
    }, [activeCategory, activeSearch, sortBy, priceMin, priceMax]);

    useEffect(() => {
        fetchProducts();
    }, [activeCategory, activeSearch, sortBy, page]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('products')
                .select('id, name, category, price, stock, image_url, is_new, is_bestseller, is_featured', { count: 'exact' })
                .eq('status', 'active');

            // Apply search
            if (activeSearch) {
                query = query.or(`name.ilike.%${activeSearch}%,description.ilike.%${activeSearch}%`);
            }

            // Apply category
            if (activeCategory) {
                query = query.ilike('category', `${activeCategory}%`);
            }

            // Apply price filters
            if (priceMin) query = query.gte('price', parseFloat(priceMin));
            if (priceMax) query = query.lte('price', parseFloat(priceMax));

            // Apply sort
            switch (sortBy) {
                case 'newest':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'price_asc':
                    query = query.order('price', { ascending: true });
                    break;
                case 'price_desc':
                    query = query.order('price', { ascending: false });
                    break;
                case 'bestseller':
                    query = query.eq('is_bestseller', true).order('stock', { ascending: false });
                    break;
                default: // 'popular'
                    query = query.order('stock', { ascending: false });
                    break;
            }

            // Pagination
            if (isFiltering) {
                query = query.range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);
            } else {
                query = query.limit(8);
            }

            const { data, count, error } = await query;
            if (error) throw error;

            if (data && data.length > 0) {
                setProducts(data);
                setTotalCount(count || 0);
                setUsingFallback(false);
            } else {
                setProducts(isFiltering ? [] : fallbackProducts);
                setTotalCount(isFiltering ? 0 : fallbackProducts.length);
                setUsingFallback(!isFiltering);
            }
        } catch (error) {
            console.warn('Supabase fetch failed, using fallback products:', error.message);
            setProducts(fallbackProducts);
            setTotalCount(fallbackProducts.length);
            setUsingFallback(true);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyPriceFilter = () => {
        fetchProducts();
    };

    const handleClearFilters = () => {
        setPriceMin('');
        setPriceMax('');
        setSortBy('popular');
    };

    const formatPrice = (product) => {
        if (usingFallback) return product.price;
        if (!product.price) return 'Preço sob consulta';
        return `${parseFloat(product.price).toFixed(2).replace('.', ',')} €`;
    };

    const getProductImage = (product) => {
        if (usingFallback) return product.img;
        return product.image_url || '/placeholder.svg';
    };

    const getProductBadge = (product) => {
        if (usingFallback) return product.badge;
        if (product.is_bestseller) return 'Mais Vendido';
        if (product.is_new) return 'Novidade';
        return null;
    };

    const getTitle = () => {
        if (activeSearch) return `Pesquisa: "${activeSearch}"`;
        if (activeCategory) return activeCategory;
        return 'Escolhas da Comunidade';
    };

    const renderFilterToolbar = () => {
        if (!isFiltering) return null;

        const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

        return (
            <div className="filter-toolbar">
                <div className="filter-toolbar-row">
                    <div className="filter-sort">
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-actions-right">
                        <button className="filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
                            <SlidersHorizontal size={16} />
                            Filtros
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="filter-expanded">
                        <div className="filter-price-range">
                            <label>Preço</label>
                            <div className="price-inputs">
                                <input
                                    type="number"
                                    placeholder="Mín"
                                    value={priceMin}
                                    onChange={(e) => setPriceMin(e.target.value)}
                                />
                                <span>—</span>
                                <input
                                    type="number"
                                    placeholder="Máx"
                                    value={priceMax}
                                    onChange={(e) => setPriceMax(e.target.value)}
                                />
                                <button className="btn-filter-apply" onClick={handleApplyPriceFilter}>Aplicar</button>
                            </div>
                        </div>
                        <button className="btn-filter-clear" onClick={handleClearFilters}>Limpar filtros</button>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            className="pagination-btn"
                            disabled={page === 0}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                        >
                            <ChevronLeft size={16} />
                            Anterior
                        </button>
                        <span className="pagination-text">Página {page + 1} de {totalPages}</span>
                        <button
                            className="pagination-btn"
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        >
                            Próxima
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <section className="bestsellers-section" style={{ minHeight: '60vh' }}>
                <div className="container">
                    <h2 className="section-title text-center">{getTitle()}</h2>
                    <div className="product-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="product-card loading-skeleton">
                                <div className="skeleton-image"></div>
                                <div className="skeleton-text"></div>
                                <div className="skeleton-text short"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="bestsellers-section" style={{ minHeight: '60vh' }}>
            <div className="container">
                <h2 className="section-title text-center">{getTitle()}</h2>

                {/* Filter Toolbar Top */}
                {renderFilterToolbar()}

                {products.length === 0 && !loading ? (
                    <div className="no-products-message">
                        <p>Nenhum produto encontrado para esta seleção.</p>
                        <button className="btn-secondary" onClick={handleClearFilters}>Limpar filtros</button>
                    </div>
                ) : (
                    <div className="product-grid">
                        {products.map(product => (
                            <div key={product.id} className="product-card">
                                <div className="product-image-container" onClick={() => navigate(`/produto/${product.id}`)} style={{ cursor: 'pointer' }}>
                                    {getProductBadge(product) && (
                                        <span className={`product-badge ${getProductBadge(product) === 'Mais Vendido' ? 'bestseller' : 'new-info'}`}>
                                            {getProductBadge(product)}
                                        </span>
                                    )}
                                    <img src={getProductImage(product)} alt={product.name} loading="lazy" onError={(e) => { e.target.src = '/placeholder.svg'; }} />
                                    <button className="wishlist-btn" aria-label="Adicionar aos favoritos" onClick={(e) => e.stopPropagation()}>
                                        <Heart size={20} strokeWidth={1.5} />
                                    </button>
                                </div>

                                <div className="quick-add">
                                    <button className="add-to-cart-btn" onClick={() => addToCart(product)}>
                                        <ShoppingBag size={16} strokeWidth={1.5} />
                                        <span>Adicionar ao Cesto</span>
                                    </button>
                                </div>

                                <div className="product-info" onClick={() => navigate(`/produto/${product.id}`)} style={{ cursor: 'pointer' }}>
                                    <div className="product-category">{product.category || 'Geral'}</div>
                                    <div className="product-rating">
                                        <span className="stars">★★★★★</span>
                                        <span className="rating-score">({usingFallback ? product.rating : '4.8'})</span>
                                    </div>
                                    <h3 className="product-name">{product.name}</h3>
                                    <div className="product-price">{formatPrice(product)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filter Toolbar Bottom */}
                {renderFilterToolbar()}

                {!isFiltering && (
                    <div className="text-center view-all-container">
                        <button className="btn-secondary" onClick={() => navigate('/loja')}>Ver todos os produtos</button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default BestSellers;
