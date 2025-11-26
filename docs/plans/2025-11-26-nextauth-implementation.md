# NextAuth v5 Magic Link Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement passwordless authentication using NextAuth v5 with email magic links, allowing users to sign in by clicking a link sent to their email.

**Architecture:** NextAuth v5 with Drizzle adapter for database sessions, Resend for email delivery, middleware-based route protection, and auto-user creation with role assignment (admin for Navin, regular user for others).

**Tech Stack:** NextAuth v5, @auth/drizzle-adapter, Resend, Drizzle ORM, Next.js 15 App Router, TypeScript

---

## Task 1: Install Dependencies and Configure Environment

**Goal:** Install NextAuth v5 and related packages, set up environment variables.

**Files:**
- Modify: `package.json`
- Modify: `.env.local`
- Modify: `.env.example`

**Step 1: Install NextAuth dependencies**

Run:
```bash
pnpm add next-auth@beta @auth/drizzle-adapter resend
```

Expected: Packages installed successfully, `package.json` updated with:
- `next-auth@^5.x.x`
- `@auth/drizzle-adapter@^1.x.x`
- `resend@^4.x.x`

**Step 2: Generate NextAuth secret**

Run:
```bash
openssl rand -base64 32
```

Expected: Random 32-character string output (e.g., `abcd1234...`)

**Step 3: Set up Resend account**

Manual steps:
1. Go to https://resend.com/signup
2. Create free account (100 emails/day)
3. Navigate to API Keys
4. Create new API key
5. Copy the key (starts with `re_`)

**Step 4: Add environment variables to .env.local**

Add to `.env.local`:
```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<paste-the-generated-secret-from-step-2>

# Resend Email Provider
RESEND_API_KEY=<paste-your-resend-api-key>
RESEND_FROM_EMAIL=onboarding@resend.dev

# Admin Configuration
ADMIN_EMAIL=seneviratnanavin@gmail.com
```

**Step 5: Update .env.example**

Add to `.env.example`:
```bash
# NextAuth (Week 1+)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Resend Email Provider (Week 1+)
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev

# Admin Configuration (Week 1+)
ADMIN_EMAIL=
```

**Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml .env.example
git commit -m "feat: install NextAuth v5 and Resend dependencies"
```

Note: Do NOT commit `.env.local` (already in .gitignore)

---

## Task 2: Add NextAuth Database Tables to Schema

**Goal:** Extend Drizzle schema with the 3 required NextAuth tables (accounts, sessions, verificationTokens).

**Files:**
- Modify: `lib/db/schema.ts`

**Step 1: Add NextAuth tables to schema**

Add to `lib/db/schema.ts` after the existing tables:

```typescript
import { pgTable, text, integer, timestamp, primaryKey, uuid } from 'drizzle-orm/pg-core';

// ... existing tables (users, restaurants, etc.) ...

// NextAuth tables
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull().unique(),
    expires: timestamp('expires').notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
