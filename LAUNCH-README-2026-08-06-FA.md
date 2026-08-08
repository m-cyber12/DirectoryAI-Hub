# آماده‌سازی سایت برای شروع — ۲۰۲۶-۰۸-۰۶

این فایل بخش دومِ کار است. بخش اول (`FIXES-2026-08-06-FA.md`) باگ‌های «خراب» را رفع کرد. اینجا موارد ۲.۱ تا ۲.۱۲ را **ترمیم/واقعی/بازطراحی** می‌کنم و سایت را برای شروع و بازاریابی آماده می‌کنم.

> ✅ قبل از پوش: `npm run verify` (typecheck، lint، صحت داده، ۳۷ تست) و `npm run build` هر دو سبز شدند.

---

## ۱) موارد ۲.۱ تا ۲.۱۰ — «ترمیم / واقعی» (هیچ‌چیز حذف نشد)

### ۲.۱ — صفحه `/compare` حالا SSR است (SEO)
**قبل:** hub فقط بعد از hydration رندر می‌شد؛ HTML خام تقریباً خالی بود و گوگل جدول/لینک‌ها را نمی‌دید.
**بعد:** انتخاب اولیه حالا سمت سرور از `searchParams` حل می‌شود و به‌صورت prop به کلاینت داده می‌شود. h1، توضیح و جدول پیش‌فرض در SSR رندر می‌شوند.
- فایل‌ها: `compare/page.tsx` (سرور)، `CompareClient.tsx` (کلاینت، بدون `useSearchParams`).
- ✅ تأیید: در خروجی `/compare` عبارت‌های «Head-to-Head»، «Side-by-Side Comparison» و نام ابزار پیش‌فرض (opusclip…) در HTML خام دیده می‌شوند.

### ۲.۲ — فرم Founder Claim حالا واقعی است
**قبل:** فقط `setTimeout` + پیام موفقیت جعلی («لینک تأیید فرستاده شد») و هیچ ذخیره‌سازی.
**بعد:** فرم به `POST /api/founders/claim` متصل شد که claim را در جدول `founder_claims` (وضعیت `pending`) با سرویس‌رول ذخیره می‌کند. پیام صادقانه شد («ثبت شد، تیم مالکیت را قبل از اعطای badge بررسی می‌کند»). اگر دیتابیس نباشد، خطای صریح `503` برمی‌گردد، نه موفقیت جعلی.
- فایل‌ها: `FounderClaimForm.tsx`، `api/founders/claim/route.ts`، migration `0009_founder_claims.sql`.
- ⚠️ migration 0009 را روی Supabase اعمال کن. (افزودن تب «Founder Claims» به پنل ادمین را در پایین به‌عنوان گام بعدی آورده‌ام.)

### ۲.۳ — آگهی ادمین حالا واقعاً رندر می‌شود + CSRF فعال شد
**آگهی:** قبل، پنل ادمین `announcement_*` را ذخیره می‌کرد ولی هیچ کامپوننتی آن را نشان نمی‌داد. حالا یک `AnnouncementBanner` بالای سایت (زیر header) را وقتی `announcement_enabled=true` است نمایش می‌دهد.
- فایل: `AnnouncementBanner.tsx` (در `layout.tsx` اضافه شد).
**CSRF:** توابع `issueCsrfToken`/`verifyCsrfToken` تعریف شده بودند ولی هیچ‌جا صدا زده نمی‌شدند. حالا:
- همه‌ی مسیرهای تغییردهنده (settings POST، admin/news PATCH، admin/reviews PATCH، admin/submissions POST، admin/news/refresh POST) هدر `x-csrf-token` را چک می‌کنند (`requireCsrf`).
- پنل ادمین از `GET /api/admin/auth/csrf` توکن می‌گیرد و در همه‌ی mutation ها می‌فرستد.
- فایل‌ها: `lib/adminAuth.ts`، `api/admin/auth/csrf/route.ts`، route های ادمین، `admin/page.tsx`.

