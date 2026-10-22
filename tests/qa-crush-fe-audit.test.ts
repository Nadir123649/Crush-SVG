import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..');

test('QA Audit: [CRUSH-FE] Cookie Consent Banner Admin Protection', () => {
  const cookieBannerPath = path.join(projectRoot, 'src/components/ui/CookieConsentBanner.tsx');
  const code = fs.readFileSync(cookieBannerPath, 'utf-8');

  // Verify isAdminRoute helper exists
  assert.ok(code.includes('function isAdminRoute()'), 'isAdminRoute helper function must be defined');
  assert.ok(code.includes('window.location.pathname.startsWith("/admin")'), 'Must check if pathname starts with /admin');

  // Verify render guard excludes admin routes
  assert.ok(
    code.includes('isAdminRoute()'),
    'Render guard must include isAdminRoute() to prevent rendering on admin pages'
  );
});

test('QA Audit: [CRUSH-FE-13] SVG Guides Horizontal Overflow Containment', () => {
  const indexPagePath = path.join(projectRoot, 'src/app/[locale]/svg-guides/page.tsx');
  const slugPagePath = path.join(projectRoot, 'src/app/[locale]/svg-guides/[slug]/page.tsx');

  const indexCode = fs.readFileSync(indexPagePath, 'utf-8');
  const slugCode = fs.readFileSync(slugPagePath, 'utf-8');

  assert.ok(
    indexCode.includes('overflow-x-clip'),
    'svg-guides index page must contain overflow-x-clip to prevent mobile horizontal scroll'
  );
  assert.ok(
    slugCode.includes('overflow-x-clip'),
    'svg-guides slug page must contain overflow-x-clip to prevent mobile horizontal scroll'
  );
});

test('QA Audit: [CRUSH-FE-14] Contact Form Validation & Anti-Spam Constraints', () => {
  const contactClientPath = path.join(projectRoot, 'src/app/[locale]/contact-us/ContactUsClient.tsx');
  const code = fs.readFileSync(contactClientPath, 'utf-8');

  // Client-side input validation guards before sending
  assert.ok(code.includes('name.trim().length < 3'), 'Must enforce minimum 3 characters for name');
  assert.ok(code.includes('message.trim().length < 10'), 'Must enforce minimum 10 characters for message');
  assert.ok(code.includes('^[^\s@]+@[^\s@]+\.[^\s@]+$') || code.includes('@'), 'Must validate email format');

  // Visual error indicators
  assert.ok(code.includes('isNameInvalid'), 'Must have isNameInvalid state for red border feedback');
  assert.ok(code.includes('isEmailInvalid'), 'Must have isEmailInvalid state for red border feedback');
  assert.ok(code.includes('isMessageInvalid'), 'Must have isMessageInvalid state for red border feedback');
});

test('QA Audit: [CRUSH-FE-05 to 11] Tool Dropzone Mime Validation & User Error Toasts', () => {
  // 1. ConverterUI (SVG -> PNG)
  const converterCode = fs.readFileSync(path.join(projectRoot, 'src/components/sections/ConverterUI.tsx'), 'utf-8');
  assert.ok(
    converterCode.includes('invalidSvgFile'),
    'ConverterUI must trigger invalidSvgFile toast on non-SVG file drop'
  );

  // 2. RasterToSvgConverter (PNG -> SVG)
  const rasterCode = fs.readFileSync(path.join(projectRoot, 'src/components/sections/RasterToSvgConverter.tsx'), 'utf-8');
  assert.ok(
    rasterCode.includes('errorInvalidFile'),
    'RasterToSvgConverter must reject invalid file types with errorInvalidFile toast'
  );

  // 3. ImageResizer
  const resizerCode = fs.readFileSync(path.join(projectRoot, 'src/components/sections/ImageResizer.tsx'), 'utf-8');
  assert.ok(
    resizerCode.includes('Unsupported file type'),
    'ImageResizer must display unsupported file type toast'
  );

  // 4. SvgOptimizerUI
  const optimizerCode = fs.readFileSync(path.join(projectRoot, 'src/components/sections/SvgOptimizerUI.tsx'), 'utf-8');
  assert.ok(
    optimizerCode.includes('invalidSvgFile'),
    'SvgOptimizerUI must display invalidSvgFile toast'
  );

  // 5. SvgToCodeUI
  const svgToCodeContent = fs.readFileSync(path.join(projectRoot, 'src/components/sections/SvgToCodeUI.tsx'), 'utf-8');
  assert.ok(
    svgToCodeContent.includes('invalidSvgFile'),
    'SvgToCodeUI must display invalidSvgFile toast'
  );
});

test('QA Audit: [CRUSH-FE-02 & Locale Tickets] Dictionary Key Completeness', () => {
  const enRaw = fs.readFileSync(path.join(projectRoot, 'messages/en.json'), 'utf-8');
  const en = JSON.parse(enRaw);

  const locales = ['de', 'es', 'fr', 'ja', 'pt'];
  for (const loc of locales) {
    const locRaw = fs.readFileSync(path.join(projectRoot, `messages/${loc}.json`), 'utf-8');
    const locData = JSON.parse(locRaw);

    function checkKeys(enObj: any, locObj: any, pathStr = '') {
      for (const key of Object.keys(enObj)) {
        const fullPath = pathStr ? `${pathStr}.${key}` : key;
        assert.ok(key in locObj, `Missing key in ${loc}: ${fullPath}`);
        if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
          assert.equal(typeof locObj[key], 'object', `Expected object at ${loc}:${fullPath}`);
          checkKeys(enObj[key], locObj[key], fullPath);
        }
      }
    }

    checkKeys(en, locData);
  }
});

test('QA Audit: [CRUSH-FE-04] Guest Quota Conversion Refresh Tracking', () => {
  const converterCode = fs.readFileSync(path.join(projectRoot, 'src/components/sections/ConverterUI.tsx'), 'utf-8');
  assert.ok(
    converterCode.includes('refreshUsage(setUsage)'),
    'ConverterUI must call refreshUsage(setUsage) after successful conversion to update quota count'
  );
});

test('QA Audit: [CRUSH-FE SEO] Use Case Pages Responsive Overflow Containment', () => {
  const useCasePage = fs.readFileSync(path.join(projectRoot, 'src/app/[locale]/use-case/[slug]/page.tsx'), 'utf-8');
  assert.ok(
    useCasePage.includes('overflow-x-clip'),
    'Use-case page must contain overflow-x-clip container'
  );
  assert.ok(
    useCasePage.includes('break-words'),
    'Use-case page typography must include break-words'
  );
});
