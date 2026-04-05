import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

const images = [
    // Image 1: Massage oil & candle on beige cloth (local)
    "/assets/hero/banner1.jpeg",
    // Image 2: Intimate wellness oil (local)
    "/assets/hero/banner2.png"
];

const Hero = () => {
    const [currentImage, setCurrentImage] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % images.length);
        }, 5000); // Change image every 5 seconds
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="hero">
            <div className="hero-background">
                {images.map((img, index) => (
                    <img
                        key={index}
                        src={img}
                        alt="Atmosfera sensorial de bem-estar"
                        className={`hero-slide ${index === currentImage ? 'active' : ''}`}
                    />
                ))}
                <div className="hero-overlay"></div>
            </div>
            <div className="container hero-content text-center">
                <h1>Descubra novos rituais de intimidade</h1>
                <p className="hero-subtitle">
                    Experiências sensoriais criadas para despertar os sentidos
                    e transformar momentos íntimos em bem-estar.
                </p>
                <button className="btn-primary" onClick={() => navigate('/loja')}>Explorar a coleção</button>
            </div>
        </section>
    );
};

export default Hero;
