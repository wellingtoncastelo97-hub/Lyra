const stripeApiBase = 'https://api.stripe.com/v1';
const encoder = new TextEncoder();

const appendFormValue = (params: URLSearchParams, key: string, value: unknown) => {
  if (value === null || value === undefined) return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => appendFormValue(params, `${key}[${index}]`, item));
    return;
  }

  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => {
      appendFormValue(params, `${key}[${childKey}]`, childValue);
    });
    return;
  }

  params.append(key, String(value));
};

export const toStripeFormBody = (payload: Record<string, unknown>) => {
  const params = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => appendFormValue(params, key, value));
  return params;
};

const getStripeSecretKey = () => {
  const key = Deno.env.get('STRIPE_SECRET_KEY');

  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY.');
  }

  return key;
};

export const stripeRequest = async <T>(
  path: string,
  options: {
    method?: 'GET' | 'POST';
    body?: Record<string, unknown>;
    query?: Record<string, string | number | boolean>;
    apiVersion?: string;
  } = {},
): Promise<T> => {
  const method = options.method || 'POST';
  const url = new URL(`${stripeApiBase}/${path}`);

  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      ...(options.apiVersion ? { 'Stripe-Version': options.apiVersion } : {}),
      ...(method !== 'GET' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: method !== 'GET' && options.body ? toStripeFormBody(options.body) : undefined,
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error?.message || 'Stripe request failed.';
    throw new Error(message);
  }

  return payload as T;
};

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const timingSafeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
};

export const verifyStripeSignature = async (
  rawBody: string,
  signatureHeader: string | null,
  toleranceSeconds = 300,
) => {
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET.');
  }

  if (!signatureHeader) {
    throw new Error('Missing Stripe signature header.');
  }

  const parts = signatureHeader.split(',').reduce<Record<string, string[]>>((accumulator, entry) => {
    const [key, value] = entry.split('=');
    if (!key || !value) return accumulator;
    accumulator[key] = [...(accumulator[key] || []), value];
    return accumulator;
  }, {});

  const timestamp = Number(parts.t?.[0]);
  const signatures = parts.v1 || [];

  if (!timestamp || signatures.length === 0) {
    throw new Error('Invalid Stripe signature header.');
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTimestamp - timestamp) > toleranceSeconds) {
    throw new Error('Stripe signature timestamp is outside the tolerance window.');
  }

  const signingKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    signingKey,
    encoder.encode(`${timestamp}.${rawBody}`),
  );

  const expected = toHex(signature);
  const valid = signatures.some((item) => timingSafeEqual(item, expected));

  if (!valid) {
    throw new Error('Stripe signature verification failed.');
  }

  return true;
};
