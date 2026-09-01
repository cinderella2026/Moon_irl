import { useState } from 'react'
import { Icon } from './Icon'
import {
  appleAuthEnabled,
  backendConfigured,
  emailCodeEnabled,
  sendEmailOtp,
  signInWithApple,
  verifyEmailOtp,
} from './backend'

type AuthScreenProps = {
  onDemo: () => void
  onAuthenticated: () => void
}

function friendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('BACKEND_NOT_CONFIGURED')) return 'دیتابیس هنوز به نسخهٔ منتشرشده متصل نشده است.'
  if (message.toLowerCase().includes('rate')) return 'تعداد درخواست‌ها زیاد شده؛ یک دقیقه دیگر دوباره امتحان کن.'
  if (message.toLowerCase().includes('expired')) return 'کد منقضی شده؛ یک کد تازه بگیر.'
  if (message.toLowerCase().includes('invalid')) return 'کد واردشده درست نیست.'
  return 'ورود کامل نشد. دوباره امتحان کن.'
}

export function AuthScreen({ onDemo, onAuthenticated }: AuthScreenProps) {
  const [step, setStep] = useState<'email' | 'sent'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [adult, setAdult] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  async function requestOtp() {
    if (!validEmail || !adult) return
    setLoading(true)
    setError('')
    try {
      await sendEmailOtp(email.trim().toLowerCase())
      setStep('sent')
      setNotice(emailCodeEnabled
        ? 'کد یک‌بارمصرف به ایمیلت فرستاده شد.'
        : 'لینک ورود یک‌بارمصرف به ایمیلت فرستاده شد. همان لینک را باز کن تا وارد MOON شوی.')
    } catch (requestError) {
      setError(friendlyAuthError(requestError))
    } finally {
      setLoading(false)
    }
  }

  async function confirmOtp() {
    if (otp.trim().length < 6) return
    setLoading(true)
    setError('')
    try {
      await verifyEmailOtp(email.trim().toLowerCase(), otp.trim().replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))))
      onAuthenticated()
    } catch (verifyError) {
      setError(friendlyAuthError(verifyError))
    } finally {
      setLoading(false)
    }
  }

  async function appleLogin() {
    if (!appleAuthEnabled) return
    if (!adult) {
      setError('ابتدا تأیید کن که حداقل ۱۸ سال داری.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await signInWithApple()
    } catch (appleError) {
      setError(friendlyAuthError(appleError))
      setLoading(false)
    }
  }

  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-visual" aria-hidden="true">
        <span className="auth-orbit orbit-a" />
        <span className="auth-orbit orbit-b" />
        <span className="auth-moon">◐</span>
        <div className="auth-people"><span>ن</span><span>آ</span><span>ا</span></div>
      </section>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-logo" dir="ltr">MO<span>◐</span>N <small>IRL</small></div>
        <small className="auth-kicker">MEMBERSHIP</small>
        <h1 id="auth-title">ورود به MOON</h1>
        <p>بدون رمز عبور؛ یک لینک امن و یک‌بارمصرف برایت می‌فرستیم.</p>

        {step === 'email' ? (
          <form onSubmit={(event) => { event.preventDefault(); requestOtp() }}>
            <label className="auth-field"><span>ایمیل</span><div><Icon name="message" size={19} /><input dir="ltr" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div></label>
            <label className="adult-check"><input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} /><span><b>۱۸ سال یا بیشتر دارم</b><small>با ادامه، قوانین جامعه و حریم خصوصی را می‌پذیرم.</small></span></label>
            <button className="auth-primary" type="submit" disabled={!validEmail || !adult || loading}>{loading ? 'در حال ارسال...' : emailCodeEnabled ? 'دریافت کد موقت' : 'ارسال لینک ورود'}</button>
          </form>
        ) : (
          <form onSubmit={(event) => { event.preventDefault(); if (emailCodeEnabled) confirmOtp() }}>
            <button className="change-email" type="button" onClick={() => { setStep('email'); setOtp(''); setNotice('') }}><Icon name="back" size={17} /> تغییر ایمیل</button>
            {emailCodeEnabled && <label className="auth-field otp-field"><span>کد موقت</span><input dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={otp} onChange={(event) => setOtp(event.target.value.replace(/[^0-9۰-۹]/g, ''))} placeholder="••••••" /></label>}
            {notice && <p className="auth-notice"><Icon name="check" size={16} /> {notice}</p>}
            {emailCodeEnabled && <button className="auth-primary" type="submit" disabled={otp.trim().length < 6 || loading}>{loading ? 'در حال بررسی...' : 'تأیید و ورود'}</button>}
            <button className="resend-code" type="button" disabled={loading} onClick={requestOtp}>{loading ? 'در حال ارسال...' : emailCodeEnabled ? 'ارسال دوبارهٔ کد' : 'ارسال دوبارهٔ لینک'}</button>
          </form>
        )}

        <div className="auth-divider"><span>یا</span></div>
        <button className="apple-login" type="button" onClick={appleLogin} disabled={loading || !appleAuthEnabled}><span className="apple-mark">●</span> {appleAuthEnabled ? 'ادامه با Apple' : 'ورود با Apple · به‌زودی'}</button>
        {!appleAuthEnabled && <p className="auth-provider-note">ورود ایمیلی فعال است؛ Apple پس از تأیید حساب توسعه‌دهندهٔ مالک اضافه می‌شود.</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}

        {!backendConfigured && <div className="auth-demo-note"><Icon name="settings" size={17} /><span><b>نسخهٔ نمایشی</b><small>تا اتصال سرویس عضویت، می‌توانی تمام بخش‌ها را ببینی.</small></span><button type="button" onClick={onDemo}>ورود به دمو</button></div>}
        <footer><button type="button">حریم خصوصی</button><span>·</span><button type="button">قوانین جامعه</button><span>·</span><button type="button">راهنمای امنیت</button></footer>
      </section>
    </main>
  )
}
