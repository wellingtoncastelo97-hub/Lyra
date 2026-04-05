import { useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AdminPage from './admin/AdminPage';
import CartSidebar from './components/CartSidebar';
import { CartProvider } from './context/CartContext';
import { ResellerProvider } from './context/ResellerContext';
import './App.css';
import About from './pages/About';
import Checkout from './pages/Checkout';
import Collections from './pages/Collections';
import Contact from './pages/Contact';
import OrderConfirmation from './pages/OrderConfirmation';
import Policy from './pages/Policy';
import ProductDetail from './pages/ProductDetail';
import Shop from './pages/Shop';
import Beneficios from './pages/revendedores/Beneficios';
import ComoFunciona from './pages/revendedores/ComoFunciona';
import LandingPage from './pages/revendedores/LandingPage';
import Login from './pages/revendedores/Login';
import Registro from './pages/revendedores/Registro';
import ResellerApp from './pages/revendedores/dashboard/ResellerApp';
import CatalogPage from './pages/catalog/CatalogPage';
import CatalogProductDetail from './pages/catalog/CatalogProductDetail';
import CatalogCheckout from './pages/catalog/CatalogCheckout';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <CartProvider>
      <Router>
        <CartSidebar />
        <ScrollToTop />
        <Routes>
          {/* Main pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/explicacao" element={<ComoFunciona />} />
          <Route path="/beneficios" element={<Beneficios />} />
          <Route path="/pagamento" element={<Registro />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminPage />} />

          {/* Shop */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route path="/loja" element={<Shop />} />
          <Route path="/produto/:productId" element={<ProductDetail />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/colecoes" element={<Collections />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/politicas/:type" element={<Policy />} />

          {/* Reseller pages */}
          <Route path="/revendedores" element={<LandingPage />} />
          <Route path="/revendedores/como-funciona" element={<ComoFunciona />} />
          <Route path="/revendedores/beneficios" element={<Beneficios />} />
          <Route path="/revendedores/pagamento" element={<Registro />} />
          <Route path="/revendedores/login" element={<Login />} />
          <Route path="/revendedores/registo" element={<Registro />} />
          <Route path="/revendedores/registro" element={<Navigate to="/pagamento" replace />} />
          <Route
            path="/revendedores/painel"
            element={
              <ResellerProvider>
                <ResellerApp />
              </ResellerProvider>
            }
          />

          {/* Personalized Catalog routes (MUST be last before catch-all) */}
          <Route path="/:slug" element={<CatalogPage />} />
          <Route path="/:slug/produto/:productId" element={<CatalogProductDetail />} />
          <Route path="/:slug/checkout" element={<CatalogCheckout />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
