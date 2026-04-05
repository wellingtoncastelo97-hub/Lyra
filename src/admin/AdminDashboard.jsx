import React, { useEffect, useState } from 'react';
import {
    AlertTriangle,
    CreditCard,
    DollarSign,
    Package,
    ShoppingCart,
    TrendingUp,
    Users,
} from 'lucide-react';
import { formatCurrency } from '../utils/finance';
import {
    buildAdminInsights,
    formatDateTime,
    getOrderStatusMeta,
    loadAdminOperationsData,
} from './adminMetrics';

const toneLabels = {
    success: 'is-success',
    warning: 'is-warning',
    info: 'is-info',
    danger: 'is-danger',
    neutral: 'is-neutral',
};

const AdminDashboard = () => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            setError(null);

            try {
                const baseData = await loadAdminOperationsData();
                setInsights(buildAdminInsights(baseData));
            } catch (fetchError) {
                console.error('Admin dashboard error:', fetchError);
                setError('Nao foi possivel carregar o centro de operacoes.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <>
                <div className="admin-topbar">
                    <div>
                        <h1>Centro de Operacoes</h1>
                        <p className="admin-topbar-subtitle">A preparar a visao geral da LYRA.</p>
                    </div>
                </div>
                <div className="admin-content">
                    <div className="admin-loading">
                        <div className="admin-spinner"></div>
                        A carregar dados de operacao...
                    </div>
                </div>
            </>
        );
    }

    if (error || !insights) {
        return (
            <>
                <div className="admin-topbar">
                    <div>
                        <h1>Centro de Operacoes</h1>
                        <p className="admin-topbar-subtitle">Painel central de controlo da revenda.</p>
                    </div>
                </div>
                <div className="admin-content">
                    <div className="admin-empty">
                        <AlertTriangle size={46} />
                        <p>{error || 'Sem dados suficientes para mostrar o dashboard.'}</p>
                    </div>
                </div>
            </>
        );
    }

    const { totals, paymentBreakdown, statusBreakdown, topResellers, recentOrders } = insights;
    const paymentRows = Object.entries(paymentBreakdown).sort((left, right) => right[1] - left[1]);
    const pipelineRows = Object.entries(statusBreakdown).sort((left, right) => right[1] - left[1]);

    return (
        <>
            <div className="admin-topbar admin-topbar-rich">
                <div>
                    <h1>Centro de Operacoes</h1>
                    <p className="admin-topbar-subtitle">
                        Controle revendedoras, margens LYRA, encomendas e repasses num unico painel.
                    </p>
                </div>
                <div className="admin-topbar-actions">
                    <span className="admin-pill">
                        {totals.activeResellers} revendedoras ativas
                    </span>
                    <span className="admin-pill admin-pill-outline">
                        {totals.pendingOrders} encomendas pendentes
                    </span>
                </div>
            </div>

            <div className="admin-content">
                <div className="admin-kpi-grid">
                    <KpiCard
                        icon={DollarSign}
                        label="Volume total vendido"
                        value={formatCurrency(totals.gmv)}
                        hint={`${totals.orders} encomendas validas`}
                    />
                    <KpiCard
                        icon={TrendingUp}
                        label="Lucro LYRA"
                        value={formatCurrency(totals.lyraProfit)}
                        hint={`Base LYRA: ${formatCurrency(totals.lyraBase)}`}
                    />
                    <KpiCard
                        icon={Users}
                        label="Repasse pronto"
                        value={formatCurrency(totals.readyPayouts)}
                        hint={`Pendente: ${formatCurrency(totals.pendingPayouts)}`}
                    />
                    <KpiCard
                        icon={ShoppingCart}
                        label="Ticket medio"
                        value={formatCurrency(totals.avgOrder)}
                        hint="Media por encomenda"
                    />
                    <KpiCard
                        icon={Package}
                        label="Catalogo ativo"
                        value={totals.activeProducts.toLocaleString('pt-PT')}
                        hint={`${totals.visibleCatalogProducts.toLocaleString('pt-PT')} produtos visiveis em catalogos`}
                    />
                    <KpiCard
                        icon={AlertTriangle}
                        label="Stock sensivel"
                        value={totals.lowStock.toLocaleString('pt-PT')}
                        hint="Produtos ativos com menos de 5 unidades"
                    />
                </div>

                <div className="admin-overview-grid">
                    <section className="admin-panel">
                        <div className="admin-panel-header">
                            <div>
                                <h3>Leitura financeira</h3>
                                <p>Margens calculadas entre Dreamlove, LYRA e revendedoras.</p>
                            </div>
                        </div>
                        <div className="admin-finance-grid">
                            <FinanceBox
                                title="Custo Dreamlove"
                                value={formatCurrency(totals.supplierCost)}
                                detail="Base atual de fornecedor"
                            />
                            <FinanceBox
                                title="Custo LYRA para revendedoras"
                                value={formatCurrency(totals.lyraBase)}
                                detail="Valor base usado no painel"
                            />
                            <FinanceBox
                                title="Lucro das revendedoras"
                                value={formatCurrency(totals.resellerProfit)}
                                detail="Ganhos gerados nas vendas"
                            />
                            <FinanceBox
                                title="Lucro bruto consolidado"
                                value={formatCurrency(totals.gmv - totals.supplierCost)}
                                detail="Venda total menos custo fornecedor"
                            />
                        </div>
                    </section>

                    <section className="admin-panel">
                        <div className="admin-panel-header">
                            <div>
                                <h3>Pipeline de encomendas</h3>
                                <p>Estado da operacao e dos pagamentos.</p>
                            </div>
                        </div>
                        <div className="admin-stack-list">
                            {pipelineRows.length === 0 ? (
                                <EmptyInline text="Sem encomendas para distribuir por estado." />
                            ) : (
                                pipelineRows.map(([status, total]) => {
                                    const meta = getOrderStatusMeta(status);
                                    return (
                                        <div key={status} className="admin-inline-stat">
                                            <span className={`admin-badge ${toneLabels[meta.tone] || 'is-neutral'}`}>
                                                {meta.label}
                                            </span>
                                            <strong>{total}</strong>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="admin-panel-note">
                            <CreditCard size={16} />
                            <span>
                                O checkout atual usa metodos manuais. A base para Stripe e snapshots financeiros
                                segue preparada na nova migracao SQL do projeto.
                            </span>
                        </div>
                    </section>
                </div>

                <div className="admin-overview-grid admin-overview-grid-wide">
                    <section className="admin-panel">
                        <div className="admin-panel-header">
                            <div>
                                <h3>Top revendedoras</h3>
                                <p>Quem mais vende e mais gera margem para a LYRA.</p>
                            </div>
                        </div>
                        {topResellers.length === 0 ? (
                            <EmptyInline text="Ainda nao existem revendedoras com vendas registadas." />
                        ) : (
                            <div className="admin-data-list">
                                {topResellers.map((reseller) => (
                                    <div key={reseller.id} className="admin-data-row">
                                        <div>
                                            <strong>{reseller.full_name || 'Revendedora sem nome'}</strong>
                                            <span>
                                                /{reseller.slug || 'sem-slug'} · {reseller.catalogVisible}/{reseller.catalogTotal} produtos visiveis
                                            </span>
                                        </div>
                                        <div className="admin-data-row-end">
                                            <div>
                                                <small>GMV</small>
                                                <strong>{formatCurrency(reseller.gmv)}</strong>
                                            </div>
                                            <div>
                                                <small>Lucro LYRA</small>
                                                <strong>{formatCurrency(reseller.lyraProfit)}</strong>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="admin-panel">
                        <div className="admin-panel-header">
                            <div>
                                <h3>Metodos de pagamento</h3>
                                <p>Visao rapida dos meios usados nas encomendas.</p>
                            </div>
                        </div>
                        {paymentRows.length === 0 ? (
                            <EmptyInline text="Sem pagamentos registados ainda." />
                        ) : (
                            <div className="admin-stack-list">
                                {paymentRows.map(([method, total]) => (
                                    <div key={method} className="admin-inline-stat">
                                        <span>{method}</span>
                                        <strong>{total}</strong>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <section className="admin-panel">
                    <div className="admin-panel-header">
                        <div>
                            <h3>Encomendas recentes</h3>
                            <p>Ultimas vendas para acompanhamento rapido.</p>
                        </div>
                    </div>
                    {recentOrders.length === 0 ? (
                        <EmptyInline text="Ainda nao ha encomendas para mostrar." />
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Encomenda</th>
                                        <th>Revendedora</th>
                                        <th>Total</th>
                                        <th>Lucro LYRA</th>
                                        <th>Repasse</th>
                                        <th>Estado</th>
                                        <th>Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td>
                                                <div className="admin-table-title">
                                                    #{order.id.slice(0, 8)}
                                                </div>
                                                <div className="admin-table-subtitle">
                                                    {order.itemsCount} itens · {order.paymentMethodLabel}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="admin-table-title">
                                                    {order.reseller?.full_name || 'Loja LYRA'}
                                                </div>
                                                <div className="admin-table-subtitle">
                                                    {order.customers?.name || 'Cliente sem nome'}
                                                </div>
                                            </td>
                                            <td>{formatCurrency(order.orderTotal)}</td>
                                            <td>{formatCurrency(order.lyraProfitTotal)}</td>
                                            <td>{formatCurrency(order.resellerProfitTotal)}</td>
                                            <td>
                                                <span className={`admin-badge ${toneLabels[order.statusMeta.tone] || 'is-neutral'}`}>
                                                    {order.statusMeta.label}
                                                </span>
                                            </td>
                                            <td>{formatDateTime(order.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
};

const KpiCard = ({ icon: Icon, label, value, hint }) => (
    <div className="admin-kpi-card">
        <div className="admin-kpi-icon">
            <Icon size={18} />
        </div>
        <div className="admin-kpi-copy">
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{hint}</small>
        </div>
    </div>
);

const FinanceBox = ({ title, value, detail }) => (
    <div className="admin-finance-box">
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
    </div>
);

const EmptyInline = ({ text }) => (
    <div className="admin-inline-empty">{text}</div>
);

export default AdminDashboard;
