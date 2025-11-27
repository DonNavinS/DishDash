import { auth } from '@/auth';
import { redirect } from 'next/navigation';

/**
 * Require admin role (server-side only)
 * Redirects to dashboard if not admin
 * Returns session if admin
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session) {
    redirect('/sign-in');
  }

  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return session;
}
