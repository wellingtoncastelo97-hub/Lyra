import React, { useState } from 'react';
import { Menu, Search, User, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import './Header.css';

const Header = ({ onMenuClick }) => {
    const { setIsCartOpen, cartCount } = useCart();
    const navigate = useNavigate();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/loja?search=${encodeURIComponent(searchTerm.trim())}`);
            setIsSearchOpen(false);
            setSearchTerm('');
        }
    };

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-left">
                    <button className="icon-btn menu-btn" onClick={onMenuClick} aria-label="Abrir menu">
                        <Menu size={24} strokeWidth={1.5} />
                    </button>
                    <nav className="header-nav">
                        <Link to="/loja" className="nav-link">Loja</Link>
                        <Link to="/colecoes" className="nav-link">Coleções</Link>
                        <Link to="/sobre" className="nav-link">Sobre</Link>
                    </nav>
                </div>

                <div className="header-logo">
                    <Link to="/loja">LYRA</Link>
                </div>

                <div className="header-icons">
                    {isSearchOpen ? (
                        <form className="header-search-form" onSubmit={handleSearchSubmit}>
                            <input
                                type="text"
                                placeholder="Procurar produtos..."
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button type="button" className="icon-btn" onClick={() => setIsSearchOpen(false)}>
                                <X size={20} strokeWidth={1.5} />
                            </button>
                        </form>
                    ) : (
                        <button className="icon-btn" aria-label="Pesquisar" onClick={() => setIsSearchOpen(true)}>
                            <Search size={20} strokeWidth={1.5} />
                        </button>
                    )}

                    <button className="icon-btn" aria-label="Conta">
                        <User size={20} strokeWidth={1.5} />
                    </button>
                    <button className="icon-btn" aria-label="Cesto" onClick={() => setIsCartOpen(true)} style={{ position: 'relative' }}>
                        <ShoppingBag size={20} strokeWidth={1.5} />
                        {cartCount > 0 && (
                            <span className="cart-badge">{cartCount}</span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
