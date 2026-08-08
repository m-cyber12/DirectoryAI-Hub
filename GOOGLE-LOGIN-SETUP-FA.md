# رفع Google Login — CreatorAI Hub

خطای `Unsupported provider: provider is not enabled` از Supabase است، نه از کد سایت. درخواست OAuth به Supabase رسیده، اما Google provider در پروژه فعال نشده است.

## 1. ساخت OAuth در Google Cloud
1. به Google Cloud Console بروید و پروژه را انتخاب/ایجاد کنید.
2. مسیر **APIs & Services → OAuth consent screen** را کامل کنید؛ نوع معمولاً External است.
3. مسیر **Credentials → Create Credentials → OAuth client ID → Web application**.
4. در **Authorized redirect URIs** دقیقاً این مقدار را اضافه کنید:
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
5. Client ID و Client secret را کپی کنید.

## 2. فعال‌سازی در Supabase
1. Supabase Dashboard → **Authentication → Providers → Google**.
2. گزینه Google را Enable کنید.
3. Client ID و Client secret مرحله قبل را وارد و Save کنید.
4. Authentication → URL Configuration:
   - Site URL: `https://creatorsaicenter.vercel.app`
   - Redirect URLs:
     - `https://creatorsaicenter.vercel.app/account`
     - `https://creatorsaicenter.vercel.app/**`
     - برای توسعه: `http://localhost:3000/account`

## 3. Vercel
متغیرهای عمومی باید دقیقاً پروژه Supabase فعال را نشان دهند:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

بعد از تغییر Environment Variables یک Redeploy انجام دهید.

## بررسی
پس از Save کردن Provider، دکمه Continue with Google نباید دیگر خطای 400 بدهد. اگر خطای `redirect_uri_mismatch` دیدید، URI مرحله 1 دقیقاً با Project Ref واقعی Supabase یکسان نیست.
