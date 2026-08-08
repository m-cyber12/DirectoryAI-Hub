# گزارش اجرای اصلاحات — ۴ اوت ۲۰۲۶

این نسخه برای رفع ریسک‌های اعتبار و «تعاملِ نمایشی» در گزارش‌های پیوست آماده شده است.

## تغییرهای انجام‌شده

1. **ادعای تست دستی و نمره حذف شد**
   - ۱۰ رکوردی که تنها به صفحهٔ فروشنده/قیمت لینک می‌دادند از `Hands-on tested` به `Pricing verified` تنزل داده شدند.
   - نمره، تاریخ تست، evidence URL و verdictهای منتسب به تست از این رکوردها حذف شده‌اند.
   - در نتیجه تا زمانی که evidence pack واقعی وجود نداشته باشد، سایت هیچ نمرهٔ benchmark منتشر نمی‌کند.

2. **خانه بازسازی و ساده شد**
   - فایل صفحهٔ اصلی در نسخهٔ مبنا ناقص و TypeScript آن خراب بود؛ به صفحه‌ای کامل و قابل build تبدیل شد.
   - پیام اصلی اکنون workflow-first است: جست‌وجو، برنامه‌ریزی workflow و مرور کاتالوگ.
   - proof strip صادقانه نمایش می‌دهد: تعداد ابزارها، تعداد قیمت‌های source-checked و صفر evidence pack عمومی.
   - testimonial، «raw output» و آمار تستِ بدون مدرک نمایش داده نمی‌شود.

3. **صفحهٔ Trending از رتبه‌بندی ساختگی به discovery collection تبدیل شد**
   - عبارت‌های «live»، «most saved»، «weekly»، تعداد save و ranking مبتنی بر دادهٔ seed حذف شد.
   - صفحه اکنون شفاف می‌گوید که collection است، نه ranking؛ و ابزارهای price-checked / newly catalogued را با برچسب مناسب نشان می‌دهد.

4. **رفتارهای mock حذف شدند**
   - در نبود Supabase، API review دیگر review جعلی را به UI برنمی‌گرداند؛ پاسخ `503` صریح می‌دهد.
   - رأی helpful نیز در نبود storage موفقیت جعلی اعلام نمی‌کند.

5. **Newsletter صادقانه شد**
   - وقتی database یا ESP آماده نیست، UI/API دیگر وعدهٔ ایمیل تایید نمی‌دهد.
   - متن به «launch waitlist» تغییر کرد و دقیقاً می‌گوید تا راه‌اندازی delivery، ایمیل تایید ارسال نمی‌شود.

6. **متن‌های اعتماد و accessibility تمیز شد**
   - About page با وضعیت واقعی evidence vault هماهنگ شد.
   - هشدار lint مربوط به quotation در Methodology رفع شد.

## کنترل کیفیت اجراشده

```text
npm run typecheck       PASS
npm run lint            PASS (بدون warning/error)
npm run validate:data   PASS (197 ابزار)
npm run build           PASS (قبل از آخرین تغییرهای متنی/صفحه Trending)
```

پس از آخرین تغییرهای متنی، `npm run verify` دوباره اجرا و با موفقیت تمام شد. قبل از deploy، یک بار `npm run build` را در CI اجرا کنید.

## عمداً انجام نشده

- Evidence Vault واقعی ساخته نشده، چون artefact، prompt، setting، هزینه و خروجی قابل‌انتشارِ واقعی در repository نبود. ساخت یک vault با دادهٔ ساختگی دقیقاً همان مشکل audit را تکرار می‌کرد.
- خبرهای auto-published هنوز نیازمند editorial gate واقعی هستند؛ پیش از فعال کردن cron، refresh pipeline را به review queue تبدیل کنید.
- برای ranking/community واقعی، bookmarks و voteهای server-side با حساب کاربری و audit trail لازم است.
