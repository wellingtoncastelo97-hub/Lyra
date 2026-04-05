import { supabase } from '../supabaseClient';

const normalizeError = (error, fallbackMessage) => {
    if (!error) return new Error(fallbackMessage);
    if (error instanceof Error) return error;
    return new Error(error.message || fallbackMessage);
};

export const createStripeCheckoutSession = async (payload) => {
    const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: payload,
    });

    if (error) {
        throw normalizeError(error, 'Nao foi possivel iniciar o checkout Stripe.');
    }

    if (!data?.url) {
        throw new Error('O checkout Stripe nao devolveu um link valido.');
    }

    return data;
};

export const syncStripeCheckoutSession = async (sessionId) => {
    if (!sessionId) {
        throw new Error('Sessao Stripe invalida.');
    }

    const { data, error } = await supabase.functions.invoke('sync-stripe-checkout', {
        body: { sessionId },
    });

    if (error) {
        throw normalizeError(error, 'Nao foi possivel confirmar o estado do pagamento Stripe.');
    }

    return data;
};
