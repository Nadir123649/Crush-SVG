import { NextRequest, NextResponse } from 'next/server'
import { getRequestId } from '@/lib/shared/logger'

export function proxy(request: NextRequest): NextResponse {
  const hostname = request.headers.get('host');
  const url = request.nextUrl;

  // 1. Agar request api.crushsvg.net ya staging-api.crushsvg.net se aa rahi hai
  if (hostname === 'api.crushsvg.net' || hostname === 'staging-api.crushsvg.net') {
    
    // Agar koi directly base URL (api.crushsvg.net/) khole
    if (url.pathname === '/') {
      return NextResponse.json(
        { status: "online", service: "CrushSVG API Gateway" }, 
        { status: 200 }
      );
    }

    // Agar path /api se shuru nahi hota, toh usay internal /api folder par rewrite kar do
    if (!url.pathname.startsWith('/api')) {
      const rewrittenUrl = new URL(`/api${url.pathname}`, request.url);
      return NextResponse.rewrite(rewrittenUrl);
    }
  }

  // 2. Normal Frontend Requests ke liye original proxy logic (Request ID header)
  const requestId = getRequestId(request);
  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);
  return response;
}

export const config = {
  // Matcher ko broad karna parega taake yeh root domain aur subdomain dono ko catch kar sake
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
