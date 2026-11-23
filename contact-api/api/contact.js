// Vercel serverless function: POST /api/contact
// Forwards contact-form messages from the website to Telegram. The bot token
// lives only in Vercel's environment variables, never in the website code.
import { handleContact } from '../lib/contact.js'

export default async function handler(req, res) {
  const { status, headers, body } = await handleContact({
    method: req.method,
    origin: req.headers.origin,
    body: req.body,
    env: process.env,
  })
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value)
  if (body === undefined) {
    res.status(status).end()
  } else {
    res.status(status).json(body)
  }
}
