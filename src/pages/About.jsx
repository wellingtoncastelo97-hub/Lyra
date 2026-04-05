import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Heart, Droplet, Shield } from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import './About.css';

const About = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="app">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            <Header onMenuClick={() => setSidebarOpen(true)} />

            <main className="about-page">
                <section className="about-hero">
                    <div className="container text-center">
                        <h1>A Nossa Filosofia</h1>
                        <p className="about-hero-subtitle">
                            Na LYRA, acreditamos que o bem-estar íntimo é uma extensão natural do autocuidado.
                            Cada produto é criado para despertar os sentidos e transformar momentos comuns em rituais de conexão.
                        </p>
                    </div>
                </section>

                <section className="about-story">
                    <div className="container">
                        <div className="about-story-grid">
                            <div className="about-story-content">
                                <h2>A Nossa História</h2>
                                <p>
                                    A LYRA nasceu da convicção de que o prazer e o bem-estar íntimo merecem a mesma atenção e cuidado
                                    que dedicamos a qualquer outro aspeto da nossa saúde. Criámos uma marca que celebra a intimidade
                                    como algo natural, bonito e digno de ser vivido com intenção.
                                </p>
                                <p>
                                    Cada fórmula é desenvolvida com ingredientes naturais cuidadosamente selecionados, testados
                                    dermatologicamente e livres de componentes agressivos. Acreditamos que o que toca a nossa pele
                                    deve ser tão puro quanto o momento que queremos criar.
                                </p>
                            </div>
                            <div className="about-story-image">
                                <img src="/placeholder.svg" alt="A história LYRA" loading="lazy" />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="about-values">
                    <div className="container text-center">
                        <h2 className="section-title">Os Nossos Valores</h2>
                        <p className="section-subtitle">Princípios que guiam cada decisão que tomamos.</p>
                        <div className="values-grid">
                            <div className="value-card">
                                <Leaf size={32} strokeWidth={1.5} />
                                <h3>Naturalidade</h3>
                                <p>Ingredientes naturais e orgânicos, sem parabenos, sulfatos ou químicos agressivos.</p>
                            </div>
                            <div className="value-card">
                                <Heart size={32} strokeWidth={1.5} />
                                <h3>Inclusividade</h3>
                                <p>Produtos para todas as pessoas, todos os corpos e todas as formas de viver a intimidade.</p>
                            </div>
                            <div className="value-card">
                                <Droplet size={32} strokeWidth={1.5} />
                                <h3>Sustentabilidade</h3>
                                <p>Embalagens recicláveis, produção ética e compromisso com o impacto ambiental mínimo.</p>
                            </div>
                            <div className="value-card">
                                <Shield size={32} strokeWidth={1.5} />
                                <h3>Transparência</h3>
                                <p>Lista completa de ingredientes, testes dermatológicos e comunicação honesta.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="about-ingredients">
                    <div className="container">
                        <div className="about-story-grid reverse">
                            <div className="about-story-content">
                                <h2>Ingredientes com Propósito</h2>
                                <p>
                                    Selecionamos cada ingrediente pelo seu benefício real. Óleo de amêndoa doce para nutrir,
                                    aloe vera para acalmar, vitamina E para proteger. Sem fragrâncias artificiais,
                                    sem corantes sintéticos, sem compromissos.
                                </p>
                                <ul className="ingredients-list">
                                    <li>100% Vegan & Cruelty-Free</li>
                                    <li>Testado dermatologicamente</li>
                                    <li>Sem parabenos ou sulfatos</li>
                                    <li>Compatível com pH natural</li>
                                    <li>Embalagens sustentáveis</li>
                                </ul>
                            </div>
                            <div className="about-story-image">
                                <img src="/placeholder.svg" alt="Ingredientes naturais" loading="lazy" />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="about-cta">
                    <div className="container text-center">
                        <h2>Pronta para descobrir o seu ritual?</h2>
                        <p>Explore a nossa coleção e encontre os produtos perfeitos para si.</p>
                        <button className="btn-primary" onClick={() => navigate('/loja')}>Explorar a Loja</button>
                    </div>
                </section>
            </main>

            <Footer />
            <FloatingWhatsApp />
        </div>
    );
};

export default About;
