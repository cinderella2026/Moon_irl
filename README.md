# MOON IRL 🌙

**MOON IRL یک شبکهٔ اجتماعی زندگی واقعی برای آدم‌ها، ارتباط‌ها، سازنده‌ها و لحظه‌های روزمره است.**

این ریپو در وضعیت فعلی یک پروتوتایپ موبایل‌محور و قابل‌کلیک است که هم به‌صورت وب مستقل و هم داخل Telegram Mini App اجرا می‌شود. هیچ secret یا bot token در فرانت‌اند قرار ندارد.

## چیزی که اکنون قابل استفاده است

- فید عکس، متن، رویداد، Life Update و رابطهٔ دوطرفه
- وضعیت‌های ۲۴ ساعته و پروفایل عمومی
- جست‌وجو و فیلتر افراد برای دوستی، رابطه و سازنده‌ها
- Top 10 و Community Rating از ۱ تا ۱۰
- دنبال‌کردن، لایک، ذخیره، نظر و اعلام حضور در رویداد
- ساخت پست متنی، عکس، وضعیت، رویداد، Life Update و ژورنال خصوصی
- پیام‌ها، درخواست‌ها و نمای رابطهٔ تأییدشده
- پروفایل شخصی، Mood، To-do، Journal، ذخیره‌ها و Full Moon
- تنظیمات حریم خصوصی، Block/Report و مسیرهای ایمنی در UI
- ذخیرهٔ تعامل‌های نمونه در `localStorage`
- Telegram WebApp bridge برای `ready`، `expand`، رنگ پوسته و haptic feedback

## مرز نسخهٔ نمایشی

GitHub Pages یک میزبان استاتیک است. بنابراین این نسخه هنوز حساب واقعی، احراز هویت، دیتابیس، آپلود دائمی، پیام‌رسانی بین کاربران، پرداخت، moderation یا همگام‌سازی ابری ندارد. UI این موضوع را با برچسب «نسخهٔ نمایشی» مشخص می‌کند و داده‌های محلی فقط در همان مرورگر می‌مانند.

برای نسخهٔ واقعی باید یک backend مستقل اضافه شود. Telegram فقط لایهٔ ورود/اجرا/پرداخت خواهد بود و داده‌های MOON در پایگاه‌دادهٔ خود محصول نگه‌داری می‌شوند.

## اجرای محلی

نیازمندی‌ها: Node.js 22 و pnpm 10.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

کنترل کیفیت و build نهایی:

```bash
pnpm check
```

خروجی production در `dist/` ساخته می‌شود.

## انتشار

هر push به شاخهٔ `main` ابتدا lint و build را اجرا می‌کند و سپس GitHub Pages از طریق workflow رسمی منتشر می‌شود:

<https://cinderella2026.github.io/Moon_irl/>

تنظیم Vite در GitHub Actions مسیر پایه را روی `/Moon_irl/` می‌گذارد. build محلی و Vercel همچنان از `/` استفاده می‌کنند.

برای Vercel نیز می‌توان ریپو را Import کرد؛ تنظیمات build و headerها در `vercel.json` ثبت شده‌اند.

## اتصال امن به Telegram

- `Telegram.WebApp.initDataUnsafe` در این نمونه فقط برای نمایش نام/عکس استفاده می‌شود و مبنای احراز هویت نیست.
- در نسخهٔ واقعی، `Telegram.WebApp.initData` از فرانت‌اند به backend فرستاده و امضا فقط در سرور اعتبارسنجی می‌شود.
- `BOT_TOKEN` فقط در secret manager سرویس backend نگه‌داری می‌شود.
- هیچ secret نباید نامی با پیشوند `VITE_` داشته باشد؛ متغیرهای `VITE_*` داخل کد عمومی مرورگر قرار می‌گیرند.
- `.env.example` فقط قرارداد URL عمومی API را نشان می‌دهد.

## ساختار اصلی

- `src/App.tsx`: پنج بخش اصلی، جریان‌ها، sheetها و state محلی پروتوتایپ
- `src/data.ts`: دادهٔ نمایشی واضح و typeهای محتوای اجتماعی
- `src/Icon.tsx`: آیکن‌های SVG بدون dependency خارجی
- `src/styles.css`: طراحی dark-first، RTL، responsive و safe-area
- `src/telegram.ts`: اتصال محدود و امن به Telegram WebApp
- `.github/workflows/ci.yml`: lint و build روی push/PR
- `.github/workflows/pages.yml`: انتشار خودکار GitHub Pages

## مسیر نسخهٔ واقعی

اولویت backend: احراز هویت Telegram → حساب و پروفایل → پست و Follow → Feed → Rating و Top 10 → Discover و Relationship → DM → Block/Report/Moderation → Photo Verification → Full Moon. ابزارهای Life خصوصی باقی می‌مانند و به‌صورت پیش‌فرض عمومی نمی‌شوند.
