import React, { useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, DollarSign, BookOpen, ArrowLeft, LogOut, Settings, ExternalLink, Menu, X } from 'lucide-react';
import './ResellerDashboard.css';

const ResellerLayout = ({ children, currentPage, onNavigate, onLogout, resellerName, resellerSlug }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleNav = (page) => {
        onNavigate(page);
        setMobileMenuOpen(false);
    };

    return (
        <div className="reseller-layout">
            {/* Mobile Header */}
            <div className="reseller-mobile-header">
                <h2>LYRA</h2>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <aside className={`reseller-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
                <div className="reseller-brand">
                    <h2>LYRA</h2>
                    <span>Portal do Revendedor</span>
                </div>

                <nav className="reseller-nav">
                    <button className={currentPage === 'home' ? 'active' : ''} onClick={() => handleNav('home')}>
                        <LayoutDashboard size={18} /> Dashboard
                    </button>
                    <button className={currentPage === 'catalog' ? 'active' : ''} onClick={() => handleNav('catalog')}>
                        <Package size={18} /> Meu Catálogo
                    </button>
                    <button className={currentPage === 'orders' ? 'active' : ''} onClick={() => handleNav('orders')}>
                        <ShoppingCart size={18} /> Encomendas
                    </button>
                    <button className={currentPage === 'earnings' ? 'active' : ''} onClick={() => handleNav('earnings')}>
                        <DollarSign size={18} /> Ganhos
                    </button>
                    <button className={currentPage === 'training' ? 'active' : ''} onClick={() => handleNav('training')}>
                        <BookOpen size={18} /> Começar a Vender
                    </button>
                    <button className={currentPage === 'settings' ? 'active' : ''} onClick={() => handleNav('settings')}>
                        <Settings size={18} /> Perfil & Catálogo
                    </button>
                </nav>

                {/* Catalog Quick Link */}
                {resellerSlug && (
                    <div className="reseller-catalog-link">
                        <a
                            href={`/${resellerSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink size={14} /> Ver Meu Catálogo
                        </a>
                    </div>
                )}

                <div className="reseller-footer">
                    <a href="/revendedores" style={{ marginBottom: '0.75rem', display: 'flex' }}>
                        <ArrowLeft size={16} /> Voltar à Landing
                    </a>
                    <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }}>
                        <LogOut size={16} /> Terminar Sessão
                    </a>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {mobileMenuOpen && <div className="reseller-overlay" onClick={() => setMobileMenuOpen(false)} />}

            <main className="reseller-main">
                <header className="reseller-header-bar">
                    <div className="greeting">Bem-vindo, {resellerName || 'Revendedor'}</div>
                    <div className="status-badge">
                        <span style={{ width: '6px', height: '6px', backgroundColor: '#27ae60', borderRadius: '50%', display: 'inline-block' }}></span>
                        Conta Ativa
                    </div>
                </header>
                {children}
            </main>
        </div>
    );
};

export default ResellerLayout;
