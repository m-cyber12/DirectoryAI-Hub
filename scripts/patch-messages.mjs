// One-off helper: adds the i18n keys shared across all locale files
// (theme toggles, cookie bar, newsletter notes, home extras, categories).
// Run: node scripts/patch-messages.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const D = {};

const cats = {
  'Video Generation': { es: 'Generación de vídeo', pt: 'Geração de vídeo', fr: 'Génération vidéo', de: 'Videogenerierung', zh: '视频生成', ar: 'توليد الفيديو', fa: 'تولید ویدیو' },
  'Video Editing & VFX': { es: 'Edición de vídeo y VFX', pt: 'Edição de vídeo e VFX', fr: 'Montage vidéo et VFX', de: 'Videobearbeitung & VFX', zh: '视频剪辑与特效', ar: 'مونتاج الفيديو والمؤثرات', fa: 'ادیت ویدیو و VFX' },
  'Video Repurposing': { es: 'Reaprovechamiento de vídeo', pt: 'Reaproveitamento de vídeo', fr: 'Réutilisation de vidéo', de: 'Video-Repurposing', zh: '视频再利用', ar: 'إعادة استخدام الفيديو', fa: 'بازاستفاده ویدیو' },
  'Faceless Video': { es: 'Vídeo sin rostro', pt: 'Vídeo sem rosto', fr: 'Vidéo sans visage', de: 'Faceless-Video', zh: '无脸视频', ar: 'فيديو بدون وجه', fa: 'ویدیوی بدون چهره' },
  'Voice & Audio': { es: 'Voz y audio', pt: 'Voz e áudio', fr: 'Voix et audio', de: 'Stimme & Audio', zh: '语音与音频', ar: 'الصوت والصوتيات', fa: 'صدا و صوت' },
  'Translation & Dubbing': { es: 'Traducción y doblaje', pt: 'Tradução e dublagem', fr: 'Traduction et doublage', de: 'Übersetzung & Synchronisation', zh: '翻译与配音', ar: 'الترجمة والدبلجة', fa: 'ترجمه و دوبله' },
  'Music & SFX': { es: 'Música y efectos de sonido', pt: 'Música e efeitos sonoros', fr: 'Musique et effets sonores', de: 'Musik & Soundeffekte', zh: '音乐与音效', ar: 'الموسيقى والمؤثرات الصوتية', fa: 'موسیقی و افکت صوتی' },
  'AI Avatars': { es: 'Avatares de IA', pt: 'Avatares de IA', fr: 'Avatars IA', de: 'KI-Avatare', zh: 'AI 数字人', ar: 'أفاتار الذكاء الاصطناعي', fa: 'آواتارهای هوش مصنوعی' },
  'Thumbnails & Design': { es: 'Miniaturas y diseño', pt: 'Miniaturas e design', fr: 'Miniatures et design', de: 'Thumbnails & Design', zh: '缩略图与设计', ar: 'الصور المصغّرة والتصميم', fa: 'تامبنیل و طراحی' },
  'Scripting & Writing': { es: 'Guion y redacción', pt: 'Roteiro e escrita', fr: 'Script et rédaction', de: 'Skript & Texterstellung', zh: '脚本与写作', ar: 'كتابة السيناريو', fa: 'فیلم‌نامه و نویسندگی' },
  'AI Agents & Assistants': { es: 'Agentes y asistentes de IA', pt: 'Agentes e assistentes de IA', fr: 'Agents et assistants IA', de: 'KI-Agenten & Assistenten', zh: 'AI 智能体与助手', ar: 'وكلاء ومساعدو الذكاء الاصطناعي', fa: 'عوامل و دستیاران هوش مصنوعی' },
  'Prompts & Templates': { es: 'Prompts y plantillas', pt: 'Prompts e modelos', fr: 'Prompts et modèles', de: 'Prompts & Vorlagen', zh: '提示词与模板', ar: 'البرومبتات والقوالب', fa: 'پرامپت و قالب' },
  'Transcription & Captions': { es: 'Transcripción y subtítulos', pt: 'Transcrição e legendas', fr: 'Transcription et sous-titres', de: 'Transkription & Untertitel', zh: '转写与字幕', ar: 'التفريغ والترجمات النصية', fa: 'رونویسی و زیرنویس' },
  'SEO & Analytics': { es: 'SEO y análisis', pt: 'SEO e análises', fr: 'SEO et analytique', de: 'SEO & Analytics', zh: 'SEO 与分析', ar: 'تحسين محركات البحث والتحليلات', fa: 'سئو و تحلیل' },
  Automation: { es: 'Automatización', pt: 'Automação', fr: 'Automatisation', de: 'Automatisierung', zh: '自动化', ar: 'الأتمتة', fa: 'اتوماسیون' },
  'Live & Streaming': { es: 'Directos y streaming', pt: 'Ao vivo e streaming', fr: 'Live et streaming', de: 'Live & Streaming', zh: '直播与流媒体', ar: 'البث المباشر', fa: 'لایو و استریم' },
  '3D & Motion': { es: '3D y motion', pt: '3D e motion', fr: '3D et motion', de: '3D & Motion', zh: '3D 与动态', ar: '3D والحركة', fa: 'سه‌بعدی و موشن' },
};