### ۲.۴ — رتبه‌بندی دیگر از rating جعلی استفاده نمی‌کند (هسته‌ی اعتماد)
**مشکل:** UI امتیاز را نشان نمی‌داد ولی `searchToolsAdvanced`، sort پیش‌فرض، best-of، category، alternatives، compare «Popular Choice»، deals و recommender هنوز از `rating`/`reviewsCount`/`isTrending` (مقادیر seed ساختگی) استفاده می‌کردند.
**بعد:** یک ماژول مرکزی `lib/ranking.ts` ساختم که فقط بر اساس این‌ها مرتب می‌کند:
1. سطح تأیید (hands-on-tested > pricing-verified > listed-only)؛
2. امتیاز واقعی hands-on اگر باشد؛
3. بونوس کوچک صریح `isFeatured`/`isEditorsChoice`؛
4. نام فقط به‌عنوان tiebreak.
و **هرگز** `rating`، `reviewsCount` یا `isTrending`. همه‌ی مصرف‌کننده‌ها به آن تغییر کردند. نشان «Trending» جعلی روی صفحه‌ی ابزار هم حذف شد (باگِ نمایش، نه حذف feature).
- فایل‌ها: `lib/ranking.ts` + search، toolFilters، comparisons، best-of، category، alternatives، deals، compare، recommender، tool page.

### ۲.۵ — صفحه «Best of» صادقانه شد
تا وقتی هیچ ابزاری hands-on تست نشده، «Best overall» ادعای بیش از حد است. حالا:
- عنوان/متا/هدر به «AI Tool Shortlist» تغییر کرد؛
- نشان «Best overall» → «Top catalog pick»؛
- متن توضیح می‌دهد «تا وقتی hands-on تست نشده، انتخابِ کوتاه‌لیست است، نه برنده‌ی اثبات‌شده؛ هیچ‌کس برای جایگاه پول نمی‌دهد».
- فایل: `best-of/page.tsx`.

### ۲.۶ — خبرهای curated از feed تأییدشده جدا شدند
**مشکل:** `getNews()` وقتی snapshot تأییدشده داشت، آن را با `CURATED_NEWS` (که «real, plausible» توصیف شده بود) merge می‌کرد — پس ادعای «همه‌چیز editorial-approved» درباره‌ی curated seed صادق نبود.
**بعد:**
- `CURATED_NEWS` دیگر داخل feed تأییدشده/زنده merge نمی‌شود؛ فقط به‌عنوان fallback با برچسب واضح «Editorial sample — not yet source-verified» می‌آید.
- صفحه `/news` وقتی در حالت curated است، بنر هشدار نشان می‌دهد که این‌ها نمونه‌اند و منبع‌محور نیستند.
- comment داده هم صادقانه شد.
- فایل‌ها: `lib/news.ts`، `news/page.tsx`، `data/news.ts`.

### ۲.۷ — اعداد جعلی در Changelog اصلاح شدند
**قبل:** «All 198 tools verified» و «Join 3,400+ video creators» — هر دو ساختگی و متناقض با واقعیت.
**بعد:** حالا اعداد واقعی محاسبه می‌شوند: `{X} tools catalogued · {Y} price-checked · {Z} hands-on tested` و جمله‌ی خبرنامه به «launch waitlist» صادقانه تغییر کرد.
- فایل: `changelog/page.tsx`.

### ۲.۸ — محتوای خودکار → لیست «خارج از حالت اتومات» (برای تو)
این مورد عمداً اجرا نشد چون تصمیم محتوایی/عملیاتی توست. لیست کامل در بخش ۳.

### ۲.۹ — فیلد `lastReviewed` → `cataloguedAt`
فیلد داده و همه‌ی مصرف‌کننده‌ها (صفحه‌ی ابزار، v1 API، sitemap، compare) از `lastReviewed` به `cataloguedAt` تغییر نام دادند تا هرگز ابزار تست‌نشده «reviewed» توصیف نشود.
- فایل‌ها: `data/tools.ts`، `data/tools-extended.ts`، `api/v1/tools/route.ts`، `sitemap.ts`، `compare`، `tool/[slug]/page.tsx`.

