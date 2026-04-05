import { supabase } from '../supabaseClient';
import {
    calculateLineMargins,
    getLyraResellerCost,
    getSupplierCost,
    parseMoney,
    roundMoney,
} from '../utils/finance';

const PAGE_SIZE = 1000;

export const ORDER_STATUS_META = {
    pending: { label: 'Pendente', tone: 'warning' },
    paid: { label: 'Pago', tone: 'success' },
    confirmed: { label: 'Confirmado', tone: 'info' },
    processing: { label: 'Em preparacao', tone: 'info' },
    shipped: { label: 'Enviado', tone: 'info' },
    delivered: { label: 'Entregue', tone: 'success' },
    cancelled: { label: 'Cancelado', tone: 'danger' },
};

export const PAYMENT_METHOD_LABELS = {
    mbway: 'MB Way',
    multibanco: 'Multibanco',
    transferencia: 'Transferencia',
    stripe: 'Stripe',
    card: 'Cartao',
    cash: 'Dinheiro',
};

const buildRangeQuery = (query, from) => query.range(from, from + PAGE_SIZE - 1);

export const fetchAllRows = async (table, selectClause, buildQuery = (query) => query) => {
    const rows = [];
    let from = 0;
    let totalCount = null;

    while (true) {
        let query = supabase
            .from(table)
            .select(selectClause, { count: from === 0 ? 'exact' : undefined });

        query = buildQuery(query);
        query = buildRangeQuery(query, from);

        const { data, error, count } = await query;

        if (error) {
            throw error;
        }

        if (typeof count === 'number' && totalCount === null) {
            totalCount = count;
        }

        const chunk = data || [];
        rows.push(...chunk);

        if (chunk.length < PAGE_SIZE) {
            break;
        }

        if (totalCount !== null && rows.length >= totalCount) {
            break;
        }

        from += PAGE_SIZE;
    }

    return rows;
};

export const loadAdminOperationsData = async ({
    includeProducts = true,
    includeOrders = true,
    includeOrderItems = true,
    includeResellers = true,
    includeResellerProducts = true,
} = {}) => {
    const tasks = [];

    tasks.push(
        includeProducts
            ? fetchAllRows(
                'products',
                'id, name, brand, category, subcategory, status, stock, image_url, cost_price, suggested_price, price, updated_at'
            )
            : Promise.resolve([])
    );

    tasks.push(
        includeOrders
            ? fetchAllRows(
                'orders',
                'id, customer_id, reseller_id, total_amount, status, payment_method, created_at, customers(name, email, phone, address)',
                (query) => query.order('created_at', { ascending: false })
            )
            : Promise.resolve([])
    );

    tasks.push(
        includeOrderItems
            ? fetchAllRows('order_items', 'id, order_id, product_id, quantity, price_at_time')
            : Promise.resolve([])
    );

    tasks.push(
        includeResellers
            ? fetchAllRows(
                'resellers',
                'id, full_name, email, slug, whatsapp, created_at, is_active, status, catalog_title, paid_at, expires_at',
                (query) => query.order('created_at', { ascending: false })
            )
            : Promise.resolve([])
    );

    tasks.push(
        includeResellerProducts
            ? fetchAllRows('reseller_products', 'reseller_id, product_id, custom_price, is_visible')
            : Promise.resolve([])
    );

    const [products, orders, orderItems, resellers, resellerProducts] = await Promise.all(tasks);

    return {
        products,
        orders,
        orderItems,
        resellers,
        resellerProducts,
    };
};

export const isResellerActive = (reseller = {}) => {
    if (typeof reseller.status === 'string' && reseller.status.length > 0) {
        return reseller.status === 'active';
    }

    return reseller.is_active === true;
};

export const getOrderStatusMeta = (status) => ORDER_STATUS_META[status] || {
    label: status || 'Sem estado',
    tone: 'neutral',
};

export const getPaymentMethodLabel = (method) => {
    if (!method) return 'Nao definido';
    return PAYMENT_METHOD_LABELS[method] || method;
};

export const canPayoutOrder = (order = {}) =>
    ['paid', 'confirmed', 'processing', 'shipped', 'delivered'].includes(order.status);

