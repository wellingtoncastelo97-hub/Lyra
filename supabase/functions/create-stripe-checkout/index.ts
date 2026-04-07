import { corsHeaders } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabaseAdmin.ts';
import { stripeRequest } from '../_shared/stripe.ts';

type ResellerCheckoutPayload = {
  type: 'reseller_access';
  resellerId: string;
  email: string;
  fullName: string;
};

type CatalogCheckoutPayload = {
  type: 'catalog_order';
  uiMode?: 'hosted' | 'custom';
  source?: 'shop' | 'catalog';
  resellerId?: string | null;
  resellerSlug?: string | null;
  shippingMethod: {
    id: string;
    carrier: string;
    label: string;
    subtitle?: string;
    price: number;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    notes?: string;
  };
  cartItems: Array<{
    productId: string;
    quantity: number;
  }>;
};

type CheckoutPayload = ResellerCheckoutPayload | CatalogCheckoutPayload;

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const getBaseUrl = (request: Request) =>
  Deno.env.get('APP_BASE_URL') ||
  request.headers.get('origin') ||
  'http://127.0.0.1:4173';

const buildResellerLineItem = () => {
  const predefinedPriceId = Deno.env.get('STRIPE_RESELLER_PRICE_ID');

  if (predefinedPriceId) {
    return {
      price: predefinedPriceId,
      quantity: 1,
    };
  }

  return {
    price_data: {
      currency: 'eur',
      unit_amount: 2900,
      product_data: {
        name: 'Sistema LYRA para Revendedora',
        description: 'Ativacao do sistema de revenda LYRA com painel, catalogo e suporte.',
      },
    },
    quantity: 1,
  };
};

const ensureResellerPending = async (
  supabase: ReturnType<typeof createAdminClient>,
  resellerId: string,
  sessionId: string,
) => {
  const { error } = await supabase
    .from('resellers')
    .update({
      payment_status: 'checkout_created',
      payment_gateway: 'stripe',
      stripe_checkout_session_id: sessionId,
    })
    .eq('id', resellerId);

  if (error) throw error;
};

const handleResellerCheckout = async (
  payload: ResellerCheckoutPayload,
  request: Request,
) => {
  const supabase = createAdminClient();
  const baseUrl = getBaseUrl(request);

  const { data: reseller, error: resellerError } = await supabase
    .from('resellers')
    .select('id, full_name, email, status, is_active')
    .eq('id', payload.resellerId)
    .single();

  if (resellerError || !reseller) {
    throw new Error('Revendedora nao encontrada para iniciar o checkout.');
  }

  const isAlreadyActive = typeof reseller.status === 'string'
    ? reseller.status === 'active'
    : reseller.is_active === true;

  if (isAlreadyActive) {
    throw new Error('Esta conta ja esta ativa.');
  }

  const session = await stripeRequest<{ id: string; url: string }>('checkout/sessions', {
    body: {
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: payload.email,
      client_reference_id: payload.resellerId,
      customer_creation: 'always',
      success_url: `${baseUrl}/pagamento?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pagamento?checkout=cancelled`,
      metadata: {
        checkout_type: 'reseller_access',
        reseller_id: payload.resellerId,
        email: payload.email,
        full_name: payload.fullName,
      },
      line_items: [buildResellerLineItem()],
    },
  });

  await ensureResellerPending(supabase, payload.resellerId, session.id);

  return jsonResponse({
    url: session.url,
    sessionId: session.id,
  });
};

const resolveCatalogReseller = async (
  supabase: ReturnType<typeof createAdminClient>,
  resellerId?: string | null,
  resellerSlug?: string | null,
) => {
  if (resellerId) {
    return resellerId;
  }

  if (!resellerSlug) {
    return null;
  }

  const { data } = await supabase
    .from('resellers')
    .select('id, status, is_active')
    .eq('slug', resellerSlug)
    .maybeSingle();

  const isAvailable = typeof data?.status === 'string'
    ? data.status === 'active'
    : data?.is_active === true;

  return isAvailable ? data?.id || null : null;
};

