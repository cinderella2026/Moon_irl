import { createClient, type Session } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const backendConfigured = Boolean(supabaseUrl && supabasePublishableKey)
export const emailAuthEnabled = import.meta.env.VITE_EMAIL_AUTH_ENABLED === 'true'
export const emailCodeEnabled = import.meta.env.VITE_EMAIL_CODE_ENABLED === 'true'
export const appleAuthEnabled = import.meta.env.VITE_APPLE_AUTH_ENABLED === 'true'
export const premiumUsernameEnabled = import.meta.env.VITE_PREMIUM_USERNAME_ENABLED === 'true'

export const supabase = backendConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null

export type MoonAccount = {
  id: string
  email: string | null
  username: string | null
  display_name: string | null
  avatar_url: string | null
  account_status: 'active' | 'suspended' | 'deleting'
}

export type UsernameQuote = {
  username: string
  available: boolean
  price_stars: number
  reason: 'free_first_id' | 'premium_short_id' | 'paid_change' | 'taken' | 'reserved' | 'invalid'
}

export async function getCurrentSession() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export function watchSession(callback: (session: Session | null) => void) {
  if (!supabase) return () => undefined
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}

export async function signInAnonymously() {
  if (!supabase) throw new Error('BACKEND_NOT_CONFIGURED')
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return data.session
}

export async function sendEmailOtp(email: string) {
  if (!supabase) throw new Error('BACKEND_NOT_CONFIGURED')
  const emailRedirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo },
  })
  if (error) throw error
}

export async function verifyEmailOtp(email: string, token: string) {
  if (!supabase) throw new Error('BACKEND_NOT_CONFIGURED')
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error) throw error
  return data.session
}

export async function signInWithApple() {
  if (!supabase) throw new Error('BACKEND_NOT_CONFIGURED')
  const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function loadMoonAccount(session: Session): Promise<MoonAccount> {
  if (!supabase) throw new Error('BACKEND_NOT_CONFIGURED')
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, account_status')
    .eq('id', session.user.id)
    .single()
  if (error) throw error
  return {
    ...data,
    email: session.user.email ?? null,
  } as MoonAccount
}

export async function quoteUsername(candidate: string): Promise<UsernameQuote> {
  if (!supabase) throw new Error('BACKEND_NOT_CONFIGURED')
  const { data, error } = await supabase.rpc('quote_username', { candidate })
  if (error) throw error
  return data as UsernameQuote
}

export async function claimFreeUsername(candidate: string) {
  if (!supabase) throw new Error('BACKEND_NOT_CONFIGURED')
  const { data, error } = await supabase.rpc('claim_username', { candidate })
  if (error) throw error
  return data as { username: string }
}

export async function createUsernameInvoice(candidate: string) {
  if (!supabase) throw new Error('BACKEND_NOT_CONFIGURED')
  const { data, error } = await supabase.functions.invoke('create-username-invoice', {
    body: { username: candidate },
  })
  if (error) throw error
  return data as { invoice_url: string; order_id: string; price_stars: number }
}

export async function deleteMoonAccount(confirmation: string) {
  if (!supabase) throw new Error('BACKEND_NOT_CONFIGURED')
  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: { confirmation },
  })
  if (error) throw error
  return data as { deleted: boolean }
}
