import { useEffect, useRef, type FormEvent } from 'react'

export default function ContactForm() {
  const dialogRef = useRef<HTMLDialogElement>(null)

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '')
    const company = String(formData.get('company') ?? '')
    const email = String(formData.get('email') ?? '')
    const message = String(formData.get('message') ?? '')
    const subject = encodeURIComponent(`Intro call with ThinkWell AI — ${name}`)
    const body = encodeURIComponent(
      `Name: ${name}\nCompany: ${company}\nEmail: ${email}\n\n${message}`,
    )

    window.location.href = `mailto:whaletera@gmail.com?subject=${subject}&body=${body}`
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

          <button className="btn btn--solid btn--lg" type="submit">
            Send message
            <svg viewBox="0 0 16 16" aria-hidden="true" className="btn__arrow">
              <path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" fill="none" />
            </svg>
          </button>
          <p className="contact-form__note">
            Your email app will open with your message ready to send.
          </p>
        </form>
      </div>
    </dialog>
  )
}
