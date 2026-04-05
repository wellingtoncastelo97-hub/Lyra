import React, { useState, useEffect } from 'react';
import ResellerLayout from './ResellerLayout';
import ResellerProducts from './ResellerProducts';
import ResellerSettings from './ResellerSettings';
import ResellerEarnings from './ResellerEarnings';
import OrdersList from '../../../admin/OrdersList';
import { useReseller } from '../../../context/ResellerContext';
import { supabase } from '../../../supabaseClient';
import { CheckSquare, Square, ArrowUpRight, Copy, ExternalLink, Check, BookOpen } from 'lucide-react';
import './ResellerDashboard.css';

const ResellerApp = () => {
    const { reseller, loading, signOut } = useReseller();
    const [currentPage, setCurrentPage] = useState('home');
    const isActive = typeof reseller?.status === 'string'
        ? reseller.status === 'active'
        : reseller?.is_active === true;

    useEffect(() => {
        if (!loading && reseller && !isActive) {
            signOut().finally(() => {
                window.location.href = '/pagamento?checkout=pending';
            });
        }
    }, [isActive, loading, reseller, signOut]);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#888' }}>A carregar...</div>;
    if (!reseller) {
        window.location.href = '/revendedores/login';
        return null;
    }
    if (!isActive) {
        return null;
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <DashboardHome onNavigate={setCurrentPage} reseller={reseller} />;
            case 'catalog':
                return <ResellerProducts />;
            case 'orders':
                return (
                    <>
                        <div className="reseller-topbar">
                            <h1>Meus Pedidos</h1>
                        </div>
                        <OrdersList role="reseller" resellerId={reseller.id} />
                    </>
                );
            case 'earnings':
                return <ResellerEarnings />;
            case 'training':
                return <TrainingView onNavigate={setCurrentPage} reseller={reseller} />;
            case 'settings':
                return <ResellerSettings />;
            default:
                return <DashboardHome onNavigate={setCurrentPage} reseller={reseller} />;
        }
    };

    return (
        <ResellerLayout
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onLogout={signOut}
            resellerName={reseller.full_name}
            resellerSlug={reseller.slug}
        >
            {renderPage()}
        </ResellerLayout>
    );
};

