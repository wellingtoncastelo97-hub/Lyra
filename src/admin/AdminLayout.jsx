import React from 'react';
import { LayoutDashboard, Package, Settings, ArrowLeft, LogOut, ShoppingCart, Users } from 'lucide-react';

const AdminLayout = ({ children, currentPage, onNavigate, onLogout }) => {
    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-brand">
                    <h2>LYRA</h2>
                    <span>Admin</span>
                </div>

                <nav className="admin-sidebar-nav">
                    <button
                        className={`admin-nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
                        onClick={() => onNavigate('dashboard')}
                    >
                        <LayoutDashboard size={18} />
                        Dashboard
                    </button>
                    <button
                        className={`admin-nav-item ${currentPage === 'products' ? 'active' : ''}`}
                        onClick={() => onNavigate('products')}
                    >
                        <Package size={18} />
                        Produtos
                    </button>
                    <button
                        className={`admin-nav-item ${currentPage === 'orders' ? 'active' : ''}`}
                        onClick={() => onNavigate('orders')}
                    >
                        <ShoppingCart size={18} />
                        Encomendas
                    </button>
                    <button
                        className={`admin-nav-item ${currentPage === 'resellers' ? 'active' : ''}`}
                        onClick={() => onNavigate('resellers')}
                    >
                        <Users size={18} />
                        Revendedores
                    </button>
                    <button
                        className={`admin-nav-item ${currentPage === 'settings' ? 'active' : ''}`}
                        onClick={() => onNavigate('settings')}
                    >
                        <Settings size={18} />
                        Definições
                    </button>
                </nav>

                <div className="admin-sidebar-footer">
                    <a href="/loja" style={{ marginBottom: '0.75rem', display: 'flex' }}>
                        <ArrowLeft size={16} />
                        Voltar à Loja
                    </a>
                    <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }}>
                        <LogOut size={16} />
                        Sair
                    </a>
                </div>
            </aside>

            {/* Main Content */}
            <div className="admin-main">
                {children}
            </div>
        </div>
    );
};

export default AdminLayout;
