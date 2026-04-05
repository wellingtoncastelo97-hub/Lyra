param(
    [string]$ProjectRef = 'cpveybfypwiqaefcvqoo',
    [string]$SupabaseUrl = 'https://cpveybfypwiqaefcvqoo.supabase.co',
    [string]$AppBaseUrl = 'https://lyra-revenda.pt',
    [string]$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY,
    [string]$StripeSecretKey = $env:STRIPE_SECRET_KEY,
    [string]$StripeWebhookSecret = $env:STRIPE_WEBHOOK_SECRET,
    [string]$StripeResellerPriceId = $env:STRIPE_RESELLER_PRICE_ID
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ServiceRoleKey)) {
    throw 'Defina SUPABASE_SERVICE_ROLE_KEY antes de enviar os secrets.'
}

if ([string]::IsNullOrWhiteSpace($StripeSecretKey)) {
    throw 'Defina STRIPE_SECRET_KEY antes de enviar os secrets.'
}

$secretArgs = @(
    "SUPABASE_URL=$SupabaseUrl"
    "SUPABASE_SERVICE_ROLE_KEY=$ServiceRoleKey"
    "STRIPE_SECRET_KEY=$StripeSecretKey"
    "APP_BASE_URL=$AppBaseUrl"
)

if (-not [string]::IsNullOrWhiteSpace($StripeWebhookSecret)) {
    $secretArgs += "STRIPE_WEBHOOK_SECRET=$StripeWebhookSecret"
}

if (-not [string]::IsNullOrWhiteSpace($StripeResellerPriceId)) {
    $secretArgs += "STRIPE_RESELLER_PRICE_ID=$StripeResellerPriceId"
}

& npx supabase secrets set --project-ref $ProjectRef @secretArgs
