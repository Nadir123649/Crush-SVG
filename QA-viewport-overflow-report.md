# Mobile and desktop viewport overflow regression report

**Result: PASS**

**Test run:** Playwright, Chromium, local development server

**Regression spec:** [`tests/e2e/viewport-overflow.spec.ts`](tests/e2e/viewport-overflow.spec.ts)

## Checks performed

The test loaded each route and checked that the document had no horizontal overflow (`document.documentElement.scrollWidth` did not exceed `clientWidth`). It also treated missing responses and HTTP errors as failures.

| Viewport | Routes checked | Result |
| --- | ---: | --- |
| Desktop, 1280x800 | 36: six tools x six locales | PASS |
| Mobile, 375x812 | 11 reported route/locale cases | PASS |
| **Total** | **47 route/viewport checks** | **PASS** |

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

All 47 checks passed. No tested page had document-level horizontal scrolling, and no route returned a missing or HTTP error response. No layout fixes were needed after this run.

`git diff --check` also passed.

## Environment note

The local app logged a MongoDB DNS connection warning while starting. It did not prevent the tested pages from loading or the viewport checks from completing. Browser console also emitted existing image sizing and AdSense script warnings; these did not cause test failures.
