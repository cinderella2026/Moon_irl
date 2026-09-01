import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AccountSheet } from './AccountSheet'
import { AuthScreen } from './AuthScreen'
import { Icon, type IconName } from './Icon'
import {
  conversations,
  profileById,
  profiles,
  starterPosts,
  topPeople,
  type Post,
  type Profile,
} from './data'
import { currentTelegramUser, hapticSuccess } from './telegram'
import {
  backendConfigured,
  getCurrentSession,
  loadMoonAccount,
  watchSession,
  type MoonAccount,
} from './backend'

type Tab = 'home' | 'discover' | 'create' | 'people' | 'me'
type DiscoverMode = 'همه' | 'دوستی' | 'رابطه' | 'سازنده‌ها'
type PeopleMode = 'messages' | 'requests' | 'relationships'
type DraftKind = 'post' | 'photo' | 'status' | 'event' | 'life' | 'journal'
type Audience = 'همه' | 'دنبال‌کننده‌ها' | 'دوستان نزدیک' | 'فقط من'

type Task = { id: string; text: string; done: boolean }
type LocalMessage = { id: string; mine: boolean; text: string; time: string }
type Comment = { id: string; name: string; text: string; time: string }

const storageKeys = {
  posts: 'moon-irl-posts-v3',
  liked: 'moon-irl-liked-v3',
  saved: 'moon-irl-saved-v3',
  follows: 'moon-irl-follows-v3',
  ratings: 'moon-irl-ratings-v3',
  tasks: 'moon-irl-tasks-v3',
  mood: 'moon-irl-mood-v3',
  journal: 'moon-irl-journal-v3',
  messages: 'moon-irl-messages-v3',
} as const

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be disabled in private or embedded browser modes.
  }
}

const standardNumberFormatter = new Intl.NumberFormat('fa-IR')
const compactNumberFormatter = new Intl.NumberFormat('fa-IR', { notation: 'compact' })

function formatNumber(value: number) {
  return (value > 9999 ? compactNumberFormatter : standardNumberFormatter).format(value)
}

function Avatar({ profile, size = 'medium', story = false }: { profile: Profile; size?: 'small' | 'medium' | 'large' | 'hero'; story?: boolean }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className={`avatar avatar-${size} ${story ? 'avatar-story' : ''}`} aria-hidden="true">
      {!failed && <img src={profile.avatar} alt="" onError={() => setFailed(true)} />}
      <span className="avatar-fallback">{profile.name.slice(0, 1)}</span>
      {profile.fullMoon && <span className="full-moon-dot">●</span>}
    </span>
  )
}

function VerifiedName({ profile, compact = false }: { profile: Profile; compact?: boolean }) {
  return (
    <span className={`verified-name ${compact ? 'compact' : ''}`}>
      <b>{profile.name}</b>
      {profile.verified && <Icon name="verified" size={compact ? 15 : 17} className="verified-icon" />}
      {profile.fullMoon && <span className="moon-badge" title="Full Moon">●</span>}
    </span>
  )
}

function ImageMedia({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`image-media ${failed ? 'image-failed' : ''} ${className}`}>
      {!failed && <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />}
      {failed && <span>MOON</span>}
    </div>
  )
}

function ScreenHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="screen-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

type PostCardProps = {
  post: Post
  liked: boolean
  saved: boolean
  followed: boolean
  going: boolean
  onLike: () => void
  onSave: () => void
  onFollow: () => void
  onComments: () => void
  onProfile: () => void
  onShare: () => void
  onGoing: () => void
}

function PostCard({ post, liked, saved, followed, going, onLike, onSave, onFollow, onComments, onProfile, onShare, onGoing }: PostCardProps) {
  const profile = profileById(post.authorId)
  return (
    <article className={`post-card post-${post.kind}`}>
      <header className="post-head">
        <button className="identity-button" type="button" onClick={onProfile} aria-label={`دیدن پروفایل ${profile.name}`}>
          <Avatar profile={profile} />
          <span>
            <VerifiedName profile={profile} compact />
            <small>{post.location ? `${post.location} · ` : ''}{post.time}</small>
          </span>
        </button>
        {post.authorId !== 'ella' && (
          <button className={`text-action ${followed ? 'is-following' : ''}`} type="button" onClick={onFollow}>
            {followed ? 'دنبال می‌کنی' : 'دنبال کن'}
          </button>
        )}
      </header>

      {post.kind === 'relationship' && (
        <div className="relationship-update">
          <span className="relationship-mark">♡</span>
          <div className="couple-avatars"><Avatar profile={profileById('nika')} size="large" /><Avatar profile={profileById('armin')} size="large" /></div>
          <span className="soft-label">رابطهٔ تأییدشدهٔ دوطرفه</span>
        </div>
      )}

      {post.image && (
        <button type="button" className="post-media-button" onDoubleClick={onLike} aria-label="دو بار لمس برای پسندیدن">
          <ImageMedia src={post.image} alt={`تصویر پست ${profile.name}`} className="post-media" />
          {post.kind === 'life' && <span className="media-label">LIFE UPDATE</span>}
        </button>
      )}

      {post.event && (
        <div className="event-panel">
          <span className="event-date"><b>۲۱</b><small>شهریور</small></span>
          <span className="event-copy"><b>{post.event.title}</b><small>{post.event.when} · {post.event.place}</small></span>
          <button className={going ? 'is-going' : ''} type="button" onClick={onGoing}>{going ? 'میام ✓' : 'میام'}</button>
        </div>
      )}

      <p className="post-copy">{post.text}</p>
      <div className="post-actions">
        <div>
          <button type="button" className={liked ? 'is-liked' : ''} onClick={onLike} aria-label={liked ? 'حذف پسند' : 'پسندیدن'}>
            <Icon name="heart" filled={liked} /> <span>{formatNumber(post.likes + (liked ? 1 : 0))}</span>
          </button>
          <button type="button" onClick={onComments} aria-label="دیدن نظرها"><Icon name="comment" /> <span>{formatNumber(post.comments)}</span></button>
          <button type="button" onClick={onShare} aria-label="اشتراک‌گذاری"><Icon name="share" /></button>
        </div>
        <button type="button" className={saved ? 'is-saved' : ''} onClick={onSave} aria-label={saved ? 'حذف از ذخیره‌ها' : 'ذخیره'}><Icon name="bookmark" filled={saved} /></button>
      </div>
      {post.event && <p className="post-meta">{formatNumber(post.event.attending + (going ? 1 : 0))} نفر می‌آیند</p>}
    </article>
  )
}

