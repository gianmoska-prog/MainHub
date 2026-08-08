import { createClient } from 'jsr:@supabase/supabase-js@2'

type Json = Record<string, unknown>

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const SLACK_BOT_TOKEN = Deno.env.get('SLACK_BOT_TOKEN') || ''
const SLACK_SIGNING_SECRET = Deno.env.get('SLACK_SIGNING_SECRET') || ''
const SHARED_SECRET = Deno.env.get('MAINHUB_SLACK_SHARED_SECRET') || ''
const MAINHUB_ORIGIN = 'https://gianmoska-prog.github.io'
const STORAGE_BUCKET = 'record-attachments'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const corsHeaders = {
  'Access-Control-Allow-Origin': MAINHUB_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function response(body: unknown, status = 200, extra: HeadersInit = {}) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', ...corsHeaders, ...extra },
  })
}

function safeError(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 1800)
  return String(error || 'unknown_error').slice(0, 1800)
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return result === 0
}

async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return Array.from(new Uint8Array(signed)).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function verifySlackRequest(req: Request, rawBody: string) {
  if (!SLACK_SIGNING_SECRET) return false
  const timestamp = req.headers.get('x-slack-request-timestamp') || ''
  const signature = req.headers.get('x-slack-signature') || ''
  const timestampNumber = Number(timestamp)
  if (!timestampNumber || Math.abs(Date.now() / 1000 - timestampNumber) > 300) return false
  const expected = `v0=${await hmacHex(SLACK_SIGNING_SECRET, `v0:${timestamp}:${rawBody}`)}`
  return timingSafeEqual(expected, signature)
}

async function slackApi(method: string, params: Record<string, unknown>) {
  if (!SLACK_BOT_TOKEN) throw new Error('slack_bot_token_missing')
  const form = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    form.set(key, typeof value === 'string' ? value : JSON.stringify(value))
  })
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })
  const data = await res.json()
  if (!res.ok || !data.ok) throw new Error(`slack_${method}:${data.error || res.status}`)
  return data
}

async function getSettings() {
  const { data, error } = await admin.from('slack_integration_settings').select('*').eq('singleton', true).single()
  if (error) throw error
  return data
}

async function getRoute(routeKey: string) {
  const { data, error } = await admin.from('slack_channel_routes').select('*').eq('route_key', routeKey).eq('enabled', true).single()
  if (error) throw new Error(`slack_route_unavailable:${routeKey}`)
  if (!data.channel_id) throw new Error(`slack_route_not_configured:${routeKey}`)
  return data
}

function mainhubRoute(entityType: string) {
  if (entityType === 'decision' || entityType === 'record') return 'dashboard'
  if (entityType === 'finance') return 'divisions/finance'
  if (entityType === 'calendar') return 'divisions/operations/calendar'
  if (entityType === 'project' || entityType === 'milestone') return 'divisions/operations/projects'
  if (['lotto', 'product', 'revision'].includes(entityType)) return 'divisions/operations/products'
  if (entityType === 'supplier') return 'divisions/operations/suppliers'
  return 'dashboard'
}

function titleCase(value: unknown) {
  return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
}

function money(value: unknown, currency: unknown) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: String(currency || 'EUR') }).format(amount) } catch { return `${amount.toFixed(2)} ${currency || ''}`.trim() }
}

async function fetchEntity(entityType: string, entityId: string | null) {
  if (!entityId) return null
  const table = entityType === 'record' || entityType === 'decision' ? 'record_posts'
    : entityType === 'calendar' ? 'calendar_events'
    : entityType === 'finance' ? 'finance_entries'
    : entityType === 'project' ? 'projects'
    : entityType === 'milestone' ? 'project_milestones'
    : entityType === 'lotto' ? 'product_lots'
    : entityType === 'product' ? 'products'
    : entityType === 'revision' ? 'product_revisions'
    : entityType === 'supplier' ? 'suppliers'
    : null
  if (!table) return null
  const { data } = await admin.from(table).select('*').eq('id', entityId).maybeSingle()
  return data
}

