import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';
import './FeaturedProduct.css';

const fallbackProduct = {
    id: 'featured-1',
    name: 'Óleo de Massagem Midnight Amber',
    price: 45.00,
    image_url: '/placeholder.svg',
    description: 'Uma mistura sensual de âmbar quente, baunilha e óleo de amêndoa doce. Criado para fundir-se na pele, este luxuoso óleo corporal transforma o simples ato de tocar num ritual profundamente reconfortante. Deixe o calor despertar os seus sentidos.'
};

const FeaturedProduct = () => {
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [product, setProduct] = useState(fallbackProduct);

    useEffect(() => {
        const fetchFeatured = async () => {
            const { data } = await supabase
                .from('products')
                .select('*')
                .eq('is_featured', true)
                .eq('status', 'active')
                .limit(1)
                .single();
            if (data) {
                setProduct({
                    ...data,
                    description: data.description || fallbackProduct.description
                });
            }
        };
        fetchFeatured();
    }, []);

    const formatPrice = (price) => {
        if (!price) return '45,00 €';
        return `${parseFloat(price).toFixed(2).replace('.', ',')} €`;
    };

    return (
        <section className="featured-section">
            <div className="container">
                <div className="featured-content-wrapper">
                    <div className="featured-image">
                        <img
                            src={product.image_url || '/placeholder.svg'}
                            alt={product.name}
                            loading="lazy"
                            onError={(e) => { e.target.src = '/placeholder.svg'; }}
                        />
                    </div>

                    <div className="featured-details">
                        <span className="featured-label">Ritual em Destaque</span>
                        <h2 className="featured-title">{product.name}</h2>
                        <p className="featured-description">{product.description}</p>
                        <div className="featured-price">{formatPrice(product.price)}</div>
                        <div className="featured-actions">
                            <button className="btn-primary" onClick={() => addToCart(product)}>Adicionar ao Cesto</button>
                            <button className="btn-secondary" onClick={() => navigate(`/produto/${product.id}`)}>Saber Mais</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturedProduct;
