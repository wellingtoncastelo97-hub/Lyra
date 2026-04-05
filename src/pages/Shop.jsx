import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import AnnouncementBar from '../components/AnnouncementBar';
import BestSellers from '../components/BestSellers';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';

const Shop = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [searchParams] = useSearchParams();
    const activeCategory = searchParams.get('category') || null;
    const activeSearch = searchParams.get('search') || null;

    return (
        <div className="app">
            <AnnouncementBar />
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            <Header onMenuClick={() => setSidebarOpen(true)} />
            <main>
                <BestSellers activeCategory={activeCategory} activeSearch={activeSearch} forceShowAll />
            </main>
            <Footer />
            <FloatingWhatsApp />
        </div>
    );
};

export default Shop;
