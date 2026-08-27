import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host');
  const url = req.nextUrl;

  // Agar request api.crushsvg.net ya staging-api.crushsvg.net se aa rahi hai
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
      return NextResponse.rewrite(new URL(`/api${url.pathname}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
