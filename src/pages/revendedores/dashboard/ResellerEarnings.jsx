import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { useReseller } from '../../../context/ResellerContext';
import { calculateLineMargins, formatCurrency, getLyraResellerCost, getSupplierCost } from '../../../utils/finance';

const ResellerEarnings = () => {
    const { reseller } = useReseller();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');

    useEffect(() => {
        if (!reseller?.id) return;

        const fetchEarnings = async () => {
            setLoading(true);

            try {
                const { data: ordersData } = await supabase
                    .from('orders')
                    .select('id, total_amount, status, created_at')
                    .eq('reseller_id', reseller.id)
                    .neq('status', 'cancelled')
                    .order('created_at', { ascending: false });

                const orderRows = ordersData || [];
                const orderIds = orderRows.map((order) => order.id);

                let items = [];
                if (orderIds.length > 0) {
                    const { data: itemsData } = await supabase
                        .from('order_items')
                        .select('id, order_id, product_id, quantity, price_at_time')
                        .in('order_id', orderIds);

                    items = itemsData || [];
                }

                const productIds = [...new Set(items.map((item) => item.product_id))];
                let products = [];
                if (productIds.length > 0) {
                    const { data: productsData } = await supabase
                        .from('products')
                        .select('id, name, cost_price, suggested_price')
                        .in('id', productIds);

                    products = productsData || [];
                }

                const productMap = Object.fromEntries(products.map((product) => [product.id, product]));
                const itemsByOrder = items.reduce((map, item) => {
                    if (!map[item.order_id]) {
                        map[item.order_id] = [];
                    }

                    map[item.order_id].push(item);
                    return map;
                }, {});

                const enrichedOrders = orderRows.map((order) => {
                    const orderItems = itemsByOrder[order.id] || [];
                    const resellerProfit = orderItems.reduce((sum, item) => {
                        const product = productMap[item.product_id] || {};
                        const line = calculateLineMargins({
                            supplierCost: getSupplierCost(product),
                            lyraCost: getLyraResellerCost(product),
                            salePrice: item.price_at_time,
                            quantity: item.quantity,
                        });

                        return sum + line.resellerProfitTotal;
                    }, 0);

                    return {
                        ...order,
                        resellerProfit,
                    };
                });

                setOrders(enrichedOrders);
            } catch (error) {
                console.error('Reseller earnings error:', error);
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEarnings();
    }, [reseller?.id]);

    const stats = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());

        const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
        const totalProfit = orders.reduce((sum, order) => sum + (parseFloat(order.resellerProfit) || 0), 0);

        const monthOrders = orders.filter((order) => new Date(order.created_at) >= startOfMonth);
        const weekOrders = orders.filter((order) => new Date(order.created_at) >= startOfWeek);

        const thisMonthRevenue = monthOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
        const thisMonthProfit = monthOrders.reduce((sum, order) => sum + (parseFloat(order.resellerProfit) || 0), 0);
        const thisWeekRevenue = weekOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
        const thisWeekProfit = weekOrders.reduce((sum, order) => sum + (parseFloat(order.resellerProfit) || 0), 0);

        return {
            totalRevenue,
            totalProfit,
            totalOrders: orders.length,
            thisMonthRevenue,
            thisMonthProfit,
            thisMonthOrders: monthOrders.length,
            thisWeekRevenue,
            thisWeekProfit,
            thisWeekOrders: weekOrders.length,
        };
    }, [orders]);

    const visibleStats = {
        profit: period === 'week' ? stats.thisWeekProfit : period === 'month' ? stats.thisMonthProfit : stats.totalProfit,
        revenue: period === 'week' ? stats.thisWeekRevenue : period === 'month' ? stats.thisMonthRevenue : stats.totalRevenue,
        orders: period === 'week' ? stats.thisWeekOrders : period === 'month' ? stats.thisMonthOrders : stats.totalOrders,
    };

    if (loading) {
        return (
            <>
                <div className="reseller-topbar"><h1>Os Meus Ganhos</h1></div>
                <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>A carregar dados...</div>
            </>
        );
    }

    const formatDate = (value) =>
        new Date(value).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

    const statusLabels = {
        pending: 'Pendente',
        paid: 'Pago',
        confirmed: 'Confirmado',
        processing: 'Em preparacao',
        shipped: 'Enviado',
        delivered: 'Entregue',
        cancelled: 'Cancelado',
    };

    const statusColors = {
        pending: '#f39c12',
        paid: '#1d7b4a',
        confirmed: '#3498db',
        processing: '#9b59b6',
        shipped: '#2ecc71',
        delivered: '#27ae60',
        cancelled: '#e74c3c',
    };

    return (
        <>
            <div className="reseller-topbar">
                <h1>Os Meus Ganhos</h1>
            </div>

            <div className="re-period-tabs">
                <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>
                    Esta Semana
                </button>
                <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>
                    Este Mes
                </button>
                <button className={period === 'all' ? 'active' : ''} onClick={() => setPeriod('all')}>
                    Total
                </button>
            </div>

            <div className="reseller-stats-grid">
                <div className="r-stat-card border-gold">
                    <span className="r-stat-label"><DollarSign size={14} /> Ganhos</span>
                    <span className="r-stat-value highlight">{formatCurrency(visibleStats.profit)}</span>
                </div>
                <div className="r-stat-card">
                    <span className="r-stat-label"><TrendingUp size={14} /> Faturacao</span>
                    <span className="r-stat-value">{formatCurrency(visibleStats.revenue)}</span>
                </div>
                <div className="r-stat-card">
                    <span className="r-stat-label"><ShoppingCart size={14} /> Encomendas</span>
                    <span className="r-stat-value">{visibleStats.orders}</span>
                </div>
                <div className="r-stat-card">
                    <span className="r-stat-label"><Calendar size={14} /> Ticket medio</span>
                    <span className="r-stat-value">
                        {visibleStats.orders > 0 ? formatCurrency(visibleStats.revenue / visibleStats.orders) : formatCurrency(0)}
                    </span>
                </div>
            </div>

            <div className="re-orders-section">
                <h3>Encomendas Recentes</h3>
                {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                        Ainda nao tem encomendas. Partilhe o seu catalogo para comecar a vender.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="re-orders-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Venda</th>
                                    <th>Seu lucro</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.slice(0, 10).map((order) => (
                                    <tr key={order.id}>
                                        <td>{formatDate(order.created_at)}</td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(parseFloat(order.total_amount) || 0)}</td>
                                        <td style={{ fontWeight: 600, color: '#1d7b4a' }}>
                                            {formatCurrency(parseFloat(order.resellerProfit) || 0)}
                                        </td>
                                        <td>
                                            <span
                                                className="re-status-badge"
                                                style={{
                                                    backgroundColor: `${statusColors[order.status] || '#888'}20`,
                                                    color: statusColors[order.status] || '#888',
                                                }}
                                            >
                                                {statusLabels[order.status] || order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};

export default ResellerEarnings;
