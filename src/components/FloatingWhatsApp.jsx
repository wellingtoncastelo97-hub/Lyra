import React from 'react';
import { MessageCircle } from 'lucide-react';
import './FloatingWhatsApp.css';

const FloatingWhatsApp = () => {
    const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '351900000000';

    return (
        <a
            href={`https://wa.me/${whatsappNumber}`}
            className="floating-whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar connosco pelo WhatsApp"
        >
            <div className="whatsapp-tooltip">Precisa de ajuda a escolher?</div>
            <MessageCircle size={28} strokeWidth={1.5} />
        </a>
    );
};

export default FloatingWhatsApp;