function entityFields(entityType: string, entity: Json | null) {
  if (!entity) return [] as Array<{ type: string, text: string }>
  const fields: Array<{ type: string, text: string }> = []
  const add = (label: string, value: unknown) => {
    const text = String(value ?? '').trim()
    if (text) fields.push({ type: 'mrkdwn', text: `*${label}*\n${text}` })
  }
  if (entityType === 'finance') {
    add('Amount', money(entity.amount, entity.currency))
    add('Status', titleCase(entity.status))
    add('Category', entity.category)
    add('Counterparty', entity.counterparty)
    add('Entry date', entity.entry_date)
    add('Notes', entity.notes)
  } else if (entityType === 'calendar') {
    add('Date', entity.event_date)
    add('Category', titleCase(entity.category))
    add('Time', entity.all_day ? 'All day' : [entity.start_time, entity.end_time].filter(Boolean).join('–'))
    add('Notes', entity.notes)
  } else if (entityType === 'project') {
    add('Status', titleCase(entity.status))
    add('Owner', entity.owner_display)
    add('Target', entity.target_date)
    add('Next action', entity.next_action)
    add('Description', entity.description)
  } else if (entityType === 'milestone') {
    add('Due', entity.due_date)
    add('State', entity.completed ? 'Completed' : 'Open')
  } else if (entityType === 'product') {
    add('Status', titleCase(entity.status))
    add('Sample', titleCase(entity.sample_status))
    add('Material', entity.material)
    add('Supplier', entity.supplier_name)
    add('Unit cost', entity.unit_cost ? money(entity.unit_cost, entity.currency) : '')
    add('Next action', entity.next_action)
  } else if (entityType === 'supplier') {
    add('Status', titleCase(entity.status))
    add('Category', titleCase(entity.category))
    add('Location', entity.location)
    add('Contact', entity.primary_contact)
    add('Next action', entity.next_action)
  } else if (entityType === 'record' || entityType === 'decision') {
    add('Category', titleCase(entity.category))
    if (entityType === 'decision') {
      add('Decision date', entity.decision_date)
      add('Owner', entity.decision_owner_display)
    }
    add('Details', entity.body)
  }
  return fields.slice(0, 10)
}

function actionValue(entityType: string, entityId: string, extra: Json = {}) {
  return JSON.stringify({ entity_type: entityType, entity_id: entityId, ...extra }).slice(0, 1900)
}

function buildSlackMessage(activity: Json, entity: Json | null, baseUrl: string) {
  const entityType = String(activity.entity_type || 'record')
  const entityId = String(activity.entity_id || '')
  const action = String(activity.action || 'updated')
  const label = String(activity.entity_label || entity?.title || entity?.name || entity?.description || titleCase(entityType))
  const actor = String(activity.actor_display || 'MOSCATELLI')
  const route = mainhubRoute(entityType)
  const url = `${baseUrl.replace(/\/$/, '')}/index.html#${route}`
  const eyebrow = entityType === 'decision' ? 'DECISION' : entityType.toUpperCase()
  const fallback = `${eyebrow} · ${label} · ${titleCase(action)} by ${actor}`
  const blocks: Json[] = [
    { type: 'header', text: { type: 'plain_text', text: `MOSCATELLI · ${eyebrow}`, emoji: false } },
    { type: 'section', text: { type: 'mrkdwn', text: `*${label}*\n${titleCase(action)} by ${actor}` } },
  ]
  const fields = entityFields(entityType, entity)
  if (fields.length) blocks.push({ type: 'section', fields })
  blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: `Private Hub · ${new Date(String(activity.created_at || Date.now())).toLocaleString('en-GB', { timeZone: 'Europe/Rome', dateStyle: 'medium', timeStyle: 'short' })}` }] })
  const elements: Json[] = [{ type: 'button', text: { type: 'plain_text', text: 'Open in MainHub', emoji: false }, url, action_id: 'open_mainhub', value: actionValue(entityType, entityId) }]
  if (entityId) elements.push({ type: 'button', text: { type: 'plain_text', text: 'Add comment', emoji: false }, action_id: 'comment_entity', value: actionValue(entityType, entityId) })
  if (entityType === 'decision' && entityId) elements.push({ type: 'button', text: { type: 'plain_text', text: 'Acknowledge', emoji: false }, style: 'primary', action_id: 'ack_decision', value: actionValue(entityType, entityId) })
  if (entityType === 'milestone' && entityId) elements.push({ type: 'button', text: { type: 'plain_text', text: entity?.completed ? 'Reopen' : 'Complete', emoji: false }, action_id: entity?.completed ? 'milestone_reopen' : 'milestone_complete', value: actionValue(entityType, entityId) })
  if (entityType === 'project' && entityId) elements.push({ type: 'button', text: { type: 'plain_text', text: 'Change status', emoji: false }, action_id: 'project_status', value: actionValue(entityType, entityId, { current_status: entity?.status }) })
  blocks.push({ type: 'actions', elements: elements.slice(0, 5) })
  return { text: fallback, blocks }
}

