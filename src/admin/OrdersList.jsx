import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ChevronDown,
    ChevronUp,
    DollarSign,
    Search,
    ShoppingBag,
    Store,
    Users,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { formatCurrency } from '../utils/finance';
import {
    buildAdminInsights,
    formatDateTime,
    getOrderStatusMeta,
    loadAdminOperationsData,
} from './adminMetrics';

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pendente' },
    { value: 'paid', label: 'Pago' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'processing', label: 'Em preparacao' },
    { value: 'shipped', label: 'Enviado' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'cancelled', label: 'Cancelado' },
];

const toneMap = {
    success: 'is-success',
    warning: 'is-warning',
    info: 'is-info',
    danger: 'is-danger',
    neutral: 'is-neutral',
};

const OrdersList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('');

    const fetchOrders = useCallback(async () => {
        setLoading(true);

        try {
            const baseData = await loadAdminOperationsData({
                includeProducts: true,
                includeOrders: true,
                includeOrderItems: true,
                includeResellers: true,
                includeResellerProducts: false,
            });

            const insights = buildAdminInsights(baseData);
            setOrders(insights.orderFinancials);
        } catch (error) {
            console.error('Orders admin error:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const filteredOrders = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return orders.filter((order) => {
            if (statusFilter && order.status !== statusFilter) {
                return false;
            }

            if (paymentFilter && order.paymentMethodLabel !== paymentFilter) {
                return false;
            }

            if (!normalizedSearch) {
                return true;
            }

            const haystack = [
                order.id,
                order.customers?.name,
                order.customers?.email,
                order.reseller?.full_name,
                order.reseller?.slug,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(normalizedSearch);
        });
    }, [orders, paymentFilter, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        return filteredOrders.reduce(
            (accumulator, order) => {
                accumulator.total += 1;
                accumulator.gmv += order.orderTotal;
                accumulator.lyraProfit += order.lyraProfitTotal;
                accumulator.resellerProfit += order.resellerProfitTotal;

                if (order.status === 'pending') {
                    accumulator.pending += 1;
                }

                return accumulator;
            },
            {
                total: 0,
                pending: 0,
                gmv: 0,
                lyraProfit: 0,
                resellerProfit: 0,
            }
        );
    }, [filteredOrders]);

    const paymentOptions = useMemo(
        () => [...new Set(orders.map((order) => order.paymentMethodLabel).filter(Boolean))].sort(),
        [orders]
    );

    const toggleExpand = (orderId) => {
        setExpandedOrder((current) => (current === orderId ? null : orderId));
    };

    const updateStatus = async (orderId, newStatus) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (!error) {
            await fetchOrders();
        }
    };

    return (
        <>
            <div className="admin-topbar">
                <div>
                    <h1>Encomendas</h1>
                    <p className="admin-topbar-subtitle">
                        Acompanhe venda, margem LYRA e repasse por encomenda.
                    </p>
                </div>
            </div>

            <div className="admin-content">
                <div className="admin-kpi-grid admin-kpi-grid-tight">
                    <MiniKpi icon={ShoppingBag} label="Encomendas" value={stats.total} />
                    <MiniKpi icon={DollarSign} label="Volume" value={formatCurrency(stats.gmv)} />
                    <MiniKpi icon={Store} label="Lucro LYRA" value={formatCurrency(stats.lyraProfit)} />
                    <MiniKpi icon={Users} label="Repasse" value={formatCurrency(stats.resellerProfit)} />
                </div>

                <div className="admin-table-container">
                    <div className="admin-table-header">
                        <div>
                            <h3>Fluxo de encomendas</h3>
                            <p className="admin-header-copy">
                                Use os filtros para achar rapidamente clientes, revendedoras ou pedidos.
                            </p>
                        </div>
                        <div className="admin-filters">
                            <div className="admin-search">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar por cliente, slug ou ID..."
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                />
                            </div>
                            <select
                                className="admin-filter-select"
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                            >
                                <option value="">Todos os estados</option>
                                {STATUS_OPTIONS.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="admin-filter-select"
                                value={paymentFilter}
                                onChange={(event) => setPaymentFilter(event.target.value)}
                            >
                                <option value="">Todos os pagamentos</option>
                                {paymentOptions.map((method) => (
                                    <option key={method} value={method}>
                                        {method}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-loading">
                            <div className="admin-spinner"></div>
                            A carregar encomendas...
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="admin-empty">
                            <ShoppingBag size={48} />
                            <p>Nenhuma encomenda encontrada com estes filtros.</p>
                        </div>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Encomenda</th>
                                        <th>Revendedora</th>
                                        <th>Cliente</th>
                                        <th>Total</th>
                                        <th>Lucro LYRA</th>
                                        <th>Repasse</th>
                                        <th>Estado</th>
                                        <th>Pagamento</th>
                                        <th>Data</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((order) => {
                                        const isExpanded = expandedOrder === order.id;
                                        const statusMeta = getOrderStatusMeta(order.status);

                                        return (
                                            <React.Fragment key={order.id}>
                                                <tr
                                                    className="admin-row-clickable"
                                                    onClick={() => toggleExpand(order.id)}
                                                >
                                                    <td>
                                                        <div className="admin-table-title">
                                                            #{order.id.slice(0, 8)}
                                                        </div>
                                                        <div className="admin-table-subtitle">
                                                            {order.itemsCount} itens
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="admin-table-title">
                                                            {order.reseller?.full_name || 'Loja LYRA'}
                                                        </div>
                                                        <div className="admin-table-subtitle">
                                                            /{order.reseller?.slug || 'loja'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="admin-table-title">
                                                            {order.customers?.name || 'Sem nome'}
                                                        </div>
                                                        <div className="admin-table-subtitle">
                                                            {order.customers?.email || 'Sem email'}
                                                        </div>
                                                    </td>
                                                    <td>{formatCurrency(order.orderTotal)}</td>
                                                    <td>{formatCurrency(order.lyraProfitTotal)}</td>
                                                    <td>{formatCurrency(order.resellerProfitTotal)}</td>
                                                    <td>
                                                        <select
                                                            value={order.status}
                                                            onChange={(event) => {
                                                                event.stopPropagation();
                                                                updateStatus(order.id, event.target.value);
                                                            }}
                                                            onClick={(event) => event.stopPropagation()}
                                                            className={`admin-status-select ${toneMap[statusMeta.tone] || 'is-neutral'}`}
                                                        >
                                                            {STATUS_OPTIONS.map((status) => (
                                                                <option key={status.value} value={status.value}>
                                                                    {status.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>{order.paymentMethodLabel}</td>
                                                    <td>{formatDateTime(order.created_at)}</td>
                                                    <td className="admin-expand-cell">
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </td>
                                                </tr>

                                                {isExpanded && (
                                                    <tr className="admin-expanded-row">
                                                        <td colSpan="10">
                                                            <div className="admin-order-detail-grid">
                                                                <div className="admin-order-detail-card">
                                                                    <h4>Resumo financeiro</h4>
                                                                    <div className="admin-finance-grid admin-finance-grid-compact">
                                                                        <FinanceLine
                                                                            label="Custo Dreamlove"
                                                                            value={formatCurrency(order.supplierTotal)}
                                                                        />
                                                                        <FinanceLine
                                                                            label="Base LYRA"
                                                                            value={formatCurrency(order.lyraBaseTotal)}
                                                                        />
                                                                        <FinanceLine
                                                                            label="Lucro LYRA"
                                                                            value={formatCurrency(order.lyraProfitTotal)}
                                                                        />
                                                                        <FinanceLine
                                                                            label="Repasse revendedora"
                                                                            value={formatCurrency(order.resellerProfitTotal)}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="admin-order-detail-card">
                                                                    <h4>Cliente e entrega</h4>
                                                                    <p><strong>Nome:</strong> {order.customers?.name || 'Sem nome'}</p>
                                                                    <p><strong>Email:</strong> {order.customers?.email || 'Sem email'}</p>
                                                                    <p><strong>Telefone:</strong> {order.customers?.phone || 'Sem telefone'}</p>
                                                                    <p><strong>Morada:</strong> {order.customers?.address || 'Sem morada'}</p>
                                                                    <p><strong>Pagamento:</strong> {order.paymentMethodLabel}</p>
                                                                </div>
                                                            </div>

                                                            <div className="admin-line-items">
                                                                <div className="admin-line-items-header">
                                                                    <h4>Itens desta encomenda</h4>
                                                                </div>
                                                                {order.lines.length === 0 ? (
                                                                    <div className="admin-inline-empty">
                                                                        Sem itens financeiros associados.
                                                                    </div>
                                                                ) : (
                                                                    <div className="admin-data-list">
                                                                        {order.lines.map((line) => (
                                                                            <div key={line.id} className="admin-data-row">
                                                                                <div className="admin-line-item-main">
                                                                                    <div className="admin-line-item-thumb">
                                                                                        {line.imageUrl ? (
                                                                                            <img src={line.imageUrl} alt="" />
                                                                                        ) : (
                                                                                            <ShoppingBag size={14} />
                                                                                        )}
                                                                                    </div>
                                                                                    <div>
                                                                                        <strong>{line.productName}</strong>
                                                                                        <span>
                                                                                            {line.brand || 'Sem marca'} · {line.category || 'Sem categoria'} · {line.financials.quantity}x
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="admin-data-row-end">
                                                                                    <div>
                                                                                        <small>Venda</small>
                                                                                        <strong>{formatCurrency(line.financials.saleTotal)}</strong>
                                                                                    </div>
                                                                                    <div>
                                                                                        <small>LYRA</small>
                                                                                        <strong>{formatCurrency(line.financials.lyraProfitTotal)}</strong>
                                                                                    </div>
                                                                                    <div>
                                                                                        <small>Revendedora</small>
                                                                                        <strong>{formatCurrency(line.financials.resellerProfitTotal)}</strong>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
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

const FinanceLine = ({ label, value }) => (
    <div className="admin-finance-box admin-finance-box-inline">
        <span>{label}</span>
        <strong>{value}</strong>
    </div>
);

export default OrdersList;
