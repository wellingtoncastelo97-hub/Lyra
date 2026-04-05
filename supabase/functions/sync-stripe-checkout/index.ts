import { corsHeaders } from '../_shared/cors.ts';
import { fulfillStripeSession } from '../_shared/payments.ts';
import { stripeRequest } from '../_shared/stripe.ts';

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

  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return jsonResponse({ error: 'Sessao Stripe em falta.' }, 400);
    }

    const session = await stripeRequest<any>(`checkout/sessions/${sessionId}`, {
      method: 'GET',
      query: {
        'expand[]': 'payment_intent',
      },
    });

    const result = await fulfillStripeSession(session);

    return jsonResponse({
      ok: true,
      sessionId,
      result,
      paymentStatus: session.payment_status || null,
      checkoutStatus: session.status || null,
    });
  } catch (error) {
    console.error('Stripe session sync error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Falha ao sincronizar checkout Stripe.' },
      400,
    );
  }
});
