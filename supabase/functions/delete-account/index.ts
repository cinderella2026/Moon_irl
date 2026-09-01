import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405)

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) return json({ error: 'AUTH_REQUIRED' }, 401)

    const { confirmation } = await request.json()
    if (confirmation !== 'DELETE') return json({ error: 'CONFIRMATION_REQUIRED' }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const publishableKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !publishableKey || !serviceRoleKey) return json({ error: 'SERVER_NOT_CONFIGURED' }, 500)

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'AUTH_REQUIRED' }, 401)

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    await admin.from('profiles').update({ account_status: 'deleting' }).eq('id', user.id)

    // The auth.users foreign key cascades through every user-owned table.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id, false)
    if (deleteError) {
      await admin.from('profiles').update({ account_status: 'active' }).eq('id', user.id)
      return json({ error: 'DELETE_FAILED' }, 500)
    }

    return json({ deleted: true })
  } catch {
    return json({ error: 'INVALID_REQUEST' }, 400)
  }
})
