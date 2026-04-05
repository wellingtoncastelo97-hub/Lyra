
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const categories = [
        { name: 'Rituals' },
        { name: 'Discovery' },
        { name: 'Connection' },
        { name: 'Atmosphere' },
        { name: 'Kits & Experiences' }
    ];

    const handleNav = (path) => {
        navigate(path);
        onClose();
    };

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'is-open' : ''}`} onClick={onClose}></div>
            <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
                <div className="sidebar-header">
                    <button className="close-btn" onClick={onClose} aria-label="Fechar menu">
                        <X size={24} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="sidebar-content">
                    <section className="sidebar-section">
                        <h3 className="sidebar-title">Coleções</h3>
                        <ul className="sidebar-list">
                            <li><button className="sidebar-link active" onClick={() => handleNav('/loja')}>Todos os Produtos</button></li>
                            {categories.map((cat, index) => (
                                <li key={index}>
                                    <button className="sidebar-link" onClick={() => handleNav(`/loja?category=${encodeURIComponent(cat.name)}`)}>
                                        {cat.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="sidebar-section">
                        <h3 className="sidebar-title">Filtrar por Intenção</h3>
                        <div className="sidebar-tags">
                            <button className="tag-btn" onClick={() => handleNav('/loja?search=calma')}>Calma</button>
                            <button className="tag-btn" onClick={() => handleNav('/loja?search=desejo')}>Desejo</button>
                            <button className="tag-btn" onClick={() => handleNav('/loja?search=sensorial')}>Sensorial</button>
                            <button className="tag-btn" onClick={() => handleNav('/loja?search=conexão')}>Conexão</button>
                            <button className="tag-btn" onClick={() => handleNav('/loja?search=pessoal')}>Pessoal</button>
                        </div>
                    </section>

                    <section className="sidebar-section">
                        <h3 className="sidebar-title">Navegação</h3>
                        <ul className="sidebar-list">
                            <li><button className="sidebar-link" onClick={() => handleNav('/sobre')}>Sobre a LYRA</button></li>
                            <li><button className="sidebar-link" onClick={() => handleNav('/contacto')}>Contacte-nos</button></li>
                        </ul>
                    </section>

                    <section className="sidebar-section wellness-hub">
                        <h3 className="sidebar-title">Espaço do Bem-Estar</h3>
                        <div className="wellness-card">
                            <p>Nova na LYRA? Explore o nosso guia de rituais para a consumidora informada.</p>
                            <button className="read-more" onClick={() => handleNav('/sobre')}>Ler Guias</button>
                        </div>
                    </section>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
