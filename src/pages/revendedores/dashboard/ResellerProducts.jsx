import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Minus, Eye, EyeOff, ChevronLeft, ChevronRight, Package, Check, X, Filter, TrendingUp } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { useReseller } from '../../../context/ResellerContext';
import {
    calculateUnitMargins,
    formatCurrency,
    getLyraResellerCost,
    getRetailPrice,
    getSalePrice,
    roundMoney,
} from '../../../utils/finance';

const ITEMS_PER_PAGE = 20;

const getProductImages = (product) => [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean);

const getCategoryLeaf = (value = '') => {
    const parts = value.split(' > ').map((item) => item.trim()).filter(Boolean);
    return parts.at(-1) || value;
};

const getDescriptionPreview = (value = '') =>
    value
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 170);

const ResellerProducts = () => {
    const { reseller } = useReseller();
    const [products, setProducts] = useState([]);
    const [resellerProducts, setResellerProducts] = useState({});
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [saving, setSaving] = useState({});

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [viewMode, setViewMode] = useState('all'); // 'all' | 'selected'

    // Filter options
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    // Bulk pricing
    const [bulkMarkup, setBulkMarkup] = useState('');
    const [showBulkModal, setShowBulkModal] = useState(false);

    // Stats
    const [stats, setStats] = useState({ total: 0, selected: 0, avgProfit: 0 });

    // Fetch filter options
    useEffect(() => {
        const fetchFilters = async () => {
            const { data: catData } = await supabase.rpc('get_categories');
            if (catData) setCategories(catData.map(c => c.category).filter(Boolean));

            const { data: brandData } = await supabase.rpc('get_brands');
            if (brandData) setBrands(brandData.map(b => b.brand).filter(Boolean));
        };
        fetchFilters();
    }, []);

    // Fetch reseller's selected products
    const fetchResellerProducts = useCallback(async () => {
        if (!reseller?.id) return;
        const { data } = await supabase
            .from('reseller_products')
            .select('product_id, custom_price, is_visible')
            .eq('reseller_id', reseller.id);

        const map = {};
        (data || []).forEach(rp => {
            map[rp.product_id] = { custom_price: rp.custom_price, is_visible: rp.is_visible };
        });
        setResellerProducts(map);
        setStats(prev => ({ ...prev, selected: Object.keys(map).length }));
    }, [reseller?.id]);

    useEffect(() => {
        fetchResellerProducts();
    }, [fetchResellerProducts]);

    // Fetch products
    const fetchProducts = useCallback(async () => {
        setLoading(true);

        if (viewMode === 'selected') {
            // Show only products in reseller's catalog
            const selectedIds = Object.keys(resellerProducts);
            if (selectedIds.length === 0) {
                setProducts([]);
                setTotalCount(0);
                setLoading(false);
                return;
            }

            let query = supabase
                .from('products')
                .select('*', { count: 'exact' })
                .in('id', selectedIds)
                .order('name', { ascending: true })
                .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

            if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);
            if (selectedCategory) query = query.eq('category', selectedCategory);
            if (selectedBrand) query = query.eq('brand', selectedBrand);

            const { data, count } = await query;
            setProducts(data || []);
            setTotalCount(count || 0);
        } else {
            let query = supabase
                .from('products')
                .select('*', { count: 'exact' })
                .eq('status', 'active')
                .order('name', { ascending: true })
                .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

            if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);
            if (selectedCategory) query = query.eq('category', selectedCategory);
            if (selectedBrand) query = query.eq('brand', selectedBrand);

            const { data, count } = await query;
            setProducts(data || []);
            setTotalCount(count || 0);
            setStats(prev => ({ ...prev, total: count || 0 }));
        }

        setLoading(false);
    }, [page, searchTerm, selectedCategory, selectedBrand, viewMode, resellerProducts]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);
    useEffect(() => { setPage(0); }, [searchTerm, selectedCategory, selectedBrand, viewMode]);

    // Add product to catalog
    const addProduct = async (product) => {
        if (!reseller?.id) return;
        const productId = product.id;
        setSaving(prev => ({ ...prev, [productId]: true }));

        const suggestedPrice = getRetailPrice(product) || roundMoney(getLyraResellerCost(product) * 1.35);

        const { error } = await supabase
            .from('reseller_products')
            .upsert({
                reseller_id: reseller.id,
                product_id: productId,
                custom_price: suggestedPrice,
                is_visible: true
            }, { onConflict: 'reseller_id,product_id' });

        if (!error) {
            setResellerProducts(prev => ({
                ...prev,
                [productId]: { custom_price: suggestedPrice, is_visible: true }
            }));
            setStats(prev => ({ ...prev, selected: prev.selected + 1 }));
        }
        setSaving(prev => ({ ...prev, [productId]: false }));
    };

    // Remove product from catalog
    const removeProduct = async (productId) => {
        if (!reseller?.id) return;
        setSaving(prev => ({ ...prev, [productId]: true }));

        const { error } = await supabase
            .from('reseller_products')
            .delete()
            .eq('reseller_id', reseller.id)
            .eq('product_id', productId);

        if (!error) {
            setResellerProducts(prev => {
                const next = { ...prev };
                delete next[productId];
                return next;
            });
            setStats(prev => ({ ...prev, selected: prev.selected - 1 }));
        }
        setSaving(prev => ({ ...prev, [productId]: false }));
    };

    // Update custom price
    const updatePrice = async (productId, newPrice) => {
        if (!reseller?.id || !newPrice || isNaN(newPrice)) return;

        setResellerProducts(prev => ({
            ...prev,
            [productId]: { ...prev[productId], custom_price: parseFloat(newPrice) }
        }));

        await supabase
            .from('reseller_products')
            .update({ custom_price: parseFloat(newPrice) })
            .eq('reseller_id', reseller.id)
            .eq('product_id', productId);
    };

    // Toggle visibility
    const toggleVisibility = async (productId) => {
        if (!reseller?.id) return;
        const current = resellerProducts[productId];
        if (!current) return;

        const newVisible = !current.is_visible;
        setResellerProducts(prev => ({
            ...prev,
            [productId]: { ...prev[productId], is_visible: newVisible }
        }));

        await supabase
            .from('reseller_products')
            .update({ is_visible: newVisible })
            .eq('reseller_id', reseller.id)
            .eq('product_id', productId);
    };

    // Bulk apply markup
    const applyBulkMarkup = async () => {
        if (!bulkMarkup || isNaN(bulkMarkup)) return;
        const markup = parseFloat(bulkMarkup) / 100;

        const updates = products
            .filter(p => resellerProducts[p.id])
            .map(p => ({
                reseller_id: reseller.id,
                product_id: p.id,
                custom_price: roundMoney(getLyraResellerCost(p) * (1 + markup)),
                is_visible: resellerProducts[p.id].is_visible
            }));

        if (updates.length === 0) return;

        const { error } = await supabase
            .from('reseller_products')
            .upsert(updates, { onConflict: 'reseller_id,product_id' });

        if (!error) {
            await fetchResellerProducts();
            setShowBulkModal(false);
            setBulkMarkup('');
        }
    };

    // Add all visible products
    const addAllVisible = async () => {
        if (!reseller?.id) return;
        const toAdd = products
            .filter(p => !resellerProducts[p.id])
            .map(p => ({
                reseller_id: reseller.id,
                product_id: p.id,
                custom_price: getRetailPrice(p) || roundMoney(getLyraResellerCost(p) * 1.35),
                is_visible: true
            }));

        if (toAdd.length === 0) return;

        const { error } = await supabase
            .from('reseller_products')
            .upsert(toAdd, { onConflict: 'reseller_id,product_id' });

        if (!error) {
            await fetchResellerProducts();
        }
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const isSelected = (productId) => !!resellerProducts[productId];

    const getProfit = (product) => {
        const rp = resellerProducts[product.id];
        if (!rp) return null;
        return calculateUnitMargins({
            supplierCost: product.cost_price,
            lyraCost: getLyraResellerCost(product),
            salePrice: getSalePrice(product, rp),
        }).resellerProfit;
    };

    const getProfitMargin = (product) => {
        const rp = resellerProducts[product.id];
        if (!rp) return null;
        const salePrice = getSalePrice(product, rp);
        if (!salePrice) return null;
        const profit = getProfit(product);
        return (((profit || 0) / salePrice) * 100).toFixed(0);
    };

    return (
        <>
            <div className="reseller-topbar reseller-topbar-split">
                <div className="rd-page-intro">
                    <h1>Meu Catálogo</h1>
                    <p>
                        Selecione produtos, defina os seus preços e controle o que aparece no seu catálogo.
                    </p>
                </div>
                <div className="rd-inline-actions">
                    <button
                        className="rp-btn rp-btn-outline"
                        onClick={() => setShowBulkModal(true)}
                        disabled={stats.selected === 0}
                    >
                        <TrendingUp size={16} /> Margem em Lote
                    </button>
                    <button
                        className="rp-btn rp-btn-primary"
                        onClick={addAllVisible}
                    >
                        <Plus size={16} /> Adicionar Todos da Página
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="reseller-stats-grid reseller-stats-grid-compact">
                <div className="r-stat-card border-gold">
                    <span className="r-stat-label">Produtos no Catálogo</span>
                    <span className="r-stat-value highlight">{stats.selected}</span>
                </div>
                <div className="r-stat-card">
                    <span className="r-stat-label">Total Disponível</span>
                    <span className="r-stat-value">{stats.total.toLocaleString()}</span>
                </div>
                <div className="r-stat-card">
                    <span className="r-stat-label">Link do Catálogo</span>
                    <div className="rd-stat-inline">
                        <code className="rd-stat-code">
                            /{reseller?.slug || 'seu-nome'}
                        </code>
                        <button
                            className="rp-btn-icon"
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/${reseller?.slug}`);
                                alert('Link copiado!');
                            }}
                            title="Copiar link"
                        >
                            Copiar
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="rp-filters">
                <div className="rp-view-tabs">
                    <button
                        className={viewMode === 'all' ? 'active' : ''}
                        onClick={() => setViewMode('all')}
                    >
                        Todos os Produtos
                    </button>
                    <button
                        className={viewMode === 'selected' ? 'active' : ''}
                        onClick={() => setViewMode('selected')}
                    >
                        Meu Catálogo ({stats.selected})
                    </button>
                </div>

                <div className="rp-filter-row">
                    <div className="rp-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Pesquisar produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        <option value="">Todas as Categorias</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
                        <option value="">Todas as Marcas</option>
                        {brands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="rp-loading">A carregar produtos...</div>
            ) : products.length === 0 ? (
                <div className="rp-empty">
                    <Package size={48} color="#ccc" />
                    <p>{viewMode === 'selected'
                        ? 'Ainda não adicionou produtos ao seu catálogo. Vá a "Todos os Produtos" e comece a selecionar.'
                        : 'Nenhum produto encontrado com esses filtros.'
                    }</p>
                </div>
            ) : (
                <div className="rp-product-grid">
                    {products.map(product => {
                        const selected = isSelected(product.id);
                        const rp = resellerProducts[product.id];
                        const profit = getProfit(product);
                        const margin = getProfitMargin(product);
                        const isSaving = saving[product.id];
                        const gallery = getProductImages(product);
                        const categoryLeaf = product.subcategory || getCategoryLeaf(product.category);
                        const lyraCost = getLyraResellerCost(product);
                        const retailPrice = getRetailPrice(product);
                        const salePrice = selected ? getSalePrice(product, rp) : retailPrice;
                        const marginSplit = calculateUnitMargins({
                            supplierCost: product.cost_price,
                            lyraCost,
                            salePrice,
                        });

                        return (
                            <div key={product.id} className={`rp-product-card ${selected ? 'selected' : ''}`}>
                                {selected && (
                                    <div className="rp-card-badge">
                                        <Check size={12} /> No catálogo
                                    </div>
                                )}

                                <div className="rp-card-image">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} onError={(e) => { e.target.src = '/placeholder.svg'; }} />
                                    ) : (
                                        <div className="rp-card-placeholder"><Package size={32} color="#ccc" /></div>
                                    )}
                                    {gallery.length > 1 && (
                                        <div className="rp-card-gallery-count">
                                            +{gallery.length - 1} fotos
                                        </div>
                                    )}
                                </div>

                                <div className="rp-card-body">
                                    <h4 className="rp-card-name">{product.name}</h4>
                                    <div className="rp-card-meta">
                                        {product.brand && <span className="rp-tag">{product.brand}</span>}
                                        {categoryLeaf && <span className="rp-tag rp-tag-accent">{categoryLeaf}</span>}
                                    </div>
                                    {product.category && (
                                        <p className="rp-card-category-path">{product.category}</p>
                                    )}
                                    {product.description && (
                                        <p className="rp-card-description">
                                            {getDescriptionPreview(product.description)}
                                        </p>
                                    )}
                                    <div className="rp-card-status">
                                        <span className={`rp-stock-badge ${product.stock > 0 ? 'is-in' : 'is-out'}`}>
                                            {product.stock > 0 ? `${product.stock} em stock` : 'Sem stock'}
                                        </span>
                                        {gallery.length > 1 && (
                                            <span className="rp-card-status-note">{gallery.length} imagens</span>
                                        )}
                                    </div>

                                    <div className="rp-card-prices">
                                        {/* custo fornecedor ocultado para revendedoras */}
                                        <div className="rp-price-row" style={{ display: 'none' }}>
                                            <span className="rp-price-label">Custo do produto:</span>
                                            <span className="rp-price-cost">
                                                {marginSplit.supplierCost ? formatCurrency(marginSplit.supplierCost) : '—'}
                                            </span>
                                        </div>
                                        <div className="rp-price-row">
                                            <span className="rp-price-label">Custo do produto:</span>
                                            <span className="rp-price-suggested">{lyraCost ? formatCurrency(lyraCost) : '—'}</span>
                                        </div>
                                        <div className="rp-price-row">
                                            <span className="rp-price-label">Venda sugerida:</span>
                                            <span className="rp-price-suggested">{retailPrice ? formatCurrency(retailPrice) : '—'}</span>
                                        </div>
                                        <div className="rp-price-row" style={{ display: 'none' }}>
                                            <span className="rp-price-label">Margem LYRA:</span>
                                            <span className="rp-price-suggested">{formatCurrency(marginSplit.lyraProfit)}</span>
                                        </div>

                                        {selected && (
                                            <>
                                                <div className="rp-price-row rp-price-editable">
                                                    <span className="rp-price-label">Seu preco:</span>
                                                    <div className="rp-price-input-wrap">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={rp?.custom_price || ''}
                                                            onChange={(e) => {
                                                                setResellerProducts(prev => ({
                                                                    ...prev,
                                                                    [product.id]: { ...prev[product.id], custom_price: e.target.value }
                                                                }));
                                                            }}
                                                            onBlur={(e) => updatePrice(product.id, e.target.value)}
                                                            className="rp-price-input"
                                                        />
                                                        <span className="rp-price-currency">€</span>
                                                    </div>
                                                </div>
                                                {profit !== null && (
                                                    <div className="rp-price-row rp-profit">
                                                        <span className="rp-price-label">Seu lucro:</span>
                                                        <span className={`rp-price-profit ${parseFloat(profit) > 0 ? 'positive' : 'negative'}`}>
                                                            {formatCurrency(profit)} ({margin}%)
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="rp-price-row" style={{ display: 'none' }}>
                                                    <span className="rp-price-label">Venda ativa:</span>
                                                    <span className="rp-price-suggested">{salePrice ? formatCurrency(salePrice) : '—'}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="rp-card-actions">
                                        {selected ? (
                                            <>
                                                <button
                                                    className="rp-btn-icon"
                                                    onClick={() => toggleVisibility(product.id)}
                                                    title={rp?.is_visible ? 'Ocultar do catálogo' : 'Mostrar no catálogo'}
                                                >
                                                    {rp?.is_visible ? <Eye size={16} color="#27ae60" /> : <EyeOff size={16} color="#999" />}
                                                </button>
                                                <button
                                                    className="rp-btn rp-btn-danger"
                                                    onClick={() => removeProduct(product.id)}
                                                    disabled={isSaving}
                                                >
                                                    <Minus size={14} /> Remover
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="rp-btn rp-btn-primary"
                                                onClick={() => addProduct(product)}
                                                disabled={isSaving}
                                                style={{ width: '100%' }}
                                            >
                                                {isSaving ? 'A adicionar...' : <><Plus size={14} /> Adicionar ao Catálogo</>}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="rp-pagination">
                    <span className="rp-pagination-info">
                        {page * ITEMS_PER_PAGE + 1}–{Math.min((page + 1) * ITEMS_PER_PAGE, totalCount)} de {totalCount}
                    </span>
                    <div className="rp-pagination-btns">
                        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                            <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pn;
                            if (totalPages <= 5) pn = i;
                            else if (page < 3) pn = i;
                            else if (page > totalPages - 4) pn = totalPages - 5 + i;
                            else pn = page - 2 + i;
                            return (
                                <button key={pn} className={page === pn ? 'active' : ''} onClick={() => setPage(pn)}>
                                    {pn + 1}
                                </button>
                            );
                        })}
                        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Bulk Markup Modal */}
            {showBulkModal && (
                <div className="rp-modal-overlay" onClick={() => setShowBulkModal(false)}>
                    <div className="rp-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="rp-modal-header">
                            <h3>Definir Margem em Lote</h3>
                            <button onClick={() => setShowBulkModal(false)}><X size={20} /></button>
                        </div>
                        <div className="rp-modal-body">
                            <p style={{ color: '#666', marginBottom: '1rem' }}>
                                Aplica uma margem (%) sobre o custo do produto para todos os produtos selecionados nesta pagina.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>Margem:</span>
                                <input
                                    type="number"
                                    value={bulkMarkup}
                                    onChange={(e) => setBulkMarkup(e.target.value)}
                                    placeholder="Ex: 100"
                                    className="rp-price-input"
                                    style={{ width: '100px' }}
                                />
                                <span>%</span>
                            </div>
                            <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                                Exemplo: margem de 50% sobre custo LYRA de 10€ = preco de venda 15€ (lucro 5€)
                            </p>
                        </div>
                        <div className="rp-modal-footer">
                            <button className="rp-btn rp-btn-outline" onClick={() => setShowBulkModal(false)}>Cancelar</button>
                            <button className="rp-btn rp-btn-primary" onClick={applyBulkMarkup}>Aplicar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ResellerProducts;
