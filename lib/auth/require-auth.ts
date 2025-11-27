import { auth } from '@/auth';
import { redirect } from 'next/navigation';

/**
 * Require authentication (server-side only)
 * Redirects to sign-in if not authenticated
 * Returns session if authenticated
 */
export async function requireAuth(callbackUrl?: string) {
  const session = await auth();

  if (!session) {
    const url = callbackUrl
      ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : '/sign-in';
    redirect(url);
  }

  return session;
}
