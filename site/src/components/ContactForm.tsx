import { useEffect, useRef, useState, type FormEvent } from 'react'

// Messages are emailed by Web3Forms (https://web3forms.com). Each access key
// delivers to the one inbox it was created for, and Web3Forms' free plan has no
// CC, so every inbox that should get contact messages has its own key here.
// Keys are public by design (they can only send to their own inbox), so they
// are safe in client-side code. To add an inbox, create a key for it at
// web3forms.com and append it to this list.
const WEB3FORMS_ACCESS_KEYS = [
  'd6b992a5-95c8-4d3d-a682-4debf83d4596', // primary inbox (CONTACT_EMAIL)
  'fa8857d7-edd1-4df2-94ac-7662883c9cf4', // team inbox 2
  '895ab027-2f03-4238-ae18-f82a30ad69c7', // team inbox 3
]
const CONTACT_EMAIL = 'whaletera@gmail.com'

// Serverless endpoint (contact-api/ in this repo, hosted on Vercel) that
// forwards each message to the team's Telegram bot. The bot token stays on
// the server; it must never be added to this client-side code.
const TELEGRAM_RELAY_URL = 'https://api.thinkwell-ai.online/api/contact'

type Status = 'idle' | 'sending' | 'sent' | 'error'

type ContactFields = { name: string; company: string; email: string; message: string }

async function sendEmail(fields: ContactFields, accessKey: string): Promise<void> {
  const response = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: accessKey,
      subject: `Intro call with ThinkWell AI — ${fields.name}`,
      from_name: 'ThinkWell AI website',
      replyto: fields.email,
      ...fields,
      company: fields.company || '—',
    }),
  })
  const result = (await response.json().catch(() => null)) as { success?: boolean } | null
  if (!response.ok || !result?.success) throw new Error('Web3Forms rejected the message')
}

async function sendTelegram(fields: ContactFields): Promise<void> {
  const response = await fetch(TELEGRAM_RELAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  const result = (await response.json().catch(() => null)) as { success?: boolean } | null
  if (!response.ok || !result?.success) throw new Error('Telegram relay rejected the message')
}

export default function ContactForm() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const openTimer = window.setTimeout(() => {
      if (!dialog.open) dialog.showModal()
    }, 5000)

    const openFromLink = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const link = event.target.closest('a[href="#contact-form"]')
      if (!link) return
      event.preventDefault()
      window.clearTimeout(openTimer)
      if (!dialog.open) dialog.showModal()
    }

    document.addEventListener('click', openFromLink)

    return () => {
      window.clearTimeout(openTimer)
      document.removeEventListener('click', openFromLink)
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return

    const form = event.currentTarget
    const formData = new FormData(form)

    // Honeypot: real visitors never see this field, bots tend to fill it in.
    if (formData.get('botcheck')) {
      form.reset()
      setStatus('sent')
      return
    }

    const fields: ContactFields = {
      name: String(formData.get('name') ?? '').trim(),
      company: String(formData.get('company') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      message: String(formData.get('message') ?? '').trim(),
    }

    setStatus('sending')
    // Every inbox and Telegram are sent to in parallel; the message counts as
    // delivered if at least one of them gets through.
    const channels = [
      ...WEB3FORMS_ACCESS_KEYS.map((key, i) => ({
        label: `Email #${i + 1}`,
        send: sendEmail(fields, key),
      })),
      { label: 'Telegram', send: sendTelegram(fields) },
    ]
    const results = await Promise.allSettled(channels.map((channel) => channel.send))
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.warn(`${channels[i].label} delivery failed:`, result.reason)
      }
    })
    if (results.some((result) => result.status === 'fulfilled')) {
      form.reset()
      setStatus('sent')
    } else {
      setStatus('error')
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="contact-form"
      id="contact-form"
      aria-labelledby="contact-form-title"
    >
      <button
        className="contact-form__close"
        type="button"
        aria-label="Close contact form"
        onClick={() => dialogRef.current?.close()}
      >
        ×
      </button>
      <div className="contact-form__content">
        <div className="contact-form__intro">
          <p className="contact-form__eyebrow">
            <span className="contact-form__status" aria-hidden="true" />
            ThinkWell AI <span>/</span> Intro call
          </p>
          <h2 className="contact-form__title" id="contact-form-title">
            Tell us what is <em>stuck.</em>
          </h2>
          <p className="contact-form__description">
            Share the challenge. We will come back with a straight answer and a useful next step.
          </p>
          <p className="contact-form__promise">30 minutes · No deck · Reply within one working day</p>
        </div>

        <form className="contact-form__fields" onSubmit={handleSubmit}>
          <div className="contact-form__row">
            <div className="contact-form__field">
              <label htmlFor="contact-form-name">Name</label>
              <input
                id="contact-form-name"
                name="name"
                autoComplete="name"
                maxLength={200}
                required
              />
            </div>

            <div className="contact-form__field">
              <label htmlFor="contact-form-company">Company</label>
              <input
                id="contact-form-company"
                name="company"
                autoComplete="organization"
                maxLength={200}
              />
            </div>
          </div>

          <div className="contact-form__field">
            <label htmlFor="contact-form-email">Work email</label>
            <input
              id="contact-form-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={320}
              required
            />
          </div>

          <div className="contact-form__field">
            <label htmlFor="contact-form-message">How can we help?</label>
            <textarea
              id="contact-form-message"
              name="message"
              rows={4}
              maxLength={3000}
              required
            />
          </div>

          <input
            type="checkbox"
            name="botcheck"
            className="contact-form__honeypot"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <button
            className="btn btn--solid btn--lg"
            type="submit"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? 'Sending…' : 'Send message'}
            <svg viewBox="0 0 16 16" aria-hidden="true" className="btn__arrow">
              <path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" fill="none" />
            </svg>
          </button>
          <p
            className={`contact-form__note${
              status === 'sent'
                ? ' contact-form__note--success'
                : status === 'error'
                  ? ' contact-form__note--error'
                  : ''
            }`}
            role="status"
            aria-live="polite"
          >
            {status === 'sent' &&
              'Thanks, your message has been sent. We will reply within one working day.'}
            {status === 'error' && (
              <>
                Sorry, your message could not be sent. Please try again, or email us at{' '}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              </>
            )}
            {(status === 'idle' || status === 'sending') &&
              'We will reply to the email address you enter above.'}
          </p>
        </form>
      </div>
    </dialog>
  )
}