export const isCancelledOrder = (order = {}) => order.status === 'cancelled';

export const formatDateTime = (value) => {
    if (!value) return 'Sem data';

    return new Intl.DateTimeFormat('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
};

export const formatShortDate = (value) => {
    if (!value) return 'Sem data';

    return new Intl.DateTimeFormat('pt-PT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
};

export const buildOrderFinancials = (order, items = [], productMap = {}) => {
    const lines = items.map((item) => {
        const product = productMap[item.product_id] || {};
        const financials = calculateLineMargins({
            supplierCost: getSupplierCost(product),
            lyraCost: getLyraResellerCost(product),
            salePrice: parseMoney(item.price_at_time),
            quantity: item.quantity,
        });

        return {
            ...item,
            product,
            productName: product.name || 'Produto sem nome',
            imageUrl: product.image_url || '',
            category: product.subcategory || product.category || '',
            brand: product.brand || '',
            financials,
        };
    });

    const totals = lines.reduce(
        (accumulator, line) => {
            accumulator.itemsCount += line.financials.quantity;
            accumulator.supplierTotal += line.financials.supplierTotal;
            accumulator.lyraBaseTotal += line.financials.lyraTotal;
            accumulator.saleTotal += line.financials.saleTotal;
            accumulator.lyraProfitTotal += line.financials.lyraProfitTotal;
            accumulator.resellerProfitTotal += line.financials.resellerProfitTotal;
            accumulator.grossProfitTotal += line.financials.grossProfitTotal;
            return accumulator;
        },
        {
            itemsCount: 0,
            supplierTotal: 0,
            lyraBaseTotal: 0,
            saleTotal: 0,
            lyraProfitTotal: 0,
            resellerProfitTotal: 0,
            grossProfitTotal: 0,
        }
    );

    const orderTotal = roundMoney(parseMoney(order?.total_amount) || totals.saleTotal);

    return {
        ...order,
        lines,
        itemsCount: totals.itemsCount,
        supplierTotal: roundMoney(totals.supplierTotal),
        lyraBaseTotal: roundMoney(totals.lyraBaseTotal),
        saleTotal: roundMoney(totals.saleTotal || orderTotal),
        orderTotal,
        lyraProfitTotal: roundMoney(totals.lyraProfitTotal),
        resellerProfitTotal: roundMoney(totals.resellerProfitTotal),
        grossProfitTotal: roundMoney(totals.grossProfitTotal),
        payoutReady: canPayoutOrder(order),
        paymentMethodLabel: getPaymentMethodLabel(order?.payment_method),
        statusMeta: getOrderStatusMeta(order?.status),
    };
};

const buildCatalogMap = (resellerProducts = []) =>
    resellerProducts.reduce((map, row) => {
        if (!map[row.reseller_id]) {
            map[row.reseller_id] = { total: 0, visible: 0 };
        }

        map[row.reseller_id].total += 1;

        if (row.is_visible) {
            map[row.reseller_id].visible += 1;
        }

        return map;
    }, {});

export const buildAdminInsights = ({
    products = [],
    orders = [],
    orderItems = [],
    resellers = [],
    resellerProducts = [],
}) => {
    const productMap = Object.fromEntries(products.map((product) => [product.id, product]));
    const resellerMap = Object.fromEntries(resellers.map((reseller) => [reseller.id, reseller]));
    const itemsByOrder = orderItems.reduce((map, item) => {
        if (!map[item.order_id]) {
            map[item.order_id] = [];
        }

        map[item.order_id].push(item);
        return map;
    }, {});

    const catalogMap = buildCatalogMap(resellerProducts);

    const orderFinancials = orders
        .map((order) => ({
            ...buildOrderFinancials(order, itemsByOrder[order.id] || [], productMap),
            reseller: resellerMap[order.reseller_id] || null,
        }))
        .sort((left, right) => new Date(right.created_at) - new Date(left.created_at));

    const activeOrders = orderFinancials.filter((order) => !isCancelledOrder(order));

    const totals = activeOrders.reduce(
        (accumulator, order) => {
            accumulator.orders += 1;
            accumulator.gmv += order.orderTotal;
            accumulator.supplierCost += order.supplierTotal;
            accumulator.lyraBase += order.lyraBaseTotal;
            accumulator.lyraProfit += order.lyraProfitTotal;
            accumulator.resellerProfit += order.resellerProfitTotal;

            if (order.status === 'pending') {
                accumulator.pendingOrders += 1;
            }

            if (order.payoutReady) {
                accumulator.readyPayouts += order.resellerProfitTotal;
            } else {
                accumulator.pendingPayouts += order.resellerProfitTotal;
            }

            return accumulator;
        },
        {
            orders: 0,
            gmv: 0,
            supplierCost: 0,
            lyraBase: 0,
            lyraProfit: 0,
            resellerProfit: 0,
            pendingOrders: 0,
            readyPayouts: 0,
            pendingPayouts: 0,
        }
    );

    const statusBreakdown = activeOrders.reduce((map, order) => {
        map[order.status] = (map[order.status] || 0) + 1;
        return map;
    }, {});

    const paymentBreakdown = activeOrders.reduce((map, order) => {
        const label = getPaymentMethodLabel(order.payment_method);
        map[label] = (map[label] || 0) + 1;
        return map;
    }, {});

    const resellerPerformance = resellers
        .map((reseller) => {
            const resellerOrders = activeOrders.filter((order) => order.reseller_id === reseller.id);
            const settledOrders = resellerOrders.filter((order) => order.payoutReady);
            const catalogInfo = catalogMap[reseller.id] || { total: 0, visible: 0 };

            const gmv = resellerOrders.reduce((sum, order) => sum + order.orderTotal, 0);
            const lyraProfit = resellerOrders.reduce((sum, order) => sum + order.lyraProfitTotal, 0);
            const readyPayout = settledOrders.reduce((sum, order) => sum + order.resellerProfitTotal, 0);
            const pendingPayout = resellerOrders
                .filter((order) => !order.payoutReady)
                .reduce((sum, order) => sum + order.resellerProfitTotal, 0);

            return {
                ...reseller,
                isActive: isResellerActive(reseller),
                catalogTotal: catalogInfo.total,
                catalogVisible: catalogInfo.visible,
                ordersCount: resellerOrders.length,
                gmv: roundMoney(gmv),
                lyraProfit: roundMoney(lyraProfit),
                readyPayout: roundMoney(readyPayout),
                pendingPayout: roundMoney(pendingPayout),
                avgTicket: resellerOrders.length ? roundMoney(gmv / resellerOrders.length) : 0,
                lastOrderAt: resellerOrders[0]?.created_at || null,
                pendingOrders: resellerOrders.filter((order) => order.status === 'pending').length,
            };
        })
        .sort((left, right) => right.gmv - left.gmv);

    const activeResellers = resellerPerformance.filter((reseller) => reseller.isActive).length;
    const lowStock = products.filter((product) => {
        const stock = Number.parseInt(product.stock, 10);
        return product.status === 'active' && Number.isFinite(stock) && stock >= 0 && stock < 5;
    }).length;

    return {
        productMap,
        resellerMap,
        catalogMap,
        orderFinancials,
        resellerPerformance,
        totals: {
            ...totals,
            gmv: roundMoney(totals.gmv),
            supplierCost: roundMoney(totals.supplierCost),
            lyraBase: roundMoney(totals.lyraBase),
            lyraProfit: roundMoney(totals.lyraProfit),
            resellerProfit: roundMoney(totals.resellerProfit),
            readyPayouts: roundMoney(totals.readyPayouts),
            pendingPayouts: roundMoney(totals.pendingPayouts),
            activeResellers,
            totalResellers: resellers.length,
            totalProducts: products.length,
            activeProducts: products.filter((product) => product.status === 'active').length,
            lowStock,
            visibleCatalogProducts: resellerProducts.filter((row) => row.is_visible).length,
            avgOrder: totals.orders ? roundMoney(totals.gmv / totals.orders) : 0,
        },
        statusBreakdown,
        paymentBreakdown,
        recentOrders: orderFinancials.slice(0, 8),
        topResellers: resellerPerformance.slice(0, 5),
    };
};
