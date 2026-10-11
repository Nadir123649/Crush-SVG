/**
 * CrushSVG Backend Bug Fix - Local Test Script
 * Tests all 5 fixed bugs against http://localhost:3000
 *
 * Run: node test_all_fixes.js
 */

const BASE = 'http://localhost:3000';

async function test(name, fn) {
  try {
    const result = await fn();
    const ok = result.pass;
    console.log(`${ok ? '✅' : '❌'} ${name}`);
    if (!ok) console.log(`   DETAIL: ${result.detail}`);
    return ok;
  } catch (err) {
    console.log(`❌ ${name}`);
    console.log(`   ERROR: ${err.message}`);
    return false;
  }
}

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="red"/></svg>';

async function main() {
  console.log('\n==============================');
  console.log('  CrushSVG Bug Fix Test Suite');
  console.log('==============================\n');

  let passed = 0;
  let total = 0;

  // ── API-01: /api/v1/optimize is now PUBLIC (was returning 401) ──────────────
  total++;
  passed += await test('API-01: POST /api/v1/optimize returns 200 JSON (not 401)', async () => {
    const res = await fetch(`${BASE}/api/v1/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ svg: SVG }),
    });
    const body = await res.json().catch(() => null);
    if (res.status !== 200) return { pass: false, detail: `Got ${res.status}, body: ${JSON.stringify(body)}` };
    if (!body?.success) return { pass: false, detail: `success=false, body: ${JSON.stringify(body)}` };
    if (!body?.optimized_svg) return { pass: false, detail: `no optimized_svg in response` };
    return { pass: true };
  });

  // ── API-01: Response is JSON not HTML ───────────────────────────────────────
  total++;
  passed += await test('API-01: /api/v1/optimize Content-Type is application/json', async () => {
    const res = await fetch(`${BASE}/api/v1/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ svg: SVG }),
    });
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json')
      ? { pass: true }
      : { pass: false, detail: `Content-Type: ${ct}` };
  });

  // ── API-02: Convert SLA — must respond in < 2000ms ─────────────────────────
  total++;
  passed += await test('API-02: POST /api/v1/convert responds in < 2000ms (was 6.4s)', async () => {
    const start = Date.now();
    const res = await fetch(`${BASE}/api/v1/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ svg: SVG, format: 'png', transparent: true }),
    });
    const elapsed = Date.now() - start;
    if (!res.ok) return { pass: false, detail: `HTTP ${res.status} after ${elapsed}ms` };
    return elapsed < 2000
      ? { pass: true }
      : { pass: false, detail: `Took ${elapsed}ms, SLA is 2000ms` };
  });

  // ── BUG-03: Max width now accepts 8192 (was rejected at 4001+) ─────────────
  total++;
  passed += await test('BUG-03: /api/v1/convert accepts width=8192 (was max 4000)', async () => {
    const res = await fetch(`${BASE}/api/v1/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ svg: SVG, format: 'png', width: 8192 }),
    });
    if (res.status === 200 || res.status === 201) return { pass: true };
    const body = await res.json().catch(() => null);
    return { pass: false, detail: `HTTP ${res.status}: ${JSON.stringify(body)}` };
  });

  // ── BUG-03: Width > 8192 is correctly rejected ─────────────────────────────
  total++;
  passed += await test('BUG-03: /api/v1/convert rejects width=9000 with 400/422', async () => {
    const res = await fetch(`${BASE}/api/v1/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ svg: SVG, format: 'png', width: 9000 }),
    });
    return (res.status === 400 || res.status === 422)
      ? { pass: true }
      : { pass: false, detail: `Expected 400/422, got ${res.status}` };
  });

  // ── API-01: Invalid SVG body still returns 400 JSON (error path works) ──────
  total++;
  passed += await test('API-01: /api/v1/optimize returns 400 for invalid body (not 500 HTML)', async () => {
    const res = await fetch(`${BASE}/api/v1/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ svg: 'not_an_svg' }),
    });
    const ct = res.headers.get('content-type') || '';
    const body = await res.json().catch(() => null);
    if (!ct.includes('application/json')) return { pass: false, detail: `Not JSON: ${ct}` };
    if (res.status !== 400) return { pass: false, detail: `Expected 400, got ${res.status}` };
    return { pass: true };
  });

  // ── Health endpoint sanity check ────────────────────────────────────────────
  total++;
  passed += await test('SANITY: GET /api/v1/health returns 200', async () => {
    const res = await fetch(`${BASE}/api/v1/health`);
    return res.ok ? { pass: true } : { pass: false, detail: `HTTP ${res.status}` };
  });

  console.log(`\n==============================`);
  console.log(`  Results: ${passed}/${total} PASSED`);
  if (passed === total) {
    console.log('  🎉 ALL TESTS PASSED — Ready to push!');
  } else {
    console.log('  ⚠️  Some tests failed. Check details above.');
  }
  console.log('==============================\n');
}

main().catch(console.error);
