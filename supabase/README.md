# MOON IRL backend

## Deploy order

1. Run `migrations/202608310001_initial.sql` on the target Supabase project.
2. Deploy `delete-account` and disable the platform legacy JWT pre-check; the function validates the bearer token with `auth.getUser`.
3. Deploy `create-username-invoice` with the same setting.
4. Deploy `telegram-payment-webhook` without the legacy JWT pre-check; Telegram authenticates with the webhook secret header.
5. Add server secrets in Supabase only, never in Git or Vite variables.

Required only for Telegram Stars payments:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are provided to deployed Edge Functions by Supabase.

After the bot secrets are present and the Telegram webhook is registered, set `VITE_PREMIUM_USERNAME_ENABLED=true` in the deployment environment. Until then the free first ID works while the paid control stays disabled.

Apple sign-in requires the project owner's Apple Developer Team ID, Service ID and signing key. Only set `VITE_APPLE_AUTH_ENABLED=true` after the Apple provider is fully configured in Supabase.

The default Supabase email template sends a magic link. `VITE_EMAIL_CODE_ENABLED` must remain `false` unless a custom email template that exposes `{{ .Token }}` has been configured and tested.

Supabase's built-in SMTP is restricted to organization members and is not a public production mailer. Keep `VITE_EMAIL_AUTH_ENABLED=false` until a custom SMTP provider and sending domain are configured and tested. Anonymous sign-in remains enabled so anyone can start a real, RLS-protected account without Telegram or email; users should connect a durable identity before using the account across devices.
