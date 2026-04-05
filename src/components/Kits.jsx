import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Kits.css';

const kits = [
    {
        id: 'kit-discovery',
        name: 'Kit Ritual de Descoberta',
        description: 'Uma introdução à nossa coleção essencial. Inclui tamanhos de viagem do nosso óleo de massagem, gel íntimo e uma mini vela sensorial.',
        price: 65.00,
        displayPrice: '65,00 €',
        image_url: 'https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
        id: 'kit-relaxamento',
        name: 'Kit Ritual de Relaxamento',
        description: 'Criado para dissipar a tensão. Inclui os nossos sais de banho calmantes, manteiga corporal e uma bruma para quarto soothing.',
        price: 85.00,
        displayPrice: '85,00 €',
        image_url: 'https://images.pexels.com/photos/3997381/pexels-photo-3997381.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
        id: 'kit-conexao',
        name: 'Kit Ritual de Conexão',
        description: 'Para momentos partilhados de intimidade. Inclui a nossa vela Veludo & Conexão, óleo de massagem aquecente e venda de seda.',
        price: 110.00,
        displayPrice: '110,00 €',
        image_url: 'https://images.pexels.com/photos/6621340/pexels-photo-6621340.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
];

const Kits = () => {
    const { addToCart } = useCart();
    const navigate = useNavigate();

    return (
        <section className="kits-section">
            <div className="container">
                <h2 className="section-title text-center">Kits Curados</h2>
                <p className="section-subtitle text-center">
                    Coleções cuidadosamente pensadas para criar rituais completos.
                </p>

                <div className="kits-list">
                    {kits.map((kit, index) => (
                        <div key={kit.id} className={`kit-card ${index % 2 !== 0 ? 'kit-reverse' : ''}`}>
                            <div className="kit-image">
                                <img src={kit.image_url} alt={kit.name} loading="lazy" />
                            </div>
                            <div className="kit-details">
                                <h3 className="kit-name">{kit.name}</h3>
                                <p className="kit-description">{kit.description}</p>
                                <div className="kit-price">{kit.displayPrice}</div>
                                <div className="kit-actions">
                                    <button className="btn-primary" onClick={() => addToCart(kit)}>Adicionar ao Cesto</button>
                                    <button className="btn-secondary" onClick={() => navigate('/loja?category=Kits+%26+Experiences')}>Explorar Kit</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Kits;
