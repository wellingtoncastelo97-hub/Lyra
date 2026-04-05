import React from 'react';
import { Instagram, Facebook, Twitter, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-newsletter">
                    <h3 className="newsletter-title">Receba novos rituais, inspiração e experiências exclusivas.</h3>
                    <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="email"
                            placeholder="O seu endereço de email"
                            className="newsletter-input"
                            required
                        />
                        <button type="submit" className="newsletter-submit" aria-label="Subscribe">
                            <ArrowRight size={20} />
                        </button>
                    </form>
                </div>

                <div className="footer-links-container">
                    <div className="footer-brand">
                        <h2 className="footer-logo">LYRA</h2>
                        <p className="footer-tagline">Experiências sensoriais criadas para despertar os sentidos.</p>
                        <div className="footer-socials">
                            <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
                            <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
                            <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
                        </div>
                    </div>

                    <div className="footer-nav-groups">
                        <div className="footer-nav-group">
                            <h4 className="footer-nav-title">Loja</h4>
                            <ul className="footer-nav-list">
                                <li><Link to="/loja?category=Rituals">Óleos de Massagem</Link></li>
                                <li><Link to="/loja?category=Discovery">Gels Íntimos</Link></li>
                                <li><Link to="/loja?category=Atmosphere">Velas</Link></li>
                                <li><Link to="/loja?category=Kits+%26+Experiences">Kits & Presentes</Link></li>
                            </ul>
                        </div>

                        <div className="footer-nav-group">
                            <h4 className="footer-nav-title">Sobre a LYRA</h4>
                            <ul className="footer-nav-list">
                                <li><Link to="/sobre">A Nossa Filosofia</Link></li>
                                <li><Link to="/sobre">Ingredientes</Link></li>
                                <li><Link to="/sobre">Sustentabilidade</Link></li>
                                <li><Link to="/contacto">Diário</Link></li>
                            </ul>
                        </div>

                        <div className="footer-nav-group">
                            <h4 className="footer-nav-title">Apoio ao Cliente</h4>
                            <ul className="footer-nav-list">
                                <li><Link to="/contacto">Contacte-nos</Link></li>
                                <li><Link to="/politicas/envios">Envios & Devoluções</Link></li>
                                <li><Link to="/contacto">FAQ</Link></li>
                                <li><Link to="/politicas/privacidade">Termos & Privacidade</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2022 - {new Date().getFullYear()} LYRA Intimate Wellness. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