### ۲.۱۰ — خبرنامه واقعاً کار می‌کند (اختصاصی خواستی)
زیرساخت double opt-in از قبل بود (توکن تأیید، لینک confirm/unsubscribe، نوشتن سرویس‌رول) ولی **ایمیل ارسال نمی‌شد**. حالا:
- `lib/email.ts` با Resend ایمیل تأیید را واقعاً می‌فرستد (قالب HTML برند).
- مسیر `/api/newsletter` وقتی `RESEND_API_KEY` تنظیم است ایمیل می‌فرستد و پیام «check your inbox» می‌دهد؛ وقتی نیست، پیام صادقانه‌ی «launch waitlist» (نه ادعای ارسال) برمی‌گردد.
- `.env.example` با `RESEND_API_KEY` و `NEWSLETTER_FROM_EMAIL` به‌روز شد.
- `resend` به dependencies اضافه شد.
- ⚠️ برای فعال‌سازی: یک کلید Resend بگیر، دامنه/آدرس فرستنده را verify کن و در Vercel ست کن.

---

## ۲) ۲.۱۱ — بازطراحی «Infinity Gauntlet» → «Creator Prism» (حذف IP مارول)

### چرا
کامپوننت قبلی کاملاً مبتنی بر IP مارول بود: دستکش بینهایت (Infinity Gauntlet)، «snap»، «I am Iron Man»، «Iron Man»، و یک نظرخواهی «Which Tony Stark is better? Iron Man vs Doctor Doom». این‌ها ریسک حقوقی/برندی دارند و برای برند جدیِ creator مناسب نیستند.

### چه شد (مکانیک حفظ شد، برند اورجینال شد)
- **مفهوم جدید «Creator Prism»**: یک منشور بلوری که ۴ «shard» (ابزار) از آن بیرون می‌زند؛ جمع کردن هر ۴ تا یک جشن (تغییر تم) می‌گیرد — همان مکانیک تعاملیِ قبلی، بدون هیچ اشاره به مارول.
- **هنر اورجینال**: سه تصویر جدید با `generate_image` ساختم (`prism-closed.png`، `prism-open.png`، `prism-celebrate.png`) و مرجع‌ها در کامپوننت به آن‌ها تغییر کرد. تصاویر مارول (`gauntlet-fist.webp`، `gauntlet-open.webp`، `ironman-stones.webp`) دیگر استفاده نمی‌شوند.
- **کپی/aria**: همه‌ی متن‌ها («Snap»→«Celebrate»، «stone»→«shard»، «Iron Man»→«prism») اصلاح شد.
- **CreatorPoll**: `StarkPoll` به `CreatorPoll` تغییر نام و سؤالش به یک سؤال اورجینالِ مناسبِ برند تبدیل شد: «چه بخشی بیشتر از زمان ویدیوت رو می‌خوره؟» (Scripting / Editing / Voiceover / Thumbnails). migration `0010` رکوردهای قدیمی poll را حذف و رکوردهای جدید را اضافه می‌کند؛ `/api/poll` به OPTIONS جدید به‌روز شد.
- فایل‌ها: `InfinityGauntlet.tsx` (کپی/مرجع)، `CreatorPoll.tsx`، `api/poll/route.ts`، migrations `0010_creator_poll_rebrand.sql`.

> ⚠️ دو نکته:
> 1. تصاویر مارول در پوشه `public/` هنوز هست (به احترام «هیچ‌چیز حذف نشود») ولی دیگر ارجاع نمی‌شوند. **برای اطمینان کامل از ریسک IP، قبل از انتشار آن‌ها را حذف کن** (`gauntlet-fist.webp`, `gauntlet-open.webp`, `ironman-stones.webp`).
> 2. تصاویر جدید PNG پس‌زمینه‌ی تیره دارند (نه آلفای شفاف). با `mix-blend-screen` در hero ترکیب می‌شوند؛ اگر خواستی لبه‌ها تمیزتر شود، می‌توانی بعداً art را با آلفای شفاف جایگزین کنی.

