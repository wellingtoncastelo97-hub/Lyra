import React, { useState } from 'react';
import { CreditCard, Settings, ShieldCheck } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import AdminLayout from './AdminLayout';
import AdminLogin from './AdminLogin';
import OrdersList from './OrdersList';
import ProductsList from './ProductsList';
import ResellersManagement from './ResellersManagement';
import './Admin.css';

const AdminPage = () => {
    const [isAuthenticated, setAuthenticated] = useState(
        localStorage.getItem('lyra_admin_auth') === 'true'
    );
    const [currentPage, setCurrentPage] = useState('dashboard');

    const handleLogout = () => {
        localStorage.removeItem('lyra_admin_auth');
        localStorage.removeItem('lyra_admin_secret');
        setAuthenticated(false);
    };

    if (!isAuthenticated) {
        return <AdminLogin onLogin={() => setAuthenticated(true)} />;
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <AdminDashboard />;
            case 'products':
                return <ProductsList />;
            case 'orders':
                return <OrdersList />;
            case 'resellers':
                return <ResellersManagement />;
            case 'settings':
                return <AdminSettingsPanel />;
            default:
                return <AdminDashboard />;
        }
    };

    return (
        <AdminLayout
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onLogout={handleLogout}
        >
            {renderPage()}
        </AdminLayout>
    );
};

const AdminSettingsPanel = () => (
    <>
        <div className="admin-topbar">
            <div>
                <h1>Definicoes operacionais</h1>
                <p className="admin-topbar-subtitle">
                    Bloco de configuracao para pagamentos, repasses e automatizacoes futuras.
                </p>
            </div>
        </div>
        <div className="admin-content">
            <div className="admin-overview-grid admin-overview-grid-wide">
                <section className="admin-panel">
                    <div className="admin-panel-header">
                        <div>
                            <h3>Checkout e pagamentos</h3>
                            <p>O checkout atual grava encomendas e metodos de pagamento manuais.</p>
                        </div>
                    </div>
                    <div className="admin-settings-list">
                        <div className="admin-settings-item">
                            <CreditCard size={18} />
                            <div>
                                <strong>Stripe futuro</strong>
                                <span>
                                    O projeto fica preparado por migracao SQL para guardar payment intents,
                                    sessoes, estado do pagamento e webhooks.
                                </span>
                            </div>
                        </div>
                        <div className="admin-settings-item">
                            <ShieldCheck size={18} />
                            <div>
                                <strong>Snapshots financeiros</strong>
                                <span>
                                    Proximo passo recomendado: aplicar a migracao para congelar custo fornecedor,
                                    custo LYRA e lucros no momento da venda.
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="admin-panel">
                    <div className="admin-panel-header">
                        <div>
                            <h3>Notas de gestao</h3>
                            <p>Boas praticas para manter a operacao limpa.</p>
                        </div>
                    </div>
                    <div className="admin-settings-list">
                        <div className="admin-settings-item">
                            <Settings size={18} />
                            <div>
                                <strong>Custo Dreamlove vs custo LYRA</strong>
                                <span>
                                    Nos produtos, use custo Dreamlove como base do fornecedor, custo LYRA como
                                    valor da revendedora e preco final como referencia de venda.
                                </span>
                            </div>
                        </div>
                        <div className="admin-settings-item">
                            <ShieldCheck size={18} />
                            <div>
                                <strong>Repasse das revendedoras</strong>
                                <span>
                                    O dashboard mostra o valor pronto para repasse com base nas encomendas nao
                                    canceladas e com estado confirmado, pago, enviado ou entregue.
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </>
);

export default AdminPage;
