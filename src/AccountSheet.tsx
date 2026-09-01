import { useMemo, useState } from 'react'
import { Icon } from './Icon'
import {
  appleAuthEnabled,
  backendConfigured,
  claimFreeUsername,
  createUsernameInvoice,
  deleteMoonAccount,
  emailCodeEnabled,
  premiumUsernameEnabled,
  quoteUsername,
  signOut,
  type MoonAccount,
  type UsernameQuote,
} from './backend'
import { telegramWebApp } from './telegram'

type AccountSheetProps = {
  account: MoonAccount | null
  demoMode: boolean
  onClose: () => void
  onUsernameChanged: (username: string) => void
  onSignedOut: () => void
  onDeleted: () => void
}

const reservedUsernames = new Set(['admin', 'support', 'moon', 'moonirl', 'help', 'security', 'official'])

function normalizeUsername(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)
}

function demoQuote(candidate: string, hasUsername: boolean): UsernameQuote {
  if (!/^[a-z][a-z0-9_]{2,19}$/.test(candidate)) return { username: candidate, available: false, price_stars: 0, reason: 'invalid' }
  if (reservedUsernames.has(candidate)) return { username: candidate, available: false, price_stars: 0, reason: 'reserved' }
  const price = candidate.length <= 4 || hasUsername ? 150 : 0
  return { username: candidate, available: true, price_stars: price, reason: candidate.length <= 4 ? 'premium_short_id' : hasUsername ? 'paid_change' : 'free_first_id' }
}

function quoteMessage(quote: UsernameQuote | null) {
  if (!quote) return '۳ تا ۲۰ کاراکتر انگلیسی؛ با حرف شروع شود.'
  if (quote.available && quote.price_stars === 0) return 'این آیدی آزاد است و اولین انتخاب تو رایگان خواهد بود.'
  if (quote.available) return 'این آیدی آزاد است و به‌عنوان آیدی ویژه ثبت می‌شود.'
  if (quote.reason === 'taken') return 'این آیدی قبلاً انتخاب شده است.'
  if (quote.reason === 'reserved') return 'این آیدی برای بخش‌های رسمی MOON رزرو شده است.'
  return 'فرمت آیدی درست نیست.'
}