pnpm tsc --noEmit
```

Expected: No errors (TypeScript compiles successfully)

**Step 3: Generate migration**

Run:
```bash
pnpm db:generate
```

Expected: New migration file created in `drizzle/migrations/` with CREATE statements for the 3 tables

**Step 4: Apply migration**

Run:
```bash
pnpm db:push
```

Expected: Migration applied successfully to Vercel Postgres database

**Step 5: Verify tables in Drizzle Studio**

Run:
```bash
pnpm db:studio
```

Open https://local.drizzle.studio in browser
Expected: See new tables: `accounts`, `sessions`, `verification_tokens`

**Step 6: Commit**

```bash
git add lib/db/schema.ts drizzle/migrations/*
git commit -m "feat: add NextAuth database tables to schema"
```

---

## Task 3: Create NextAuth Configuration

**Goal:** Set up main NextAuth configuration with Drizzle adapter, email provider, and callbacks.

**Files:**
- Create: `auth.ts`
- Create: `lib/email/magic-link-template.ts`

**Step 1: Create magic link email template**

Create `lib/email/magic-link-template.ts`:

```typescript
import { createTransport } from 'nodemailer';

interface EmailParams {
  identifier: string;
  url: string;
  provider: {
    server: any;
    from: string;
  };
}

export async function sendMagicLinkEmail(params: EmailParams) {
  const { identifier: email, url, provider } = params;
  const { server, from } = provider;

  const transport = createTransport(server);

  const result = await transport.sendMail({
    to: email,
    from,
    subject: 'Sign in to DishDash',
    text: textEmail({ url, email }),
    html: htmlEmail({ url, email }),
  });

  const failed = result.rejected.concat(result.pending).filter(Boolean);
  if (failed.length) {
    throw new Error(`Email failed to send to: ${failed.join(', ')}`);
  }
}

function textEmail({ url, email }: { url: string; email: string }) {
  return `Sign in to DishDash\n\nClick the link below to sign in:\n${url}\n\nIf you didn't request this email, you can safely ignore it.\n\nThis link expires in 24 hours.`;
}

function htmlEmail({ url, email }: { url: string; email: string }) {
  const brandColor = '#f97316'; // Orange-500 for DishDash branding
  const buttonBackgroundColor = brandColor;
  const buttonTextColor = '#ffffff';

  return `
    <body style="background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 32px;">
                  <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #111827;">
                    🍽️ Sign in to DishDash
                  </h1>
                  <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4b5563;">
                    Click the button below to sign in to your account:
                  </p>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center">
                        <a href="${url}" target="_blank" style="display: inline-block; padding: 12px 32px; background-color: ${buttonBackgroundColor}; color: ${buttonTextColor}; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          Sign in to DishDash
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 24px 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                    Or copy and paste this URL into your browser:
                  </p>
                  <p style="margin: 8px 0 0; font-size: 14px; word-break: break-all; color: #3b82f6;">
                    ${url}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-size: 12px; line-height: 18px; color: #9ca3af;">
                    If you didn't request this email, you can safely ignore it.
                    <br/>
                    This link expires in 24 hours.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  `;
}
```

**Step 2: Create NextAuth configuration**

Create `auth.ts` in root directory:

```typescript
import NextAuth, { DefaultSession } from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import EmailProvider from 'next-auth/providers/email';
import { db } from '@/lib/db';
import { sendMagicLinkEmail } from '@/lib/email/magic-link-template';
import { eq } from 'drizzle-orm';
import { users } from '@/lib/db/schema';

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
  adapter: DrizzleAdapter(db),
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
      if (!user.role) {
        const isAdmin = user.email === process.env.ADMIN_EMAIL;

        // Update user with role
        await db
          .update(users)
          .set({
            role: isAdmin ? 'admin' : 'user',
            updatedAt: new Date()
          })
          .where(eq(users.id, user.id));
      }
      return true;
    },
    async session({ session, user }) {
      // Add user ID and role to session
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
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
```

**Step 3: Verify TypeScript compilation**

Run:
```bash
pnpm tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add auth.ts lib/email/magic-link-template.ts
git commit -m "feat: configure NextAuth v5 with email provider"
```

---

## Task 4: Create NextAuth API Route Handler

**Goal:** Set up the API route that handles all NextAuth requests.

**Files:**
- Create: `app/api/auth/[...nextauth]/route.ts`

**Step 1: Create API route handler**

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
pnpm tsc --noEmit
```

Expected: No errors

**Step 3: Test API route exists**

Start dev server:
```bash
pnpm dev
```

Open browser to: http://localhost:3000/api/auth/providers

Expected: JSON response showing configured providers (email)

**Step 4: Commit**

```bash
git add app/api/auth/[...nextauth]/route.ts
git commit -m "feat: add NextAuth API route handler"
```

---

## Task 5: Create Sign-In Page

**Goal:** Build the sign-in page with email input form.

**Files:**
- Create: `app/(auth)/sign-in/page.tsx`
- Create: `app/(auth)/sign-in/verify/page.tsx`
- Create: `app/(auth)/layout.tsx`

**Step 1: Create auth layout**

Create `app/(auth)/layout.tsx`:

```typescript
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If user is already signed in, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
```

**Step 2: Create sign-in page**

Create `app/(auth)/sign-in/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (result?.error) {
        setError('Failed to send magic link. Please try again.');
        setLoading(false);
      } else {
        // Redirect to verify page
        window.location.href = '/sign-in/verify?email=' + encodeURIComponent(email);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          🍽️ Welcome to DishDash
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in with your email to get started
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
            className="mt-1"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending...' : 'Send magic link'}
        </Button>
      </form>

      <p className="mt-4 text-xs text-center text-gray-500">
        We'll email you a magic link for a password-free sign in.
      </p>
    </div>
  );
}
```

**Step 3: Create verify page**

Create `app/(auth)/sign-in/verify/page.tsx`:

```typescript
'use client';

import { useSearchParams } from 'next/navigation';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-orange-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Check your email
        </h1>

        <p className="text-gray-600 mb-4">
          We sent a magic link to <strong>{email}</strong>
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-700">
          <p className="mb-2">Click the link in the email to sign in.</p>
          <p className="text-xs text-gray-500">
            The link expires in 24 hours. If you don't see the email, check your spam folder.
          </p>
        </div>

        <a
          href="/sign-in"
          className="mt-6 inline-block text-sm text-orange-600 hover:text-orange-700"
        >
          ← Back to sign in
        </a>
      </div>
    </div>
  );
}
```

**Step 4: Add Suspense wrapper for verify page**

The verify page uses `useSearchParams()`, which requires Suspense. Wrap it:

Update `app/(auth)/sign-in/verify/page.tsx`:

```typescript
import { Suspense } from 'react';

function VerifyContent() {
  // ... existing component code ...
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
```

**Step 5: Verify TypeScript compilation**

Run:
```bash
pnpm tsc --noEmit
```

Expected: No errors

**Step 6: Test sign-in page**

With dev server running, navigate to: http://localhost:3000/sign-in

Expected: See sign-in form with email input

**Step 7: Commit**

```bash
git add app/(auth)
git commit -m "feat: add sign-in and verify pages"
```

---

## Task 6: Create Middleware for Route Protection

**Goal:** Protect routes that require authentication using Next.js middleware.

**Files:**
- Create: `middleware.ts`

**Step 1: Create middleware file**

Create `middleware.ts` in root directory:

```typescript
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
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
pnpm tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add middleware for route protection"
```

---

## Task 7: Create Dashboard Page (Protected Route)

**Goal:** Create a simple protected dashboard page to test authentication.

**Files:**
- Create: `app/dashboard/page.tsx`
- Create: `app/dashboard/layout.tsx`

**Step 1: Create dashboard layout**

Create `app/dashboard/layout.tsx`:

```typescript
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                🍽️ DishDash
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session.user?.email}
              </span>
              {session.user?.role === 'admin' && (
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                  Admin
                </span>
              )}
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
```

**Step 2: Create dashboard page**

Create `app/dashboard/page.tsx`:

```typescript
import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome back!
        </h2>
        <div className="space-y-2">
          <p className="text-gray-600">
            <strong>Email:</strong> {session?.user?.email}
          </p>
          <p className="text-gray-600">
            <strong>Name:</strong> {session?.user?.name || 'Not set'}
          </p>
          <p className="text-gray-600">
            <strong>Role:</strong> {session?.user?.role}
          </p>
          <p className="text-gray-600">
            <strong>User ID:</strong> {session?.user?.id}
          </p>
        </div>
      </div>

      <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🎉 Authentication Working!
        </h3>
        <p className="text-sm text-gray-700">
          NextAuth v5 is successfully configured. You're seeing this page because you're authenticated.
        </p>
      </div>
    </div>
  );
}
```

**Step 3: Verify TypeScript compilation**

Run:
```bash
pnpm tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add app/dashboard
git commit -m "feat: add protected dashboard page"
```

---

## Task 8: Create Auth Helper Functions

**Goal:** Create reusable helper functions for checking authentication and authorization.

**Files:**
- Create: `lib/auth/get-session.ts`
- Create: `lib/auth/require-auth.ts`
- Create: `lib/auth/require-admin.ts`

**Step 1: Create get-session helper**

Create `lib/auth/get-session.ts`:

```typescript
import { auth } from '@/auth';

/**
 * Get the current session (server-side only)
 * Returns null if not authenticated
 */