function HomeScreen({
  posts,
  liked,
  saved,
  follows,
  going,
  onToggleLike,
  onToggleSave,
  onToggleFollow,
  onComments,
  onProfile,
  onShare,
  onGoing,
  onLife,
  onDiscover,
  mood,
  openTasks,
}: {
  posts: Post[]
  liked: Record<string, boolean>
  saved: Record<string, boolean>
  follows: Record<string, boolean>
  going: Record<string, boolean>
  onToggleLike: (id: string) => void
  onToggleSave: (id: string) => void
  onToggleFollow: (id: string) => void
  onComments: (id: string) => void
  onProfile: (id: string) => void
  onShare: (post: Post) => void
  onGoing: (id: string) => void
  onLife: () => void
  onDiscover: () => void
  mood: string
  openTasks: number
}) {
  const [feedMode, setFeedMode] = useState<'for-you' | 'following'>('for-you')
  const visiblePosts = feedMode === 'following' ? posts.filter((post) => follows[post.authorId] || post.authorId === 'ella') : posts

  return (
    <main className="screen home-screen">
      <header className="brand-header">
        <button className="wordmark" type="button" aria-label="MOON IRL، خانه"><span>MO</span><i>◐</i><span>N</span><small>IRL</small></button>
        <div>
          <button className="icon-button notification-button" type="button" aria-label="اعلان‌ها"><Icon name="bell" /><span /></button>
          <button className="icon-button" type="button" aria-label="زندگی من" onClick={onLife}><Icon name="moon" /></button>
        </div>
      </header>

      <section className="stories" aria-label="وضعیت‌های ۲۴ ساعته">
        <button type="button" className="story story-add" onClick={onLife}><span className="story-avatar"><Avatar profile={profileById('ella')} size="large" /><i>+</i></span><small>وضعیت من</small></button>
        {profiles.slice(1).map((profile) => (
          <button type="button" className="story" key={profile.id} onClick={() => onProfile(profile.id)}>
            <Avatar profile={profile} size="large" story />
            <small>{profile.name.split(' ')[0]}</small>
          </button>
        ))}
      </section>

      <button type="button" className="today-strip" onClick={onLife}>
        <span><Icon name="smile" /><b>حال امروز</b><small>{mood || 'ثبت نشده'}</small></span>
        <span><Icon name="list" /><b>کارهای من</b><small>{openTasks ? `${formatNumber(openTasks)} کار باز` : 'همه انجام شد'}</small></span>
        <Icon name="chevron-left" className="today-chevron" />
      </button>

      <div className="feed-switch" role="tablist" aria-label="نوع فید">
        <button type="button" role="tab" aria-selected={feedMode === 'for-you'} className={feedMode === 'for-you' ? 'active' : ''} onClick={() => setFeedMode('for-you')}>برای تو</button>
        <button type="button" role="tab" aria-selected={feedMode === 'following'} className={feedMode === 'following' ? 'active' : ''} onClick={() => setFeedMode('following')}>دنبال‌شده‌ها</button>
      </div>

      <section className="feed" aria-label="فید MOON">
        {visiblePosts.length ? visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            liked={Boolean(liked[post.id])}
            saved={Boolean(saved[post.id])}
            followed={Boolean(follows[post.authorId])}
            going={Boolean(going[post.id])}
            onLike={() => onToggleLike(post.id)}
            onSave={() => onToggleSave(post.id)}
            onFollow={() => onToggleFollow(post.authorId)}
            onComments={() => onComments(post.id)}
            onProfile={() => onProfile(post.authorId)}
            onShare={() => onShare(post)}
            onGoing={() => onGoing(post.id)}
          />
        )) : (
          <div className="empty-state"><Icon name="people" size={34} /><h3>هنوز کسی را دنبال نکرده‌ای</h3><p>از بخش کشف، آدم‌های مناسب خودت را پیدا کن.</p><button type="button" onClick={onDiscover}>رفتن به کشف</button></div>
        )}
      </section>
    </main>
  )
}

