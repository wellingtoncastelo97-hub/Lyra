import { loadStripe } from '@stripe/stripe-js';

const fallbackPublishableKey = 'pk_live_51TIaeE11szeAjxCemb6U2cYdZq7H611pmttmdE9NtW7Sgq45K4mRtaEHkLkYxxlcKieEnq0pAM6z6LIOjrxgdMzV00gUYbIW7x';
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || fallbackPublishableKey;

if (typeof window !== 'undefined' && !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
  console.warn('[stripe] VITE_STRIPE_PUBLISHABLE_KEY nao definida. A usar fallback embutido.');
}

if (typeof window !== 'undefined' && publishableKey.startsWith('pk_live_') && window.location.protocol !== 'https:') {
  console.warn('[stripe] Chave LIVE requer HTTPS - o checkout nao funciona em http://');
}

export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
