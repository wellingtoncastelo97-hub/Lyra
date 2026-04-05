import { createAdminClient } from './supabaseAdmin.ts';

type StripeSession = {
  id: string;
  payment_status?: string | null;
  status?: string | null;
  payment_intent?: string | null;
  customer?: string | null;
  customer_details?: {
    email?: string | null;
    name?: string | null;
  } | null;
  metadata?: Record<string, string | undefined> | null;
};

const getCheckoutType = (session: StripeSession) => session.metadata?.checkout_type || '';

export const fulfillStripeSession = async (session: StripeSession) => {
  const supabase = createAdminClient();
  const checkoutType = getCheckoutType(session);
  const isPaid = session.payment_status === 'paid';
  const now = new Date().toISOString();

  if (checkoutType === 'reseller_access') {
    const resellerId = session.metadata?.reseller_id;

    if (!resellerId) {
      throw new Error('Missing reseller metadata in Stripe session.');
    }

    const updatePayload = {
      payment_status: isPaid ? 'paid' : session.payment_status || 'pending',
      payment_gateway: 'stripe',
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent || null,
      stripe_customer_id: session.customer || null,
      checkout_completed_at: now,
      ...(isPaid ? {
        is_active: true,
        status: 'active',
        paid_at: now,
      } : {}),
    };

    const { error } = await supabase
      .from('resellers')
      .update(updatePayload)
      .eq('id', resellerId);

    if (error) throw error;

    return {
      type: 'reseller_access',
      resourceId: resellerId,
      status: isPaid ? 'paid' : session.payment_status || 'pending',
    };
  }

  if (checkoutType === 'catalog_order') {
    const orderId = session.metadata?.order_id;

    if (!orderId) {
      throw new Error('Missing order metadata in Stripe session.');
    }

    const updatePayload = {
      payment_status: isPaid ? 'paid' : session.payment_status || 'pending',
      payment_gateway: 'stripe',
      payment_method: 'stripe',
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent || null,
      paid_at: isPaid ? now : null,
      status: isPaid ? 'paid' : 'pending',
    };

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (error) throw error;

    return {
      type: 'catalog_order',
      resourceId: orderId,
      status: isPaid ? 'paid' : session.payment_status || 'pending',
    };
  }

  return {
    type: checkoutType || 'unknown',
    resourceId: null,
    status: session.payment_status || session.status || 'unknown',
  };
};

export const expireStripeSession = async (session: StripeSession) => {
  const supabase = createAdminClient();
  const checkoutType = getCheckoutType(session);

  if (checkoutType === 'reseller_access') {
    const resellerId = session.metadata?.reseller_id;
    if (!resellerId) return;

    await supabase
      .from('resellers')
      .update({
        payment_status: 'expired',
        payment_gateway: 'stripe',
        stripe_checkout_session_id: session.id,
      })
      .eq('id', resellerId);

    return;
  }

  if (checkoutType === 'catalog_order') {
    const orderId = session.metadata?.order_id;
    if (!orderId) return;

    await supabase
      .from('orders')
      .update({
        payment_status: 'expired',
        payment_gateway: 'stripe',
        payment_method: 'stripe',
        stripe_checkout_session_id: session.id,
        status: 'cancelled',
      })
      .eq('id', orderId);
  }
};
