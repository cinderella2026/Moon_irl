import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'

type Quote = {
  username: string
  available: boolean
  price_stars: number
  reason: string
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405)

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) return json({ error: 'AUTH_REQUIRED' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const publishableKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!supabaseUrl || !publishableKey || !serviceRoleKey || !botToken) return json({ error: 'SERVER_NOT_CONFIGURED' }, 503)

    const body = await request.json()
    const username = String(body.username ?? '').trim().toLowerCase()
    if (!/^[a-z][a-z0-9_]{2,19}$/.test(username)) return json({ error: 'INVALID_USERNAME' }, 400)

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'AUTH_REQUIRED' }, 401)

    const { data: quoteData, error: quoteError } = await userClient.rpc('quote_username', { candidate: username })
    const quote = quoteData as Quote | null
    if (quoteError || !quote?.available) return json({ error: 'USERNAME_UNAVAILABLE' }, 409)
    if (quote.price_stars !== 150) return json({ error: 'PAYMENT_NOT_REQUIRED' }, 409)

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    await admin.from('username_orders').update({ status: 'expired' })
      .eq('user_id', user.id).eq('username', username).eq('status', 'pending')

    const orderId = crypto.randomUUID()
    const payload = `moon_username:${orderId}`
    const { error: orderError } = await admin.from('username_orders').insert({
      id: orderId,
      user_id: user.id,
      username,
      price_stars: 150,
      status: 'pending',
      invoice_payload: payload,
    })
    if (orderError) return json({ error: 'ORDER_CREATE_FAILED' }, 500)

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `MOON ID @${username}`,
        description: 'ثبت یک‌بارهٔ آیدی ویژه و یکتای MOON IRL',
        payload,
        provider_token: '',
        currency: 'XTR',
        prices: [{ label: `@${username}`, amount: 150 }],
      }),
    })
    const telegramResult = await telegramResponse.json()
    if (!telegramResponse.ok || !telegramResult.ok || typeof telegramResult.result !== 'string') {
      await admin.from('username_orders').update({ status: 'failed' }).eq('id', orderId)
      return json({ error: 'INVOICE_CREATE_FAILED' }, 502)
    }

    return json({ invoice_url: telegramResult.result, order_id: orderId, price_stars: 150 })
  } catch {
    return json({ error: 'INVALID_REQUEST' }, 400)
  }
})
