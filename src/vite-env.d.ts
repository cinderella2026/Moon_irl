/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_EMAIL_CODE_ENABLED?: string
  readonly VITE_APPLE_AUTH_ENABLED?: string
  readonly VITE_PREMIUM_USERNAME_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
