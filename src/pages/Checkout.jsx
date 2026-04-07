import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TransparentCheckout from '../components/checkout/TransparentCheckout';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';
import { createStripeCheckoutSession } from '../utils/stripeCheckout';

const Checkout = () => {
  const { cartItems, cartTotal } = useCart();
  const [searchParams] = useSearchParams();
  const [resellerId, setResellerId] = useState(null);

  useEffect(() => {
    const ref = searchParams.get('ref');

    if (!ref) {
      setResellerId(null);
      return;
    }

    supabase
      .from('resellers')
      .select('id')
      .eq('slug', ref)
      .single()
      .then(({ data }) => {
        if (data?.id) {
          setResellerId(data.id);
        }
      });
  }, [searchParams]);

  const handlePrepareCheckout = async ({ customer, shippingMethod }) => {
    const refSlug = searchParams.get('ref');

    return createStripeCheckoutSession({
      type: 'catalog_order',
      uiMode: 'custom',
      source: 'shop',
      resellerId,
      resellerSlug: refSlug,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        postalCode: customer.postalCode,
        notes: customer.notes,
      },
      shippingMethod,
      cartItems: cartItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    });
  };

  return (
    <TransparentCheckout
      backTo="/loja"
      backLabel="Continuar a comprar"
      logoTo="/loja"
      cartItems={cartItems}
      cartTotal={cartTotal}
      onPrepareCheckout={handlePrepareCheckout}
      initialErrorMessage={
        searchParams.get('checkout') === 'cancelled'
          ? 'O pagamento foi interrompido. Pode retomar a encomenda quando quiser.'
          : null
      }
      emptyTitle="O seu cesto esta vazio"
      emptyDescription="Adicione produtos antes de seguir para o checkout."
      emptyActionTo="/loja"
      emptyActionLabel="Voltar a loja"
    />
  );
};

export default Checkout;