function DiscoverScreen({ follows, onFollow, onProfile }: { follows: Record<string, boolean>; onFollow: (id: string) => void; onProfile: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<DiscoverMode>('همه')
  const [showTop, setShowTop] = useState(false)
  const filtered = profiles.slice(1).filter((profile) => {
    const matchesMode = mode === 'همه' || profile.intent === mode
    const haystack = `${profile.name} ${profile.username} ${profile.city} ${profile.role} ${profile.interests.join(' ')}`
    return matchesMode && haystack.toLocaleLowerCase('fa').includes(query.trim().toLocaleLowerCase('fa'))
  })

  return (
    <main className="screen discover-screen">
      <ScreenHeader title="کشف" subtitle="آدم‌ها، جمع‌ها و اتفاق‌های نزدیک تو" />
      <label className="search-box">
        <Icon name="search" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام، شهر یا علاقه..." aria-label="جست‌وجو" />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="پاک کردن جست‌وجو"><Icon name="close" size={18} /></button>}
      </label>
      <div className="chip-row" role="tablist" aria-label="هدف کشف">
        {(['همه', 'دوستی', 'رابطه', 'سازنده‌ها'] as DiscoverMode[]).map((item) => <button type="button" role="tab" aria-selected={mode === item} className={mode === item ? 'active' : ''} key={item} onClick={() => setMode(item)}>{item}</button>)}
      </div>

      {!query && mode === 'همه' && (
        <section className="top-ten-card">
          <button className="top-ten-summary" type="button" onClick={() => setShowTop((value) => !value)}>
            <span><small>MOON TOP 10</small><b>آدم‌های این فاز</b><em>دورهٔ بعدی: ۲ روز و ۱۱ ساعت</em></span>
            <span className="top-ten-faces">{topPeople.slice(0, 3).map((item) => <Avatar key={item.profileId} profile={profileById(item.profileId)} />)}</span>
            <Icon name="chevron-left" className={showTop ? 'rotate-down' : ''} />
          </button>
          {showTop && (
            <div className="ranking-list">
              {topPeople.map((item) => {
                const person = profileById(item.profileId)
                return <button type="button" key={item.profileId} onClick={() => onProfile(item.profileId)}><span className="rank-number">{item.rank}</span><Avatar profile={person} /><span><VerifiedName profile={person} compact /><small>{person.city}</small></span><b>{person.score.toLocaleString('fa-IR')}</b><em>{item.change}</em></button>
              })}
            </div>
          )}
        </section>
      )}

      <div className="section-title"><div><h2>{query ? 'نتیجهٔ جست‌وجو' : mode === 'همه' ? 'آدم‌هایی برای تو' : mode}</h2><p>{filtered.length ? `${formatNumber(filtered.length)} پیشنهاد` : 'چیزی پیدا نشد'}</p></div><button type="button"><Icon name="settings" size={19} /> فیلترها</button></div>
      {filtered.length ? (
        <section className="people-grid">
          {filtered.map((profile) => (
            <article className="person-card" key={profile.id}>
              <button type="button" className="person-visual" onClick={() => onProfile(profile.id)}>
                <ImageMedia src={profile.cover ?? profile.avatar} alt={`تصویر ${profile.name}`} />
                <span className="intent-badge">{profile.intent}</span>
                <span className="person-gradient" />
                <span className="person-overview"><VerifiedName profile={profile} /><small>{profile.city} · {profile.role}</small></span>
              </button>
              <div className="person-card-body">
                <p>{profile.bio}</p>
                <div className="mini-tags">{profile.interests.slice(0, 2).map((item) => <span key={item}>{item}</span>)}</div>
                <div className="person-card-meta"><small>{profile.mutual ?? 'تازه در MOON'}</small><button className={follows[profile.id] ? 'following' : ''} type="button" onClick={() => onFollow(profile.id)}>{follows[profile.id] ? 'دنبال می‌کنی' : 'دنبال کن'}</button></div>
              </div>
            </article>
          ))}
        </section>
      ) : <div className="empty-state compact"><Icon name="search" size={32} /><h3>نتیجه‌ای نیست</h3><p>عبارت یا فیلتر دیگری را امتحان کن.</p></div>}

      {!query && (
        <section className="circles-section">
          <div className="section-title"><div><h2>حلقه‌های نزدیک تو</h2><p>جمع‌های کوچک با علاقهٔ مشترک</p></div></div>
          <div className="circle-list">
            <button type="button"><span className="circle-art cinema">🎞</span><span><b>سینمای مستقل</b><small>۱٫۲K عضو · تهران</small></span><em>پیوستن</em></button>
            <button type="button"><span className="circle-art run">◒</span><span><b>دویدن شبانه</b><small>۶۸۴ عضو · ۲ رویداد</small></span><em>پیوستن</em></button>
          </div>
        </section>
      )}
    </main>
  )
}

const draftKinds: { id: DraftKind; label: string; detail: string; icon: IconName }[] = [
  { id: 'post', label: 'پست', detail: 'متن و گفت‌وگو', icon: 'edit' },
  { id: 'photo', label: 'عکس', detail: 'یک لحظهٔ واقعی', icon: 'image' },
  { id: 'status', label: 'وضعیت ۲۴h', detail: 'الان چه خبر؟', icon: 'moon' },
  { id: 'event', label: 'رویداد', detail: 'آدم‌ها را جمع کن', icon: 'people' },
  { id: 'life', label: 'Life Update', detail: 'یک تغییر مهم', icon: 'sparkle' },
  { id: 'journal', label: 'ژورنال', detail: 'خصوصی برای خودت', icon: 'journal' },
]

function CreateScreen({ onPublish, onJournal, onCancel }: { onPublish: (post: Post) => void; onJournal: (text: string) => void; onCancel: () => void }) {
  const [kind, setKind] = useState<DraftKind>('post')
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [audience, setAudience] = useState<Audience>('همه')
  const [photo, setPhoto] = useState('')
  const [fileError, setFileError] = useState('')

  function chooseKind(next: DraftKind) {
    setKind(next)
    if (next === 'journal') setAudience('فقط من')
    if (next === 'status' && audience === 'فقط من') setAudience('همه')
  }

  function choosePhoto(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFileError('فقط فایل تصویری قابل انتخاب است.')
      return
    }
    if (file.size > 1_500_000) {
      setFileError('برای نسخهٔ نمایشی، عکس باید کمتر از ۱٫۵ مگابایت باشد.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setPhoto(reader.result)
      setFileError('')
    }
    reader.readAsDataURL(file)
  }

  function submit() {
    if (kind === 'journal') {
      onJournal(text.trim())
      return
    }
    const nextPost: Post = {
      id: `local-${Date.now()}`,
      authorId: 'ella',
      kind: kind === 'event' ? 'event' : kind === 'life' || kind === 'status' ? 'life' : photo ? 'photo' : 'text',
      time: 'همین حالا',
      text: text.trim() || (kind === 'photo' ? 'یک لحظه از امروز.' : title.trim()),
      image: photo || undefined,
      location: location.trim() || undefined,
      likes: 0,
      comments: 0,
      event: kind === 'event' ? { title: title.trim() || 'رویداد تازه', when: 'زمان در انتظار تکمیل', place: location.trim() || 'مکان مشخص نشده', attending: 1 } : undefined,
    }
    onPublish(nextPost)
  }

  const canPublish = Boolean(text.trim() || photo || (kind === 'event' && title.trim()))

  return (
    <main className="screen create-screen">
      <ScreenHeader title="ساختن" subtitle="یک لحظه، فکر یا اتفاق را ثبت کن" action={<button type="button" className="close-create" onClick={onCancel}>انصراف</button>} />
      <section className="creation-types" aria-label="نوع محتوا">
        {draftKinds.map((item) => <button type="button" className={kind === item.id ? 'active' : ''} key={item.id} onClick={() => chooseKind(item.id)}><Icon name={item.icon} /><span><b>{item.label}</b><small>{item.detail}</small></span></button>)}
      </section>

      <section className="composer">
        <div className="composer-identity"><Avatar profile={profileById('ella')} /><span><VerifiedName profile={profileById('ella')} compact /><small>{audience}</small></span></div>
        {kind === 'event' && <label className="field-label"><span>نام رویداد</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="مثلاً پیک‌نیک جمعه" /></label>}
        <label className="composer-text"><span>{kind === 'journal' ? 'یادداشت خصوصی امروز' : kind === 'status' ? 'الان چه خبر؟' : 'چه چیزی می‌خواهی بگویی؟'}</span><textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={600} placeholder={kind === 'journal' ? 'این نوشته فقط روی همین دستگاه می‌ماند...' : 'واقعی، کوتاه و خودت باش.'} /></label>

        {photo && <div className="photo-preview"><ImageMedia src={photo} alt="پیش‌نمایش عکس انتخاب‌شده" /><button type="button" onClick={() => setPhoto('')} aria-label="حذف عکس"><Icon name="close" /></button></div>}
        {fileError && <p className="field-error" role="alert">{fileError}</p>}

        <div className="composer-tools">
          {kind !== 'journal' && <label className="file-tool"><Icon name="image" /><span>{photo ? 'تغییر عکس' : 'افزودن عکس'}</span><input type="file" accept="image/*" onChange={(event) => choosePhoto(event.target.files?.[0])} /></label>}
          {kind !== 'journal' && <label className="location-field"><span>⌖</span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="افزودن مکان" /></label>}
        </div>

        <div className="audience-picker">
          <span><Icon name={audience === 'فقط من' ? 'lock' : 'globe'} /> چه کسی ببیند؟</span>
          <div>{(['همه', 'دنبال‌کننده‌ها', 'دوستان نزدیک', 'فقط من'] as Audience[]).map((item) => <button type="button" key={item} disabled={kind === 'journal' && item !== 'فقط من'} className={audience === item ? 'active' : ''} onClick={() => setAudience(item)}>{item}</button>)}</div>
          {kind === 'journal' && <small>ژورنال به‌طور پیش‌فرض خصوصی است و وارد فید نمی‌شود.</small>}
        </div>

        <div className="publish-row"><span>{text.length.toLocaleString('fa-IR')} / ۶۰۰</span><button type="button" onClick={submit} disabled={!canPublish}>{kind === 'journal' ? 'ذخیره در ژورنال' : 'انتشار'}</button></div>
      </section>
    </main>
  )
}

function ChatView({ profileId, messages, onBack, onSend, onProfile }: { profileId: string; messages: LocalMessage[]; onBack: () => void; onSend: (text: string) => void; onProfile: () => void }) {
  const profile = profileById(profileId)
  const [text, setText] = useState('')
  const seed: LocalMessage[] = [
    { id: 'seed-1', mine: false, text: profileId === 'nika' ? 'سلام! برای برنامهٔ جمعه هنوز هستی؟' : 'سلام، خوبی؟', time: '۲۰:۳۸' },
    { id: 'seed-2', mine: true, text: 'آره، حتماً. ساعت رو قطعی کنیم.', time: '۲۰:۴۱' },
  ]
  const visible = messages.length ? messages : seed

  function send() {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return (
    <main className="screen chat-screen">
      <header className="chat-header">
        <button type="button" className="icon-button" onClick={onBack} aria-label="بازگشت"><Icon name="back" /></button>
        <button type="button" className="chat-person" onClick={onProfile}><Avatar profile={profile} /><span><VerifiedName profile={profile} compact /><small>آنلاین</small></span></button>
        <button type="button" className="icon-button" aria-label="گزینه‌های گفتگو"><Icon name="more" /></button>
      </header>
      <div className="chat-safety"><Icon name="lock" size={15} /> حریم این گفتگو برای هر دو نفر مهم است</div>
      <section className="message-thread" aria-label={`گفتگو با ${profile.name}`}>
        <span className="day-divider">امروز</span>
        {visible.map((message) => <div className={`message-bubble ${message.mine ? 'mine' : ''}`} key={message.id}><p>{message.text}</p><small>{message.time}</small></div>)}
      </section>
      <form className="message-composer" onSubmit={(event) => { event.preventDefault(); send() }}>
        <button type="button" aria-label="افزودن"><Icon name="plus" /></button>
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="پیام..." aria-label="متن پیام" />
        <button className="send-button" type="submit" disabled={!text.trim()} aria-label="ارسال"><Icon name="send" /></button>
      </form>
    </main>
  )
}

function PeopleScreen({
  mode,
  setMode,
  onChat,
  onProfile,
  requests,
  onRequest,
}: {
  mode: PeopleMode
  setMode: (mode: PeopleMode) => void
  onChat: (id: string) => void
  onProfile: (id: string) => void
  requests: Record<string, 'pending' | 'accepted' | 'rejected'>
  onRequest: (id: string, action: 'accepted' | 'rejected') => void
}) {
  return (
    <main className="screen people-screen">
      <ScreenHeader title="آدم‌ها" subtitle="گفتگوها و ارتباط‌های واقعی تو" action={<button type="button" className="icon-button" aria-label="پیام تازه"><Icon name="edit" /></button>} />
      <div className="people-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'messages'} className={mode === 'messages' ? 'active' : ''} onClick={() => setMode('messages')}>پیام‌ها <span>۲</span></button>
        <button type="button" role="tab" aria-selected={mode === 'requests'} className={mode === 'requests' ? 'active' : ''} onClick={() => setMode('requests')}>درخواست‌ها</button>
        <button type="button" role="tab" aria-selected={mode === 'relationships'} className={mode === 'relationships' ? 'active' : ''} onClick={() => setMode('relationships')}>رابطه‌ها</button>
      </div>

      {mode === 'messages' && <section className="conversation-list">
        <div className="note-row"><Icon name="lock" /><span><b>درخواست پیام جداست</b><small>افراد ناشناس مستقیم وارد گفتگوها نمی‌شوند.</small></span><Icon name="chevron-left" /></div>
        {conversations.map((conversation) => {
          const profile = profileById(conversation.profileId)
          return <button type="button" key={conversation.id} onClick={() => onChat(profile.id)}><span className="online-wrap"><Avatar profile={profile} size="large" />{conversation.online && <i />}</span><span className="conversation-copy"><VerifiedName profile={profile} compact /><small>{conversation.lastMessage}</small></span><span className="conversation-time"><small>{conversation.time}</small>{conversation.unread && <b>{conversation.unread.toLocaleString('fa-IR')}</b>}</span></button>
        })}
      </section>}

      {mode === 'requests' && <section className="request-list">
        <p className="section-kicker">درخواست‌های تازه</p>
        {['kiarash', 'raya'].map((id) => {
          const profile = profileById(id)
          const state = requests[id] ?? 'pending'
          return <article key={id}><button className="request-identity" type="button" onClick={() => onProfile(id)}><Avatar profile={profile} size="large" /><span><VerifiedName profile={profile} compact /><small>{profile.mutual}</small></span></button>{state === 'pending' ? <div><button type="button" onClick={() => onRequest(id, 'accepted')}>قبول</button><button type="button" className="secondary" onClick={() => onRequest(id, 'rejected')}>رد</button></div> : <span className={`request-result ${state}`}>{state === 'accepted' ? 'قبول شد ✓' : 'رد شد'}</span>}</article>
        })}
        <div className="safety-card"><Icon name="verified" /><span><b>کنترل دست توست</b><small>Block و Report همیشه رایگان و در دسترس می‌مانند.</small></span></div>
      </section>}

      {mode === 'relationships' && <section className="relationships-page">
        <article className="relationship-card">
          <small>رابطهٔ تأییدشده</small>
          <div className="partner-row"><Avatar profile={profileById('armin')} size="hero" /><span className="heart-link">♡</span><Avatar profile={profileById('ella')} size="hero" /></div>
          <h2>الا و آرمین</h2><p>Together since 2024</p>
          <span className="mutual-confirm"><Icon name="verified" /> تأییدشده توسط هر دو نفر</span>
          <button type="button" onClick={() => onProfile('armin')}>دیدن صفحهٔ رابطه</button>
        </article>
        <div className="relationship-info"><h3>رابطه در MOON چطور کار می‌کند؟</h3><p>هیچ رابطه‌ای بدون تأیید هر دو نفر عمومی نمی‌شود. پایان دادن به رابطه نیز برای هیچ‌کس نیاز به اجازهٔ طرف مقابل ندارد.</p></div>
      </section>}
    </main>
  )
}

function MeScreen({ onLife, onSettings, savedCount, mood, openTasks }: { onLife: () => void; onSettings: () => void; savedCount: number; mood: string; openTasks: number }) {
  const me = profileById('ella')
  const photos = starterPosts.filter((post) => post.image).slice(0, 3)
  return (
    <main className="screen me-screen">
      <header className="me-actions"><span className="mini-wordmark">MOON</span><div><button className="icon-button" type="button" aria-label="اشتراک پروفایل"><Icon name="share" /></button><button className="icon-button" type="button" onClick={onSettings} aria-label="تنظیمات"><Icon name="settings" /></button></div></header>
      <section className="profile-hero">
        <div className="profile-photo-wrap"><Avatar profile={me} size="hero" story /><span className="status-bubble">{me.status}</span></div>
        <VerifiedName profile={me} />
        <p className="username" dir="ltr">@{me.username}</p>
        <p className="profile-role">{me.role} · {me.city}</p>
        <p className="profile-bio">{me.bio}</p>
        <p className="partner-line">♡ <b>@arminazar</b> · از ۲۰۲۴</p>
        <div className="profile-numbers"><button type="button"><b>{me.score.toLocaleString('fa-IR')} <small>/10</small></b><span>Community Score</span></button><button type="button"><b>{me.followers}</b><span>دنبال‌کننده</span></button><button type="button"><b>۳۱۲</b><span>دنبال‌شده</span></button></div>
        <div className="profile-buttons"><button type="button"><Icon name="edit" size={18} /> ویرایش پروفایل</button><button type="button" className="secondary"><Icon name="share" size={18} /> اشتراک</button></div>
      </section>

      <section className="life-launchers">
        <div className="section-title"><div><h2>زندگی من</h2><p>خصوصی، مگر خودت منتشر کنی</p></div><button type="button" onClick={onLife}>دیدن همه <Icon name="chevron-left" size={17} /></button></div>
        <div className="tool-grid">
          <button type="button" onClick={onLife}><span className="tool-icon mood">{mood || '○'}</span><b>حال امروز</b><small>{mood ? 'ثبت شده' : 'هنوز ثبت نشده'}</small></button>
          <button type="button" onClick={onLife}><span className="tool-icon"><Icon name="list" /></span><b>کارها</b><small>{openTasks ? `${formatNumber(openTasks)} کار باز` : 'همه انجام شد'}</small></button>
          <button type="button" onClick={onLife}><span className="tool-icon"><Icon name="journal" /></span><b>ژورنال</b><small>خصوصی روی دستگاه</small></button>
          <button type="button"><span className="tool-icon"><Icon name="bookmark" /></span><b>ذخیره‌ها</b><small>{formatNumber(savedCount)} مورد</small></button>
        </div>
      </section>

      <section className="full-moon-banner"><span className="full-moon-art">●</span><span><small>FULL MOON</small><b>ابزارهای بیشتر برای زندگی و ساختن</b><p>تم اختصاصی، آمار، Top 100 و ژورنال پیشرفته</p></span><button type="button">دیدن پلن</button></section>

      <section className="my-posts">
        <div className="profile-content-tabs"><button type="button" className="active"><Icon name="grid" /> پست‌ها</button><button type="button"><Icon name="bookmark" /> ذخیره‌ها</button><button type="button"><Icon name="sparkle" /> Life</button></div>
        <div className="photo-grid">
          {photos.map((post) => post.image && <ImageMedia key={post.id} src={post.image} alt="یکی از پست‌های نمایشی پروفایل" />)}
          <div className="grid-placeholder"><Icon name="plus" /><span>پست تازه</span></div>
        </div>
      </section>
    </main>
  )
}

function LifeSheet({ mood, setMood, tasks, setTasks, journal, setJournal, onClose }: { mood: string; setMood: (mood: string) => void; tasks: Task[]; setTasks: (tasks: Task[]) => void; journal: string[]; setJournal: (entries: string[]) => void; onClose: () => void }) {
  const [newTask, setNewTask] = useState('')
  const [note, setNote] = useState('')
  const moods = ['خیلی خوب', 'خوب', 'معمولی', 'سنگین', 'خسته']
  const moodMarks = ['◕', '◔', '◑', '◒', '○']

  function addTask() {
    if (!newTask.trim()) return
    setTasks([...tasks, { id: `task-${Date.now()}`, text: newTask.trim(), done: false }])
    setNewTask('')
  }

  function saveNote() {
    if (!note.trim()) return
    setJournal([note.trim(), ...journal])
    setNote('')
  }

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="bottom-sheet life-sheet" role="dialog" aria-modal="true" aria-labelledby="life-title">
        <div className="sheet-handle" />
        <header><div><small>PRIVATE BY DEFAULT</small><h2 id="life-title">زندگی من</h2><p>حال، کارها و نوشته‌هایی که فقط برای خودت هستند.</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="بستن"><Icon name="close" /></button></header>

        <div className="life-block mood-block"><div className="block-title"><span><Icon name="smile" /><b>امروز چه حالی داری؟</b></span>{mood && <small>ثبت شد</small>}</div><div className="mood-picker">{moods.map((item, index) => <button type="button" className={mood === item ? 'active' : ''} key={item} onClick={() => { setMood(item); hapticSuccess() }}><b>{moodMarks[index]}</b><small>{item}</small></button>)}</div></div>

        <div className="life-block tasks-block"><div className="block-title"><span><Icon name="list" /><b>کارهای امروز</b></span><small>{tasks.filter((task) => task.done).length.toLocaleString('fa-IR')} از {tasks.length.toLocaleString('fa-IR')}</small></div><div className="task-list">{tasks.map((task) => <div key={task.id} className={task.done ? 'done' : ''}><button type="button" onClick={() => setTasks(tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))} aria-label={task.done ? 'برگرداندن کار' : 'انجام شد'}>{task.done && <Icon name="check" size={16} />}</button><span>{task.text}</span><button type="button" className="delete-task" onClick={() => setTasks(tasks.filter((item) => item.id !== task.id))} aria-label="حذف کار"><Icon name="close" size={16} /></button></div>)}</div><form className="inline-add" onSubmit={(event) => { event.preventDefault(); addTask() }}><input value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="یک کار تازه..." aria-label="کار تازه" /><button type="submit" disabled={!newTask.trim()}><Icon name="plus" /> افزودن</button></form></div>

        <div className="life-block journal-block"><div className="block-title"><span><Icon name="journal" /><b>ژورنال امروز</b></span><Icon name="lock" size={16} /></div><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="چیزی که نمی‌خواهی فراموش کنی..." /><button type="button" disabled={!note.trim()} onClick={saveNote}>ذخیرهٔ خصوصی</button>{journal.length > 0 && <div className="journal-recent"><small>نوشته‌های اخیر</small>{journal.slice(0, 2).map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>)}</div>}</div>
        <p className="local-note"><Icon name="lock" size={15} /> این نسخه سرور ندارد؛ اطلاعات خصوصی فقط در همین مرورگر ذخیره می‌شوند.</p>
      </section>
    </div>
  )
}

