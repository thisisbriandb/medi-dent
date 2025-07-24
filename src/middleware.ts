
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value || request.headers.get('Authorization');
  const { pathname } = request.nextUrl;

  // Liste des routes publiques
  const publicRoutes = ['/', '/login', '/register'];
  
  // Routes du dashboard
  const dashboardRoutes = ['/dashboard'];

  // Si c'est une route publique ou une route d'inscription, on autorise l'accès
  if (publicRoutes.includes(pathname) || 
      pathname.startsWith('/register/') || 
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Si l'utilisateur n'est pas authentifié et essaie d'accéder à une route protégée
  if (!authToken && (pathname.startsWith('/dashboard') || pathname.startsWith('/profile'))) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    return response;
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