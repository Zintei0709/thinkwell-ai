import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatMessage, handleContact, validate } from '../lib/contact.js'

const ORIGIN = 'https://thinkwell-ai.online'
const env = {
  TELEGRAM_BOT_TOKEN: '123:test-token',
  TELEGRAM_CHAT_ID: '42',
  ALLOWED_ORIGINS: `${ORIGIN}, https://www.thinkwell-ai.online`,
}
const valid = { name: 'Ada', company: 'Acme', email: 'ada@example.com', message: 'Hello there' }

function fakeFetch(response = { ok: true, json: { ok: true } }) {
  const calls = []
  const impl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) })
    return { ok: response.ok, status: response.ok ? 200 : 400, json: async () => response.json }
  }
  return { impl, calls }
}

test('preflight from an allowed origin gets CORS headers', async () => {
  const res = await handleContact({ method: 'OPTIONS', origin: ORIGIN, env })
  assert.equal(res.status, 204)
  assert.equal(res.headers['Access-Control-Allow-Origin'], ORIGIN)
})

test('requests from other origins are rejected without CORS headers', async () => {
  const fetch = fakeFetch()
  const res = await handleContact({
    method: 'POST', origin: 'https://evil.example', body: valid, env, fetchImpl: fetch.impl,
  })
  assert.equal(res.status, 403)
  assert.equal(res.headers['Access-Control-Allow-Origin'], undefined)
  assert.equal(fetch.calls.length, 0)
})

test('non-POST methods are rejected', async () => {
  const res = await handleContact({ method: 'GET', origin: ORIGIN, env })
  assert.equal(res.status, 405)
})

test('missing fields and bad emails are rejected', async () => {
  assert.match(validate({ ...valid, message: '  ' }).error, /required/)
  assert.match(validate({ ...valid, email: 'not-an-email' }).error, /email/)
  assert.match(validate({ ...valid, message: 'x'.repeat(3001) }).error, /too long/)
  const res = await handleContact({ method: 'POST', origin: ORIGIN, body: { name: 'A' }, env })
  assert.equal(res.status, 400)
})

test('honeypot submissions succeed silently without contacting Telegram', async () => {
  const fetch = fakeFetch()
  const res = await handleContact({
    method: 'POST', origin: ORIGIN, body: { ...valid, botcheck: 'on' }, env, fetchImpl: fetch.impl,
  })
  assert.equal(res.status, 200)
  assert.equal(fetch.calls.length, 0)
})

test('a valid message is sent to the configured Telegram chat', async () => {
  const fetch = fakeFetch()
  const res = await handleContact({
    method: 'POST', origin: ORIGIN, body: JSON.stringify(valid), env, fetchImpl: fetch.impl,
  })
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, { success: true })
  assert.equal(fetch.calls.length, 1)
  assert.equal(fetch.calls[0].url, 'https://api.telegram.org/bot123:test-token/sendMessage')
  assert.equal(fetch.calls[0].body.chat_id, '42')
  assert.equal(fetch.calls[0].body.text, formatMessage(valid))
  assert.equal(fetch.calls[0].body.parse_mode, undefined)
})

test('Telegram errors are reported as 502', async () => {
  const fetch = fakeFetch({ ok: false, json: { ok: false, description: 'chat not found' } })
  const res = await handleContact({
    method: 'POST', origin: ORIGIN, body: valid, env, fetchImpl: fetch.impl,
  })
  assert.equal(res.status, 502)
})

test('missing server configuration is reported as 500', async () => {
  const res = await handleContact({
    method: 'POST', origin: ORIGIN, body: valid, env: { ALLOWED_ORIGINS: ORIGIN },
  })
  assert.equal(res.status, 500)
})