async function uploadRecordAttachments(postId: string, channelId: string, threadTs: string) {
  const { data: attachments } = await admin.from('record_attachments').select('path,mime_type').eq('post_id', postId).order('created_at')
  for (const [index, attachment] of (attachments || []).entries()) {
    if (!String(attachment.mime_type || '').startsWith('image/')) continue
    const { data: blob, error } = await admin.storage.from(STORAGE_BUCKET).download(attachment.path)
    if (error || !blob) continue
    const filename = String(attachment.path || `attachment-${index + 1}`).split('/').pop() || `attachment-${index + 1}.jpg`
    const reserved = await slackApi('files.getUploadURLExternal', { filename, length: blob.size })
    const uploaded = await fetch(reserved.upload_url, { method: 'POST', body: blob, headers: { 'Content-Type': attachment.mime_type || 'application/octet-stream' } })
    if (!uploaded.ok) throw new Error(`slack_file_upload:${uploaded.status}`)
    await slackApi('files.completeUploadExternal', {
      files: [{ id: reserved.file_id, title: `MainHub attachment ${index + 1}` }],
      channel_id: channelId,
      thread_ts: threadTs,
      initial_comment: index === 0 ? 'Attached in MainHub' : undefined,
    })
  }
}

async function dispatchJob(jobId: string) {
  const worker = `edge-${crypto.randomUUID()}`
  const { data: jobs, error: claimError } = await admin.rpc('claim_slack_outbox', { p_job_id: jobId, p_worker: worker })
  if (claimError) throw claimError
  const job = jobs?.[0]
  if (!job) return { ok: true, skipped: true }
  try {
    const settings = await getSettings()
    const route = await getRoute(job.route_key)
    const activity = job.payload || {}
    const entityType = String(activity.entity_type || '')
    const entityId = activity.entity_id ? String(activity.entity_id) : null
    const entity = await fetchEntity(entityType, entityId)
    const message = buildSlackMessage(activity, entity, settings.mainhub_base_url)
    const posted = await slackApi('chat.postMessage', { channel: route.channel_id, text: message.text, blocks: message.blocks, unfurl_links: false, unfurl_media: false })
    if ((entityType === 'record' || entityType === 'decision') && entityId) await uploadRecordAttachments(entityId, route.channel_id, posted.ts)
    await admin.rpc('finish_slack_outbox', { p_job_id: job.id, p_success: true, p_channel_id: route.channel_id, p_message_ts: posted.ts, p_error: null })
    return { ok: true, channel: route.channel_name, ts: posted.ts }
  } catch (error) {
    await admin.rpc('finish_slack_outbox', { p_job_id: job.id, p_success: false, p_channel_id: null, p_message_ts: null, p_error: safeError(error) })
    throw error
  }
}