const homeMeta = {
  es: { metaTitle: 'CreatorAI Hub — herramientas de IA para creadores de vídeo', metaDescription: 'Encuentra herramientas de IA para vídeo con etiquetas de verificación claras, fuentes de precio y descubrimiento orientado al flujo de trabajo.', heroSubSeparator: 'y separamos claramente', heroSubFrom: 'de las herramientas que', chipToolsCatalogued: 'herramientas catalogadas', rotatingWords: ['clips', 'subtítulos', 'doblaje', 'edición', 'miniaturas'] },
  pt: { metaTitle: 'CreatorAI Hub — ferramentas de IA para criadores de vídeo', metaDescription: 'Encontre ferramentas de IA para vídeo com rótulos de verificação claros, fontes de preço e descoberta orientada ao fluxo de trabalho.', heroSubSeparator: 'e separamos claramente', heroSubFrom: 'das ferramentas que', chipToolsCatalogued: 'ferramentas catalogadas', rotatingWords: ['clipes', 'legendas', 'dublagem', 'edição', 'miniaturas'] },
  fr: { metaTitle: 'CreatorAI Hub — outils IA pour créateurs vidéo', metaDescription: 'Trouvez des outils IA vidéo avec des mentions de vérification claires, des sources de prix et une découverte orientée workflow.', heroSubSeparator: 'et nous distinguons clairement', heroSubFrom: 'des outils que nous avons', chipToolsCatalogued: 'outils référencés', rotatingWords: ['clips', 'sous-titres', 'doublage', 'montage', 'miniatures'] },
  de: { metaTitle: 'CreatorAI Hub — KI-Tools für Video-Creator', metaDescription: 'Finde KI-Videotools mit klaren Verifizierungslabels, Preisquellen und workfloworientierter Suche.', heroSubSeparator: 'und wir trennen klar', heroSubFrom: 'von Tools, die wir', chipToolsCatalogued: 'katalogisierte Tools', rotatingWords: ['Clips', 'Untertitel', 'Synchronisation', 'Schnitt', 'Thumbnails'] },
  zh: { metaTitle: 'CreatorAI Hub —— 面向视频创作者的 AI 工具', metaDescription: '找到带有清晰验证标签、价格来源和以工作流为导向的 AI 视频工具。', heroSubSeparator: '我们明确区分', heroSubFrom: '和真正', chipToolsCatalogued: '款已收录工具', rotatingWords: ['短视频', '字幕', '配音', '剪辑', '缩略图'] },
  ar: { metaTitle: 'CreatorAI Hub — أدوات الذكاء الاصطناعي لصنّاع الفيديو', metaDescription: 'اعثر على أدوات ذكاء اصطناعي للفيديو بوسوم تحقق واضحة ومصادر أسعار واكتشاف يركز على سير العمل.', heroSubSeparator: 'ونفصل بوضوح بين', heroSubFrom: 'وبين الأدوات التي', chipToolsCatalogued: 'أداة مُدرجة', rotatingWords: ['مقاطع', 'ترجمات', 'دبلجة', 'مونتاج', 'صور مصغّرة'] },
  fa: { metaTitle: 'CreatorAI Hub — ابزارهای هوش مصنوعی برای تولیدکنندگان ویدیو', metaDescription: 'ابزارهای هوش مصنوعی ویدیو را با برچسب‌های اعتبارسنجی واضح، منابع قیمت و کشف مبتنی بر جریان کار پیدا کن.', heroSubSeparator: 'و ما به وضوح جدا می‌کنیم', heroSubFrom: 'و ابزارهایی که', chipToolsCatalogued: 'ابزار فهرست‌شده', rotatingWords: ['کلیپ', 'زیرنویس', 'دوبله', 'ادیت', 'تامبنیل'] },
};

