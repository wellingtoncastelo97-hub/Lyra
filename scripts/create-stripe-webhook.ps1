param(
    [string]$StripeSecretKey = $env:STRIPE_SECRET_KEY,
    [string]$EndpointUrl = 'https://cpveybfypwiqaefcvqoo.functions.supabase.co/stripe-webhook',
    [string]$Description = 'LYRA production webhook'
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($StripeSecretKey)) {
    throw 'Defina STRIPE_SECRET_KEY antes de criar o webhook Stripe.'
}

$pairs = @(
    "url=$([uri]::EscapeDataString($EndpointUrl))"
    "description=$([uri]::EscapeDataString($Description))"
    "enabled_events[]=$([uri]::EscapeDataString('checkout.session.completed'))"
    "enabled_events[]=$([uri]::EscapeDataString('checkout.session.async_payment_succeeded'))"
    "enabled_events[]=$([uri]::EscapeDataString('checkout.session.expired'))"
)

$response = Invoke-RestMethod `
    -Uri 'https://api.stripe.com/v1/webhook_endpoints' `
    -Method POST `
    -Headers @{
        Authorization = "Bearer $StripeSecretKey"
        'Content-Type' = 'application/x-www-form-urlencoded'
    } `
    -Body ($pairs -join '&')

Write-Host ''
Write-Host 'Webhook Stripe criado com sucesso.' -ForegroundColor Green
Write-Host "Endpoint ID: $($response.id)"
Write-Host "URL: $($response.url)"
Write-Host ''
Write-Host 'Guarde este secret imediatamente e depois configure-o no Supabase como STRIPE_WEBHOOK_SECRET:' -ForegroundColor Yellow
Write-Host $response.secret
Write-Host ''