function ProfileSheet({ profileId, following, rating, onFollow, onRate, onMessage, onClose }: { profileId: string; following: boolean; rating?: number; onFollow: () => void; onRate: (rating: number) => void; onMessage: () => void; onClose: () => void }) {
  const profile = profileById(profileId)
  const profilePosts = starterPosts.filter((post) => post.authorId === profileId && post.image)
  return (
    <div className="sheet-backdrop profile-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="profile-sheet" role="dialog" aria-modal="true" aria-labelledby="public-profile-name">
        <div className="public-cover">{profile.cover && <ImageMedia src={profile.cover} alt={`تصویر پس‌زمینه ${profile.name}`} />}<button type="button" className="floating-close" onClick={onClose} aria-label="بستن"><Icon name="close" /></button><span className="cover-status">{profile.status}</span></div>
        <div className="public-profile-body">
          <Avatar profile={profile} size="hero" story />
          <h2 id="public-profile-name"><VerifiedName profile={profile} /></h2>
          <p className="username" dir="ltr">@{profile.username}</p>
          <p className="profile-role">{profile.role} · {profile.city}</p>
          <p className="profile-bio">{profile.bio}</p>
          <div className="mini-tags center">{profile.interests.map((item) => <span key={item}>{item}</span>)}</div>
          {profile.id === 'armin' && <p className="partner-line">♡ <b>@elladiba</b> · از ۲۰۲۴</p>}
          <div className="public-metrics"><span><b>{profile.score.toLocaleString('fa-IR')}<small>/10</small></b><em>از {formatNumber(profile.ratings)} رأی</em></span><span><b>{profile.followers}</b><em>دنبال‌کننده</em></span><span><b>{profile.mutual ?? 'تازه'}</b><em>ارتباط با تو</em></span></div>
          <div className="public-actions"><button type="button" className={following ? 'following' : ''} onClick={onFollow}>{following ? 'دنبال می‌کنی ✓' : 'دنبال کن'}</button><button type="button" className="secondary" onClick={onMessage}><Icon name="message" size={18} /> پیام</button><button type="button" className="icon-only" aria-label="گزینه‌ها"><Icon name="more" /></button></div>

          <section className="rating-box"><div><small>COMMUNITY RATING</small><h3>امتیاز تو به {profile.name.split(' ')[0]}</h3><p>یک امتیاز فعال داری و هر وقت بخواهی می‌توانی تغییرش بدهی.</p></div><div className="rating-options">{Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <button type="button" className={rating === value ? 'active' : ''} key={value} onClick={() => onRate(value)}>{value.toLocaleString('fa-IR')}</button>)}</div>{rating && <p className="rating-confirm"><Icon name="check" size={16} /> امتیاز {rating.toLocaleString('fa-IR')} ثبت شد.</p>}</section>

          <div className="profile-content-tabs"><button type="button" className="active"><Icon name="grid" /> پست‌ها</button><button type="button"><Icon name="image" /> عکس‌ها</button><button type="button"><Icon name="sparkle" /> Life</button></div>
          {profilePosts.length ? <div className="photo-grid public-grid">{profilePosts.map((post) => post.image && <ImageMedia key={post.id} src={post.image} alt={`پست ${profile.name}`} />)}</div> : <div className="empty-state compact"><Icon name="image" /><h3>هنوز پست عمومی ندارد</h3></div>}
          <div className="profile-safety-links"><button type="button">Block</button><span>·</span><button type="button">Report</button><span>·</span><button type="button">Community Rules</button></div>
        </div>
      </section>
    </div>
  )
}

