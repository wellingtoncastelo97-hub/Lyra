import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import './Contact.css';

const Contact = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Contact form submitted:', formData);
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 3000);
    };

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="app">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            <Header onMenuClick={() => setSidebarOpen(true)} />

            <main className="contact-page">
                <section className="contact-hero">
                    <div className="container text-center">
                        <h1>Fale Connosco</h1>
                        <p className="contact-hero-subtitle">
                            Estamos aqui para ajudar. Envie-nos uma mensagem e responderemos o mais breve possível.
                        </p>
                    </div>
                </section>

                <section className="contact-content">
                    <div className="container">
                        <div className="contact-grid">
                            <div className="contact-info">
                                <h2>Informações de Contacto</h2>
                                <p>Tem alguma dúvida sobre os nossos produtos ou precisa de ajuda com a sua encomenda? Estamos disponíveis para si.</p>

                                <div className="contact-methods">
                                    <div className="contact-method">
                                        <Mail size={24} />
                                        <div>
                                            <h4>Email</h4>
                                            <a href="mailto:ola@lyra.pt">ola@lyra.pt</a>
                                        </div>
                                    </div>

                                    <div className="contact-method">
                                        <Phone size={24} />
                                        <div>
                                            <h4>Telefone</h4>
                                            <a href="tel:+351900000000">+351 900 000 000</a>
                                        </div>
                                    </div>

                                    <div className="contact-method">
                                        <MapPin size={24} />
                                        <div>
                                            <h4>Morada</h4>
                                            <p>Lisboa, Portugal</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="contact-hours">
                                    <h4>Horário de Atendimento</h4>
                                    <p>Segunda a Sexta: 9h - 18h</p>
                                    <p>Sábado: 10h - 14h</p>
                                    <p>Domingo: Encerrado</p>
                                </div>
                            </div>

                            <div className="contact-form-container">
                                <h2>Envie-nos uma Mensagem</h2>
                                {submitted ? (
                                    <div className="contact-success">
                                        <Send size={48} />
                                        <h3>Mensagem Enviada!</h3>
                                        <p>Obrigado pelo seu contacto. Responderemos em breve.</p>
                                    </div>
                                ) : (
                                    <form className="contact-form" onSubmit={handleSubmit}>
                                        <div className="form-group">
                                            <label>Nome *</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Email *</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Assunto *</label>
                                            <input
                                                type="text"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Mensagem *</label>
                                            <textarea
                                                name="message"
                                                value={formData.message}
                                                onChange={handleChange}
                                                rows={6}
                                                required
                                            />
                                        </div>

                                        <button type="submit" className="btn-primary">
                                            <Send size={18} />
                                            Enviar Mensagem
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="contact-faq">
                    <div className="container">
                        <h2 className="text-center">Perguntas Frequentes</h2>
                        <div className="faq-grid">
                            <div className="faq-item">
                                <h4>Quanto tempo demora a entrega?</h4>
                                <p>Entregas em Portugal Continental demoram 2-3 dias úteis. Envio grátis acima de 50€.</p>
                            </div>
                            <div className="faq-item">
                                <h4>Os produtos são seguros?</h4>
                                <p>Sim, todos os nossos produtos são testados dermatologicamente, 100% vegan e livres de químicos agressivos.</p>
                            </div>
                            <div className="faq-item">
                                <h4>Posso devolver um produto?</h4>
                                <p>Sim, aceitamos devoluções até 14 dias após a receção, desde que o produto esteja selado e não utilizado.</p>
                            </div>
                            <div className="faq-item">
                                <h4>Como posso acompanhar a minha encomenda?</h4>
                                <p>Receberá um email com o código de rastreamento assim que a encomenda for enviada.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
            <FloatingWhatsApp />
        </div>
    );
};

export default Contact;
