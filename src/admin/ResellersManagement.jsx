import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Eye,
    EyeOff,
    Search,
    TrendingUp,
    Users,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { formatCurrency } from '../utils/finance';
import {
    buildAdminInsights,
    formatShortDate,
    loadAdminOperationsData,
} from './adminMetrics';

const ITEMS_PER_PAGE = 20;

const ResellersManagement = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchResellers = useCallback(async () => {
        setLoading(true);

        try {
            const baseData = await loadAdminOperationsData({
                includeProducts: true,
                includeOrders: true,
                includeOrderItems: true,
                includeResellers: true,
                includeResellerProducts: true,
            });

            const insights = buildAdminInsights(baseData);
            setRows(insights.resellerPerformance);
        } catch (error) {
            console.error('Resellers admin error:', error);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResellers();
    }, [fetchResellers]);

    useEffect(() => {
        setPage(0);
    }, [searchTerm, statusFilter]);

    const filteredRows = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return rows.filter((row) => {
            if (statusFilter) {
                const expected = statusFilter === 'active';
                if (row.isActive !== expected) {
                    return false;
                }
            }

            if (!normalizedSearch) {
                return true;
            }

            const haystack = [
                row.full_name,
                row.email,
                row.slug,
                row.whatsapp,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(normalizedSearch);
        });
    }, [rows, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        return filteredRows.reduce(
            (accumulator, row) => {
                accumulator.total += 1;
                accumulator.active += row.isActive ? 1 : 0;
                accumulator.gmv += row.gmv;
                accumulator.lyraProfit += row.lyraProfit;
                accumulator.readyPayout += row.readyPayout;
                return accumulator;
            },
            {
                total: 0,
                active: 0,
                gmv: 0,
                lyraProfit: 0,
                readyPayout: 0,
            }
        );
    }, [filteredRows]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
    const paginatedRows = filteredRows.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

    const topRows = filteredRows.slice(0, 3);

    const toggleActive = async (row) => {
        const newActive = !row.isActive;

        const { error } = await supabase
            .from('resellers')
            .update({
                is_active: newActive,
                status: newActive ? 'active' : 'inactive',
            })
            .eq('id', row.id);

        if (!error) {
            await fetchResellers();
        }
    };

    return (
        <>
            <div className="admin-topbar">
                <div>
                    <h1>Revendedoras</h1>
                    <p className="admin-topbar-subtitle">
                        Controle catalogos, vendas, lucro LYRA e repasses por revendedora.
                    </p>
                </div>
            </div>

            <div className="admin-content">
                <div className="admin-kpi-grid admin-kpi-grid-tight">
                    <MiniKpi label="Revendedoras" value={stats.total} icon={Users} />
                    <MiniKpi label="Ativas" value={stats.active} icon={TrendingUp} />
                    <MiniKpi label="GMV" value={formatCurrency(stats.gmv)} icon={TrendingUp} />
                    <MiniKpi label="Lucro LYRA" value={formatCurrency(stats.lyraProfit)} icon={TrendingUp} />
                    <MiniKpi label="Repasse pronto" value={formatCurrency(stats.readyPayout)} icon={TrendingUp} />
                </div>

                {topRows.length > 0 && (
                    <div className="admin-overview-grid admin-overview-grid-wide">
                        {topRows.map((row, index) => (
                            <section key={row.id} className="admin-panel admin-highlight-panel">
                                <div className="admin-panel-header">
                                    <div>
                                        <h3>Top {index + 1}</h3>
                                        <p>{row.full_name || 'Revendedora sem nome'}</p>
                                    </div>
                                </div>
                                <div className="admin-finance-grid admin-finance-grid-compact">
                                    <div className="admin-finance-box admin-finance-box-inline">
                                        <span>Catalogo visivel</span>
                                        <strong>{row.catalogVisible}</strong>
                                    </div>
                                    <div className="admin-finance-box admin-finance-box-inline">
                                        <span>Vendas</span>
                                        <strong>{formatCurrency(row.gmv)}</strong>
                                    </div>
                                    <div className="admin-finance-box admin-finance-box-inline">
                                        <span>Lucro LYRA</span>
                                        <strong>{formatCurrency(row.lyraProfit)}</strong>
                                    </div>
                                    <div className="admin-finance-box admin-finance-box-inline">
                                        <span>Repasse pronto</span>
                                        <strong>{formatCurrency(row.readyPayout)}</strong>
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                <div className="admin-table-container">
                    <div className="admin-table-header">
                        <div>
                            <h3>Base de revendedoras</h3>
                            <p className="admin-header-copy">
                                Ative, acompanhe desempenho e abra cada catalogo publico.
                            </p>
                        </div>
                        <div className="admin-filters">
                            <div className="admin-search">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar por nome, email ou slug..."
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
                                <option value="active">Ativas</option>
                                <option value="inactive">Inativas</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-loading">
                            <div className="admin-spinner"></div>
                            A carregar revendedoras...
                        </div>
                    ) : paginatedRows.length === 0 ? (
                        <div className="admin-empty">
                            <Users size={48} />
                            <p>Nenhuma revendedora encontrada.</p>
                        </div>
                    ) : (
                        <>
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Revendedora</th>
                                            <th>Catalogo</th>
                                            <th>Pedidos</th>
                                            <th>GMV</th>
                                            <th>Lucro LYRA</th>
                                            <th>Repasse</th>
                                            <th>Ultima venda</th>
                                            <th>Estado</th>
                                            <th>Acoes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedRows.map((row) => (
                                            <tr key={row.id}>
                                                <td>
                                                    <div className="admin-table-title">
                                                        {row.full_name || 'Revendedora sem nome'}
                                                    </div>
                                                    <div className="admin-table-subtitle">
                                                        {row.email || 'Sem email'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="admin-table-title">
                                                        {row.catalogVisible}/{row.catalogTotal} visiveis
                                                    </div>
                                                    <div className="admin-table-subtitle">
                                                        {row.slug ? `/${row.slug}` : 'Sem slug'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="admin-table-title">{row.ordersCount}</div>
                                                    <div className="admin-table-subtitle">
                                                        {row.pendingOrders} pendentes
                                                    </div>
                                                </td>
                                                <td>{formatCurrency(row.gmv)}</td>
                                                <td>{formatCurrency(row.lyraProfit)}</td>
                                                <td>
                                                    <div className="admin-table-title">
                                                        {formatCurrency(row.readyPayout)}
                                                    </div>
                                                    <div className="admin-table-subtitle">
                                                        Pend.: {formatCurrency(row.pendingPayout)}
                                                    </div>
                                                </td>
                                                <td>{row.lastOrderAt ? formatShortDate(row.lastOrderAt) : 'Sem vendas'}</td>
                                                <td>
                                                    <span className={`admin-badge ${row.isActive ? 'is-success' : 'is-danger'}`}>
                                                        {row.isActive ? 'Ativa' : 'Inativa'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="admin-action-stack">
                                                        {row.slug && (
                                                            <a
                                                                href={`/${row.slug}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="admin-link-inline"
                                                            >
                                                                Ver catalogo <ExternalLink size={12} />
                                                            </a>
                                                        )}
                                                        <button
                                                            className="admin-btn-icon"
                                                            onClick={() => toggleActive(row)}
                                                            title={row.isActive ? 'Desativar' : 'Ativar'}
                                                        >
                                                            {row.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredRows.length > ITEMS_PER_PAGE && (
                                <div className="admin-pagination">
                                    <div className="admin-pagination-info">
                                        {page * ITEMS_PER_PAGE + 1}-
                                        {Math.min((page + 1) * ITEMS_PER_PAGE, filteredRows.length)} de {filteredRows.length}
                                    </div>
                                    <div className="admin-pagination-buttons">
                                        <button
                                            onClick={() => setPage((current) => Math.max(0, current - 1))}
                                            disabled={page === 0}
                                        >
                                            <ChevronLeft size={14} />
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
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
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

export default ResellersManagement;
