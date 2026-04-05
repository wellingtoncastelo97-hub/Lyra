param(
    [string]$ProjectRef = 'cpveybfypwiqaefcvqoo',
    [string]$DatabaseUrl = $env:SUPABASE_DB_URL
)

$ErrorActionPreference = 'Stop'

if (-not [string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    & npx supabase db push --db-url $DatabaseUrl
}

& npx supabase link --project-ref $ProjectRef
& npx supabase functions deploy create-stripe-checkout --project-ref $ProjectRef
& npx supabase functions deploy sync-stripe-checkout --project-ref $ProjectRef
& npx supabase functions deploy stripe-webhook --project-ref $ProjectRef

Write-Host ''
Write-Host 'Edge Functions publicadas com sucesso.' -ForegroundColor Green
if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    Write-Host 'A migracao Stripe nao foi aplicada por comando. Se ainda nao aplicou as SQLs, faca isso no Supabase SQL Editor antes de testar os pagamentos.' -ForegroundColor Yellow
}
Write-Host ''
