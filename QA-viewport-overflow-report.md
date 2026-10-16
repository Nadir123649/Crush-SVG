# Mobile and desktop viewport overflow regression report

**Result: PASS**

**Test run:** Playwright, Chromium, local development server

**Regression specs:** [`tests/e2e/viewport-overflow.spec.ts`](tests/e2e/viewport-overflow.spec.ts), [`tests/e2e/header-zoom-layout.spec.ts`](tests/e2e/header-zoom-layout.spec.ts)

## Checks performed

The test loaded each route and checked that the document had no horizontal overflow (`document.documentElement.scrollWidth` did not exceed `clientWidth`). It also treated missing responses and HTTP errors as failures.

| Viewport | Routes checked | Result |
| --- | ---: | --- |
| Desktop, 1280x800 | 36: six tools x six locales | PASS |
| Mobile, 375x812 | 11 reported route/locale cases | PASS |
| Header, 1024px, 1280px, 1440px, 1536px, and 1600px | 30 locale/width layout checks | PASS |
| Mobile header drawer, 375px | 1 navigation access check | PASS |
| **Total** | **78 route and layout checks** | **PASS** |

### Desktop routes

Each route below was checked for `en`, `ja`, `pt`, `fr`, `de`, and `es`:

- `/svg-to-react`
- `/svg-optimizer`
- `/image-resizer`
- `/favicon-generator`
- `/background-remover`
- `/png-to-svg`

English routes use the unprefixed path; other locales use `/{locale}/{route}`.

### Mobile routes

- `/svg-to-react` for `en`, `ja`, `pt`, `fr`, `de`, and `es`
- `/pt/image-resizer`, `/fr/image-resizer`, and `/es/image-resizer`
- `/pt/png-to-svg`
- `/pt/convert-svg-to-png`

## Outcome

All 47 route/viewport checks passed. The header layout checks passed at 1024px, 1280px, 1440px, 1536px, and 1600px in all six locales: the navigation fits between the logo and account controls without overlap or clipped options. At 375px, the mobile drawer keeps the navigation links accessible. No tested page had document-level horizontal scrolling, and no route returned a missing or HTTP error response.

`git diff --check` also passed.

## Environment note

The local app logged a MongoDB DNS connection warning while starting. It did not prevent the tested pages from loading or the viewport checks from completing. Browser console also emitted existing image sizing and AdSense script warnings; these did not cause test failures.
