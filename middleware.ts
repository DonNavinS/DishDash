import { auth } from '@/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Public routes
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/api/auth');

  // If accessing protected route without auth, redirect to sign-in
  if (!isPublicRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname);
    return Response.redirect(
      new URL(`/sign-in?callbackUrl=${callbackUrl}`, req.url)
    );
  }

  // If logged in and trying to access sign-in, redirect to dashboard
  if (pathname.startsWith('/sign-in') && isLoggedIn) {
    return Response.redirect(new URL('/dashboard', req.url));
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