function CommentsSheet({ post, comments, onAdd, onClose }: { post: Post; comments: Comment[]; onAdd: (comment: string) => void; onClose: () => void }) {
  const [text, setText] = useState('')
  const seed: Comment[] = [
    { id: 'c1', name: 'رایا', text: 'این حس شهر شب دقیقاً همینه.', time: '۱ ساعت' },
    { id: 'c2', name: 'کیارش', text: 'برای برنامهٔ بعدی منم خبر کنین 🙌', time: '۴۳ دقیقه' },
  ]
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="bottom-sheet comments-sheet" role="dialog" aria-modal="true" aria-labelledby="comments-title">
        <div className="sheet-handle" /><header><div><h2 id="comments-title">نظرها</h2><p>{formatNumber(post.comments + comments.length)} گفتگو زیر این پست</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="بستن"><Icon name="close" /></button></header>
        <div className="comments-list">{[...seed, ...comments].map((comment) => <div key={comment.id}><span className="comment-avatar">{comment.name.slice(0, 1)}</span><span><b>{comment.name}</b><p>{comment.text}</p><small>{comment.time} · پاسخ</small></span></div>)}</div>
        <form className="comment-form" onSubmit={(event) => { event.preventDefault(); if (text.trim()) { onAdd(text.trim()); setText('') } }}><Avatar profile={profileById('ella')} /><input value={text} onChange={(event) => setText(event.target.value)} placeholder="نظرت را بنویس..." aria-label="نظر تازه" /><button type="submit" disabled={!text.trim()} aria-label="ارسال نظر"><Icon name="send" /></button></form>
      </section>
    </div>
  )
}