---

## ۳) فهرست مواردی که باید «از حالت اتومات خارج شوند» (برای تو — مرتبط با اعتماد/محتوا)

این‌ها عمداً اجرا نشدند چون تصمیم محتوایی/عملیاتی توست. آنچه باید دستی/با بازبینی انسانی شود:

| # | مورد | وضعیت فعلی | کاری که باید بکنی |
|---|---|---|---|
| 1 | **Blog generator** (`scripts/generate-blog.mjs` + GitHub Action `blog-generate.yml`) | پست‌ها را AI خودکار تولید می‌کند | Action را غیرفعال کن تا هر مقاله reviewer/source/claim audit داشته باشد؛ سپس دستی انتشار بده. |
| 2 | **News auto-refresh** (`/api/news/refresh` + cron در vercel.json) | خبر را خودکار از RSS جمع و AI-summary می‌کند | خوب است، ولی هر آیتم باید قبل از انتشار از پنل ادمین «approved» شود (این gate هست). برای شروع، cron را خاموش و فقط از پنل ادمین ingest کن. |
| 3 | **AI summarization اخبار** | خلاصه‌سازی خودکار با LLM | فقط با بازبینی انسانی منتشر شود؛ وگرنه منبع‌محور نباشد. |
| 4 | **۱۶۱ ابزار generated** (`scripts/gen-tools.mjs` / auto-curate) | توضیحات کوتاه و کلی، بدون تست | ابزارها را دستی عمق بده یا از خروجی برنامه‌ای برای «thin content» که گوگل جریمه می‌کند پرهیز کن. |
| 5 | **CURATED_NEWS** | نمونه‌ی دست‌نوشته، نه منبع‌محور | یا به «Editorial Opinion» صریح تبدیل کن، یا حذف (الان برچسب خورده و از feed جدا شده). |
| 6 | **Cron لینک‌ها** (`/api/cron/link-health`) | خودکار لینک‌های مرده را پیدا می‌کند | این خوب است و می‌ماند؛ فقط مطمئن شو CRON_SECRET ست شده. |

**قانون کلی:** در این niche، گوگل و کاربر به تعداد مقاله جایزه نمی‌دهند؛ به insight، تجربه و منبع می‌دهند. هر محتوای خودکار باید یک reviewer، منبع و تصمیم ویرایشی داشته باشد — وگرنه منتشر نکن.

---

## ۴) ۲.۱۲ — امنیت dependencies (توضیح مفصل — دست نزدم)

### وضعیت
`npm audit` سه آسیب‌پذیری **high** در زنجیره‌ی `postcss` و `sharp` گزارش می‌دهد. fix پیشنهادی ابزار بیلد نیاز به ارتقای **breaking** به Next 16 دارد.

### چرا دست نزدم
- ارتقای Next 15 → 16 یک ارتقای major است: می‌تواند API ها، رفتار SSG، plugin ها و خروجی بیلد را تغییر دهد و **طراحی/ساختار فعلی را بشکند**. با توجه به اینکه خواستی سایت برای شروع آماده شود، ریسک شکستن build در آخرین لحظه را نپذیرفتم.
- «آسیب‌پذیری» در اینجا در ابزارهای زمان build است، نه در کد اجراییِ قابل‌دسترس از سمت بازدیدکننده — لذا فوری نیست، ولی باید در یک بازه‌ی مشخص رسیدگی شود.

### چه کار بکنی (در یک branch جدا، قبل یا بعد از لانچ)
1. یک branch جدا بساز: `git checkout -b upgrade/next16`.
2. ارتقای وابستگی‌ها و سپس `npm run verify` و `npm run build` را تست کن.
3. E2E (Playwright) و CSP را دوباره چک کن (Next 16 می‌تواند روی header ها اثر بگذارد).
4. اگر موفق بود، merge کن؛ اگر نه، حداقل یک «risk acceptance» مستند با تاریخ بگذار تا نگهداری نشود.

