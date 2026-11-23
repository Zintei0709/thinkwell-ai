import { useEffect, useRef, useState, type FormEvent } from 'react'

// Messages are delivered by Web3Forms (https://web3forms.com) to the inbox the
// access key was created for. The key is public by design: it can only send
// messages to that inbox, so it is safe to ship in client-side code.
const WEB3FORMS_ACCESS_KEY = 'd6b992a5-95c8-4d3d-a682-4debf83d4596'
const CONTACT_EMAIL = 'whaletera@gmail.com'

type Status = 'idle' | 'sending' | 'sent' | 'error'

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

    const name = String(formData.get('name') ?? '').trim()
    const company = String(formData.get('company') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    const message = String(formData.get('message') ?? '').trim()

    setStatus('sending')
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Intro call with ThinkWell AI — ${name}`,
          from_name: 'ThinkWell AI website',
          replyto: email,
          name,
          company: company || '—',
          email,
          message,
        }),
      })
      const result = (await response.json().catch(() => null)) as { success?: boolean } | null
      if (!response.ok || !result?.success) throw new Error('Web3Forms rejected the message')
      form.reset()
      setStatus('sent')
    } catch {
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
              <input id="contact-form-name" name="name" autoComplete="name" required />
            </div>

            <div className="contact-form__field">
              <label htmlFor="contact-form-company">Company</label>
              <input id="contact-form-company" name="company" autoComplete="organization" />
            </div>
          </div>

          <div className="contact-form__field">
            <label htmlFor="contact-form-email">Work email</label>
            <input
              id="contact-form-email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="contact-form__field">
            <label htmlFor="contact-form-message">How can we help?</label>
            <textarea id="contact-form-message" name="message" rows={4} required />
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