function SettingsSheet({ onClose, onAccount, accountLabel }: { onClose: () => void; onAccount: () => void; accountLabel: string }) {
  const [privateAccount, setPrivateAccount] = useState(false)
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="bottom-sheet settings-sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="sheet-handle" /><header><div><h2 id="settings-title">تنظیمات و امنیت</h2><p>حساب، حریم خصوصی و کنترل داده‌ها</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="بستن"><Icon name="close" /></button></header>
        <div className="settings-group"><button type="button" onClick={onAccount}><span><Icon name="moon" /><b>حساب و آیدی MOON</b></span><small dir="ltr">{accountLabel}</small><Icon name="chevron-left" /></button><button type="button"><span><Icon name="user" /><b>ویرایش پروفایل</b></span><Icon name="chevron-left" /></button><button type="button"><span><Icon name="verified" /><b>تأیید عکس و ۱۸+</b></span><small>در مرحلهٔ فعال‌سازی</small><Icon name="chevron-left" /></button></div>
        <div className="settings-group"><label><span><Icon name="lock" /><span><b>حساب خصوصی</b><small>درخواست‌های دنبال‌کردن را خودت تأیید می‌کنی</small></span></span><input type="checkbox" checked={privateAccount} onChange={(event) => setPrivateAccount(event.target.checked)} /></label><button type="button"><span><Icon name="people" /><b>کاربران Block شده</b></span><Icon name="chevron-left" /></button><button type="button"><span><Icon name="globe" /><b>زبان</b></span><small>فارسی</small><Icon name="chevron-left" /></button></div>
        <div className="settings-group danger"><button type="button"><span><Icon name="journal" /><b>دریافت داده‌ها</b></span><Icon name="chevron-left" /></button><button type="button" onClick={onAccount}><span><Icon name="close" /><b>حذف حساب</b></span><small>تأیید دوباره لازم است</small><Icon name="chevron-left" /></button></div>
        <div className="legal-links"><button type="button">قوانین جامعه</button><button type="button">حریم خصوصی</button><button type="button">راهنمای امنیت</button><small>MOON IRL · Demo 0.2</small></div>
      </section>
    </div>
  )
}