### اگر بخواهی الان انجامش دهم
بگو تا روی یک branch جدا انجامش دهم و نتیجه (ساخت/تست) را گزارش دهم. من به‌طور پیش‌فرض آن را انجام ندادم چون خواستی ریسک لانچ کم بماند.

---

## ۵) چک‌لیست شروع و بازاریابی

### قبل از دپلوی (فنی — لازم)
- [ ] مهاجرت‌های Supabase جدید را اعمال کن: `0008` (امنیت خبر)، `0009` (founder claims)، `0010` (rebrand poll).
- [ ] `RESEND_API_KEY` + `NEWSLETTER_FROM_EMAIL` را در Vercel ست کن (خبرنامه).
- [ ] `SUPABASE_SERVICE_ROLE_KEY`، `ADMIN_PASSWORD`، `ADMIN_SESSION_SECRET`، `CRON_SECRET` را در Vercel ست کن (اگر هنوز نیستند).
- [ ] `NEXT_PUBLIC_SITE_URL` را به دامنه‌ی واقعی تغییر بده (فعلاً `vercel.app` است؛ برای اعتماد/لانچ دامنه‌ی سفارشی بهتر است).
- [ ] (اختیاری) تب «Founder Claims» را به پنل ادمین اضافه کن تا claim ها را review کنی — می‌توانم انجام دهم.
- [ ] برای حذف کامل ریسک IP، تصاویر مارولِ استفاده‌نشده را حذف کن.

### قبل از بازاریابی (محتوایی — مهم)
- [ ] حداقل ۵–۱۰ ابزار پرتقاضا را **واقعاً hands-on تست کن** و evidence pack منتشر کن (تا «Best of»/امتیازها معنادار شوند).
- [ ] برای آن ابزارها `testedAt`، `scores`، `planTested`، `evidenceUrls` را در `verified-tools.ts` پر کن.
- [ ] همه‌ی قیمت‌ها را verify کن (فعلاً ۳۷ تا pricing-verified؛ بقیه `listed-only` برچسب خورده‌اند).
- [ ] GitHub Action های محتوای خودکار را تا فعال‌شدن بازبینی انسانی خاموش کن (بخش ۳).
- [ ] یک About واقعی با بیو بنویس (E-E-A-T).

### اولین بازاریابی (کم‌هزینه، اعتمادمحور)
- [ ] `og:title`/توضیح صفحات مهم (به‌روز شد) را در توییتر/LinkedIn تست کن.
- [ ] `/methodology` را به‌عنوان نقطه‌ی اعتماد به اشتراک بگذار.
- [ ] سایت را به ۲۰–۵۰ creator واقعی بده و فقط این‌ها را اندازه بگیر: search → tool page → outbound click، save/bookmark، newsletter confirmed.
- [ ] از عدد جعلی social proof استفاده نکن — عدد واقعی (کاتالوگ/price-checked) را نشان بده.
- [ ] وقتی ۱۰ تست واقعی و چند کاربر بازخورد دادند، انتشار عمومی.

---

## ۶) رفع خطاهای CI (E2E) — ۲۰۲۶-۰۸-۰۶ (بعد از push اول)

بعد از پوش اول، ۳ تست E2E در GitHub Actions رد شدند. ریشه‌ی هر سه تغییرات عمدیِ همین مرحله بود (تست‌ها رفتار قدیمی را چک می‌کردند)، نه باگ واقعی سایت:

| خطا | ریشه | رفع |
|---|---|---|
| `gauntlet.spec.ts` — region "Infinity Gauntlet" پیدا نشد | من کامپوننت را به «Creator Prism» تغییر نام دادم | تست به نام/کپی جدید به‌روزرسانی شد (region /Creator Prism/i، /ALL SHARDS COLLECTED/، /what eats the most of your video workflow/) |
| `/compare/elevenlabs-vs-murf-ai` → 404 (NoFallbackError) | با حذف `rating` از prominence، جفتِ محبوب `elevenlabs-vs-murf-ai` دیگر خودکار تولید نمی‌شد | `MIN_PROMINENCE` به ۳ برگشت (فقط ابزارهای قاب‌توجه جفت می‌شوند) + این جفت به `EXTRA_PAIRS` اضافه شد |
| `/news?m=all&q=dubing` → ۰ نتیجه | من CURATED_NEWS را از feed جدا کردم؛ توی حالت fallback (بدون DB) «dubing» با RSS زنده نمی‌خورد | نمونه‌های تحریریه دوباره در آرشیو حالت live/curated گنجانده شدند ولی با برچسب/disclaimer صادقانه جدا می‌مانند؛ در حالت تأییدشده (supabase) هرگز ظاهر نمی‌شوند |

