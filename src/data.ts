export type Profile = {
  id: string
  name: string
  username: string
  avatar: string
  cover?: string
  city: string
  role: string
  bio: string
  status: string
  interests: string[]
  intent: 'دوستی' | 'رابطه' | 'سازنده‌ها'
  verified?: boolean
  fullMoon?: boolean
  score: number
  ratings: number
  followers: string
  mutual?: string
}

export type Post = {
  id: string
  authorId: string
  kind: 'photo' | 'text' | 'event' | 'relationship' | 'life'
  time: string
  text: string
  image?: string
  location?: string
  likes: number
  comments: number
  event?: {
    title: string
    when: string
    place: string
    attending: number
  }
}

export type Conversation = {
  id: string
  profileId: string
  lastMessage: string
  time: string
  unread?: number
  online?: boolean
}

const palettes = [
  ['#262033', '#7662a8', '#e2b79f', '#2d2025', '#8879c1', '#cabfff'],
  ['#152a30', '#467b80', '#d7a888', '#171a1f', '#a7584f', '#a7d9d0'],
  ['#31211f', '#9b5f4a', '#edc3a7', '#3b2927', '#d29d69', '#f1c39a'],
  ['#1e2236', '#53608f', '#b98268', '#15151c', '#495a79', '#a9b7ff'],
  ['#2b2430', '#8d657a', '#f0c8b6', '#5b352f', '#72608d', '#e5b6cf'],
  ['#1e2920', '#5b7d61', '#c58f72', '#201b1a', '#d2a45e', '#bad8a8'],
] as const

function hashText(value: string) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0)
}

function svgData(markup: string) {
  return `data:image/svg+xml,${encodeURIComponent(markup)}`
}

