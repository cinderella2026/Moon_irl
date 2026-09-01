import { createClient } from 'jsr:@supabase/supabase-js@2'

type TelegramUpdate = {
  update_id?: number
  pre_checkout_query?: {
    id: string
    from: { id: number }
    currency: string
    total_amount: number
    invoice_payload: string
  }
  message?: {
    from?: { id: number }
    successful_payment?: {
      currency: string
      total_amount: number
      invoice_payload: string
      telegram_payment_charge_id: string
      provider_payment_charge_id?: string
    }
  }
}

function orderIdFrom(payload: string) {
  const match = /^moon_username:([0-9a-f-]{36})$/i.exec(payload)
  return match?.[1] ?? null
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('ok')

  const webhookSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET')
  const receivedSecret = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
  if (!webhookSecret || receivedSecret !== webhookSecret) return new Response('unauthorized', { status: 401 })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!supabaseUrl || !serviceRoleKey || !botToken) return new Response('server not configured', { status: 503 })

  const update = await request.json() as TelegramUpdate
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

  async function telegram(method: string, body: Record<string, unknown>) {
    return fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  if (update.pre_checkout_query) {
    const query = update.pre_checkout_query
    const orderId = orderIdFrom(query.invoice_payload)
    let ok = Boolean(orderId && query.currency === 'XTR' && query.total_amount === 150)

    if (ok && orderId) {
      const { data: order } = await admin.from('username_orders')
        .select('id, user_id, username, status, price_stars').eq('id', orderId).maybeSingle()
      ok = Boolean(order && order.status === 'pending' && order.price_stars === 150)
      if (ok && order) {
        const { data: owner } = await admin.from('profiles').select('id').eq('id', order.user_id).maybeSingle()
        const { data: conflict } = await admin.from('profiles').select('id')
          .eq('username', order.username).neq('id', order.user_id).maybeSingle()
        ok = Boolean(owner && !conflict)
      }
    }

    await telegram('answerPreCheckoutQuery', {
      pre_checkout_query_id: query.id,
      ok,
      ...(!ok ? { error_message: 'این آیدی دیگر در دسترس نیست یا فاکتور منقضی شده است.' } : {}),
    })
    return new Response('ok')
  }

  const payment = update.message?.successful_payment
  if (payment) {
    const orderId = orderIdFrom(payment.invoice_payload)
    if (!orderId || payment.currency !== 'XTR' || payment.total_amount !== 150) return new Response('ok')

    const { error: eventError } = await admin.from('payment_events').insert({
      telegram_update_id: update.update_id,
      event_type: 'successful_payment',
      order_id: orderId,
      payload: update,
    })
    if (eventError?.code === '23505') return new Response('ok')

    const { error: fulfillError } = await admin.rpc('fulfill_username_order', {
      target_order: orderId,
      charge_id: payment.telegram_payment_charge_id,
      provider_charge_id: payment.provider_payment_charge_id ?? null,
    })

    if (fulfillError && update.message?.from?.id) {
      const refundResponse = await telegram('refundStarPayment', {
        user_id: update.message.from.id,
        telegram_payment_charge_id: payment.telegram_payment_charge_id,
      })
      await admin.from('username_orders').update({ status: refundResponse.ok ? 'refunded' : 'failed' }).eq('id', orderId)
    }
  }

  return new Response('ok')
})