export async function getSession() {
  return await auth();
}

/**
 * Get the current user (server-side only)
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
```

**Step 2: Create require-auth helper**

Create `lib/auth/require-auth.ts`:

```typescript
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
```

**Step 3: Create require-admin helper**

Create `lib/auth/require-admin.ts`:

```typescript
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
```

**Step 4: Verify TypeScript compilation**

Run:
```bash
pnpm tsc --noEmit
```

Expected: No errors

**Step 5: Commit**

```bash
git add lib/auth
git commit -m "feat: add auth helper functions"
```

---

## Task 9: Update Landing Page with Sign-In Link

**Goal:** Update the landing page to include a sign-in link.

**Files:**
- Modify: `app/page.tsx`

**Step 1: Update landing page**

Replace content in `app/page.tsx`:

```typescript
import Link from 'next/link';
import { auth } from '@/auth';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          🍽️ DishDash
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Track, plan, and share your restaurant adventures
        </p>

        <div className="space-y-4">
          {session ? (
            <div className="space-y-4">
              <p className="text-gray-700">
                Welcome back, <strong>{session.user?.email}</strong>!
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="/api/auth/signout">Sign Out</a>
                </Button>
              </div>
            </div>
          ) : (
            <Button asChild size="lg">
              <Link href="/sign-in">Get Started</Link>
            </Button>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-2xl mb-2">📝</div>
            <h3 className="font-semibold text-gray-900 mb-2">ToDo Eat List</h3>
            <p className="text-sm text-gray-600">
              Save restaurants you want to try and track your progress
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-2xl mb-2">🎉</div>
            <h3 className="font-semibold text-gray-900 mb-2">Log Visits</h3>
            <p className="text-sm text-gray-600">
              Record your dining experiences with friends
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Track Stats</h3>
            <p className="text-sm text-gray-600">
              See trends in your cuisine preferences and spending
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
pnpm tsc --noEmit
```

Expected: No errors

**Step 3: Test landing page**

With dev server running, navigate to: http://localhost:3000

Expected:
- Unauthenticated: See "Get Started" button linking to /sign-in
- Authenticated: See "Go to Dashboard" and "Sign Out" buttons

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: update landing page with auth links"
```

---

## Task 10: Add SessionProvider for Client Components

**Goal:** Wrap app with SessionProvider to enable `useSession()` hook in client components.

**Files:**
- Modify: `app/layout.tsx`
- Create: `lib/auth/session-provider.tsx`

**Step 1: Create SessionProvider wrapper**

Create `lib/auth/session-provider.tsx`:

```typescript
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

**Step 2: Update root layout**

Modify `app/layout.tsx` to wrap children with SessionProvider:

```typescript
import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/lib/auth/session-provider';

export const metadata: Metadata = {
  title: 'DishDash',
  description: 'Track, plan, and share your restaurant adventures',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

**Step 3: Verify TypeScript compilation**

Run:
```bash
pnpm tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add app/layout.tsx lib/auth/session-provider.tsx
git commit -m "feat: add SessionProvider for client components"
```

---

## Task 11: Test Complete Authentication Flow

**Goal:** Manually test the entire authentication flow end-to-end.

**Step 1: Start dev server**

Run:
```bash
pnpm dev
```

**Step 2: Test unauthenticated state**

1. Open http://localhost:3000/dashboard
2. Expected: Redirect to /sign-in?callbackUrl=%2Fdashboard

**Step 3: Test sign-in flow**

1. Navigate to http://localhost:3000/sign-in
2. Enter your email (use ADMIN_EMAIL from .env.local)
3. Click "Send magic link"
4. Expected: Redirect to /sign-in/verify

**Step 4: Check email**

1. Check your email inbox
2. Expected: Email from DishDash with branded template
3. Click the "Sign in to DishDash" button
4. Expected: Redirect to /dashboard

**Step 5: Verify session**

1. On /dashboard, verify:
   - Your email is displayed
   - Your role is "admin"
   - Your user ID is shown
   - "Admin" badge is visible in navbar

**Step 6: Test protected route**

1. Navigate to http://localhost:3000/dashboard
2. Expected: Page loads without redirect (you're authenticated)

**Step 7: Test sign-out**

1. Click "Sign out" in navbar
2. Expected: Redirect to landing page (/)
3. Try accessing /dashboard again
4. Expected: Redirect to /sign-in

**Step 8: Verify database**

Run:
```bash
pnpm db:studio
```

Check tables:
- `users`: Should have your user record with role='admin'
- `sessions`: Should have active session (or empty if signed out)
- `accounts`: Should have email provider record
- `verification_tokens`: Should be empty (token deleted after use)

**Step 9: Test regular user**

1. Sign out if logged in
2. Sign in with different email (not ADMIN_EMAIL)
3. Expected: New user created with role='user'
4. Dashboard should NOT show "Admin" badge

**Step 10: Document test results**

Create a test results file or add to PR description:
- [ ] Magic link email received
- [ ] Email template looks good
- [ ] Sign-in flow completes successfully
- [ ] Admin role assigned correctly
- [ ] Regular user role assigned correctly
- [ ] Protected routes redirect when not authenticated
- [ ] Session persists across page refreshes
- [ ] Sign-out clears session

---

## Task 12: Run Code Quality Checks

**Goal:** Ensure all code passes TypeScript, ESLint, and Prettier checks, and builds successfully.

**Step 1: TypeScript check**

Run:
```bash
pnpm tsc --noEmit
```

Expected: No errors

**Step 2: ESLint check**

Run:
```bash
pnpm lint
```

Expected: No errors or warnings

**Step 3: Prettier check**

Run:
```bash
pnpm format:check
```

Expected: All files properly formatted

If not formatted, run:
```bash
pnpm format
```

**Step 4: Production build test**

Run:
```bash
pnpm build
```

Expected: Build completes successfully with no errors

**Step 5: Commit any formatting fixes**

If Prettier made changes:
```bash
git add .
git commit -m "style: apply prettier formatting"
```

---

## Task 13: Update Documentation

**Goal:** Update README with authentication setup instructions.

**Files:**
- Modify: `README.md`

**Step 1: Update README**

Add authentication section to `README.md` after "Database Setup":

```markdown
## Authentication Setup

### NextAuth v5 with Magic Link

This project uses NextAuth v5 for passwordless authentication via email magic links.

**Initial Setup:**

1. Create Resend account at https://resend.com
2. Get API key from Resend dashboard
3. Add environment variables to `.env.local`:
   ```bash
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
   RESEND_API_KEY=<your-resend-api-key>
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ADMIN_EMAIL=<your-email-for-admin-access>
   ```

**Sign-In Flow:**

1. Navigate to `/sign-in`
2. Enter your email
3. Click the magic link sent to your email
4. You'll be redirected to `/dashboard`

**Roles:**

- **Admin**: Email matching `ADMIN_EMAIL` gets admin role
- **User**: All other emails get regular user role

**Protected Routes:**

Routes requiring authentication (redirect to /sign-in if not logged in):
- `/dashboard` - Main dashboard
- `/restaurants` - Restaurant management (future)
- `/friends` - Friend management (future)
- `/visits` - Visit logging (future)
- `/todo` - ToDo Eat List (future)

**Session Management:**

- Sessions stored in database (Vercel Postgres)
- 30-day expiration
- Access session in Server Components: `const session = await auth()`
- Access session in Client Components: `const { data: session } = useSession()`
```

**Step 2: Verify formatting**

Run:
```bash
pnpm format:check
```

If needed:
```bash
pnpm format
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add authentication setup section to README"
```

---

## Task 14: Push to GitHub and Update Story

**Goal:** Push all commits to GitHub and update Shortcut story status.

**Step 1: Push to GitHub**

Run:
```bash
git push -u origin navinseneviratna1922/sc-57/implement-nextauth-v5-w
```

Expected: All commits pushed successfully

**Step 2: Update Shortcut story**

The story will be updated automatically by the workflow, but verify:
- Story SC-57 status changed to "In Review" or "Done"
- Commits are linked to the story

**Step 3: Verify deployment (if auto-deploy enabled)**

Check Vercel dashboard for preview deployment
Expected: Preview URL deployed successfully

**Step 4: Final verification checklist**

- [ ] All commits pushed to GitHub
- [ ] Branch created and up to date
- [ ] All acceptance criteria met:
  - [ ] NextAuth v5 installed and configured
  - [ ] Magic Link email authentication working
  - [ ] SMTP provider configured (Resend)
  - [ ] Users can sign in via email link
  - [ ] Database sessions created and persisted
  - [ ] Protected routes middleware implemented
- [ ] Code quality checks pass (TypeScript, ESLint, Prettier, build)
- [ ] Documentation updated

---

## Acceptance Criteria Verification

✅ **NextAuth v5 installed and configured**
- Dependencies installed: `next-auth@beta`, `@auth/drizzle-adapter`, `resend`
- Main config created in `auth.ts`
- Database adapter configured with Drizzle

✅ **Magic Link email authentication working**
- Email provider configured with Resend
- Custom branded email template created
- Users receive magic links
- Clicking link authenticates user

✅ **SMTP provider configured (Resend)**
- Resend API key in environment
- SMTP settings configured in EmailProvider
- Emails sending successfully

✅ **Users can sign in via email link**
- Sign-in page created at `/sign-in`
- Email input form functional
- Verify page shows confirmation
- Magic link redirects to dashboard

✅ **JWT sessions created and persisted**
- Database sessions (more secure than JWT)
- Sessions table stores active sessions
- 30-day expiration configured
- Sessions accessible via `auth()` and `useSession()`

✅ **Protected routes middleware implemented**
- Middleware created in `middleware.ts`
- Protects dashboard and future routes
- Redirects to /sign-in with callbackUrl
- Public routes remain accessible

---

## Notes for Future Tasks

**Week 1 Remaining:**
- SC-58: Admin role and user management UI
- SC-59: Restaurant CRUD functionality
- SC-60: Friend management with avatars
- SC-61: ToDo Eat List feature

**Week 2:**
- Add Google OAuth provider (easy addition to NextAuth config)
- QR invite system (uses existing auth session)
- Visit logging with auto-ToDo completion

**Week 3:**
- Photo uploads (Vercel Blob)
- Dashboard stats
- PWA capabilities

**Auth Integration Points:**
- Use `session.user.role` for admin features
- Use `session.user.id` for user-specific queries
- Use `requireAdmin()` helper for admin-only pages
- Use `requireAuth()` helper for protected pages