function portrait(id: string) {
  const [dark, mid, skin, hair, shirt, accent] = palettes[hashText(id) % palettes.length]
  const hairShape = hashText(id) % 2 === 0
    ? `<path d="M183 322c0-122 62-192 139-192 91 0 151 68 151 192l-36 76H216Z" fill="${hair}"/><path d="M203 281c31-105 153-139 237-30-73-22-144-4-213 49Z" fill="${accent}" opacity=".16"/>`
    : `<path d="M175 334c10-142 65-207 148-207 105 0 161 84 151 231l-64 72-184-31Z" fill="${hair}"/><circle cx="200" cy="280" r="52" fill="${hair}"/><circle cx="449" cy="293" r="46" fill="${hair}"/>`
  return svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 800">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${dark}"/><stop offset="1" stop-color="${mid}"/></linearGradient><radialGradient id="light"><stop stop-color="${accent}" stop-opacity=".34"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs>
    <rect width="640" height="800" fill="url(#bg)"/><circle cx="500" cy="110" r="250" fill="url(#light)"/><path d="M0 642C117 588 162 620 275 590s239-52 365 20v190H0Z" fill="${dark}" opacity=".68"/><circle cx="91" cy="110" r="4" fill="${accent}" opacity=".5"/><circle cx="538" cy="252" r="6" fill="${accent}" opacity=".38"/>
    ${hairShape}<ellipse cx="323" cy="321" rx="112" ry="137" fill="${skin}"/><path d="M260 331c18 11 38 11 56 0M351 331c18 11 38 11 56 0" stroke="${hair}" stroke-width="7" stroke-linecap="round" fill="none" opacity=".78"/><circle cx="287" cy="334" r="7" fill="${hair}"/><circle cx="381" cy="334" r="7" fill="${hair}"/><path d="M318 358c-4 20-4 35 8 40" stroke="#9a6459" stroke-width="5" stroke-linecap="round" fill="none" opacity=".55"/><path d="M294 427c20 18 54 19 78 0" stroke="#9a4f58" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M276 440h96v97h-96z" fill="${skin}"/><path d="M107 800c19-169 88-277 216-277s210 104 226 277Z" fill="${shirt}"/><path d="M207 541c27 49 70 75 116 75s88-26 119-75" stroke="${accent}" stroke-opacity=".34" stroke-width="7" fill="none"/><path d="M97 800c29-85 47-128 77-165M549 800c-23-85-43-135-74-173" stroke="${accent}" stroke-opacity=".13" stroke-width="24"/>
  </svg>`)
}

function scene(id: string) {
  const [dark, mid, skin, hair, shirt, accent] = palettes[hashText(id) % palettes.length]
  const variant = hashText(id) % 4
  const common = `<defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${dark}"/><stop offset="1" stop-color="${mid}"/></linearGradient><linearGradient id="glow"><stop stop-color="${accent}" stop-opacity=".62"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></linearGradient></defs><rect width="1200" height="900" fill="url(#sky)"/><circle cx="930" cy="135" r="250" fill="url(#glow)" opacity=".54"/>`
  const scenes = [
    `${common}<rect x="72" y="90" width="1056" height="570" rx="28" fill="#111218" opacity=".5"/><path d="M110 470h980M310 120v350M665 120v350M932 120v350" stroke="${accent}" stroke-opacity=".18" stroke-width="8"/><path d="M110 452 310 302l120 94 235-215 160 141 107-98 158 128v118Z" fill="${mid}" opacity=".58"/><circle cx="252" cy="662" r="64" fill="${skin}"/><path d="M178 900c4-116 34-184 75-184s81 67 90 184Z" fill="${shirt}"/><circle cx="820" cy="654" r="66" fill="${skin}"/><path d="M742 900c9-120 38-190 81-190s85 70 91 190Z" fill="${hair}"/><ellipse cx="540" cy="768" rx="245" ry="46" fill="#17151b"/><rect x="525" y="645" width="30" height="139" rx="12" fill="${accent}" opacity=".6"/><circle cx="540" cy="638" r="43" fill="${accent}" opacity=".22"/>`,
    `${common}<rect x="100" y="112" width="1000" height="520" rx="26" fill="#0d0d12"/><rect x="151" y="158" width="898" height="418" rx="12" fill="${accent}" opacity=".18"/><circle cx="738" cy="302" r="116" fill="${accent}" opacity=".19"/><path d="m675 237 155 66-155 75Z" fill="#f2eef8" opacity=".72"/><path d="M0 900V670c165-83 322-70 472 10 190-96 442-102 728 13v207Z" fill="#111116"/><g fill="${hair}"><circle cx="175" cy="696" r="55"/><circle cx="355" cy="664" r="62"/><circle cx="552" cy="705" r="58"/><circle cx="765" cy="666" r="64"/><circle cx="992" cy="701" r="57"/></g><path d="M120 900c4-115 23-162 58-162s60 48 66 162M293 900c4-126 27-180 65-180s66 55 72 180M491 900c5-112 25-158 63-158s61 47 67 158M700 900c7-126 29-179 68-179s68 53 73 179M936 900c6-111 27-158 58-158s57 47 64 158" fill="${shirt}"/>`,
    `${common}<circle cx="926" cy="169" r="94" fill="#f3dfad" opacity=".82"/><path d="M0 490c183-167 326-202 522-71 173-173 378-213 678-7v488H0Z" fill="${mid}" opacity=".72"/><path d="M0 606c180-117 381-104 574 15 181-119 407-117 626-1v280H0Z" fill="${dark}"/><path d="M815 900c9-226 43-352 110-352s114 124 127 352Z" fill="${shirt}"/><circle cx="930" cy="485" r="79" fill="${skin}"/><path d="M854 480c9-83 38-125 78-125 50 0 82 47 80 131-47-39-99-42-158-6Z" fill="${hair}"/><path d="M117 781c184-73 341-83 491-29" stroke="${accent}" stroke-opacity=".42" stroke-width="13" fill="none"/><circle cx="153" cy="763" r="9" fill="${accent}"/><circle cx="589" cy="747" r="9" fill="${accent}"/>`,
    `${common}<rect x="80" y="96" width="1040" height="690" rx="32" fill="#101014" opacity=".56"/><rect x="128" y="144" width="480" height="335" rx="18" fill="${accent}" opacity=".15"/><path d="M164 402c103-128 215-128 410 0" stroke="${accent}" stroke-opacity=".55" stroke-width="15" fill="none"/><rect x="660" y="145" width="410" height="24" rx="12" fill="${accent}" opacity=".25"/><rect x="660" y="198" width="292" height="20" rx="10" fill="${accent}" opacity=".13"/><circle cx="348" cy="612" r="74" fill="${skin}"/><path d="M259 900c8-142 39-221 92-221s95 77 103 221Z" fill="${shirt}"/><circle cx="785" cy="609" r="72" fill="${skin}"/><path d="M696 900c8-145 43-225 91-225s88 78 101 225Z" fill="${hair}"/><ellipse cx="571" cy="815" rx="188" ry="38" fill="${accent}" opacity=".12"/>`,
  ]
  return svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">${scenes[variant]}</svg>`)
}

const image = (id: string, width = 900) => width <= 500 ? portrait(id) : scene(id)

export const profiles: Profile[] = [
  {
    id: 'ella',
    name: 'الا دیبا',
    username: 'elladiba',
    avatar: image('photo-1494790108377-be9c29b29330', 420),
    cover: image('photo-1500530855697-b586d89ba3ee', 1200),
    city: 'تهران',
    role: 'خلبان · سازنده',
    bio: 'زندگی واقعی، آدم‌های واقعی و چیزهایی که ارزش به‌خاطر سپردن دارند.',
    status: 'امروز بین زمین و آسمان ✈️',
    interests: ['سفر', 'عکاسی', 'قهوه'],
    intent: 'سازنده‌ها',
    verified: true,
    fullMoon: true,
    score: 9.4,
    ratings: 4821,
    followers: '۲۸٫۴K',
  },
  {
    id: 'nika',
    name: 'نیکا راد',
    username: 'nikarad',
    avatar: image('photo-1534528741775-53994a69daeb', 420),
    cover: image('photo-1524250502761-1ac6f2e30d43', 1200),
    city: 'تهران',
    role: 'طراح محصول',
    bio: 'طراحی، موسیقی زنده و پیاده‌روی‌های طولانی بدون مقصد.',
    status: 'برای یک قهوه و گپ آزادم ☕️',
    interests: ['طراحی', 'کنسرت', 'کافه'],
    intent: 'دوستی',
    verified: true,
    score: 9.6,
    ratings: 7360,
    followers: '۱۲٫۸K',
    mutual: '۳ علاقهٔ مشترک',
  },
  {
    id: 'armin',
    name: 'آرمین آذر',
    username: 'arminazar',
    avatar: image('photo-1500648767791-00dcc994a43e', 420),
    cover: image('photo-1482192596544-9eb780fc7f66', 1200),
    city: 'تهران',
    role: 'فیلم‌ساز',
    bio: 'فیلم کوتاه می‌سازم و آدم‌های جالب را پیدا می‌کنم.',
    status: 'لوکیشن امشب پیدا شد 🎬',
    interests: ['سینما', 'دویدن', 'شب'],
    intent: 'سازنده‌ها',
    verified: true,
    fullMoon: true,
    score: 9.7,
    ratings: 9133,
    followers: '۳۱٫۲K',
    mutual: 'نیکا دنبال می‌کند',
  },
  {
    id: 'saba',
    name: 'صبا نوری',
    username: 'sabanouri',
    avatar: image('photo-1517841905240-472988babdf9', 420),
    cover: image('photo-1516483638261-f4dbaf036963', 1200),
    city: 'شیراز',
    role: 'معمار · مسافر',
    bio: 'شهرها را با قدم زدن می‌فهمم.',
    status: 'شیراز تا دوشنبه 🌿',
    interests: ['معماری', 'سفر', 'کتاب'],
    intent: 'دوستی',
    verified: true,
    score: 9.3,
    ratings: 3960,
    followers: '۸٫۹K',
    mutual: '۲ دوست مشترک',
  },
  {
    id: 'kiarash',
    name: 'کیارش مهری',
    username: 'kiamehri',
    avatar: image('photo-1506794778202-cad84cf45f1d', 420),
    cover: image('photo-1492684223066-81342ee5ff30', 1200),
    city: 'رشت',
    role: 'موسیقی‌دان',
    bio: 'یک گروه کوچک، چند ساز قدیمی و کلی آهنگ نصفه.',
    status: 'برای اجرا دنبال درامر می‌گردیم',
    interests: ['موسیقی', 'طبیعت', 'گیتار'],
    intent: 'سازنده‌ها',
    score: 8.9,
    ratings: 1280,
    followers: '۴٫۱K',
    mutual: '۴ علاقهٔ مشترک',
  },
  {
    id: 'raya',
    name: 'رایا شمس',
    username: 'rayashams',
    avatar: image('photo-1524504388940-b1c1722653e1', 420),
    cover: image('photo-1500534314209-a25ddb2bd429', 1200),
    city: 'اصفهان',
    role: 'دانشجوی پزشکی',
    bio: 'روزها بیمارستان، شب‌ها عکاسی خیابانی.',
    status: 'شیفت تموم شد؛ بالاخره 🌙',
    interests: ['سلامت', 'عکاسی', 'پیاده‌روی'],
    intent: 'رابطه',
    verified: true,
    score: 9.2,
    ratings: 4412,
    followers: '۹٫۷K',
    mutual: '۵ نفر مشترک',
  },
]

export const starterPosts: Post[] = [
  {
    id: 'post-nika-night',
    authorId: 'nika',
    kind: 'photo',
    time: '۲ ساعت',
    text: 'پایان یک روز طولانی؛ یک میز کوچک، دو دوست قدیمی و شهری که هنوز بیداره.',
    image: image('photo-1529333166437-7750a6dd5a70', 1100),
    location: 'کریم‌خان، تهران',
    likes: 1284,
    comments: 86,
  },
  {
    id: 'post-armin-event',
    authorId: 'armin',
    kind: 'event',
    time: '۴ ساعت',
    text: 'این جمعه چند فیلم کوتاه مستقل می‌بینیم و بعد درباره‌شان حرف می‌زنیم. اگر فیلم می‌سازی یا فقط کنجکاوی، بیا.',
    image: image('photo-1485846234645-a62644f84728', 1100),
    location: 'خانه هنرمندان',
    likes: 438,
    comments: 32,
    event: {
      title: 'شب فیلم کوتاه',
      when: 'جمعه · ساعت ۱۹',
      place: 'خانه هنرمندان، تهران',
      attending: 46,
    },
  },
  {
    id: 'post-saba-life',
    authorId: 'saba',
    kind: 'life',
    time: 'دیروز',
    text: 'یک تغییر واقعی: بعد از سه سال برگشتم شیراز. هنوز کارتن‌ها باز نشده، ولی حسش درست است.',
    image: image('photo-1516483638261-f4dbaf036963', 1100),
    location: 'شیراز',
    likes: 2168,
    comments: 143,
  },
  {
    id: 'post-relationship',
    authorId: 'nika',
    kind: 'relationship',
    time: '۲ روز',
    text: 'نیکا و آرمین رابطه‌شان را دوطرفه تأیید کردند. شروع یک فصل تازه، بدون نمایش اضافه. ♡',
    likes: 3620,
    comments: 211,
  },
]

export const conversations: Conversation[] = [
  { id: 'chat-nika', profileId: 'nika', lastMessage: 'پس جمعه همون ساعت؟', time: '۲۱:۴۰', unread: 2, online: true },
  { id: 'chat-armin', profileId: 'armin', lastMessage: 'لوکیشن رو برات فرستادم 🎬', time: '۱۹:۱۲' },
  { id: 'chat-saba', profileId: 'saba', lastMessage: 'شیراز رسیدم، بعداً زنگ می‌زنم', time: 'دیروز' },
  { id: 'chat-raya', profileId: 'raya', lastMessage: 'مرسی که پرسیدی، بهترم', time: 'شنبه' },
]

export const topPeople = [
  { profileId: 'armin', rank: 1, change: '—' },
  { profileId: 'nika', rank: 2, change: '↑ ۱' },
  { profileId: 'ella', rank: 3, change: '↓ ۱' },
  { profileId: 'saba', rank: 4, change: '↑ ۲' },
  { profileId: 'raya', rank: 5, change: '—' },
  { profileId: 'kiarash', rank: 6, change: '↑ ۳' },
]

export function profileById(id: string) {
  return profiles.find((profile) => profile.id === id) ?? profiles[0]
}