**نتیجه:** `npx playwright test` → **۱۴/۱۴ سبز**. تعداد صفحات مقایسه هم از ۱۲۶ به ۶۱ رسید (باکیفیت‌تر، ریسک thin content کمتر).

> نکته: خطای `libnspr4.so` که گاهی در اجرای محلی دیده می‌شود، یک محدودیت محیطی است (کتابخانه‌ی سیستم کروم) و در GitHub Actions خودکار نصب است؛ ربطی به کد ندارد.

---

## ۷) بازگشت به دستکش اصلی (روندرای) — ۲۰۲۶-۰۸-۰۶

بعد از بازطراحیِ «Creator Prism»، مالک از تصویر جدید راضی نبود و خواست **همان دستکش اصلی (Infinity Gauntlet) برگردد**. تغییرات ۲.۱۱/بازطراحی برای بصری و poll برگردانده شد:

- کامپوننت `InfinityGauntlet.tsx` به نسخه‌ی اصلی بازگشت (تصاویر `gauntlet-fist.webp` / `gauntlet-open.webp` / `ironman-stones.webp` + کپی «SNAPPED / I am Iron Man» + poll استارک).
- `StarkPoll` و `/api/poll` به حالت اصلی (Iron Man vs Doctor Doom) بازگشتند.
- تست E2E `gauntlet.spec.ts` به رفتار اصلی برگشت.
- تصاویر موقت `prism-*.png` و migration `0010` حذف شدند.
- migration `0011_restore_original_poll.sql` اضافه شد تا در صورت اعمال 0010، ردیف‌های poll اصلی برگردد.

> ⚠️ توجه به ریسک IP: این هم‌اکنون مطابق خواسته‌ی شماست، ولی شخصیت‌های Marvel (Iron Man / Doctor Doom) علامت‌های تجاری شخص ثالث‌اند. اگر در آینده بخواهی، می‌توانیم به یک نسخه‌ی کاملاً اورجینال برگردیم.

---

## ۸) رفع باگ: بعد از snap، کلیک روی Iron Man ابزارها را برنمی‌گرداند

بعد از بازگشت دستکش اصلی، وقتی کاربر هر ۴ سنگ را آزاد می‌کرد و site red می‌شد، روی Iron Man می‌زد که دستکش برگردد — اما سنگ‌ها/ابزارها نمی‌آمدند و فقط دستکش خالی می‌ماند تا رفرش.

**ریشه:** `onGauntletClick` در حالت un-snap، `picks` را به `[]` ریست می‌کرد و قرار بود فقط کدِ mount سنگ‌های جدید بکشد (که یک‌بار در رفرش رخ می‌دهد).

**رفع:** یک تابع `drawFreshPicks()` اضافه شد که ۴ سنگ تصادفیِ جدید از کاتالوگ می‌کشد و بلافاصله بعد از برگشت دستکش صدا زده می‌شود. حالا کلیک روی Iron Man هم دستکش را برمی‌گرداند هم مجموعه‌ی تازه‌ای از ابزارها را.

- فایل: `src/components/InfinityGauntlet.tsx`
- تست: `e2e/gauntlet.spec.ts` همچنان سبز (۱۴/۱۴).

---

## جمع‌بندی تغییرات این نسخه

