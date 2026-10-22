import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { registerSchema, changePasswordSchema, resetPasswordSchema } from '../src/lib/auth/auth-validation.ts';
import { getApiDocsRedirect } from '../src/lib/openapi/constants.ts';

const projectRoot = path.resolve(__dirname, '..');

test('QA Backend Audit: [Backend / Security] Password Length Ceiling Expanded to 128 chars (z8tvbhwbj0)', () => {
  const passphrase64 = 'correct-horse-battery-staple-super-secure-passphrase-with-64-len';
  const passphrase128 = 'a'.repeat(128);
  const passphrase129 = 'a'.repeat(129);

  // 1. registerSchema
  const reg64 = registerSchema.safeParse({ name: 'ValidName', email: 'test@example.com', password: passphrase64 });
  assert.ok(reg64.success, 'registerSchema must accept 64-character password');

  const reg128 = registerSchema.safeParse({ name: 'ValidName', email: 'test@example.com', password: passphrase128 });
  assert.ok(reg128.success, 'registerSchema must accept 128-character password');

  const reg129 = registerSchema.safeParse({ name: 'ValidName', email: 'test@example.com', password: passphrase129 });
  assert.equal(reg129.success, false, 'registerSchema must reject >128-character password');

  // 2. changePasswordSchema
  const change128 = changePasswordSchema.safeParse({ currentPassword: 'oldPassword123', newPassword: passphrase128 });
  assert.ok(change128.success, 'changePasswordSchema must accept 128-character newPassword');

  // 3. resetPasswordSchema
  const reset128 = resetPasswordSchema.safeParse({ password: passphrase128 });
  assert.ok(reset128.success, 'resetPasswordSchema must accept 128-character password');
});

test('QA Backend Audit: [Backend / Security] Login Rate Limiting Configured (z8tvbhwbj1)', () => {
  const loginRouteCode = fs.readFileSync(path.join(projectRoot, 'src/app/api/v1/auth/login/route.ts'), 'utf-8');
  assert.ok(
    loginRouteCode.includes("checkRateLimit(request, 'auth:login', 5, 60_000)"),
    'Login route must limit to 5 attempts per window'
  );
  assert.ok(
    loginRouteCode.includes("rateLimitHeaders(rl)"),
    'Login route must return rateLimitHeaders with Retry-After when rate limited'
  );
});

test('QA Backend Audit: [Backend / Error Handling] Empty Payload Handling on Vectorize & Bg-Remove (z8tvbhwbj2)', () => {
  const vectorizeCode = fs.readFileSync(path.join(projectRoot, 'src/app/api/v1/vectorize/route.ts'), 'utf-8').replace(/\r\n/g, '\n');
  const bgRemoveCode = fs.readFileSync(path.join(projectRoot, 'src/app/api/v1/background-remove/route.ts'), 'utf-8').replace(/\r\n/g, '\n');

  // Vectorize
  assert.ok(vectorizeCode.includes('form = await request.formData();'), 'Vectorize must read formData');
  assert.ok(vectorizeCode.includes('!(file instanceof File) || file.size === 0'), 'Vectorize must check file instance and non-zero size');
  assert.ok(vectorizeCode.includes('"missing_file"'), 'Vectorize must return missing_file on empty/invalid payload');

  // Bg-Remove
  assert.ok(bgRemoveCode.includes('form = await request.formData();'), 'Background-remove must read formData');
  assert.ok(bgRemoveCode.includes('!(file instanceof File) || file.size === 0'), 'Background-remove must check file instance and non-zero size');
  assert.ok(bgRemoveCode.includes('"missing_file"'), 'Background-remove must return missing_file on empty/invalid payload');
});

test('QA Backend Audit: [Backend / Security] JWT Access Token Expiration Shortened to 15m (z8tvbhwbj3)', () => {
  const tokensCode = fs.readFileSync(path.join(projectRoot, 'src/lib/auth/tokens.ts'), 'utf-8');
  assert.ok(
    tokensCode.includes('process.env.ACCESS_TOKEN_EXPIRES || "15m"'),
    'ACCESS_TOKEN_EXPIRES default must be 15m (15 minutes), not 7d'
  );
});

test('QA Backend Audit: [Backend / Security] Health Check Sanitized for Public Telemetry Leakage (z8tvbhwbj4)', () => {
  const healthCode = fs.readFileSync(path.join(projectRoot, 'src/app/api/v1/health/route.ts'), 'utf-8');
  assert.ok(
    healthCode.includes('{ status: allHealthy ? \'ok\' : \'degraded\' }'),
    'Public response must return sanitized { status: "ok" }'
  );
  assert.ok(
    healthCode.includes('who.user.role === \'admin\''),
    'Detailed telemetry must only be returned for authenticated admin staff'
  );
});

test('QA Backend Audit: [Backend / API Docs] Raw OpenAPI 3.1 & /v1/docs Aliases (z8tvbhwbj5)', () => {
  // Test /v1/docs redirect
  const redirect = getApiDocsRedirect('/v1/docs', 'GET', 'api.crushsvg.net');
  assert.equal(redirect?.toString(), 'https://www.crushsvg.net/api-docs', '/v1/docs must redirect to /api-docs');

  // Verify OpenAPI 3.1 spec version
  const openApiCode = fs.readFileSync(path.join(projectRoot, 'src/app/api/openapi/route.ts'), 'utf-8');
  assert.ok(openApiCode.includes('openapi: "3.1.0"'), 'OpenAPI generator must specify version 3.1.0');

  // Verify route endpoints exist
  assert.ok(fs.existsSync(path.join(projectRoot, 'src/app/openapi.json/route.ts')), 'src/app/openapi.json/route.ts must exist');
  assert.ok(fs.existsSync(path.join(projectRoot, 'src/app/api/v1/openapi/route.ts')), 'src/app/api/v1/openapi/route.ts must exist');
});