const navigation: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'home', label: 'خانه', icon: 'home' },
  { id: 'discover', label: 'کشف', icon: 'discover' },
  { id: 'create', label: 'ساختن', icon: 'plus' },
  { id: 'people', label: 'آدم‌ها', icon: 'people' },
  { id: 'me', label: 'من', icon: 'user' },
]

export function App() {
  const telegramUser = useMemo(() => currentTelegramUser(), [])
  const [session, setSession] = useState<Session | null | undefined>(backendConfigured ? undefined : null)
  const [demoMode, setDemoMode] = useState(() => !backendConfigured && window.sessionStorage.getItem('moon-demo-access') === 'true')
  const [account, setAccount] = useState<MoonAccount | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [previousTab, setPreviousTab] = useState<Tab>('home')
  const [posts, setPosts] = useState<Post[]>(() => readStored(storageKeys.posts, starterPosts))
  const [liked, setLiked] = useState<Record<string, boolean>>(() => readStored(storageKeys.liked, {}))
  const [saved, setSaved] = useState<Record<string, boolean>>(() => readStored(storageKeys.saved, {}))
  const [follows, setFollows] = useState<Record<string, boolean>>(() => readStored(storageKeys.follows, { nika: true, armin: true, saba: true }))
  const [ratings, setRatings] = useState<Record<string, number>>(() => readStored(storageKeys.ratings, {}))
  const [tasks, setTasks] = useState<Task[]>(() => readStored(storageKeys.tasks, [
    { id: 'task-1', text: 'جواب دادن به نیکا', done: true },
    { id: 'task-2', text: 'انتخاب سه عکس سفر', done: false },
    { id: 'task-3', text: 'رزرو کلاس شنبه', done: false },
  ]))
  const [mood, setMood] = useState(() => readStored(storageKeys.mood, ''))
  const [journal, setJournal] = useState<string[]>(() => readStored(storageKeys.journal, []))
  const [messages, setMessages] = useState<Record<string, LocalMessage[]>>(() => readStored(storageKeys.messages, {}))
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [activeComments, setActiveComments] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [lifeOpen, setLifeOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [peopleMode, setPeopleMode] = useState<PeopleMode>('messages')
  const [going, setGoing] = useState<Record<string, boolean>>({})
  const [requests, setRequests] = useState<Record<string, 'pending' | 'accepted' | 'rejected'>>({})
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    getCurrentSession()
      .then((currentSession) => { if (active) setSession(currentSession) })
      .catch(() => { if (active) setSession(null) })
    const stopWatching = watchSession((nextSession) => {
      if (active) setSession(nextSession)
    })
    return () => {
      active = false
      stopWatching()
    }
  }, [])
  useEffect(() => {
    if (!session) return
    let active = true
    loadMoonAccount(session)
      .then((nextAccount) => { if (active) setAccount(nextAccount) })
      .catch(() => undefined)
    return () => { active = false }
  }, [session])
  useEffect(() => writeStored(storageKeys.posts, posts), [posts])
  useEffect(() => writeStored(storageKeys.liked, liked), [liked])
  useEffect(() => writeStored(storageKeys.saved, saved), [saved])
  useEffect(() => writeStored(storageKeys.follows, follows), [follows])
  useEffect(() => writeStored(storageKeys.ratings, ratings), [ratings])
  useEffect(() => writeStored(storageKeys.tasks, tasks), [tasks])
  useEffect(() => writeStored(storageKeys.mood, mood), [mood])
  useEffect(() => writeStored(storageKeys.journal, journal), [journal])
  useEffect(() => writeStored(storageKeys.messages, messages), [messages])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    function closeOverlay(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setSelectedProfile(null)
      setActiveComments(null)
      setLifeOpen(false)
      setSettingsOpen(false)
      setAccountOpen(false)
    }
    window.addEventListener('keydown', closeOverlay)
    return () => window.removeEventListener('keydown', closeOverlay)
  }, [])

  function navigate(tab: Tab) {
    if (tab === 'create') setPreviousTab(activeTab === 'create' ? 'home' : activeTab)
    setActiveTab(tab)
    if (tab !== 'people') setSelectedChat(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleState(setter: Dispatch<SetStateAction<Record<string, boolean>>>, id: string) {
    setter((state) => ({ ...state, [id]: !state[id] }))
    hapticSuccess()
  }

  function toggleFollow(id: string) {
    setFollows((state) => {
      const next = !state[id]
      setToast(next ? `${profileById(id).name} را دنبال کردی` : 'از دنبال‌شده‌ها حذف شد')
      return { ...state, [id]: next }
    })
  }

  async function sharePost(post: Post) {
    const shareData = { title: 'MOON IRL', text: post.text, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(shareData)
      else {
        await navigator.clipboard.writeText(`${post.text}\n${window.location.href}`)
        setToast('لینک پست کپی شد')
      }
    } catch {
      // The share dialog can be canceled by the user.
    }
  }

  function publish(post: Post) {
    setPosts((items) => [post, ...items])
    setActiveTab('home')
    setToast('پستت بالای فید منتشر شد')
    hapticSuccess()
  }

  function saveJournal(text: string) {
    if (!text) return
    setJournal((items) => [text, ...items])
    setActiveTab('me')
    setLifeOpen(true)
    setToast('یادداشت خصوصی ذخیره شد')
  }

  function openChat(profileId: string) {
    setSelectedProfile(null)
    setSelectedChat(profileId)
    setPeopleMode('messages')
    setActiveTab('people')
  }

  function sendMessage(profileId: string, text: string) {
    const message: LocalMessage = { id: `message-${Date.now()}`, mine: true, text, time: 'الان' }
    setMessages((state) => ({ ...state, [profileId]: [...(state[profileId] ?? []), message] }))
    hapticSuccess()
  }

  const activeCommentPost = activeComments ? posts.find((post) => post.id === activeComments) : undefined
  const displayName = telegramUser?.first_name || profileById('ella').name.split(' ')[0]
  const visibleAccount = account ?? {
    id: session?.user.id ?? 'demo',
    email: session?.user.email ?? null,
    username: null,
    display_name: null,
    avatar_url: null,
    account_status: 'active' as const,
  }

  function enterDemo() {
    window.sessionStorage.setItem('moon-demo-access', 'true')
    setDemoMode(true)
  }

  function leaveMembership() {
    window.sessionStorage.removeItem('moon-demo-access')
    setDemoMode(false)
    setSession(null)
    setAccount(null)
    setAccountOpen(false)
    setSettingsOpen(false)
  }

  function finishAccountDeletion() {
    Object.values(storageKeys).forEach((key) => window.localStorage.removeItem(key))
    leaveMembership()
  }

  if (session === undefined) {
    return <main className="auth-loading" dir="rtl"><span className="loading-moon">◐</span><p>در حال بررسی عضویت...</p></main>
  }

  if (!session && !demoMode) {
    return <AuthScreen onDemo={enterDemo} onAuthenticated={() => getCurrentSession().then(setSession).catch(() => setSession(null))} />
  }

  return (
    <div className="app-frame" dir="rtl">
      <div className="desktop-brand" aria-hidden="true"><span>MO◐N</span><p>آدم‌ها، ارتباط‌ها و زندگی واقعی.</p></div>
      <div className="app-shell">
        <div className={`demo-ribbon ${session ? 'online-account' : ''}`}><span className="status-dot" /> {session ? session.user.is_anonymous ? 'حساب رایگان · دیتابیس امن' : 'عضویت آنلاین · دیتابیس امن' : 'نسخهٔ نمایشی · تغییرات روی همین دستگاه'}</div>

        {activeTab === 'home' && <HomeScreen posts={posts} liked={liked} saved={saved} follows={follows} going={going} onToggleLike={(id) => toggleState(setLiked, id)} onToggleSave={(id) => { toggleState(setSaved, id); setToast(saved[id] ? 'از ذخیره‌ها حذف شد' : 'ذخیره شد') }} onToggleFollow={toggleFollow} onComments={setActiveComments} onProfile={setSelectedProfile} onShare={sharePost} onGoing={(id) => { toggleState(setGoing, id); setToast(going[id] ? 'از فهرست مهمان‌ها خارج شدی' : 'به رویداد اضافه شدی') }} onLife={() => setLifeOpen(true)} onDiscover={() => navigate('discover')} mood={mood} openTasks={tasks.filter((task) => !task.done).length} />}
        {activeTab === 'discover' && <DiscoverScreen follows={follows} onFollow={toggleFollow} onProfile={setSelectedProfile} />}
        {activeTab === 'create' && <CreateScreen onPublish={publish} onJournal={saveJournal} onCancel={() => setActiveTab(previousTab)} />}
        {activeTab === 'people' && (selectedChat ? <ChatView profileId={selectedChat} messages={messages[selectedChat] ?? []} onBack={() => setSelectedChat(null)} onSend={(text) => sendMessage(selectedChat, text)} onProfile={() => setSelectedProfile(selectedChat)} /> : <PeopleScreen mode={peopleMode} setMode={setPeopleMode} onChat={openChat} onProfile={setSelectedProfile} requests={requests} onRequest={(id, action) => { setRequests((state) => ({ ...state, [id]: action })); setToast(action === 'accepted' ? 'درخواست پذیرفته شد' : 'درخواست رد شد') }} />)}
        {activeTab === 'me' && <MeScreen onLife={() => setLifeOpen(true)} onSettings={() => setSettingsOpen(true)} savedCount={Object.values(saved).filter(Boolean).length} mood={mood} openTasks={tasks.filter((task) => !task.done).length} />}

        {!selectedChat && <nav className="bottom-nav" aria-label="منوی اصلی">
          {navigation.map((item) => <button type="button" key={item.id} className={`${activeTab === item.id ? 'active' : ''} ${item.id === 'create' ? 'create-nav' : ''}`} onClick={() => navigate(item.id)} aria-current={activeTab === item.id ? 'page' : undefined} aria-label={item.id === 'me' ? `${item.label}، ${displayName}` : item.label}><span className="nav-icon"><Icon name={item.icon} filled={activeTab === item.id && item.id !== 'create'} /></span><small>{item.label}</small>{item.id === 'people' && <i>۲</i>}</button>)}
        </nav>}
      </div>

      {lifeOpen && <LifeSheet mood={mood} setMood={setMood} tasks={tasks} setTasks={setTasks} journal={journal} setJournal={setJournal} onClose={() => setLifeOpen(false)} />}
      {selectedProfile && <ProfileSheet profileId={selectedProfile} following={Boolean(follows[selectedProfile])} rating={ratings[selectedProfile]} onFollow={() => toggleFollow(selectedProfile)} onRate={(value) => { setRatings((state) => ({ ...state, [selectedProfile]: value })); setToast('امتیازت ثبت شد'); hapticSuccess() }} onMessage={() => openChat(selectedProfile)} onClose={() => setSelectedProfile(null)} />}
      {activeCommentPost && <CommentsSheet post={activeCommentPost} comments={comments[activeCommentPost.id] ?? []} onAdd={(text) => { setComments((state) => ({ ...state, [activeCommentPost.id]: [...(state[activeCommentPost.id] ?? []), { id: `comment-${Date.now()}`, name: displayName, text, time: 'همین حالا' }] })); hapticSuccess() }} onClose={() => setActiveComments(null)} />}
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} onAccount={() => { setSettingsOpen(false); setAccountOpen(true) }} accountLabel={visibleAccount.username ? `@${visibleAccount.username}` : visibleAccount.email ?? 'تنظیم عضویت'} />}
      {accountOpen && <AccountSheet account={visibleAccount} demoMode={demoMode} onClose={() => setAccountOpen(false)} onUsernameChanged={(username) => { setAccount((current) => ({ ...(current ?? visibleAccount), username })); setToast(`@${username} برای تو انتخاب شد`) }} onSignedOut={leaveMembership} onDeleted={finishAccountDeletion} />}
      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite"><Icon name="check" size={17} /> {toast}</div>
    </div>
  )
}