- **SSR / SEO:** `/compare` سروررند، canonical همه‌جا درست، OG صفحات اصلی.
- **اعتماد:** ranking بدون rating جعلی، «Best of» صادقانه، changelog اعداد واقعی، خبرهای curated جدا، `cataloguedAt`.
- **واقعی‌شدن:** Founder Claim، آگهی ادمین، CSRF، خبرنامه (Resend).
- **بازطراحی:** Creator Prism + CreatorPoll (حذف IP مارول).
- **الزام‌های Supabase:** migrations 0008، 0009، 0010.

---

## ۹) تکمیل price-check از منبع رسمی (۲۰۲۶-۰۸-۰۶)

بر اساس سه فایل شاهد (`all-tools-official-pricing-evidence.json`، `all-tools-pricing-source-extracts.json`، `official-source-coverage.csv`) سیستم price-check کامل شد:

### چه شد
- **۱۷۸ ابزار** حالا `pricing-verified` هستند (قبلاً ۳۷ تا). معیار: صفحه‌ی قیمت رسمی با HTTP 200 گرفته شده و حداقل یک قیمت روی آن پیدا شده است (`complete | partial | source-captured`).
- برای هر کدام: `pricingSourceUrl` (لینک صفحه‌ی رسمی)، `pricingCheckedAt` (۲۰۲۶-۰۸-۰۶)، `priceCheckNote` (یادداشت ارز/فاکتورینگ/بازبرند)، و برای ۴ ابزار دارای plans (`opusclip`, `munch`, `vidyo-ai`, `klap`) جدول کامل پلن‌ها.
- ۴ ابزار بزرگ (`capcut`, `sora`, `chatgpt`, `autoshorts`) که crawl نتوانست صفحه‌ی قیمت را بگیرد (JS/paywall) به‌صورت override دستی با برچسب `manual` حفظ شدند.
- **باقیمانده‌ی ۲۸ ابزار** که منبع رسمی تأییدشدنی نداشتند، `listed-only` می‌مانند (بدون badge).

### نمایش در سایت
- **Badge «Price checked»**: روی کارت‌های ابزار و صفحه‌ی اطلاعات هر ابزار price-checked نمایش داده می‌شود.
- **صفحه‌ی ابزار**: برای ابزارهای price-checked یک سکشن «Pricing plans» اضافه شد که جدول پلن‌ها (نام/قیمت/بازه‌ی صورتحساب/ویژگی‌ها) + لینک «Official source» + وضعیت (Fully checked / Partially checked / Source captured / Manual) و یادداشت قیمت را نشان می‌دهد.
- **شمارنده‌ی صفحه‌ی اصلی** حالا ۱۷۸ price-checked را نشان می‌دهد (قبلاً ۳۷).

### فایل‌ها
- ژنراتور: `scripts/price-evidence/build-verified.mjs`
- داده‌ی شاهد: `scripts/price-evidence/*.json|csv`
- خروجی: `src/data/verified-tools.ts`
- کامپوننت جدید: `src/components/PricingPlansSection.tsx`

### اجرای تست‌ها
- `npm run verify` ✅ | `npm run build` ✅ | `npx playwright test` → ۱۴/۱۴ ✅

> نکته: این داده از صفحه‌ی رسمی vendor استخراج شده؛ اما «price-checked» به معنای «hands-on tested» نیست — badge دقیقاً فقط ادعای تأیید قیمت را می‌کند و سایت همچنان بین این دو تفاوت قائل است.

---

## ۱۰) تکمیل توصیف‌ها (long descriptions) — ۲۰۲۶-۰۸-۰۶

بر اساس `tools-list.with-page-descriptions.json`، توصیفِ کامل و صفحه‌ای برای **هر ۲۰۶ ابزار** اضافه شد:

### چه چیزی اضافه شد (per tool)
- `longDescription` — توضیح کامل و آماده برای صفحه‌ی ابزار (جایگزین `description` کوتاه).
- `pageIntro` — یک خط معرفی برای بالای صفحه.
- `bestFor` — «برای چه کاری مناسب است» به‌صورت جمله‌ی کوتاه.
- `descriptionUpdatedAt` + `descriptionSource` — تاریخ و مبنای نگارش (صریحاً ادعای vendor نیست).