function localParts(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false }).formatToParts(new Date())
  const get = (type: string) => parts.find(part => part.type === type)?.value || ''
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: get('hour') }
}

async function digestTick() {
  const settings = await getSettings()
  if (!settings.enabled) return { ok: true, skipped: 'disabled' }

  await admin.from('slack_outbox')
    .update({ status: 'retrying', locked_at: null, locked_by: null, available_at: new Date().toISOString(), last_error: 'worker_timeout_recovered' })
    .eq('status', 'processing')
    .lt('locked_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

  const { data: retries } = await admin.from('slack_outbox').select('id').in('status', ['pending', 'retrying']).lte('available_at', new Date().toISOString()).order('created_at').limit(12)
  for (const retry of retries || []) {
    try { await dispatchJob(retry.id) } catch (error) { console.error('Slack retry failed', retry.id, safeError(error)) }
  }

  if (settings.environment !== 'production') return { ok: true, skipped: 'testing_mode' }
  const local = localParts(settings.timezone || 'Europe/Rome')
  const digestHour = String(settings.daily_digest_local_time || '08:30').slice(0, 2)
  if (local.hour !== digestHour) return { ok: true, skipped: 'outside_digest_hour' }
  const { data: prior } = await admin.from('slack_digest_runs').select('status').eq('digest_date', local.date).maybeSingle()
  if (prior?.status === 'sent' || prior?.status === 'processing') return { ok: true, skipped: 'already_processed' }
  await admin.from('slack_digest_runs').upsert({ digest_date: local.date, status: 'processing', last_error: null })
  try {
    const { data: items, error } = await admin.from('slack_outbox').select('id,payload').eq('status', 'digest_pending').order('created_at').limit(80)
    if (error) throw error
    if (!items?.length) {
      await admin.from('slack_digest_runs').update({ status: 'sent', sent_at: new Date().toISOString(), item_count: 0 }).eq('digest_date', local.date)
      return { ok: true, empty: true }
    }
    const route = await getRoute('updates')
    const lines = items.slice(0, 35).map(item => {
      const payload = item.payload || {}
      return `• *${payload.entity_label || titleCase(payload.entity_type)}* — ${titleCase(payload.action)} by ${payload.actor_display || 'MOSCATELLI'}`
    })
    const blocks: Json[] = [
      { type: 'header', text: { type: 'plain_text', text: 'MOSCATELLI · Daily Update', emoji: false } },
      { type: 'section', text: { type: 'mrkdwn', text: lines.join('\n') } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: `${items.length} routine ${items.length === 1 ? 'change' : 'changes'} · Open MainHub for full detail` }] },
    ]
    const posted = await slackApi('chat.postMessage', { channel: route.channel_id, text: `MOSCATELLI daily update · ${items.length} changes`, blocks })
    await admin.from('slack_outbox').update({ status: 'sent', sent_at: new Date().toISOString(), slack_channel_id: route.channel_id, slack_message_ts: posted.ts }).in('id', items.map(item => item.id))
    await admin.from('slack_digest_runs').update({ status: 'sent', sent_at: new Date().toISOString(), item_count: items.length, slack_channel_id: route.channel_id, slack_message_ts: posted.ts }).eq('digest_date', local.date)
    return { ok: true, count: items.length }
  } catch (error) {
    await admin.from('slack_digest_runs').update({ status: 'failed', last_error: safeError(error) }).eq('digest_date', local.date)
    throw error
  }
}

