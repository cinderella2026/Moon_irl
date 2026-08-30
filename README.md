# MOON IRL 🌙

یک Telegram Mini App فارسی و موبایل‌محور برای تبدیل نیت‌های کوچک به قدم‌های واقعی.

## اجرای محلی

نیازمندی: Node.js 22 و pnpm 10.

```bash
pnpm install
pnpm dev
```

برای کنترل کیفیت و ساخت نسخهٔ نهایی:

```bash
pnpm check
```

خروجی production در پوشهٔ `dist` ساخته می‌شود.

## استقرار روی Vercel

1. این ریپو را در Vercel با گزینهٔ **Import Git Repository** وارد کنید.
2. Vercel به‌صورت خودکار Vite را تشخیص می‌دهد؛ تنظیمات لازم در `vercel.json` نیز ثبت شده‌اند.
3. پس از Deploy، دامنهٔ HTTPS تولیدشده را کپی کنید.
4. در BotFather دستور `/mybots` → ربات → **Bot Settings** → **Menu Button** → **Configure menu button** را انتخاب و همان URL را ثبت کنید.

## اتصال امن به Telegram

Mini App اطلاعات Telegram را از `window.Telegram.WebApp` می‌خواند و در مرورگر عادی هم بدون خطا نمایش داده می‌شود. برای اضافه‌کردن حساب کاربری یا ذخیرهٔ داده:

- مقدار `Telegram.WebApp.initData` را از فرانت‌اند به بک‌اند خود بفرستید.
- امضای `initData` را **فقط در سرور** و مطابق مستندات Telegram اعتبارسنجی کنید.
- `BOT_TOKEN` فقط در secretهای سرویس backend/Vercel نگه‌داری شود.
- هیچ‌وقت توکن را با پیشوند `VITE_` تعریف نکنید؛ این متغیرها داخل کد عمومی مرورگر قرار می‌گیرند.
- به `initDataUnsafe` برای احراز هویت اعتماد نکنید؛ در این نسخه فقط برای نمایش نام و تصویر استفاده شده است.

فایل `.env.example` فقط قرارداد متغیر عمومی را نشان می‌دهد و هیچ secret واقعی ندارد.

## ساختار

- `src/telegram.ts`: پل سبک و type-safe به Telegram WebApp
- `src/App.tsx`: رابط اصلی و تعامل قدم روزانه
- `src/styles.css`: طراحی responsive با پشتیبانی safe-area موبایل
- `.github/workflows/ci.yml`: اجرای lint و build روی هر push/PR
- `vercel.json`: تنظیم build، SPA routing و هدرهای امنیتی

## وضعیت فعلی

نسخهٔ اولیه شامل صفحهٔ خانه، پیشرفت روزانه، قدم پیشنهادی، بازخورد لمسی Telegram و fallback مرورگر است. تب‌های «مسیر» و «من» فعلاً ناوبری نمایشی هستند و برای اتصال دادهٔ واقعی به backend آماده‌اند.
