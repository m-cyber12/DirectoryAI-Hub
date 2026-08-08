# اجرای Cinematic Guide

## اعمال‌شده
- **Lenis** با `lenis` مدرن و نگهداری‌شده در کل سایت فعال شده است.
  - تنظیمات دسکتاپ: `duration: 1.05` و `lerp: 0.09`.
  - برای لمس/موبایل و کاربران دارای `prefers-reduced-motion` عمداً فعال نمی‌شود؛ اسکرول native هم سریع‌تر و هم دسترس‌پذیرتر است.
- پس‌زمینهٔ WebGL سه‌بعدی فقط روی Hero صفحهٔ اصلی اضافه شده است:
  - field ذرات بنفش/فیروزه‌ای، هندسهٔ wireframe و حلقهٔ نورانی.
  - واکنش نرم به pointer، بدون قابلیت کلیک و بدون پوشاندن محتوای HTML.
  - روی موبایل کوچک و برای reduced-motion به‌طور کامل غیرفعال است.
  - Canvas client-only، lazy-loaded و با DPR حداکثر 1.5 است تا عملکرد صفحه حفظ شود.

## چرا Scene در کل سایت fixed نیست؟
راهنما fixed global را پیشنهاد می‌کند، اما برای یک directory داده‌محور باعث مصرف مداوم GPU، حواس‌پرتی در فرم‌ها/مقایسه‌ها و تجربهٔ ضعیف‌تر موبایل می‌شود. این نسخه همان هویت سینماتیک را در نقطهٔ مهم (Hero) ایجاد می‌کند، در حالی که صفحات تصمیم‌گیری خوانا و سریع می‌مانند.

## چرا `drei` و `postprocessing` نصب نشده‌اند؟
افکت Bloom و Depth of Field برای این Hero ارزش بصری قابل‌توجهی نسبت به هزینهٔ bundle/GPU ایجاد نمی‌کردند. نور، material emissive و transparency ظاهر glow را با هزینهٔ بسیار کمتر فراهم می‌کنند. در نتیجه فقط وابستگی‌های لازم نصب شده‌اند: `lenis`، `three` و `@react-three/fiber`.

## کنترل کیفیت
- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm run validate:data` — PASS
- `npm run build` — PASS
- پاسخ local dev برای `/` — HTTP 200
