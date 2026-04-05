import React from 'react';
import { Leaf, Droplet, Heart, ShieldCheck } from 'lucide-react';
import './TrustBadges.css';

const badges = [
    { id: 1, icon: <Leaf size={24} strokeWidth={1.5} />, text: '100% Vegan' },
    { id: 2, icon: <Heart size={24} strokeWidth={1.5} />, text: 'Cruelty-Free' },
    { id: 3, icon: <Droplet size={24} strokeWidth={1.5} />, text: 'Ingredientes Naturais' },
    { id: 4, icon: <ShieldCheck size={24} strokeWidth={1.5} />, text: 'Testado Dermatologicamente' },
];

const TrustBadges = () => {
    return (
        <section className="trust-badges-section">
            <div className="container">
                <div className="badges-wrapper">
                    {badges.map(badge => (
                        <div key={badge.id} className="trust-badge">
                            <div className="badge-icon">{badge.icon}</div>
                            <span className="badge-text">{badge.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustBadges;
