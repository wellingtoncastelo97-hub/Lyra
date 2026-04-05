import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Categories.css';

const Categories = () => {
    const navigate = useNavigate();

    // Hardcoded premium LYRA categories
    const categoriesData = [
        { id: '1', name: 'Rituals', img: '/placeholder.svg' },
        { id: '2', name: 'Discovery', img: '/placeholder.svg' },
        { id: '3', name: 'Connection', img: '/placeholder.svg' },
        { id: '4', name: 'Atmosphere', img: '/placeholder.svg' },
        { id: '5', name: 'Kits & Experiences', img: '/placeholder.svg' }
    ];

    return (
        <section className="categories-section">
            <div className="container">
                <div className="categories-scroll-wrapper">
                    {categoriesData.map((category) => (
                        <div key={category.id} className="category-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/loja?category=${encodeURIComponent(category.name)}`)}>
                            <div className="category-image">
                                <img src={category.img} alt={category.name} loading="lazy" onError={(e) => {
                                    e.target.src = '/placeholder.svg';
                                }} />
                                <div className="category-overlay"></div>
                            </div>
                            <h3 className="category-name">{category.name}</h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Categories;