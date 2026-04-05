import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import './Collections.css';

const collections = [
    {
        id: 'rituals',
        name: 'Rituals',
        description: 'Óleos de massagem e produtos para criar momentos de conexão profunda.',
        image: '/placeholder.svg',
        products: 'Óleos de Massagem, Velas Aromáticas'
    },
    {
        id: 'discovery',
        name: 'Discovery',
        description: 'Produtos íntimos para explorar novas sensações e descobrir o prazer.',
        image: '/placeholder.svg',
        products: 'Gels Íntimos, Lubrificantes, Estimulantes'
    },
    {
        id: 'connection',
        name: 'Connection',
        description: 'Experiências pensadas para partilhar e fortalecer laços.',
        image: '/placeholder.svg',
        products: 'Kits para Casais, Jogos Sensoriais'
    },
    {
        id: 'atmosphere',
        name: 'Atmosphere',
        description: 'Crie o ambiente perfeito com velas, brumas e aromas envolventes.',
        image: '/placeholder.svg',
        products: 'Velas, Difusores, Brumas de Ambiente'
    },
    {
        id: 'kits',
        name: 'Kits & Experiences',
        description: 'Coleções curadas para rituais completos de bem-estar íntimo.',
        image: '/placeholder.svg',
        products: 'Kits de Descoberta, Kits de Relaxamento, Presentes'
    }
];

const Collections = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="app">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            <Header onMenuClick={() => setSidebarOpen(true)} />

            <main className="collections-page">
                <section className="collections-hero">
                    <div className="container text-center">
                        <h1>As Nossas Coleções</h1>
                        <p className="collections-hero-subtitle">
                            Cada coleção foi criada com uma intenção. Explore e encontre a que ressoa consigo.
                        </p>
                    </div>
                </section>

                <section className="collections-grid-section">
                    <div className="container">
                        <div className="collections-grid">
                            {collections.map((collection) => (
                                <div
                                    key={collection.id}
                                    className="collection-card"
                                    onClick={() => navigate(`/loja?category=${encodeURIComponent(collection.name)}`)}
                                >
                                    <div className="collection-image">
                                        <img
                                            src={collection.image}
                                            alt={collection.name}
                                            loading="lazy"
                                            onError={(e) => { e.target.src = '/placeholder.svg'; }}
                                        />
                                        <div className="collection-overlay"></div>
                                    </div>
                                    <div className="collection-content">
                                        <h2>{collection.name}</h2>
                                        <p className="collection-description">{collection.description}</p>
                                        <p className="collection-products">{collection.products}</p>
                                        <button className="btn-secondary collection-btn">Explorar Coleção</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="collections-cta">
                    <div className="container text-center">
                        <h2>Não sabe por onde começar?</h2>
                        <p>Explore todos os nossos produtos ou contacte-nos para uma recomendação personalizada.</p>
                        <div className="collections-cta-buttons">
                            <button className="btn-primary" onClick={() => navigate('/loja')}>Ver Todos os Produtos</button>
                            <button className="btn-secondary" onClick={() => navigate('/contacto')}>Falar Connosco</button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
            <FloatingWhatsApp />
        </div>
    );
};

export default Collections;