const handleCatalogCheckout = async (
  payload: CatalogCheckoutPayload,
  request: Request,
) => {
  const supabase = createAdminClient();
  const baseUrl = getBaseUrl(request);
  const resellerId = await resolveCatalogReseller(supabase, payload.resellerId, payload.resellerSlug);
  const source = payload.source || (resellerId ? 'catalog' : 'shop');
  const uiMode = payload.uiMode === 'custom' ? 'custom' : 'hosted';
  const customerNotes = payload.customer.notes?.trim() || null;
  const shippingPrice = Number(Number(payload.shippingMethod?.price || 0).toFixed(2));
  const shippingCarrier = payload.shippingMethod?.carrier?.trim() || '';
  const shippingLabel = payload.shippingMethod?.label?.trim() || '';
  const shippingSubtitle = payload.shippingMethod?.subtitle?.trim() || '';
  const shippingSummaryLabel = [shippingCarrier, shippingLabel].filter(Boolean).join(' - ');

  if ((payload.source === 'catalog' || payload.resellerId || payload.resellerSlug) && !resellerId) {
    throw new Error('Catalogo de revendedora invalido ou inativo.');
  }

  if (!payload.customer?.email || !payload.customer?.name || !Array.isArray(payload.cartItems) || payload.cartItems.length === 0) {
    throw new Error('Dados do checkout incompletos.');
  }

  if (!payload.shippingMethod?.id || !shippingCarrier || !shippingLabel || shippingPrice <= 0) {
    throw new Error('Metodo de entrega invalido.');
  }

  const productIds = [...new Set(payload.cartItems.map((item) => item.productId).filter(Boolean))];
  const { data: products, error: productError } = await supabase
    .from('products')
    .select('id, name, description, image_url, price, status, stock')
    .in('id', productIds);

  if (productError) throw productError;

  const productMap = new Map((products || []).map((product) => [product.id, product]));
  const resellerPriceMap = new Map<string, number>();

  if (source === 'catalog' && resellerId) {
    const { data: resellerProducts, error: resellerProductsError } = await supabase
      .from('reseller_products')
      .select('product_id, custom_price, is_visible')
      .eq('reseller_id', resellerId)
      .in('product_id', productIds)
      .eq('is_visible', true);

    if (resellerProductsError) throw resellerProductsError;

    (resellerProducts || []).forEach((row) => {
      resellerPriceMap.set(row.product_id, Number.parseFloat(row.custom_price) || 0);
    });
  }

  const normalizedItems = payload.cartItems.map((item) => {
    const product = productMap.get(item.productId);

    if (!product || product.status !== 'active') {
      throw new Error('Existe um produto invalido ou inativo no checkout.');
    }

    const quantity = Math.max(1, Math.min(99, Number.parseInt(String(item.quantity), 10) || 1));
    const unitPrice = source === 'catalog' && resellerId
      ? resellerPriceMap.get(item.productId) || 0
      : Number.parseFloat(product.price) || 0;

    if (unitPrice <= 0) {
      throw new Error(`O produto "${product.name}" nao tem preco valido para checkout.`);
    }

    return {
      product,
      quantity,
      unitPrice,
      total: Number((unitPrice * quantity).toFixed(2)),
    };
  });

  const productsSubtotal = Number(
    normalizedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2),
  );
  const orderTotal = Number((productsSubtotal + shippingPrice).toFixed(2));

  const customerAddress = [
    payload.customer.address,
    `${payload.customer.postalCode} ${payload.customer.city}`.trim(),
  ]
    .filter(Boolean)
    .join(', ');

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert([{
      name: payload.customer.name,
      email: payload.customer.email,
      phone: payload.customer.phone,
      address: customerAddress,
    }])
    .select('id')
    .single();

  if (customerError) throw customerError;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      customer_id: customer.id,
      reseller_id: resellerId,
      total_amount: orderTotal,
      subtotal_amount: productsSubtotal,
      payment_method: 'stripe',
      payment_gateway: 'stripe',
      payment_status: 'pending',
      status: 'pending',
      customer_notes: customerNotes,
      shipping_method: payload.shippingMethod.id,
      shipping_label: shippingSummaryLabel,
      shipping_cost: shippingPrice,
    }])
    .select('id')
    .single();

  if (orderError) throw orderError;

  const orderItems = normalizedItems.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    quantity: item.quantity,
    price_at_time: item.unitPrice,
  }));

  const { error: orderItemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (orderItemsError) throw orderItemsError;

  const confirmationBase = `${baseUrl}/order-confirmation/${order.id}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const returnUrl = payload.resellerSlug
    ? `${confirmationBase}&ref=${encodeURIComponent(payload.resellerSlug)}`
    : confirmationBase;

  const cancelUrl = payload.resellerSlug
    ? `${baseUrl}/${payload.resellerSlug}/checkout?checkout=cancelled`
    : `${baseUrl}/checkout?checkout=cancelled`;

  const sessionPayload: Record<string, unknown> = {
    mode: 'payment',
    payment_method_types: ['mb_way', 'card'],
    customer_email: payload.customer.email,
    client_reference_id: order.id,
    metadata: {
      checkout_type: 'catalog_order',
      order_id: order.id,
      reseller_id: resellerId || '',
      reseller_slug: payload.resellerSlug || '',
      source,
      customer_notes: customerNotes || '',
      shipping_method: payload.shippingMethod.id,
      shipping_label: shippingSummaryLabel,
      shipping_cost: shippingPrice.toFixed(2),
    },
    line_items: normalizedItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(item.unitPrice * 100),
        product_data: {
          name: item.product.name,
          description: item.product.description?.slice(0, 500) || undefined,
          images: item.product.image_url ? [item.product.image_url] : undefined,
        },
      },
    })),
  };

  sessionPayload.line_items = [
    ...(sessionPayload.line_items as Array<Record<string, unknown>>),
    {
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(shippingPrice * 100),
        product_data: {
          name: `Entrega - ${shippingSummaryLabel}`,
          description: shippingSubtitle || undefined,
        },
      },
    },
  ];

  if (uiMode === 'custom') {
    sessionPayload.ui_mode = 'custom';
    sessionPayload.return_url = returnUrl;
  } else {
    sessionPayload.success_url = returnUrl;
    sessionPayload.cancel_url = cancelUrl;
    sessionPayload.customer_creation = 'always';
  }

  let session: { id: string; url?: string; client_secret?: string };

  try {
    session = await stripeRequest<{ id: string; url?: string; client_secret?: string }>('checkout/sessions', {
      apiVersion: uiMode === 'custom' ? '2025-03-31.basil' : undefined,
      body: sessionPayload,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    const canRetryWithoutMbWay = message.includes('mb_way') || message.includes('payment_method_types');

    if (!canRetryWithoutMbWay) {
      throw error;
    }

    sessionPayload.payment_method_types = ['card'];
    console.warn('MB WAY indisponivel na conta Stripe; retry sem mb_way.');

    session = await stripeRequest<{ id: string; url?: string; client_secret?: string }>('checkout/sessions', {
      apiVersion: uiMode === 'custom' ? '2025-03-31.basil' : undefined,
      body: sessionPayload,
    });
  }

  const { error: stripeSessionError } = await supabase
    .from('orders')
    .update({
      stripe_checkout_session_id: session.id,
    })
    .eq('id', order.id);

  if (stripeSessionError) throw stripeSessionError;

  if (uiMode === 'custom') {
    if (!session.client_secret) {
      throw new Error('A sessao de pagamento nao devolveu client secret.');
    }

    return jsonResponse({
      clientSecret: session.client_secret,
      sessionId: session.id,
      orderId: order.id,
      returnUrl,
    });
  }

  return jsonResponse({
    url: session.url,
    sessionId: session.id,
    orderId: order.id,
  });
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const payload = await request.json() as CheckoutPayload;

    if (payload.type === 'reseller_access') {
      return await handleResellerCheckout(payload, request);
    }

    if (payload.type === 'catalog_order') {
      return await handleCatalogCheckout(payload, request);
    }

    return jsonResponse({ error: 'Tipo de checkout invalido.' }, 400);
  } catch (error) {
    console.error('Stripe checkout creation error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Falha ao criar checkout Stripe.' },
      400,
    );
  }
});
