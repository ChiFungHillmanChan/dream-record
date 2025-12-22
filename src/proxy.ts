import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

const publicRoutes = ['/login', '/register'];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Allow nextjs internals and static files
  if (
    path.startsWith('/_next') || 
    path.startsWith('/api') || 
    path.startsWith('/static') || 
    path.includes('.') 
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = publicRoutes.includes(path);
  const token = request.cookies.get('session_token')?.value;
  
  let payload = null;
  if (token) {
    try {
        payload = await verifyJWT(token);
    } catch {
        console.error("Proxy JWT verify error");
    }
  }

  // If protected route and no valid token
  if (!isPublicRoute && !payload) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If public route (login/register) and valid token
  if (isPublicRoute && payload) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

