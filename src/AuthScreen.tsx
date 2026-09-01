import { useState } from 'react'
import { Icon } from './Icon'
import {
  appleAuthEnabled,
  backendConfigured,
  emailAuthEnabled,
  emailCodeEnabled,
  sendEmailOtp,
  signInAnonymously,
  signInWithApple,
  verifyEmailOtp,
} from './backend'

type AuthScreenProps = {
  onDemo: () => void
  onAuthenticated: () => void
}

function friendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const normalized = message.toLowerCase()
  if (message.includes('BACKEND_NOT_CONFIGURED')) return 'دیتابیس هنوز به نسخهٔ منتشرشده متصل نشده است.'
  if (normalized.includes('email address not authorized')) return 'ارسال ایمیل عمومی هنوز فعال نشده است؛ فعلاً با حساب رایگان شروع کن.'
  if (normalized.includes('anonymous') && normalized.includes('disabled')) return 'شروع رایگان موقتاً در دسترس نیست. کمی بعد دوباره امتحان کن.'
  if (normalized.includes('rate')) return 'تعداد درخواست‌ها زیاد شده؛ یک دقیقه دیگر دوباره امتحان کن.'
  if (normalized.includes('expired')) return 'کد منقضی شده؛ یک کد تازه بگیر.'
  if (normalized.includes('invalid')) return 'کد واردشده درست نیست.'
  return 'ورود کامل نشد. دوباره امتحان کن.'
}

export function AuthScreen({ onDemo, onAuthenticated }: AuthScreenProps) {
  const [step, setStep] = useState<'start' | 'email' | 'sent'>('start')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [adult, setAdult] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  async function startFreeAccount() {
    if (!adult) return
    setLoading(true)
    setError('')
    try {
      if (!backendConfigured) {
        onDemo()
        return
      }
      await signInAnonymously()
      onAuthenticated()
    } catch (accountError) {
      setError(friendlyAuthError(accountError))
    } finally {
      setLoading(false)
    }
  }

  async function requestOtp() {
    if (!emailAuthEnabled || !validEmail || !adult) return
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
        <h1 id="auth-title">{step === 'start' ? 'شروع MOON' : 'ورود ایمیلی'}</h1>
        <p>{step === 'start' ? 'رایگان، بدون نیاز به Telegram و آمادهٔ استفاده در همین مرورگر.' : 'بدون رمز عبور؛ یک لینک امن و یک‌بارمصرف برایت می‌فرستیم.'}</p>

        {step === 'start' ? (
          <div className="auth-entry">
            <label className="adult-check"><input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} /><span><b>۱۸ سال یا بیشتر دارم</b><small>با ادامه، قوانین جامعه و حریم خصوصی را می‌پذیرم.</small></span></label>
            <button className="auth-primary" type="button" disabled={!adult || loading} onClick={startFreeAccount}>{loading ? 'در حال ساخت حساب...' : backendConfigured ? 'شروع رایگان' : 'ورود به نسخهٔ نمایشی'}</button>
            <p className="auth-guest-note"><Icon name="lock" size={16} /><span><b>حساب واقعی و امن</b><small>اطلاعات حساب در دیتابیس محافظت می‌شود؛ برای استفاده روی دستگاه دیگر بعداً یک روش ورود دائمی متصل کن.</small></span></p>

            <div className="auth-divider"><span>روش‌های ورود دائمی</span></div>
            <button className="email-login" type="button" disabled={!emailAuthEnabled || loading} onClick={() => setStep('email')}><Icon name="message" size={18} /> {emailAuthEnabled ? 'ادامه با ایمیل' : 'ورود ایمیلی · پس از اتصال ارسال عمومی'}</button>
            <button className="apple-login" type="button" onClick={appleLogin} disabled={loading || !appleAuthEnabled}><span className="apple-mark">●</span> {appleAuthEnabled ? 'ادامه با Apple' : 'ورود با Apple · به‌زودی'}</button>
            <p className="auth-provider-note">این دو روش فقط پس از ثبت امن credentialهای مالک فعال می‌شوند؛ دکمهٔ نمایشی یا خراب به کاربر نشان داده نمی‌شود.</p>
          </div>
        ) : step === 'email' ? (
          <form onSubmit={(event) => { event.preventDefault(); requestOtp() }}>
            <button className="change-email" type="button" onClick={() => setStep('start')}><Icon name="back" size={17} /> بازگشت</button>
            <label className="auth-field"><span>ایمیل</span><div><Icon name="message" size={19} /><input dir="ltr" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div></label>
            <button className="auth-primary" type="submit" disabled={!validEmail || loading}>{loading ? 'در حال ارسال...' : emailCodeEnabled ? 'دریافت کد موقت' : 'ارسال لینک ورود'}</button>
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

        {error && <p className="auth-error" role="alert">{error}</p>}
        <footer><button type="button">حریم خصوصی</button><span>·</span><button type="button">قوانین جامعه</button><span>·</span><button type="button">راهنمای امنیت</button></footer>
      </section>
    </main>
  )
}
