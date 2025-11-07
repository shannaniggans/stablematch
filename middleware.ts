import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

const AUTH_EXEMPT_PATHS = ['/signin', '/portal/signin', '/portal/register'];
const AUTH_EXEMPT_API_PREFIXES = ['/api/auth', '/api/health', '/api/portal/register'];

function isProtectedPath(pathname: string) {
  if (pathname.startsWith('/_next') || pathname.startsWith('/static')) return false;
  if (pathname.startsWith('/api')) {
    return !AUTH_EXEMPT_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  }
  return !AUTH_EXEMPT_PATHS.includes(pathname);
}

export async function middleware(req: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }
  if (!isProtectedPath(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const practiceHeader = req.headers.get('x-practice-id');
  const userHeader = req.headers.get('x-user-id');
  if (practiceHeader && userHeader) {
    return NextResponse.next();
  }

  const session = await auth(req);
  if (!session?.user) {
    if (req.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const target = req.nextUrl.pathname.startsWith('/portal') ? '/portal/signin' : '/signin';
    const signInUrl = new URL(target, req.url);
    signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  const headers = new Headers(req.headers);
  headers.set('x-practice-id', session.user.practiceId);
  headers.set('x-user-id', session.user.id);

  return NextResponse.next({
    request: {
      headers,
    },
  });
}

export const config = {
  matcher: ['/((?!.*\.).*)'],
};