async function resolveSlackUser(slackUserId: string) {
  // Keep identity resolution as two explicit reads. PostgREST relationship
  // embeddings vary with schema-cache state and must never make a valid,
  // pre-verified Slack link fall through to email discovery.
  const { data: existing, error: linkError } = await admin.from('slack_user_links').select('profile_id').eq('slack_user_id', slackUserId).eq('enabled', true).maybeSingle()
  if (linkError) throw linkError
  if (existing?.profile_id) {
    const { data: linkedProfile, error: profileError } = await admin.from('profiles').select('id,display_name,is_active').eq('id', existing.profile_id).maybeSingle()
    if (profileError) throw profileError
    if (linkedProfile?.is_active) return { profileId: linkedProfile.id, displayName: String(linkedProfile.display_name || '') }
    throw new Error('mainhub_profile_inactive')
  }
  const slackUser = await slackApi('users.info', { user: slackUserId })
  const email = String(slackUser.user?.profile?.email || '').trim()
  if (!email) throw new Error('slack_email_unavailable')
  const { data: profile } = await admin.from('profiles').select('id,display_name,is_active').ilike('email', email).eq('is_active', true).maybeSingle()
  if (!profile) throw new Error('mainhub_profile_not_found')
  await admin.from('slack_user_links').upsert({ profile_id: profile.id, slack_user_id: slackUserId, slack_email: email, slack_display_name: slackUser.user?.profile?.display_name || slackUser.user?.real_name || '', enabled: true, verified_at: new Date().toISOString() })
  return { profileId: profile.id, displayName: profile.display_name }
}

async function applySlackAction(requestId: string, slackUserId: string, action: string, entityType: string | null, entityId: string | null, payload: Json = {}) {
  await resolveSlackUser(slackUserId)
  const { data, error } = await admin.rpc('apply_slack_action', { p_request_id: requestId, p_slack_user_id: slackUserId, p_action: action, p_entity_type: entityType, p_entity_id: entityId, p_payload: payload })
  if (error) throw error
  return data
}

function parseActionValue(value: string | undefined) {
  try { return JSON.parse(value || '{}') as Json } catch { return {} }
}

async function postEphemeral(channel: string, user: string, text: string) {
  if (!channel || !user) return
  await slackApi('chat.postEphemeral', { channel, user, text })
}

async function openCommentModal(triggerId: string, value: Json, channelId: string, messageTs: string) {
  await slackApi('views.open', {
    trigger_id: triggerId,
    view: {
      type: 'modal', callback_id: 'mainhub_comment', private_metadata: JSON.stringify({ ...value, channel_id: channelId, message_ts: messageTs }),
      title: { type: 'plain_text', text: 'MainHub comment' }, submit: { type: 'plain_text', text: 'Add comment' }, close: { type: 'plain_text', text: 'Cancel' },
      blocks: [{ type: 'input', block_id: 'comment', label: { type: 'plain_text', text: 'Comment' }, element: { type: 'plain_text_input', action_id: 'body', multiline: true, max_length: 1800 } }],
    },
  })
}

async function openProjectStatusModal(triggerId: string, value: Json) {
  const current = String(value.current_status || 'active')
  const options = ['planned', 'active', 'paused', 'completed', 'archived'].map(item => ({ text: { type: 'plain_text', text: titleCase(item) }, value: item }))
  await slackApi('views.open', {
    trigger_id: triggerId,
    view: {
      type: 'modal', callback_id: 'mainhub_project_status', private_metadata: JSON.stringify(value),
      title: { type: 'plain_text', text: 'Project status' }, submit: { type: 'plain_text', text: 'Save' }, close: { type: 'plain_text', text: 'Cancel' },
      blocks: [{ type: 'input', block_id: 'status', label: { type: 'plain_text', text: 'Status' }, element: { type: 'static_select', action_id: 'value', initial_option: options.find(option => option.value === current), options } }],
    },
  })
}

async function openRecordModal(triggerId: string) {
  const categories = ['meetings', 'ideas', 'tasks', 'product', 'brand', 'finance', 'operations'].map(item => ({ text: { type: 'plain_text', text: titleCase(item) }, value: item }))
  await slackApi('views.open', { trigger_id: triggerId, view: {
    type: 'modal', callback_id: 'mainhub_record', title: { type: 'plain_text', text: 'New MainHub entry' }, submit: { type: 'plain_text', text: 'Create' }, close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      { type: 'input', block_id: 'title', label: { type: 'plain_text', text: 'Title' }, element: { type: 'plain_text_input', action_id: 'value', max_length: 180 } },
      { type: 'input', block_id: 'category', label: { type: 'plain_text', text: 'Category' }, element: { type: 'static_select', action_id: 'value', initial_option: categories[0], options: categories } },
      { type: 'input', block_id: 'body', label: { type: 'plain_text', text: 'Details' }, element: { type: 'plain_text_input', action_id: 'value', multiline: true, max_length: 3000 } },
    ],
  } })
}

