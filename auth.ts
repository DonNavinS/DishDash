import NextAuth, { DefaultSession } from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import EmailProvider from 'next-auth/providers/email';
import { db } from '@/lib/db';
import { sendMagicLinkEmail } from '@/lib/email/magic-link-template';
import { eq } from 'drizzle-orm';
import { users } from '@/lib/db/schema';

// Validate required environment variables
if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

// Extend NextAuth types to include role
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'admin' | 'user';
    } & DefaultSession['user'];
  }

  interface User {
    role: 'admin' | 'user';
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: DrizzleAdapter(db) as any,
  providers: [
    EmailProvider({
      server: {
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      sendVerificationRequest: sendMagicLinkEmail,
    }),
  ],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user }) {
      // Auto-create user with role if doesn't exist
      if (!user.role && user.id) {
        const isAdmin =
          user.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();

        // Update user with role
        await db
          .update(users)
          .set({
            role: isAdmin ? 'admin' : 'user',
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id as string));
      }
      return true;
    },
    async session({ session, user }) {
      // Add user ID and role to session
      if (session.user) {
        session.user.id = user.id as string;
        session.user.role = user.role as 'admin' | 'user';
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
    verifyRequest: '/sign-in/verify',
  },
});
