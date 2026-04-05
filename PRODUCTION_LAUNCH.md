# LYRA Production Launch

## 1. Preparacao

- Rode as SQLs no Supabase SQL Editor por esta ordem:
  - `supabase-migration.sql`
  - `supabase-admin-operations-migration.sql`
  - `supabase-admin-product-write-policies.sql`
  - `supabase-stripe-integration.sql`
- Depois, altere imediatamente a password de admin no banco:

```sql
update public.lyra_app_settings
set value = 'COLOQUE_UMA_PASSWORD_ADMIN_FORTE_AQUI', updated_at = now()
where key = 'admin_password';
```

## 2. Variaveis de frontend

No provider do site, configure:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_PASSWORD`
- `VITE_WHATSAPP_NUMBER`

## 3. Secrets do Supabase

Defina no terminal:

```powershell
$env:SUPABASE_DB_URL='postgresql://...'
$env:SUPABASE_SERVICE_ROLE_KEY='cole_aqui'
$env:STRIPE_SECRET_KEY='cole_aqui'
$env:STRIPE_RESELLER_PRICE_ID='opcional'
```

Depois execute:

```powershell
.\scripts\set-supabase-secrets.ps1
```

## 4. Publicar Edge Functions

```powershell
.\scripts\deploy-supabase-production.ps1
```

Se `SUPABASE_DB_URL` estiver definida, a migracao Stripe tambem sera aplicada por comando.

## 5. Criar a oferta de 29 EUR no Stripe

```powershell
$env:STRIPE_SECRET_KEY='cole_aqui'
node .\scripts\create-stripe-offers.mjs
```

Guarde o `priceId` devolvido e volte a correr:

```powershell
$env:STRIPE_RESELLER_PRICE_ID='price_...'
.\scripts\set-supabase-secrets.ps1
```

## 6. Criar o webhook Stripe de producao

```powershell
$env:STRIPE_SECRET_KEY='cole_aqui'
.\scripts\create-stripe-webhook.ps1
```

Copie o `secret` devolvido e envie-o para o Supabase:

```powershell
$env:STRIPE_WEBHOOK_SECRET='whsec_...'
.\scripts\set-supabase-secrets.ps1
```

## 7. Publicar o frontend

Se usar Netlify:

```powershell
$env:NETLIFY_DISABLE_AUTO_UPDATE_NOTIFIER='1'
npx netlify login
npx netlify init
npx netlify deploy --build --prod
```

Depois aponte o dominio `lyra-revenda.pt` para o site criado e confirme que o frontend usa:

- `https://lyra-revenda.pt` como URL principal
- `https://cpveybfypwiqaefcvqoo.functions.supabase.co/stripe-webhook` como destino do webhook Stripe

## 8. Teste final

- Criar revendedora em `/pagamento`
- Confirmar redirecionamento para Stripe
- Confirmar ativacao apos pagamento
- Testar compra em `/loja`
- Testar compra em `/:slug/checkout`
- Confirmar ordem paga em `/order-confirmation/:orderId`