const DashboardHome = ({ onNavigate, reseller }) => {
    const [stats, setStats] = useState({ earnings: 0, salesCount: 0, ordersShipped: 0, catalogProducts: 0 });
    const [activities, setActivities] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        if (!reseller?.id) return;
        const fetchStats = async () => {
            // Fetch orders
            const { data: orders } = await supabase
                .from('orders')
                .select('id, total_amount, status, created_at')
                .eq('reseller_id', reseller.id);

            // Fetch catalog product count
            const { count: catalogCount } = await supabase
                .from('reseller_products')
                .select('id', { count: 'exact', head: true })
                .eq('reseller_id', reseller.id);

            const ordersArr = orders || [];
            const totalRevenue = ordersArr.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
            const shipped = ordersArr.filter(o => o.status === 'shipped' || o.status === 'delivered').length;

            setStats({
                earnings: totalRevenue,
                salesCount: ordersArr.length,
                ordersShipped: shipped,
                catalogProducts: catalogCount || 0
            });

            // Activity feed
            const recentActivities = ordersArr.slice(-5).reverse().map(o => ({
                type: 'order',
                label: o.status === 'shipped' ? 'Pedido enviado' : o.status === 'delivered' ? 'Pedido entregue' : 'Nova venda',
                detail: `${parseFloat(o.total_amount).toFixed(2).replace('.', ',')}€`,
                date: o.created_at
            }));

            setActivities(recentActivities.slice(0, 4));
            setLoadingStats(false);
        };
        fetchStats();
    }, [reseller?.id]);

    const hasFirstSale = stats.salesCount > 0;
    const hasProducts = stats.catalogProducts > 0;
    const earned100 = stats.earnings >= 100;

    const catalogUrl = `${window.location.origin}/${reseller.slug || ''}`;

    return (
        <>
            <div className="rd-hero-panel">
                <div className="rd-hero-copy">
                    <span className="rd-eyebrow">Painel LYRA</span>
                    <h1>Bem-vindo, {reseller?.full_name?.split(' ')[0] || 'Revendedor'}</h1>
                    <p>
                        Acompanhe o desempenho do seu negócio, partilhe o seu catálogo e organize as
                        suas próximas vendas num espaço mais claro, elegante e profissional.
                    </p>
                </div>
                <div className="rd-hero-aside">
                    <div className="rd-hero-pill">
                        <span className="rd-hero-pill-dot" />
                        Conta pronta para vender
                    </div>
                    <button className="rp-btn rp-btn-primary" onClick={() => onNavigate('catalog')}>
                        Gerir catálogo
                    </button>
                </div>
            </div>

            {/* Catalog Link Banner */}
            {reseller.slug && (
                <div className="rd-catalog-banner">
                    <div className="rd-catalog-banner-left">
                        <h3>O seu catálogo está ativo</h3>
                        <code className="rd-catalog-url">{catalogUrl}</code>
                    </div>
                    <div className="rd-catalog-banner-actions">
                        <button
                            className="rp-btn rp-btn-outline"
                            onClick={() => {
                                navigator.clipboard.writeText(catalogUrl);
                                alert('Link copiado!');
                            }}
                        >
                            <Copy size={14} /> Copiar Link
                        </button>
                        <a
                            href={catalogUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rp-btn rp-btn-primary"
                        >
                            <ExternalLink size={14} /> Ver Catálogo
                        </a>
                    </div>
                </div>
            )}

            {/* Progress */}
            <div className="activation-progress">
                <h3>Seu progresso</h3>
                <div className="progress-steps">
                    <div className="progress-step completed"><CheckSquare size={18} /> Criou conta</div>
                    <div className={`progress-step ${hasProducts ? 'completed' : ''}`}>{hasProducts ? <CheckSquare size={18} /> : <Square size={18} />} Adicionou produtos</div>
                    <div className={`progress-step ${hasFirstSale ? 'completed' : ''}`}>{hasFirstSale ? <CheckSquare size={18} /> : <Square size={18} />} Fez primeira venda</div>
                    <div className={`progress-step ${earned100 ? 'completed' : ''}`}>{earned100 ? <CheckSquare size={18} /> : <Square size={18} />} Ganhou 100€</div>
                </div>
            </div>

            {/* Stats */}
            <div className="reseller-stats-grid">
                <div className="r-stat-card border-gold">
                    <span className="r-stat-label">Faturação Total</span>
                    <span className="r-stat-value highlight">{stats.earnings.toFixed(2).replace('.', ',')} €</span>
                </div>
                <div className="r-stat-card">
                    <span className="r-stat-label">Vendas</span>
                    <span className="r-stat-value">{stats.salesCount}</span>
                </div>
                <div className="r-stat-card">
                    <span className="r-stat-label">Enviados</span>
                    <span className="r-stat-value">{stats.ordersShipped}</span>
                </div>
                <div className="r-stat-card">
                    <span className="r-stat-label">Produtos no Catálogo</span>
                    <span className="r-stat-value">{stats.catalogProducts}</span>
                </div>
            </div>

            <div className="dashboard-split">
                <div className="fake-chart-container">
                    <div className="rd-section-head">
                        <h3>Vendas recentes <ArrowUpRight size={18} color="#27ae60" /></h3>
                        <p>{stats.salesCount > 0 ? 'Crescimento constante' : 'Comece a vender para ver resultados'}</p>
                    </div>
                    <div className="fake-chart">
                        <div className="fake-line"></div>
                    </div>

                    {!hasProducts ? (
                        <button className="cta-main-btn" onClick={() => onNavigate('catalog')}>
                            Adicionar Produtos ao Catálogo
                        </button>
                    ) : (
                        <button className="cta-main-btn" onClick={() => onNavigate('training')}>
                            Começar a Faturar Agora
                        </button>
                    )}
                </div>

                <div className="activity-feed">
                    <h3>Atividade Recente</h3>
                    <div className="activity-list">
                        {activities.length === 0 && !loadingStats && (
                            <div className="rd-empty-note">
                                Nenhuma atividade ainda. Partilhe o seu link e comece a vender!
                            </div>
                        )}
                        {activities.map((act, i) => (
                            <div key={i} className="activity-item activity-item-spread">
                                <div className="activity-item-main">
                                    <div className="activity-icon"><Check size={14} strokeWidth={3} /></div>
                                    <div className="activity-copy">
                                        <strong>{act.label}</strong>
                                        <span>{act.detail}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

const TrainingView = ({ onNavigate, reseller }) => {
    const catalogUrl = `${window.location.origin}/${reseller?.slug || ''}`;

    return (
        <>
            <div className="reseller-topbar">
                <h1>Começar a Vender</h1>
            </div>

            <div className="dashboard-split dashboard-split-even">
                <div className="fake-chart-container">
                    <h2 className="rd-subtitle">Passo a Passo</h2>
                    <div className="rd-steps-stack">
                        <div className="rd-step-card">
                            <div className="rd-step-label">PASSO 1</div>
                            <div>Vá a "Meu Catálogo" e adicione produtos</div>
                        </div>
                        <div className="rd-step-card">
                            <div className="rd-step-label">PASSO 2</div>
                            <div>Defina os seus preços de venda</div>
                        </div>
                        <div className="rd-step-card">
                            <div className="rd-step-label">PASSO 3</div>
                            <div>Copie o seu link e partilhe no WhatsApp/Instagram</div>
                        </div>
                        <div className="rd-step-card">
                            <div className="rd-step-label">PASSO 4</div>
                            <div>Receba pedidos e acompanhe os seus ganhos</div>
                        </div>
                    </div>
                </div>

                <div className="fake-chart-container">
                    <h2 className="rd-subtitle">O Seu Link</h2>
                    <div className="rd-link-panel">
                        <p>Partilhe este link com os seus clientes:</p>
                        <code className="rd-link-code">
                            {catalogUrl}
                        </code>
                        <div className="rd-inline-actions rd-inline-actions-center">
                            <button
                                className="rp-btn rp-btn-primary"
                                onClick={() => {
                                    navigator.clipboard.writeText(catalogUrl);
                                    alert('Link copiado!');
                                }}
                            >
                                <Copy size={14} /> Copiar Link
                            </button>
                            <a
                                href={catalogUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rp-btn rp-btn-outline"
                            >
                                <ExternalLink size={14} /> Ver Catálogo
                            </a>
                        </div>
                    </div>

                    <button
                        className="cta-main-btn"
                        style={{ marginTop: '1.5rem' }}
                        onClick={() => onNavigate('catalog')}
                    >
                        Ir para Meu Catálogo
                    </button>
                </div>
            </div>
        </>
    );
};

export default ResellerApp;