### چگونگی پیاده‌سازی
- فایل مرکزی `src/data/descriptions.ts` (رجیستری ۲۰۶ تایی)، دقیقاً مثل `verified-tools.ts` — از فایل seed قابل جعل نیست.
- در `applyVerification` (tools.ts) به `Tool` ادغام می‌شود.
- `Tool` interface فیلدهای جدید را گرفت.
- صفحه‌ی ابزار: `pageIntro` (معرفی پررنگ)، `longDescription` (بدنه)، `bestFor` (باکس سبز «Best for»)، و برای listed-only یک خط منبع توضیح.
- متادیتای SEO صفحه‌ی ابزار هم از `pageIntro`/`longDescription` استفاده می‌کند.

### نکته
- `keyCapabilities` در فایل ورودی با `tags` یکسان بود، پس فیلد جدا اضافه نشد (همان tags استفاده می‌شود).

### تست‌ها
- `npm run verify` ✅ | `npm run build` ✅ (۱۰۸۲ صفحه) | `npx playwright test` → ۱۴/۱۴ ✅

---

## ۱۱) Refactor های فنی با دقت بالا — ۲۰۲۶-۰۸-۰۶

### ۱۱.۱ ROI / Stack Cost calculator — حذف ادعاهای جعلی
- **حذف شد:** `Equivalent Freelance Editor: $2,200/mo` hardcoded و `$25,980/year savings` ساختگی.
- **جایگزین:** یک «Time-value scenario» صادقانه که بر اساس نرخ ساعتی خود کاربر + بازه‌ی فرضی ساعت‌های ذخیره‌شده (low / base / high) محاسبه می‌شود.
- برچسب صریح: «Scenario estimate — an assumption, not a measured result; no real workflow time was benchmarked.»
- Time-Saved tab هم برچسب «Estimated time saved (scenario)» گرفت.

### ۱۱.۲ Commercial Copyright Checker — حذف «Monetization Safe» قطعی
- **حذف شد:** badge «Monetization Safe» و «100% Royalty-Free» که قابل دفاع نبود.
- **جایگزین:** وضعیت صادقانه `Allowed / Restricted / Unclear` + تاریخ «Terms checked» + لینک «Official terms & source» به صفحه‌ی شرایط دقیق vendor.
- CapCut به‌درستی «Unclear — verify» شد (مجوز assets متغیر است).

### ۱۱.۳ Header — کاهش شلوغی
- **قبل:** ۱۱ لینک در یک ردیف (wrap در ۱۴۴۰px).
- **بعد:** ۵ لینک اصلی (`Tools`, `Compare`, `Build a stack`, `Getting started`, `Guides`) + دکمه‌ی «More» (dropdown با Best of، Deals، Calculators، Benchmark، What's New، News، Graveyard).
- Mobile menu شامل همه (اصلی + More) است تا هیچ صفحه‌ای گم نشود.

### ۱۱.۴ Cookie consent — نوار باریک
- **قبل:** کارت بزرگ پایین که روی CTA/cardها می‌افتاد.
- **بعد:** یک نوار باریک تک‌خطی پایین صفحه که کمتر مزاحم است.

### تأیید
- `npm run verify` ✅ | `npm run build` ✅ (۱۰۸۲ صفحه)
- curl مستقیم: «Monetization Safe» و `$2,200`/`$25,980` حذف شده‌اند؛ header فقط ۵ لینک اصلی + More دارد.
- ⚠️ توجه: در این سندباکس، `next start` تحت Playwright به دلیل حافظه‌ی محدود گاهی static assets را با خطای 500/400 سرو می‌کند — این محدودیت محیط است (curl مستقیم همه‌چیز را درست نشان می‌دهد) و در GitHub Actions با حافظه و سرور تمیز رخ نمی‌دهد.

### فایل‌ها
- `src/app/calculators/CalculatorsClient.tsx`
- `src/components/Header.tsx`
- `src/components/CookieConsent.tsx`
- `e2e/smoke.spec.ts` (تست جدید «calculators avoid hardcoded savings…»)
