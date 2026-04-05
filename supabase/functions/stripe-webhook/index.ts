import { corsHeaders } from '../_shared/cors.ts';
import { expireStripeSession, fulfillStripeSession } from '../_shared/payments.ts';
import { verifyStripeSignature } from '../_shared/stripe.ts';

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  try {
    await verifyStripeSignature(rawBody, signature);
    const event = JSON.parse(rawBody);
    const session = event?.data?.object;

    if (!session?.id) {
      return jsonResponse({ ok: true, ignored: true });
    }

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const result = await fulfillStripeSession(session);
        return jsonResponse({ ok: true, result });
      }
      case 'checkout.session.expired': {
        await expireStripeSession(session);
        return jsonResponse({ ok: true, expired: true });
      }
      default:
        return jsonResponse({ ok: true, ignored: true, type: event.type });
    }
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Falha no webhook Stripe.' },
      400,
    );
  }
});
