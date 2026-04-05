const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('Missing STRIPE_SECRET_KEY environment variable.');
  process.exit(1);
}

const stripeRequest = async (path, body) => {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || `Stripe request failed for ${path}`);
  }

  return payload;
};

const main = async () => {
  const product = await stripeRequest('products', {
    name: 'Sistema LYRA para Revendedora',
    description: 'Pagamento unico para ativar o sistema LYRA com painel, catalogo e suporte.',
    'metadata[offer_type]': 'reseller_access',
  });

  const price = await stripeRequest('prices', {
    product: product.id,
    currency: 'eur',
    unit_amount: '2900',
    'metadata[offer_type]': 'reseller_access',
  });

  console.log(JSON.stringify({
    productId: product.id,
    priceId: price.id,
  }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
