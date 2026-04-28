import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes
  if (
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/') ||
    pathname === '/manifest.json' ||
    pathname === '/og-image.jpg' ||
    pathname.startsWith('/sw.') ||
    pathname.startsWith('/demo')
  ) {
    return NextResponse.next()
  }

  const session = request.cookies.get('anjin_session')
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin routes
  if (pathname.startsWith('/admin')) {
    const isAdmin = request.cookies.get('anjin_admin')?.value === 'true'
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|demo).*)'],
}