export function AccountSheet({ account, demoMode, onClose, onUsernameChanged, onSignedOut, onDeleted }: AccountSheetProps) {
  const [username, setUsername] = useState(account?.username ?? '')
  const [quote, setQuote] = useState<UsernameQuote | null>(null)
  const [checking, setChecking] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePhrase, setDeletePhrase] = useState('')
  const [deleting, setDeleting] = useState(false)
  const hasUsername = Boolean(account?.username)
  const normalized = useMemo(() => normalizeUsername(username), [username])

  async function checkUsername() {
    if (!normalized) return
    setChecking(true)
    setError('')
    setNotice('')
    try {
      const nextQuote = demoMode || !backendConfigured
        ? demoQuote(normalized, hasUsername)
        : await quoteUsername(normalized)
      setQuote(nextQuote)
    } catch {
      setError('بررسی آیدی انجام نشد. دوباره امتحان کن.')
    } finally {
      setChecking(false)
    }
  }

  async function claimUsername() {
    if (!quote?.available) return
    setClaiming(true)
    setError('')
    try {
      if (demoMode || !backendConfigured) {
        onUsernameChanged(quote.username)
        setNotice(quote.price_stars ? 'پیش‌نمایش پرداخت آیدی ویژه آماده شد.' : 'آیدی نمایشی روی این دستگاه ثبت شد.')
        return
      }
      if (quote.price_stars === 0) {
        const result = await claimFreeUsername(quote.username)
        onUsernameChanged(result.username)
        setNotice('آیدی یکتای تو ثبت شد.')
        return
      }
      if (!premiumUsernameEnabled) {
        setNotice('آیدی ویژه رزرو نشده است؛ پرداخت پس از اتصال امن ربات MOON فعال می‌شود.')
        return
      }
      const invoice = await createUsernameInvoice(quote.username)
      const telegram = telegramWebApp()
      if (telegram?.openInvoice) telegram.openInvoice(invoice.invoice_url)
      else window.open(invoice.invoice_url, '_blank', 'noopener,noreferrer')
      setNotice('صفحهٔ پرداخت امن Telegram Stars باز شد. ثبت نهایی بعد از تأیید پرداخت انجام می‌شود.')
    } catch {
      setError('ثبت آیدی کامل نشد. دوباره امتحان کن.')
    } finally {
      setClaiming(false)
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
    } finally {
      onSignedOut()
    }
  }

  async function handleDelete() {
    if (deletePhrase !== 'DELETE') return
    setDeleting(true)
    setError('')
    try {
      if (!demoMode && backendConfigured) await deleteMoonAccount(deletePhrase)
      try {
        await signOut()
      } catch {
        // The auth user may already be gone, which is the expected result.
      }
      onDeleted()
    } catch {
      setError('حذف حساب انجام نشد. دوباره وارد شو و تکرار کن.')
      setDeleting(false)
    }
  }

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="bottom-sheet account-sheet" role="dialog" aria-modal="true" aria-labelledby="account-title">
        <div className="sheet-handle" />
        <header><div><small>IDENTITY & MEMBERSHIP</small><h2 id="account-title">حساب و آیدی MOON</h2><p>ورود، شناسهٔ یکتا و کنترل کامل حساب</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="بستن"><Icon name="close" /></button></header>

        <section className="account-identity-card">
          <span className="account-icon"><Icon name="verified" /></span>
          <span><b>{demoMode ? 'نسخهٔ نمایشی' : 'عضویت فعال'}</b><small>{account?.email ?? 'بدون ایمیل متصل'}</small></span>
          <em>{demoMode ? 'LOCAL' : 'VERIFIED'}</em>
        </section>

        <section className="account-block username-block">
          <div className="account-block-title"><span><Icon name="user" /><span><b>آیدی یکتای MOON</b><small>آدرس عمومی تو: moon.ir/@username</small></span></span>{account?.username && <em dir="ltr">@{account.username}</em>}</div>
          <label className="username-input"><span dir="ltr">@</span><input dir="ltr" value={username} onChange={(event) => { setUsername(normalizeUsername(event.target.value)); setQuote(null); setNotice(''); setError('') }} placeholder="your_unique_id" /><button type="button" onClick={checkUsername} disabled={checking || normalized.length < 3}>{checking ? '...' : 'بررسی'}</button></label>
          <p className={`username-hint ${quote?.available ? 'available' : quote ? 'unavailable' : ''}`}>{quote?.available && <Icon name="check" size={15} />}{quoteMessage(quote)}</p>

          <div className="id-pricing">
            <div><span><b>آیدی معمولی</b><small>۵ تا ۲۰ کاراکتر · اولین انتخاب</small></span><strong>رایگان</strong></div>
            <div className="premium-id"><span><b>آیدی ویژه</b><small>آیدی ۳–۴ حرفی یا تغییر آیدی</small></span><strong>۱۵۰ <i>★</i></strong></div>
          </div>

          {quote?.available && <button className="claim-id-button" type="button" onClick={claimUsername} disabled={claiming || (quote.price_stars > 0 && !premiumUsernameEnabled)}>{claiming ? 'در حال انجام...' : quote.price_stars === 0 ? `ثبت رایگان @${quote.username}` : premiumUsernameEnabled ? `خرید @${quote.username} با ${quote.price_stars.toLocaleString('fa-IR')} Stars` : 'پرداخت آیدی ویژه پس از اتصال ربات فعال می‌شود'}</button>}
          <p className="pricing-note"><Icon name="lock" size={14} /> {premiumUsernameEnabled ? 'پرداخت داخل Telegram فقط با Stars انجام می‌شود. قیمت یک‌بار است و اشتراک ماهانه نیست.' : 'ثبت اولین آیدی معمولی فعال است؛ پرداخت Stars تا اتصال امن ربات MOON نمایش داده نمی‌شود.'}</p>
        </section>

        <section className="account-block login-methods">
          <div className="account-block-title"><span><Icon name="lock" /><span><b>روش‌های ورود</b><small>بدون نگه‌داری رمز عبور در MOON</small></span></span></div>
          <div><span className="login-provider-icon"><Icon name="message" /></span><span><b>{emailCodeEnabled ? 'ایمیل و کد موقت' : 'ایمیل و لینک یک‌بارمصرف'}</b><small>{account?.email ?? 'آمادهٔ اتصال'}</small></span><em>{backendConfigured && !demoMode ? 'فعال' : 'آماده'}</em></div>
          <div><span className="login-provider-icon apple-small">●</span><span><b>Sign in with Apple</b><small>{appleAuthEnabled ? 'متصل به حساب MOON' : 'نیازمند Apple Developer و Service ID مالک'}</small></span><em>{appleAuthEnabled ? 'فعال' : 'به‌زودی'}</em></div>
        </section>

        {!deleteOpen ? (
          <section className="account-danger-zone">
            <button type="button" onClick={() => setDeleteOpen(true)}><span><Icon name="close" /><span><b>حذف کامل حساب</b><small>پروفایل، پست‌ها و اطلاعات خصوصی حذف می‌شوند.</small></span></span><Icon name="chevron-left" /></button>
          </section>
        ) : (
          <section className="delete-confirmation">
            <Icon name="close" size={28} />
            <h3>حذف حساب برگشت‌پذیر نیست</h3>
            <p>تمام اطلاعات حساب، رابطه‌ها، پیام‌ها، ژورنال و خریدهای متصل به پروفایل حذف می‌شوند. برای ادامه عبارت <b dir="ltr">DELETE</b> را وارد کن.</p>
            <input dir="ltr" value={deletePhrase} onChange={(event) => setDeletePhrase(event.target.value.toUpperCase())} placeholder="DELETE" aria-label="تأیید حذف حساب" />
            <div><button type="button" className="secondary" onClick={() => { setDeleteOpen(false); setDeletePhrase('') }}>انصراف</button><button type="button" className="delete-account-button" disabled={deletePhrase !== 'DELETE' || deleting} onClick={handleDelete}>{deleting ? 'در حال حذف...' : 'حذف دائمی حساب'}</button></div>
          </section>
        )}

        {notice && <p className="account-notice"><Icon name="check" size={16} /> {notice}</p>}
        {error && <p className="account-error" role="alert">{error}</p>}
        <button className="sign-out-button" type="button" onClick={handleSignOut}>خروج از حساب</button>
        <p className="account-security-note">کلیدهای مدیریتی و Bot Token فقط در سرور نگه‌داری می‌شوند و هیچ‌وقت وارد کد عمومی مرورگر نمی‌شوند.</p>
      </section>
    </div>
  )
}
