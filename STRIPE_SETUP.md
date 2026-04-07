# Stripe Setup

Para um lancamento completo em producao com dominio real e scripts, veja tambem:

- `PRODUCTION_LAUNCH.md`

## 1. SQL

Execute estas migracoes no SQL Editor do Supabase:

- `supabase-migration.sql`
- `supabase-admin-operations-migration.sql`
- `supabase-admin-product-write-policies.sql`
- `supabase-stripe-integration.sql`

## 2. Edge Function secrets

Defina estes secrets no Supabase:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `APP_BASE_URL`
- `STRIPE_RESELLER_PRICE_ID` (opcional, se quiser usar um preco ja criado no Stripe)

## 3. Frontend env

Defina tambem no frontend hospedado:

- `VITE_STRIPE_PUBLISHABLE_KEY`

Se estiver a usar Vercel, esta chave precisa de existir no ambiente de build para o checkout da loja e do catalogo usarem a conta Stripe correta.

## 4. Deploy das funcoes

Funcoes criadas:

- `create-stripe-checkout`
- `sync-stripe-checkout`
- `stripe-webhook`

Deploy esperado com Supabase CLI:

```bash
supabase functions deploy create-stripe-checkout
supabase functions deploy sync-stripe-checkout
supabase functions deploy stripe-webhook
```

## 5. Webhook Stripe

Crie um endpoint Stripe a apontar para:

```text
https://<project-ref>.functions.supabase.co/stripe-webhook
```

Eventos recomendados:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.expired`

## 6. Oferta LYRA

Se quiser ter a oferta de 29EUR ja criada no dashboard Stripe, use:

```bash
node scripts/create-stripe-offers.mjs
```

O script devolve `productId` e `priceId`. Se quiser usar esse preco fixo no checkout de revendedora, configure `STRIPE_RESELLER_PRICE_ID`.

## 7. Fluxos ligados

- `/pagamento` cria conta pendente e abre checkout Stripe para a revendedora
- `/checkout` usa Stripe para pedidos da loja
- `/:slug/checkout` usa Stripe para pedidos do catalogo da revendedora
- `/order-confirmation/:orderId` sincroniza o estado do pagamento ao regressar do Stripe