async function openCalendarModal(triggerId: string) {
  const categories = ['milestone', 'meeting', 'production', 'launch', 'travel', 'admin'].map(item => ({ text: { type: 'plain_text', text: titleCase(item) }, value: item }))
  await slackApi('views.open', { trigger_id: triggerId, view: {
    type: 'modal', callback_id: 'mainhub_calendar', title: { type: 'plain_text', text: 'New calendar event' }, submit: { type: 'plain_text', text: 'Create' }, close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      { type: 'input', block_id: 'title', label: { type: 'plain_text', text: 'Title' }, element: { type: 'plain_text_input', action_id: 'value', max_length: 180 } },
      { type: 'input', block_id: 'date', label: { type: 'plain_text', text: 'Date' }, element: { type: 'datepicker', action_id: 'value' } },
      { type: 'input', block_id: 'category', label: { type: 'plain_text', text: 'Category' }, element: { type: 'static_select', action_id: 'value', initial_option: categories[1], options: categories } },
      { type: 'input', optional: true, block_id: 'notes', label: { type: 'plain_text', text: 'Notes' }, element: { type: 'plain_text_input', action_id: 'value', multiline: true, max_length: 1800 } },
    ],
  } })
}

function stateValue(view: Json, block: string, action: string) {
  const value = ((view.state as Json)?.values as Json)?.[block] as Json
  const item = value?.[action] as Json
  return String(item?.value || (item?.selected_option as Json)?.value || item?.selected_date || '')
}

async function handleSlackPayload(payload: Json) {
  const type = String(payload.type || '')
  const slackUserId = String((payload.user as Json)?.id || payload.user_id || '')
  if (type === 'block_actions') {
    const action = (payload.actions as Json[])?.[0] || {}
    const actionId = String(action.action_id || '')
    const value = parseActionValue(String(action.value || ''))
    const channelId = String((payload.channel as Json)?.id || (payload.container as Json)?.channel_id || '')
    const messageTs = String((payload.message as Json)?.ts || (payload.container as Json)?.message_ts || '')
    if (actionId === 'comment_entity') await openCommentModal(String(payload.trigger_id || ''), value, channelId, messageTs)
    else if (actionId === 'project_status') await openProjectStatusModal(String(payload.trigger_id || ''), value)
    else if (['ack_decision', 'milestone_complete', 'milestone_reopen'].includes(actionId)) {
      const requestId = `${payload.trigger_id}:${action.action_ts || actionId}`
      await applySlackAction(requestId, slackUserId, actionId, String(value.entity_type || ''), String(value.entity_id || ''), {})
      await postEphemeral(channelId, slackUserId, actionId === 'ack_decision' ? 'Decision acknowledged in MainHub.' : 'Milestone updated in MainHub.')
    }
    return response({ ok: true })
  }
  if (type === 'view_submission') {
    const view = payload.view as Json
    const callback = String(view.callback_id || '')
    const metadata = parseActionValue(String(view.private_metadata || ''))
    const requestId = `${view.id}:${view.hash || Date.now()}`
    if (callback === 'mainhub_comment') await applySlackAction(requestId, slackUserId, 'comment', String(metadata.entity_type || ''), String(metadata.entity_id || ''), { body: stateValue(view, 'comment', 'body'), channel_id: metadata.channel_id, message_ts: metadata.message_ts })
    else if (callback === 'mainhub_project_status') await applySlackAction(requestId, slackUserId, 'project_status', 'project', String(metadata.entity_id || ''), { status: stateValue(view, 'status', 'value') })
    else if (callback === 'mainhub_record') await applySlackAction(requestId, slackUserId, 'create_record', 'record', null, { title: stateValue(view, 'title', 'value'), category: stateValue(view, 'category', 'value'), body: stateValue(view, 'body', 'value') })
    else if (callback === 'mainhub_calendar') await applySlackAction(requestId, slackUserId, 'create_calendar', 'calendar', null, { title: stateValue(view, 'title', 'value'), event_date: stateValue(view, 'date', 'value'), category: stateValue(view, 'category', 'value'), notes: stateValue(view, 'notes', 'value') })
    return response({ response_action: 'clear' })
  }
  return response({ ok: true })
}

