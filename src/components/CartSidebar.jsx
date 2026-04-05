import React from 'react';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './CartSidebar.css';

const CartSidebar = () => {
    const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
    const navigate = useNavigate();

    if (!isCartOpen) return null;

    const handleCheckout = () => {
        setIsCartOpen(false);
        navigate('/checkout');
    };

    return (
        <>
            <div className="cart-overlay" onClick={() => setIsCartOpen(false)} />
            <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h2>O seu cesto ({cartCount})</h2>
                    <button className="cart-close-btn" onClick={() => setIsCartOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <div className="cart-content">
                    {cartItems.length === 0 ? (
                        <div className="cart-empty">
                            <ShoppingBag size={48} strokeWidth={1} />
                            <p>O seu cesto está vazio.</p>
                            <button className="btn-primary" onClick={() => setIsCartOpen(false)}>
                                Continuar a comprar
                            </button>
                        </div>
                    ) : (
                        <div className="cart-items-list">
                            {cartItems.map((item) => (
                                <div key={item.id} className="cart-item">
                                    <div className="cart-item-img">
                                        <img src={item.image_url || '/placeholder.svg'} alt={item.name} />
                                    </div>
                                    <div className="cart-item-info">
                                        <div className="cart-item-title-row">
                                            <h4>{item.name}</h4>
                                            <button className="remove-item-btn" onClick={() => removeFromCart(item.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="cart-item-price">
                                            {(item.price || 0).toFixed(2).replace('.', ',')} €
                                        </div>
                                        <div className="cart-item-quantity">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                                <Minus size={14} />
                                            </button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-subtotal">
                            <span>Subtotal</span>
                            <span>{cartTotal.toFixed(2).replace('.', ',')} €</span>
                        </div>
                        <p className="cart-shipping-note">Portes e impostos calculados no checkout.</p>
                        <button className="btn-primary cart-checkout-btn" onClick={handleCheckout}>
                            Finalizar Compra
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartSidebar;
