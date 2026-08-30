import { useMemo, useState } from 'react'
import { currentTelegramUser, hapticSuccess } from './telegram'

const phases = ['آرام', 'روشن', 'در جریان', 'درخشان'] as const

function MoonMark({ progress }: { progress: number }) {
  return (
    <div className="moon-wrap" aria-label={`پیشرفت امروز ${progress} درصد`}>
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="moon">
        <span className="moon-glow" style={{ clipPath: `inset(${100 - progress}% 0 0)` }} />
        <span className="moon-value">{progress}٪</span>
      </div>
    </div>
  )
}

export function App() {
  const user = useMemo(() => currentTelegramUser(), [])
  const [done, setDone] = useState(false)
  const [activeTab, setActiveTab] = useState('خانه')
  const progress = done ? 72 : 48
  const phase = phases[Math.min(3, Math.floor(progress / 25))]

  function completeQuest() {
    setDone(true)
    hapticSuccess()
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">MOON IRL</p>
          <h1>سلام {user?.first_name ?? 'ماه‌گرد'} <span aria-hidden="true">✦</span></h1>
        </div>
        {user?.photo_url ? <img className="avatar" src={user.photo_url} alt="تصویر پروفایل" /> : <div className="avatar avatar-fallback">☾</div>}
      </header>

      <section className="hero-card">
        <div className="stars" aria-hidden="true">✦ · ˚ ✧ · ✦</div>
        <MoonMark progress={progress} />
        <p className="eyebrow">فاز امروز</p>
        <h2>{phase}</h2>
        <p>لازم نیست همه‌چیز را یک‌جا تغییر بدهی.<br />فقط قدم بعدی را واقعی کن.</p>
      </section>

      <section className="stats" aria-label="آمار امروز">
        <article><strong>{done ? 3 : 2}</strong><span>قدم انجام‌شده</span></article>
        <article><strong>۴</strong><span>روز پیوسته</span></article>
        <article><strong>+{done ? 35 : 20}</strong><span>نور امروز</span></article>
      </section>

      <section className={`quest ${done ? 'quest-done' : ''}`}>
        <div className="quest-icon" aria-hidden="true">{done ? '✓' : '↗'}</div>
        <div className="quest-copy">
          <p className="eyebrow">قدم پیشنهادی</p>
          <h3>{done ? 'انجام شد؛ نورش ماند.' : 'ده دقیقه بدون صفحه‌نمایش'}</h3>
          <p>{done ? 'یک قدم واقعی برای امروز ثبت کردی.' : 'گوشی را کنار بگذار و فقط به اطرافت نگاه کن.'}</p>
        </div>
        <button type="button" onClick={completeQuest} disabled={done}>{done ? 'ثبت شد' : 'انجام می‌دم'}</button>
      </section>

      <blockquote>«کم، اما واقعی»</blockquote>

      <nav className="bottom-nav" aria-label="منوی اصلی">
        {['خانه', 'مسیر', 'من'].map((tab) => (
          <button key={tab} type="button" className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
            <span aria-hidden="true">{tab === 'خانه' ? '◉' : tab === 'مسیر' ? '⌁' : '○'}</span>{tab}
          </button>
        ))}
      </nav>
    </main>
  )
}