async function handleSlashCommand(form: URLSearchParams) {
  const commandText = String(form.get('text') || '').trim().toLowerCase()
  const triggerId = String(form.get('trigger_id') || '')
  const slackUserId = String(form.get('user_id') || '')
  await resolveSlackUser(slackUserId)
  if (commandText === 'record' || commandText === 'entry') {
    await openRecordModal(triggerId)
    return response('')
  }
  if (commandText === 'calendar' || commandText === 'event') {
    await openCalendarModal(triggerId)
    return response('')
  }
  return response({ response_type: 'ephemeral', text: '*MOSCATELLI MainHub*\n`/mainhub record` — create a Record entry\n`/mainhub calendar` — create an all-day calendar event\nInteractive buttons on MainHub notifications handle acknowledgements, comments, milestones and project status.' })
}

async function verifyMainHubUser(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) throw new Error('missing_user_token')
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new Error('invalid_user_token')
  const { data: profile } = await admin.from('profiles').select('id,display_name,role,is_active').eq('id', data.user.id).single()
  if (!profile?.is_active) throw new Error('inactive_profile')
  return profile
}

async function clientTest(req: Request) {
  const profile = await verifyMainHubUser(req)
  if (profile.role !== 'founder') throw new Error('founder_required')
  const route = await getRoute('testing')
  const posted = await slackApi('chat.postMessage', {
    channel: route.channel_id,
    text: 'MOSCATELLI MainHub · Slack connection test',
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: 'MOSCATELLI · Connection Test', emoji: false } },
      { type: 'section', text: { type: 'mrkdwn', text: `MainHub and Slack are communicating securely.\nInitiated by *${profile.display_name}*.` } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: 'Testing channel · No production notification was sent' }] },
    ],
  })
  return { ok: true, channel: route.channel_name, ts: posted.ts }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return response({ error: 'method_not_allowed' }, 405)
  try {
    const rawBody = await req.text()
    const contentType = req.headers.get('content-type') || ''
    const isSlack = Boolean(req.headers.get('x-slack-signature'))
    if (isSlack) {
      if (!await verifySlackRequest(req, rawBody)) return response({ error: 'invalid_slack_signature' }, 401)
      if (contentType.includes('application/json')) {
        const payload = JSON.parse(rawBody)
        if (payload.type === 'url_verification') return response({ challenge: payload.challenge })
        return handleSlackPayload(payload)
      }
      const form = new URLSearchParams(rawBody)
      if (form.has('payload')) return handleSlackPayload(JSON.parse(form.get('payload') || '{}'))
      if (form.has('command')) return handleSlashCommand(form)
      return response({ ok: true })
    }

    const body = rawBody ? JSON.parse(rawBody) : {}
    if (body.kind === 'client_test') return response(await clientTest(req))
    if (!SHARED_SECRET || !timingSafeEqual(req.headers.get('x-mainhub-secret') || '', SHARED_SECRET)) return response({ error: 'unauthorized' }, 401)
    if (body.kind === 'dispatch' && body.job_id) return response(await dispatchJob(String(body.job_id)))
    if (body.kind === 'digest_tick') return response(await digestTick())
    return response({ error: 'unsupported_request' }, 400)
  } catch (error) {
    console.error('mainhub-slack', safeError(error))
    return response({ error: safeError(error) }, 500)
  }
})
