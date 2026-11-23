// Core logic for the contact endpoint, kept free of Vercel specifics so it can
// be unit-tested with a fake fetch.

const LIMITS = { name: 200, company: 200, email: 320, message: 3000 }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Comma-separated ALLOWED_ORIGINS env var -> array of origins. */
export function parseAllowedOrigins(value) {
  return (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function corsHeaders(origin, allowedOrigins) {
  const headers = { Vary: 'Origin' }
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'Content-Type'
    headers['Access-Control-Max-Age'] = '86400'
  }
  return headers
}

/** Returns { data } with trimmed fields, or { error } describing the problem. */
export function validate(body) {
  if (!body || typeof body !== 'object') return { error: 'Invalid request body' }
  const field = (key) => (typeof body[key] === 'string' ? body[key].trim() : '')
  const data = {
    name: field('name'),
    company: field('company'),
    email: field('email'),
    message: field('message'),
  }
  if (!data.name || !data.email || !data.message) {
    return { error: 'Name, email and message are required' }
  }
  if (!EMAIL_RE.test(data.email)) return { error: 'Invalid email address' }
  for (const [key, max] of Object.entries(LIMITS)) {
    if (data[key].length > max) return { error: `${key} is too long (max ${max} characters)` }
  }
  return { data }
}

/** Plain-text Telegram message (no parse_mode, so user input cannot break formatting). */
export function formatMessage({ name, company, email, message }) {
  return [
    'New contact message from thinkwell-ai.online',
    '',
    `Name: ${name}`,
    `Company: ${company || '-'}`,
    `Email: ${email}`,
    '',
    message,
  ].join('\n')
}

/**
 * Handle one request. Returns { status, headers, body? } for the caller to send.
 * env needs TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID and ALLOWED_ORIGINS.
 */
export async function handleContact({ method, origin, body, env, fetchImpl = fetch }) {
  const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS)
  const headers = corsHeaders(origin, allowedOrigins)
  const reply = (status, payload, extra = {}) => ({
    status,
    headers: { ...headers, ...extra },
    body: payload,
  })

  if (method === 'OPTIONS') return { status: 204, headers }
  if (method !== 'POST') {
    return reply(405, { success: false, error: 'Method not allowed' }, { Allow: 'POST, OPTIONS' })
  }
  if (!origin || !allowedOrigins.includes(origin)) {
    return reply(403, { success: false, error: 'Origin not allowed' })
  }

  let payload = body
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload)
    } catch {
      return reply(400, { success: false, error: 'Invalid JSON' })
    }
  }

  // Honeypot field: humans never see it, so a value means a bot. Pretend success.
  if (payload && payload.botcheck) return reply(200, { success: true })

  const { data, error } = validate(payload)
  if (error) return reply(400, { success: false, error })

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set')
    return reply(500, { success: false, error: 'Server is not configured' })
  }

  let response
  let result = null
  try {
    response = await fetchImpl(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: formatMessage(data),
        link_preview_options: { is_disabled: true },
      }),
    })
    result = await response.json().catch(() => null)
  } catch (err) {
    console.error('Telegram request failed:', err)
    return reply(502, { success: false, error: 'Could not deliver the message' })
  }

  if (!response.ok || !result || !result.ok) {
    console.error('Telegram sendMessage failed:', response.status, result && result.description)
    return reply(502, { success: false, error: 'Could not deliver the message' })
  }
  return reply(200, { success: true })
}
