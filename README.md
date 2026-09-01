# MOON IRL 🌙

MOON IRL یک شبکهٔ اجتماعی موبایل‌محور برای زندگی واقعی، آدم‌ها، ارتباط‌ها، سازنده‌ها و لحظه‌های روزمره است. همین رابط هم به‌صورت وب مستقل و هم داخل Telegram Mini App اجرا می‌شود.

## وضعیت محصول

نسخهٔ فعلی از یک پروتوتایپ صرف عبور کرده و زیرساخت واقعی عضویت و داده را دارد:

- ورود بدون رمز با ایمیل و لینک یک‌بارمصرف
- پروفایل واقعی متصل به Supabase و Row Level Security
- اولین آیدی معمولی ۵ تا ۲۰ کاراکتری رایگان
- قیمت ثابت ۱۵۰ Telegram Stars برای آیدی ۳–۴ حرفی یا تغییر آیدی
- حذف کامل و برگشت‌ناپذیر حساب از Auth و تمام جدول‌های وابسته
- مدل داده برای پروفایل، پست، دنبال‌کردن، امتیاز، رابطه، گفتگو، پیام، بلاک، گزارش، To-do و Journal
- فید، Discover، Top 10، Community Rating، پست، رویداد، Life Update، پیام‌ها و ابزارهای شخصی
- Telegram WebApp bridge برای `ready`، `expand`، پوسته، haptic و بازکردن invoice

ورود Apple و پرداخت آیدی ویژه به‌صورت feature flag کنترل می‌شوند. تا وقتی کلیدهای مالک و Bot Token فقط در secret manager سرور ثبت نشده باشند، دکمه‌های مربوطه عمداً غیرفعال می‌مانند و مسیر خراب به کاربر نشان داده نمی‌شود.

## اجرای محلی

نیازمندی‌ها: Node.js 22 و pnpm 10.

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

کنترل کامل lint، TypeScript و build:

```bash
pnpm check
```

## متغیرهای عمومی فرانت‌اند

فقط URL پروژه و کلید publishable عمومی Supabase در build مرورگر قرار می‌گیرند. امنیت داده بر RLS و policyهای دیتابیس متکی است.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
VITE_EMAIL_CODE_ENABLED=false
VITE_APPLE_AUTH_ENABLED=false
VITE_PREMIUM_USERNAME_ENABLED=false
```

هیچ‌کدام از این موارد نباید وارد ریپو یا متغیر `VITE_*` شوند: `SUPABASE_SERVICE_ROLE_KEY`، `TELEGRAM_BOT_TOKEN`، secret وبهوک، Apple private key یا هر secret دیگر.

## دیتابیس و Edge Functions

- migration اصلی: `supabase/migrations/202608310001_initial.sql`
- حذف حساب: `supabase/functions/delete-account`
- ساخت فاکتور Stars: `supabase/functions/create-username-invoice`
- تأیید پرداخت و ثبت آیدی: `supabase/functions/telegram-payment-webhook`

جزئیات استقرار و secretهای لازم در `supabase/README.md` آمده است.

## انتشار

هر push به `main` با GitHub Actions build می‌شود و از طریق GitHub Pages منتشر می‌شود:

<https://cinderella2026.github.io/Moon_irl/>

workflow فقط URL و کلید publishable عمومی Supabase را برای build مرورگر تنظیم می‌کند. هیچ service key، Bot Token یا secret دیگری در سورس ذخیره نمی‌شود.

## اصول امنیتی

- کلید service role فقط داخل Edge Function و secret manager است.
- حذف کاربر فقط سمت سرور و پس از اعتبارسنجی access token انجام می‌شود.
- Bot Token فقط سمت سرور استفاده می‌شود.
- پرداخت موفق با payload یکتا، مبلغ/ارز، وضعیت سفارش، تعارض آیدی و تکراری‌نبودن update کنترل می‌شود.
- `Telegram.WebApp.initDataUnsafe` مبنای احراز هویت نیست.
- همهٔ جدول‌های کاربرمحور RLS دارند؛ Journal و To-do فقط برای مالک قابل‌خواندن هستند.

## ساختار اصلی

- `src/App.tsx`: جریان‌های اصلی محصول و صفحه‌ها
- `src/AuthScreen.tsx`: عضویت بدون رمز
- `src/AccountSheet.tsx`: آیدی یکتا، روش‌های ورود و حذف حساب
- `src/backend.ts`: اتصال محدود فرانت‌اند به Auth، RPC و Edge Functions
- `src/telegram.ts`: اتصال امن و محدود به Telegram Mini App
- `supabase/`: schema، policyها و منطق محرمانهٔ سرور
