import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Edit2,
    Eye,
    EyeOff,
    Package,
    Percent,
    Search,
    Sparkles,
    Star,
    X,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import {
    formatCurrency,
    getLyraResellerCost,
    getRetailPrice,
    getSupplierCost,
    roundMoney,
} from '../utils/finance';
import { getAdminSupabaseClient } from './adminSupabaseClient';

const ITEMS_PER_PAGE = 20;
const BULK_ITEMS_PER_REQUEST = 500;
const BULK_UPDATE_CONCURRENCY = 20;

const getCategoryLeaf = (value = '') => {
    const parts = value.split(' > ').map((item) => item.trim()).filter(Boolean);
    return parts.at(-1) || value;
};

const getDescriptionPreview = (value = '') =>
    value
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160);

const parsePercentage = (value) => {
    const normalized = Number.parseFloat(String(value).replace(',', '.'));
    return Number.isFinite(normalized) ? normalized : 0;
};

const ADMIN_PERMISSION_ERROR = 'A base bloqueou a alteracao do admin. Aplique a migracao SQL de permissoes do admin para produtos.';

const ProductsList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    const [editingProduct, setEditingProduct] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkSaving, setBulkSaving] = useState(false);
    const [bulkError, setBulkError] = useState('');
    const [bulkSuccess, setBulkSuccess] = useState('');
    const [bulkForm, setBulkForm] = useState({
        lyraMarkup: '30',
        resellerMarkup: '50',
        onlyActive: true,
    });

    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        lowStock: 0,
        featured: 0,
    });

    useEffect(() => {
        const fetchFilters = async () => {
            const { data: categoriesData } = await supabase.rpc('get_categories');
            const { data: brandsData } = await supabase.rpc('get_brands');

            if (categoriesData) {
                setCategories(categoriesData.map((row) => row.category).filter(Boolean));
            }

            if (brandsData) {
                setBrands(brandsData.map((row) => row.brand).filter(Boolean));
            }
        };

        fetchFilters();
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            const [
                totalResponse,
                activeResponse,
                lowStockResponse,
                featuredResponse,
            ] = await Promise.all([
                supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock', 5).eq('status', 'active'),
                supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_featured', true),
            ]);

            setStats({
                total: totalResponse.count || 0,
                active: activeResponse.count || 0,
                lowStock: lowStockResponse.count || 0,
                featured: featuredResponse.count || 0,
            });
        };

        fetchStats();
    }, []);

    const applyProductFilters = useCallback((query, options = {}) => {
        const { onlyActive = false } = options;
        let nextQuery = query;

        if (searchTerm.trim()) {
            nextQuery = nextQuery.ilike('name', `%${searchTerm.trim()}%`);
        }

        if (selectedCategory) {
            nextQuery = nextQuery.eq('category', selectedCategory);
        }

        if (selectedBrand) {
            nextQuery = nextQuery.eq('brand', selectedBrand);
        }

        if (onlyActive) {
            nextQuery = nextQuery.eq('status', 'active');
        }

        return nextQuery;
    }, [searchTerm, selectedBrand, selectedCategory]);

    const fetchProducts = useCallback(async () => {
        setLoading(true);

        const query = applyProductFilters(
            supabase
            .from('products')
            .select('*', { count: 'exact' })
            .order('updated_at', { ascending: false })
            .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1)
        );

        const { data, count, error } = await query;

        if (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
            setTotalCount(0);
        } else {
            setProducts(data || []);
            setTotalCount(count || 0);
        }

        setLoading(false);
    }, [applyProductFilters, page]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        setPage(0);
    }, [searchTerm, selectedCategory, selectedBrand]);

    useEffect(() => {
        setBulkError('');
        setBulkSuccess('');
    }, [searchTerm, selectedCategory, selectedBrand]);

    const fetchProductsForBulkUpdate = useCallback(async (onlyActive) => {
        const collectedProducts = [];
        let currentPage = 0;

        while (true) {
            const query = applyProductFilters(
                supabase
                    .from('products')
                    .select('id, cost_price, suggested_price, price, status')
                    .order('id', { ascending: true })
                    .range(
                        currentPage * BULK_ITEMS_PER_REQUEST,
                        (currentPage + 1) * BULK_ITEMS_PER_REQUEST - 1
                    ),
                { onlyActive }
            );

            const { data, error } = await query;

            if (error) throw error;
            if (!data?.length) break;

            collectedProducts.push(...data);

            if (data.length < BULK_ITEMS_PER_REQUEST) break;
            currentPage += 1;
        }

        return collectedProducts;
    }, [applyProductFilters]);

    const openEdit = (product) => {
        setEditingProduct(product);
        setEditForm({
            name: product.name || '',
            cost_price: product.cost_price || '',
            suggested_price: getLyraResellerCost(product) || '',
            price: getRetailPrice(product) || '',
            stock: product.stock || 0,
            category: product.category || '',
            subcategory: product.subcategory || '',
            brand: product.brand || '',
            description: product.description || '',
            image_url: product.image_url || '',
            status: product.status || 'active',
            is_featured: product.is_featured || false,
            is_bestseller: product.is_bestseller || false,
            is_new: product.is_new || false,
        });
    };

    const saveEdit = async () => {
        if (!editingProduct) return;

        setSaving(true);
        setBulkError('');

        const stock = Number.parseInt(editForm.stock, 10) || 0;
        const supplierCost = roundMoney(editForm.cost_price);
        const lyraCost = roundMoney(editForm.suggested_price);
        const retailPrice = roundMoney(editForm.price);

        const adminSupabase = getAdminSupabaseClient();

        const { data, error } = await adminSupabase
            .from('products')
            .update({
                name: editForm.name,
                cost_price: supplierCost || null,
                suggested_price: lyraCost || null,
                price: retailPrice || null,
                stock,
                category: editForm.category,
                subcategory: editForm.subcategory,
                brand: editForm.brand,
                description: editForm.description,
                image_url: editForm.image_url,
                status: editForm.status,
                is_featured: editForm.is_featured,
                is_bestseller: editForm.is_bestseller,
                is_new: editForm.is_new,
                available: stock > 0,
                updated_at: new Date().toISOString(),
            })
            .eq('id', editingProduct.id)
            .select('id');

        if (error) {
            setBulkError('Nao foi possivel guardar este produto.');
        } else if (!data?.length) {
            setBulkError(ADMIN_PERMISSION_ERROR);
        } else {
            setBulkSuccess('Produto atualizado com sucesso.');
            setEditingProduct(null);
            fetchProducts();
        }

        setSaving(false);
    };

    const toggleStatus = async (product) => {
        const nextStatus = product.status === 'active' ? 'inactive' : 'active';

        setBulkError('');
        const adminSupabase = getAdminSupabaseClient();

        const { data, error } = await adminSupabase
            .from('products')
            .update({ status: nextStatus })
            .eq('id', product.id)
            .select('id');

        if (error) {
            setBulkError('Nao foi possivel alterar o estado do produto.');
        } else if (!data?.length) {
            setBulkError(ADMIN_PERMISSION_ERROR);
        } else {
            setBulkSuccess(`Produto ${nextStatus === 'active' ? 'ativado' : 'desativado'} com sucesso.`);
            fetchProducts();
        }
    };

    const applyBulkMargins = async () => {
        const lyraMarkup = parsePercentage(bulkForm.lyraMarkup);
        const resellerMarkup = parsePercentage(bulkForm.resellerMarkup);

        if (lyraMarkup < 0 || resellerMarkup < 0) {
            setBulkError('As percentagens devem ser iguais ou maiores que zero.');
            return;
        }

        setBulkSaving(true);
        setBulkError('');
        setBulkSuccess('');

        try {
            const adminSupabase = getAdminSupabaseClient();
            const targetProducts = await fetchProductsForBulkUpdate(bulkForm.onlyActive);
            const updatableProducts = targetProducts.filter((product) => getSupplierCost(product) > 0);

            if (!updatableProducts.length) {
                setBulkError('Nenhum produto com custo Dreamlove configurado foi encontrado nesta selecao.');
                setBulkSaving(false);
                return;
            }

            const updatedAt = new Date().toISOString();
            const updates = updatableProducts.map((product) => {
                const supplierCostValue = getSupplierCost(product);
                const lyraCostValue = roundMoney(supplierCostValue * (1 + lyraMarkup / 100));
                const suggestedRetailValue = roundMoney(lyraCostValue * (1 + resellerMarkup / 100));

                return {
                    id: product.id,
                    previous_price: getRetailPrice(product),
                    suggested_price: lyraCostValue,
                    price: suggestedRetailValue,
                    updated_at: updatedAt,
                };
            });

            let updatedProductsCount = 0;

            for (let index = 0; index < updates.length; index += BULK_UPDATE_CONCURRENCY) {
                const batch = updates.slice(index, index + BULK_UPDATE_CONCURRENCY);
                const results = await Promise.all(
                    batch.map(({ id, previous_price, ...payload }) =>
                        adminSupabase
                            .from('products')
                            .update(payload)
                            .eq('id', id)
                            .select('id')
                    )
                );

                const failedRequest = results.find(({ error }) => error);

                if (failedRequest?.error) {
                    throw failedRequest.error;
                }

                updatedProductsCount += results.reduce(
                    (total, { data }) => total + (data?.length || 0),
                    0
                );
            }

            if (updatedProductsCount === 0) {
                throw new Error(ADMIN_PERMISSION_ERROR);
            }

            for (let index = 0; index < updates.length; index += BULK_UPDATE_CONCURRENCY) {
                const batch = updates.slice(index, index + BULK_UPDATE_CONCURRENCY);
                const results = await Promise.all(
                    batch.map(({ id, previous_price, price }) =>
                        adminSupabase
                            .from('reseller_products')
                            .update({ custom_price: price })
                            .eq('product_id', id)
                            .eq('custom_price', previous_price)
                            .select('id')
                    )
                );

                const failedRequest = results.find(({ error }) => error);

                if (failedRequest?.error) {
                    throw failedRequest.error;
                }
            }

            const skippedProducts = targetProducts.length - updatableProducts.length;
            const skippedCopy = skippedProducts > 0
                ? ` ${skippedProducts} ficaram de fora por nao terem custo Dreamlove.`
                : '';

            setBulkSuccess(
                `Margens aplicadas em ${updatedProductsCount} produtos. Custo LYRA: +${lyraMarkup}% sobre Dreamlove e PVP sugerido: +${resellerMarkup}% sobre o custo LYRA.${skippedCopy}`
            );
            setShowBulkModal(false);
            fetchProducts();
        } catch (error) {
            console.error('Error applying bulk margins:', error);
            setBulkError(error?.message === ADMIN_PERMISSION_ERROR ? ADMIN_PERMISSION_ERROR : 'Nao foi possivel aplicar as margens em massa. Tente novamente.');
        } finally {
            setBulkSaving(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
    const categoryOptions = useMemo(
        () => [...new Set([...(categories || []), editForm.category].filter(Boolean))].sort(),
        [categories, editForm.category]
    );
    const bulkLyraMarkup = parsePercentage(bulkForm.lyraMarkup);
    const bulkResellerMarkup = parsePercentage(bulkForm.resellerMarkup);
    const bulkExample = useMemo(() => {
        const dreamloveCost = 10;
        const lyraCostValue = roundMoney(dreamloveCost * (1 + bulkLyraMarkup / 100));
        const suggestedPvpValue = roundMoney(lyraCostValue * (1 + bulkResellerMarkup / 100));

        return {
            dreamloveCost,
            lyraCostValue,
            suggestedPvpValue,
            resellerProfitValue: roundMoney(suggestedPvpValue - lyraCostValue),
        };
    }, [bulkLyraMarkup, bulkResellerMarkup]);

    const supplierCost = roundMoney(editForm.cost_price);
    const lyraCost = roundMoney(editForm.suggested_price);
    const retailPrice = roundMoney(editForm.price);
    const lyraMargin = roundMoney(lyraCost - supplierCost);
    const resellerMargin = roundMoney(retailPrice - lyraCost);

    return (
        <>
            <div className="admin-topbar">
                <div>
                    <h1>Produtos</h1>
                    <p className="admin-topbar-subtitle">
                        Defina o custo Dreamlove, o custo LYRA para revendedoras e o preco final sugerido.
                    </p>
                </div>
                <div className="admin-topbar-actions">
                    <button
                        className="admin-btn admin-btn-primary"
                        onClick={() => {
                            setBulkError('');
                            setBulkSuccess('');
                            setShowBulkModal(true);
                        }}
                    >
                        <Percent size={16} />
                        Aplicar margens em massa
                    </button>
                    <span className="admin-pill">{totalCount} produtos nesta vista</span>
                </div>
            </div>

            <div className="admin-content">
                <div className="admin-kpi-grid admin-kpi-grid-tight">
                    <MiniKpi label="Total" value={stats.total.toLocaleString('pt-PT')} icon={Package} />
                    <MiniKpi label="Ativos" value={stats.active.toLocaleString('pt-PT')} icon={Eye} />
                    <MiniKpi label="Stock baixo" value={stats.lowStock.toLocaleString('pt-PT')} icon={Sparkles} />
                    <MiniKpi label="Em destaque" value={stats.featured.toLocaleString('pt-PT')} icon={Star} />
                </div>

                <div className="admin-table-container">
                    <div className="admin-table-header">
                        <div>
                            <h3>Catalogo Dreamlove</h3>
                            <p className="admin-header-copy">
                                A margem LYRA nasce da diferenca entre o custo Dreamlove e o custo base da revendedora.
                            </p>
                        </div>
                        <div className="admin-filters">
                            <div className="admin-search">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar produto..."
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                />
                            </div>
                            <select
                                className="admin-filter-select"
                                value={selectedCategory}
                                onChange={(event) => setSelectedCategory(event.target.value)}
                            >
                                <option value="">Todas as categorias</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="admin-filter-select"
                                value={selectedBrand}
                                onChange={(event) => setSelectedBrand(event.target.value)}
                            >
                                <option value="">Todas as marcas</option>
                                {brands.map((brand) => (
                                    <option key={brand} value={brand}>
                                        {brand}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {bulkSuccess && (
                        <div className="admin-inline-feedback is-success">
                            {bulkSuccess}
                        </div>
                    )}

                    {bulkError && (
                        <div className="admin-inline-feedback is-danger">
                            {bulkError}
                        </div>
                    )}

                    {loading ? (
                        <div className="admin-loading">
                            <div className="admin-spinner"></div>
                            A carregar produtos...
                        </div>
                    ) : products.length === 0 ? (
                        <div className="admin-empty">
                            <Package size={48} />
                            <p>Nenhum produto encontrado.</p>
                        </div>
                    ) : (
                        <>
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Imagem</th>
                                            <th>Produto</th>
                                            <th>Categoria</th>
                                            <th>Marca</th>
                                            <th>Custo Dreamlove</th>
                                            <th>Custo LYRA</th>
                                            <th>PVP sugerido</th>
                                            <th>Lucro LYRA</th>
                                            <th>Stock</th>
                                            <th>Estado</th>
                                            <th>Acoes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product) => {
                                            const productSupplierCost = getSupplierCost(product);
                                            const productLyraCost = getLyraResellerCost(product);
                                            const productRetailPrice = getRetailPrice(product);
                                            const productLyraMargin = roundMoney(productLyraCost - productSupplierCost);

                                            return (
                                                <tr key={product.id}>
                                                    <td>
                                                        {product.image_url ? (
                                                            <img
                                                                src={product.image_url}
                                                                alt=""
                                                                className="product-table-image"
                                                                onError={(event) => {
                                                                    event.target.style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="product-table-image product-table-image-placeholder">
                                                                <Package size={18} />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="product-table-name">{product.name}</div>
                                                        {product.description && (
                                                            <div className="product-table-description">
                                                                {getDescriptionPreview(product.description)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="product-table-category-stack">
                                                            <span className="product-table-category">
                                                                {getCategoryLeaf(product.category)}
                                                            </span>
                                                            {product.subcategory && (
                                                                <span className="product-table-subcategory">
                                                                    {product.subcategory}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>{product.brand || 'Sem marca'}</td>
                                                    <td>{formatCurrency(productSupplierCost)}</td>
                                                    <td>{formatCurrency(productLyraCost)}</td>
                                                    <td>{formatCurrency(productRetailPrice)}</td>
                                                    <td>
                                                        <span className={`admin-money-chip ${productLyraMargin >= 0 ? 'is-positive' : 'is-negative'}`}>
                                                            {formatCurrency(productLyraMargin)}
                                                        </span>
                                                    </td>
                                                    <td>{renderStockBadge(product.stock)}</td>
                                                    <td>
                                                        <span className={`admin-badge ${product.status === 'active' ? 'is-success' : 'is-danger'}`}>
                                                            {product.status === 'active' ? 'Ativo' : 'Inativo'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="admin-action-stack">
                                                            <button
                                                                className="admin-btn-icon"
                                                                onClick={() => toggleStatus(product)}
                                                                title={product.status === 'active' ? 'Desativar' : 'Ativar'}
                                                            >
                                                                {product.status === 'active' ? <Eye size={16} /> : <EyeOff size={16} />}
                                                            </button>
                                                            <button
                                                                className="admin-btn-icon"
                                                                onClick={() => openEdit(product)}
                                                                title="Editar produto"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="admin-pagination">
                                    <div className="admin-pagination-info">
                                        {page * ITEMS_PER_PAGE + 1}-{Math.min((page + 1) * ITEMS_PER_PAGE, totalCount)} de {totalCount}
                                    </div>
                                    <div className="admin-pagination-buttons">
                                        <button
                                            onClick={() => setPage((current) => Math.max(0, current - 1))}
                                            disabled={page === 0}
                                        >
                                            Anterior
                                        </button>
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                                            let pageNumber = index;

                                            if (totalPages > 5) {
                                                if (page < 3) pageNumber = index;
                                                else if (page > totalPages - 4) pageNumber = totalPages - 5 + index;
                                                else pageNumber = page - 2 + index;
                                            }

                                            return (
                                                <button
                                                    key={pageNumber}
                                                    className={page === pageNumber ? 'active' : ''}
                                                    onClick={() => setPage(pageNumber)}
                                                >
                                                    {pageNumber + 1}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                                            disabled={page >= totalPages - 1}
                                        >
                                            Seguinte
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {editingProduct && (
                <div className="admin-modal-overlay" onClick={() => setEditingProduct(null)}>
                    <div className="admin-modal admin-modal-large" onClick={(event) => event.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div>
                                <h3>Controlar margens do produto</h3>
                                <p className="admin-topbar-subtitle">
                                    Ajuste fornecedor, custo LYRA e preco final numa unica vista.
                                </p>
                            </div>
                            <button className="admin-btn-icon" onClick={() => setEditingProduct(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="admin-modal-body">
                            <div className="admin-form-group">
                                <label>Nome do produto</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                                />
                            </div>

                            <div className="admin-form-row admin-form-row-triple">
                                <div className="admin-form-group">
                                    <label>Custo Dreamlove</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.cost_price}
                                        onChange={(event) => setEditForm((current) => ({ ...current, cost_price: event.target.value }))}
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <div className="admin-label-row">
                                        <label>Custo LYRA para revendedora</label>
                                        <button
                                            type="button"
                                            className="admin-text-link"
                                            onClick={() => setEditForm((current) => ({
                                                ...current,
                                                suggested_price: roundMoney(roundMoney(current.cost_price) * 1.3).toFixed(2),
                                            }))}
                                        >
                                            +30%
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.suggested_price}
                                        onChange={(event) => setEditForm((current) => ({ ...current, suggested_price: event.target.value }))}
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <div className="admin-label-row">
                                        <label>Preco final sugerido</label>
                                        <button
                                            type="button"
                                            className="admin-text-link"
                                            onClick={() => setEditForm((current) => ({
                                                ...current,
                                                price: roundMoney(roundMoney(current.suggested_price) * 1.5).toFixed(2),
                                            }))}
                                        >
                                            +50%
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.price}
                                        onChange={(event) => setEditForm((current) => ({ ...current, price: event.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="admin-finance-grid">
                                <div className="admin-finance-box">
                                    <span>Lucro LYRA por unidade</span>
                                    <strong>{formatCurrency(lyraMargin)}</strong>
                                    <small>Base: custo LYRA menos custo Dreamlove</small>
                                </div>
                                <div className="admin-finance-box">
                                    <span>Espaco da revendedora</span>
                                    <strong>{formatCurrency(resellerMargin)}</strong>
                                    <small>Preco final menos custo LYRA</small>
                                </div>
                            </div>

                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>Stock</label>
                                    <input
                                        type="number"
                                        value={editForm.stock}
                                        onChange={(event) => setEditForm((current) => ({ ...current, stock: event.target.value }))}
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label>Estado</label>
                                    <select
                                        value={editForm.status}
                                        onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))}
                                    >
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>Categoria fornecedor</label>
                                    <select
                                        value={editForm.category}
                                        onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))}
                                    >
                                        <option value="">Selecionar</option>
                                        {categoryOptions.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="admin-form-group">
                                    <label>Subcategoria</label>
                                    <input
                                        type="text"
                                        value={editForm.subcategory}
                                        onChange={(event) => setEditForm((current) => ({ ...current, subcategory: event.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="admin-form-group">
                                <label>Marca</label>
                                <input
                                    type="text"
                                    value={editForm.brand}
                                    onChange={(event) => setEditForm((current) => ({ ...current, brand: event.target.value }))}
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>URL da imagem</label>
                                <input
                                    type="text"
                                    value={editForm.image_url}
                                    onChange={(event) => setEditForm((current) => ({ ...current, image_url: event.target.value }))}
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Descricao</label>
                                <textarea
                                    rows={4}
                                    value={editForm.description}
                                    onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                                />
                            </div>

                            <div className="admin-form-toggles">
                                <ToggleLine
                                    active={editForm.is_featured}
                                    label="Produto em destaque"
                                    onToggle={() => setEditForm((current) => ({ ...current, is_featured: !current.is_featured }))}
                                />
                                <ToggleLine
                                    active={editForm.is_bestseller}
                                    label="Mais vendido"
                                    onToggle={() => setEditForm((current) => ({ ...current, is_bestseller: !current.is_bestseller }))}
                                />
                                <ToggleLine
                                    active={editForm.is_new}
                                    label="Novidade"
                                    onToggle={() => setEditForm((current) => ({ ...current, is_new: !current.is_new }))}
                                />
                            </div>
                        </div>

                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn-secondary" onClick={() => setEditingProduct(null)}>
                                Cancelar
                            </button>
                            <button className="admin-btn admin-btn-primary" onClick={saveEdit} disabled={saving}>
                                {saving ? 'A guardar...' : 'Guardar alteracoes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showBulkModal && (
                <div className="admin-modal-overlay" onClick={() => !bulkSaving && setShowBulkModal(false)}>
                    <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div>
                                <h3>Aplicar margens em massa</h3>
                                <p className="admin-topbar-subtitle">
                                    Atualize o custo LYRA e o PVP sugerido em todos os produtos desta selecao.
                                </p>
                            </div>
                            <button className="admin-btn-icon" onClick={() => !bulkSaving && setShowBulkModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="admin-modal-body">
                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>Margem LYRA sobre Dreamlove (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={bulkForm.lyraMarkup}
                                        onChange={(event) => setBulkForm((current) => ({
                                            ...current,
                                            lyraMarkup: event.target.value,
                                        }))}
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label>PVP sugerido sobre custo LYRA (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={bulkForm.resellerMarkup}
                                        onChange={(event) => setBulkForm((current) => ({
                                            ...current,
                                            resellerMarkup: event.target.value,
                                        }))}
                                    />
                                </div>
                            </div>

                            <label className="admin-checkbox-row">
                                <input
                                    type="checkbox"
                                    checked={bulkForm.onlyActive}
                                    onChange={(event) => setBulkForm((current) => ({
                                        ...current,
                                        onlyActive: event.target.checked,
                                    }))}
                                />
                                <span>Aplicar apenas a produtos ativos</span>
                            </label>

                            <div className="admin-panel-note">
                                Esta acao respeita os filtros atuais de pesquisa, categoria e marca. Se nao houver filtros, a atualizacao corre em todo o catalogo.
                            </div>

                            <div className="admin-finance-grid admin-finance-grid-compact">
                                <div className="admin-finance-box">
                                    <span>Exemplo Dreamlove</span>
                                    <strong>{formatCurrency(bulkExample.dreamloveCost)}</strong>
                                    <small>Custo de origem do fornecedor</small>
                                </div>
                                <div className="admin-finance-box">
                                    <span>Custo LYRA</span>
                                    <strong>{formatCurrency(bulkExample.lyraCostValue)}</strong>
                                    <small>{bulkLyraMarkup}% acima do custo Dreamlove</small>
                                </div>
                                <div className="admin-finance-box">
                                    <span>PVP sugerido</span>
                                    <strong>{formatCurrency(bulkExample.suggestedPvpValue)}</strong>
                                    <small>{bulkResellerMarkup}% acima do custo LYRA</small>
                                </div>
                                <div className="admin-finance-box">
                                    <span>Lucro da revendedora</span>
                                    <strong>{formatCurrency(bulkExample.resellerProfitValue)}</strong>
                                    <small>Diferença entre PVP sugerido e custo LYRA</small>
                                </div>
                            </div>
                        </div>

                        <div className="admin-modal-footer">
                            <button
                                className="admin-btn admin-btn-secondary"
                                onClick={() => setShowBulkModal(false)}
                                disabled={bulkSaving}
                            >
                                Cancelar
                            </button>
                            <button
                                className="admin-btn admin-btn-primary"
                                onClick={applyBulkMargins}
                                disabled={bulkSaving}
                            >
                                {bulkSaving ? 'A aplicar...' : 'Aplicar margens'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const MiniKpi = ({ icon: Icon, label, value }) => (
    <div className="admin-kpi-card admin-kpi-card-mini">
        <div className="admin-kpi-icon">
            <Icon size={18} />
        </div>
        <div className="admin-kpi-copy">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    </div>
);

const ToggleLine = ({ active, label, onToggle }) => (
    <div className="admin-form-toggle-item" onClick={onToggle}>
        <button className={`toggle-switch ${active ? 'active' : ''}`} type="button" />
        <label>{label}</label>
    </div>
);

const renderStockBadge = (stock) => {
    const numericStock = Number.parseInt(stock, 10) || 0;

    if (numericStock <= 0) {
        return <span className="stock-badge out-of-stock">Sem stock</span>;
    }

    if (numericStock < 10) {
        return <span className="stock-badge low-stock">{numericStock} un.</span>;
    }

    return <span className="stock-badge in-stock">{numericStock} un.</span>;
};

export default ProductsList;