const commonExtra = {
  es: { toggleTheme: 'Cambiar tema', switchToLight: 'Cambiar al modo claro', switchToDark: 'Cambiar al modo oscuro' },
  pt: { toggleTheme: 'Alternar tema', switchToLight: 'Mudar para o modo claro', switchToDark: 'Mudar para o modo escuro' },
  fr: { toggleTheme: 'Changer de thème', switchToLight: 'Passer en mode clair', switchToDark: 'Passer en mode sombre' },
  de: { toggleTheme: 'Design wechseln', switchToLight: 'Zum hellen Modus wechseln', switchToDark: 'Zum dunklen Modus wechseln' },
  zh: { toggleTheme: '切换主题', switchToLight: '切换到浅色模式', switchToDark: '切换到深色模式' },
  ar: { toggleTheme: 'تبديل المظهر', switchToLight: 'التبديل إلى الوضع الفاتح', switchToDark: 'التبديل إلى الوضع الداكن' },
  fa: { toggleTheme: 'تغییر تم', switchToLight: 'تغییر به حالت روشن', switchToDark: 'تغییر به حالت تیره' },
};

const cookieExtra = {
  es: { privacyLink: 'Política de privacidad' }, pt: { privacyLink: 'Política de privacidade' }, fr: { privacyLink: 'Politique de confidentialité' }, de: { privacyLink: 'Datenschutzerklärung' }, zh: { privacyLink: '隐私政策' }, ar: { privacyLink: 'سياسة الخصوصية' }, fa: { privacyLink: 'سیاست حفظ حریم خصوصی' },
};

const newsletterExtra = {
  es: { doubleOptIn: 'Doble opt-in: solo enviamos cuando una herramienta probada cambia de forma sustancial, un precio se mueve o un servicio se cierra. Date de baja con un clic en cualquier momento.', privacy: 'Privacidad' },
  pt: { doubleOptIn: 'Opt-in duplo: só enviamos quando uma ferramenta testada muda de forma relevante, um preço muda ou um serviço fecha. Cancele com um clique a qualquer momento.', privacy: 'Privacidade' },
  fr: { doubleOptIn: 'Double opt-in : nous n\'écrivons que lorsqu\'un outil testé change sensiblement, qu\'un prix bouge ou qu\'un service ferme. Désinscription en un clic à tout moment.', privacy: 'Confidentialité' },
  de: { doubleOptIn: 'Doppeltes Opt-in: Wir schreiben nur, wenn sich ein getestetes Tool wesentlich ändert, sich ein Preis bewegt oder ein Dienst eingestellt wird. Jederzeit mit einem Klick abbestellbar.', privacy: 'Datenschutz' },
  zh: { doubleOptIn: '双重确认订阅：只有当已测试工具发生重大变化、价格变动或服务关闭时，我们才会发送邮件。随时一键退订。', privacy: '隐私' },
  ar: { doubleOptIn: 'اشتراك مزدوج التأكيد: نرسل فقط عندما يتغير أداة مختبرة تغييرًا جوهريًا، أو يتحرك سعر، أو يُغلق خدمة. إلغاء الاشتراك بنقرة واحدة في أي وقت.', privacy: 'الخصوصية' },
  fa: { doubleOptIn: 'تأیید دوباره: فقط وقتی ایمیل می‌زنیم که ابزاری آزمایش‌شده تغییر مهمی کند، قیمتی تغییر کند یا سرویسی تعطیل شود. هر وقت خواستی با یک کلیک لغو کن.', privacy: 'حریم خصوصی' },
};

const en = {
  common: { toggleTheme: 'Toggle theme', switchToLight: 'Switch to light mode', switchToDark: 'Switch to dark mode' },
  cookie: { privacyLink: 'Privacy Policy' },
  newsletter: { doubleOptIn: 'Double opt-in: we only send when a tested tool changes materially, a price moves, or a service shuts down. Unsubscribe with one click any time.', privacy: 'Privacy' },
  home: { metaTitle: 'CreatorAI Hub — AI tools for video creators', metaDescription: 'Find AI video tools with clear verification labels, pricing sources, and workflow-first discovery.', rotatingWords: ['clips', 'captions', 'dubbing', 'editing', 'thumbnails'], heroSubSeparator: 'and we clearly separate', heroSubFrom: 'from tools we have', chipToolsCatalogued: 'tools catalogued' },
  categories: Object.fromEntries(Object.entries(cats).map(([k]) => [k, k])),
};

const locales = ['es', 'pt', 'fr', 'de', 'zh', 'ar', 'fa'];
const merge = (obj, patch) => {
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      obj[k] = obj[k] && typeof obj[k] === 'object' ? merge(obj[k], v) : { ...v };
    } else {
      obj[k] = v;
    }
  }
  return obj;
};

for (const loc of ['en', ...locales]) {
  const file = `messages/${loc}.json`;
  const j = JSON.parse(readFileSync(file, 'utf8'));
  if (loc === 'en') {
    merge(j, en);
  } else {
    merge(j, {
      common: commonExtra[loc],
      cookie: cookieExtra[loc],
      newsletter: newsletterExtra[loc],
      home: homeMeta[loc],
      categories: Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, v[loc]])),
    });
  }
  writeFileSync(file, JSON.stringify(j, null, 2) + '\n', 'utf8');
  console.log('patched', file);
}
