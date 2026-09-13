# MyLab

منصة دولية لمتخصصي المختبرات الطبية — معرفة طبية، مجتمع تفاعلي، وكورسات تعليم ذاتي.

## المكدس التقني (Tech Stack)
- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** (نظام ألوان مخصص مبني من هوية MyLab البصرية — راجع `src/styles/colors.md`)
- **Supabase** (Postgres + Auth + Storage + Realtime) — راجع `supabase/migrations/`
- **next-intl** للترجمة (إنجليزي/عربي) مع دعم RTL كامل

## هيكلة الموقع
1. **Knowledge** — معلومات طبية بتصنيف هرمي، نظام محتوى "Content Blocks" (كل بلوك عليه علامة مجاني/مدفوع مستقلة)
2. **Community** — نشر وتفاعل + رسائل خاصة + مجموعات
3. **Courses** — كورسات تعليم ذاتي، المدرّسون يقدروا يرفعوا ويبيعوا كورساتهم
+ محفظة عملات (coins) داخلية، ومساعد ذكاء اصطناعي مربوط بالمعرفة والكورسات

## الأدوار (Roles)
`admin` · `reviewer` · `instructor` · `member` — مستخدم واحد ممكن ياخد أكتر من دور (عبر جدول `user_roles`، دالة `has_role()` بتستخدم في كل RLS)

## التشغيل محلياً
\`\`\`bash
npm install
npm run dev -- --webpack   # Webpack إجباري على Termux/Android (Turbopack مش مدعوم)
\`\`\`

افتح http://localhost:3000

### ملاحظة بيئة Termux/Android
- لازم `--webpack` بدل Turbopack (مش مدعوم على android-arm64)
- `scripts/patch-swc-core.cjs` بيشتغل تلقائياً بعد `npm install` (postinstall) عشان يصلّح مشكلة تحميل `@swc/core` على المنصة دي — التفاصيل في تعليقات الملف نفسه

## متغيرات البيئة
انسخ القيم دي في ملف `.env.local` (مش متتبع في Git):
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
\`\`\`

## قواعد التطوير
- أي تعديل في قاعدة البيانات = ملف migration في `supabase/migrations/`، مش تعديل يدوي من لوحة Supabase
- بنية مجلدات معيارية: كل قسم في مساره الخاص، حدود واضحة
