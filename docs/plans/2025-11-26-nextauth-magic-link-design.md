# NextAuth v5 Magic Link Authentication Design

**Story**: SC-57 - Implement NextAuth v5 with Magic Link authentication
**Date**: 2025-11-26
**Status**: Design Complete

## Overview

Implement passwordless authentication using NextAuth v5 with email-based magic links. Users sign in by clicking a link sent to their email, with no password required. The system automatically creates user accounts on first sign-in and assigns appropriate roles (admin for Navin, regular user for others).

## Technology Stack

- **Auth Library**: NextAuth v5 (Auth.js)
- **Database Adapter**: @auth/drizzle-adapter
- **Email Provider**: Resend (free tier: 100/day, 3,000/month)
- **Session Storage**: Database sessions (Vercel Postgres)
- **Session Strategy**: Database-backed (more secure than JWT-only)

## Architecture Decision

**Chosen Approach: Drizzle Adapter with Database Sessions**

We're using the Drizzle adapter rather than JWT-only sessions because:
- Better security: Server-side session management allows revocation
- Automatic lifecycle: NextAuth handles session creation, validation, expiration
- Standard approach: Well-tested, documented patterns
- Role management: Session data synced with users table including role

**Trade-off**: Requires 3 additional database tables (accounts, sessions, verificationTokens) but provides significantly better security and session control.

## Database Schema

### New Tables (NextAuth Requirements)

**1. accounts table** - Links users to authentication providers
```typescript
{
  id: uuid (primary key)
  userId: uuid (foreign key -> users.id, cascade delete)
  type: string (e.g., 'email')
  provider: string (e.g., 'email', 'google')
  providerAccountId: string
  refresh_token: text (nullable)
  access_token: text (nullable)
  expires_at: integer (nullable)
  token_type: string (nullable)
  scope: string (nullable)
  id_token: text (nullable)
  session_state: string (nullable)
}
```

**2. sessions table** - Active user sessions
```typescript
{
  id: uuid (primary key)
  sessionToken: string (unique, indexed)
  userId: uuid (foreign key -> users.id, cascade delete)
  expires: timestamp
}
```

**3. verificationTokens table** - One-time magic link tokens
```typescript
{
  identifier: string (email address)
  token: string (unique)
  expires: timestamp
}
// Composite primary key: (identifier, token)
```

### Integration with Existing users Table

The existing `users` table remains unchanged:
```typescript
{
  id: uuid (primary key)
  email: string (unique, not null)
  name: string (not null)
  role: enum ('admin', 'user') default 'user'
  avatarUrl: string (nullable)
  createdAt: timestamp default now()
  updatedAt: timestamp default now()
}
```

NextAuth's Drizzle adapter will use this table for user data. Our callbacks will ensure the `role` field is set correctly on user creation.

## File Structure

```
dish-dash/
├── auth.ts                              # Main NextAuth configuration
├── middleware.ts                         # Route protection
├── app/
│   ├── (auth)/
│   │   └── sign-in/
│   │       └── page.tsx                 # Sign-in page
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts             # NextAuth API routes
├── lib/
│   ├── auth/
│   │   ├── get-session.ts               # Server-side session helper
│   │   ├── require-auth.ts              # Auth guard utility
│   │   └── require-admin.ts             # Admin guard utility
│   ├── email/
│   │   └── magic-link-template.ts       # Custom email template
│   └── db/
│       └── schema.ts                    # Updated with auth tables
└── .env.local                           # Auth environment variables
```

## NextAuth Configuration (auth.ts)

**Core configuration:**
```typescript
import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import EmailProvider from 'next-auth/providers/email';
import { db } from '@/lib/db';
import { sendMagicLinkEmail } from '@/lib/email/magic-link-template';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    EmailProvider({
      server: {
        host: process.env.RESEND_SMTP_HOST,
        port: 587,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: process.env.RESEND_FROM_EMAIL,
      sendVerificationRequest: sendMagicLinkEmail,
    }),
  ],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      // Auto-create user if doesn't exist
      // Set role based on email
      if (!user.role) {
        user.role = user.email === process.env.ADMIN_EMAIL ? 'admin' : 'user';
      }
      return true;
    },
    async session({ session, user }) {
      // Add role to session
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
  },
});
```

## Email Template

**Custom branded email** (`lib/email/magic-link-template.ts`):
- Clean HTML template with DishDash branding
- Clear CTA button: "Sign in to DishDash"
- Fallback plain text version
- Mobile-responsive design
- Token expiration notice: "Link expires in 24 hours"

**Email sent from**: onboarding@resend.dev (development) or your verified domain (production)

## Sign-In Flow

### User Journey

1. **User navigates to /sign-in**
   - Shows email input form
   - Simple, mobile-first UI with Tailwind
   - Submit button: "Send magic link"

2. **User submits email**
   - Calls `signIn('email', { email })`
   - NextAuth generates one-time token
   - Token stored in `verificationTokens` table
   - Email sent via Resend with magic link

3. **Success message displayed**
   - "Check your email for a magic link"
   - Show email address for confirmation
   - Option to resend (rate-limited)

4. **User clicks magic link in email**
   - Link format: `/api/auth/callback/email?token=xxx&email=xxx`
   - NextAuth validates token and email
   - If valid: creates/updates session in `sessions` table
   - If invalid/expired: shows error page

5. **User redirected to destination**
   - Default: `/dashboard`
   - Or `callbackUrl` if accessing protected route
   - Session cookie set (httpOnly, secure)

### Auto-User Creation

**On first sign-in:**
- Check if user exists in `users` table by email
- If not exists:
  - Create new user record
  - Set email from magic link
  - Set name: extracted from email (before @) or "User"
  - Set role: 'admin' if email matches `ADMIN_EMAIL` env var, else 'user'
  - Set avatarUrl: null (generated avatars handled in UI)
  - Set createdAt, updatedAt: now()

**On subsequent sign-ins:**
- User record already exists
- Update `updatedAt` timestamp
- Create new session in `sessions` table
- Preserve existing role and profile data

## Route Protection

### Middleware Configuration (middleware.ts)

```typescript
import { auth } from '@/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') ||
                           req.nextUrl.pathname.startsWith('/restaurants') ||
                           req.nextUrl.pathname.startsWith('/friends') ||
                           req.nextUrl.pathname.startsWith('/visits') ||
                           req.nextUrl.pathname.startsWith('/todo');

  if (isProtectedRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(req.nextUrl.pathname);
    return Response.redirect(new URL(`/sign-in?callbackUrl=${callbackUrl}`, req.url));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Protected Routes

**Require authentication:**
- `/dashboard` - Main dashboard
- `/restaurants/*` - Restaurant management
- `/friends/*` - Friend management
- `/visits/*` - Visit logging
- `/todo/*` - ToDo Eat List

**Public routes (no auth):**
- `/` - Landing page
- `/sign-in` - Sign-in page
- `/api/auth/*` - NextAuth API endpoints

### Role-Based Authorization

**Admin-only features** (enforced in components/API routes):
- User management
- Restaurant moderation
- Photo/content moderation

**Check in Server Components:**
```typescript
import { auth } from '@/auth';

const session = await auth();
if (session?.user?.role !== 'admin') {
  redirect('/dashboard');
}
```

**Check in API Routes:**
```typescript
import { auth } from '@/auth';

const session = await auth();
if (!session || session.user.role !== 'admin') {
  return new Response('Unauthorized', { status: 401 });
}
```

## Session Management

### Session Access

**Server Components:**
```typescript
import { auth } from '@/auth';

const session = await auth();
// session.user: { id, email, name, role, image }
```

**Client Components:**
```typescript
'use client';
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();
// status: 'loading' | 'authenticated' | 'unauthenticated'
```

**API Routes:**
```typescript
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... protected logic
}
```

### Session Lifecycle

- **Creation**: On successful magic link validation
- **Duration**: 30 days from last activity
- **Renewal**: Auto-renewed on each request (rolling sessions)
- **Expiration**: After 30 days of inactivity
- **Revocation**: Delete session record from database (admin capability)

## Error Handling

### Email Delivery Failures

**Resend API errors:**
- Catch and log error details
- Show user-friendly message: "Failed to send email. Please try again."
- Don't expose API error details to user

**Rate limiting:**
- Max 3 sign-in attempts per email per 15 minutes
- Prevents email spam/abuse
- Show message: "Too many attempts. Please try again in X minutes."

### Invalid/Expired Magic Links

**Token expired (>24 hours):**
- NextAuth shows error page
- Message: "This link has expired. Please request a new one."
- Link back to /sign-in

**Token already used:**
- Tokens are one-time use
- Message: "This link has already been used."
- Link to request new magic link

**Token not found:**
- Invalid or tampered token
- Message: "Invalid link. Please request a new one."

### Session Expiration

**Expired session:**
- Middleware catches expired sessions
- Redirect to `/sign-in?callbackUrl=<original-url>`
- Preserve intended destination for post-login redirect

**Session cleared after sign-out:**
- Session record deleted from database
- Cookie cleared
- Redirect to `/` (landing page)

### Database Connection Errors

**Drizzle adapter errors:**
- Catch in auth callbacks
- Log to console/monitoring service
- Show generic error: "Authentication failed. Please try again."
- Don't expose database details to user

### Environment Variable Validation

**On application startup:**
- Check for required env vars:
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
  - `ADMIN_EMAIL`
- Throw clear error if missing
- Validate `ADMIN_EMAIL` format (valid email)
- Validate `NEXTAUTH_SECRET` length (min 32 characters)

## Environment Variables

**Required in `.env.local`:**
```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<cryptographically-secure-random-string>

# Resend Email Provider
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_SMTP_HOST=smtp.resend.com

# Admin Configuration
ADMIN_EMAIL=seneviratnanavin@gmail.com
```

**Also add to `.env.example`** (without values) for documentation.

## Testing Strategy

### Manual Testing Checklist

**1. Magic link sign-in flow:**
- [ ] Enter email on /sign-in → receive email within 30 seconds
- [ ] Email contains branded DishDash template
- [ ] Click magic link → redirected to /dashboard
- [ ] Session persists across page refreshes
- [ ] Session accessible in Server Components (`auth()`)
- [ ] Session accessible in Client Components (`useSession()`)

**2. Admin role assignment:**
- [ ] Sign in with `ADMIN_EMAIL` → user.role = 'admin'
- [ ] Sign in with different email → user.role = 'user'
- [ ] Verify role in session object
- [ ] Check `users` table in database for correct role

**3. Route protection:**
- [ ] Visit /dashboard without auth → redirect to /sign-in
- [ ] Sign in → redirect back to /dashboard
- [ ] Access /restaurants without auth → redirect to /sign-in with callbackUrl
- [ ] Public routes (/, /sign-in) accessible without auth

**4. Email template:**
- [ ] Branded email with DishDash name received
- [ ] Magic link button clickable on mobile
- [ ] Fallback text link works
- [ ] Email displays correctly in Gmail, Outlook, Apple Mail

**5. Error scenarios:**
- [ ] Click expired magic link (>24h) → error message shown
- [ ] Request magic link 4 times rapidly → rate limit error
- [ ] Sign out → session cleared
- [ ] Access protected route after sign-out → redirect to /sign-in
- [ ] Click already-used magic link → error message

**6. Database verification:**
- [ ] Check `users` table for new user with correct role
- [ ] Check `sessions` table for active session record
- [ ] Check `accounts` table for email provider link
- [ ] Check `verificationTokens` table (should be empty after successful sign-in)

### Environment Setup Verification

- [ ] `.env.local` has all required variables
- [ ] `NEXTAUTH_SECRET` is 32+ characters and cryptographically secure
- [ ] Resend API key valid (test with API call)
- [ ] Resend has quota remaining (check dashboard)
- [ ] `ADMIN_EMAIL` matches your actual email

## Acceptance Criteria Mapping

✅ **NextAuth v5 installed and configured**
- Dependencies installed
- `auth.ts` configuration complete
- Drizzle adapter connected

✅ **Magic Link email authentication working**
- Email provider configured (Resend)
- Custom email template created
- Users receive magic links
- Links successfully authenticate users

✅ **SMTP provider configured (Resend)**
- Resend API key in environment variables
- Email sending tested and working
- From address configured

✅ **Users can sign in via email link**
- Sign-in page functional
- Magic link flow end-to-end working
- Session created on successful sign-in

✅ **JWT sessions created and persisted**
- Database sessions (not JWT, but more secure)
- Sessions stored in `sessions` table
- 30-day expiration configured
- Session accessible throughout app

✅ **Protected routes middleware implemented**
- Middleware protects /dashboard, /restaurants, etc.
- Public routes remain accessible
- Redirects to /sign-in with callbackUrl
- Post-login redirect back to intended destination

## Migration Path

**Database migration:**
1. Add 3 new tables to `lib/db/schema.ts`
2. Run `pnpm db:generate` to create migration
3. Run `pnpm db:push` to apply to database
4. Verify tables created in Drizzle Studio

**No data migration needed** - existing `users` table compatible with NextAuth adapter.

## Security Considerations

**Session security:**
- HttpOnly cookies (not accessible via JavaScript)
- Secure flag in production (HTTPS only)
- SameSite=Lax (CSRF protection)
- Server-side session storage (can't be tampered with)

**Magic link security:**
- One-time use tokens
- 24-hour expiration
- Cryptographically random tokens
- Tokens tied to specific email address

**Rate limiting:**
- Prevents email bombing
- 3 attempts per 15 minutes per email
- Protects Resend quota

**Environment variables:**
- Never commit `.env.local` to git
- Use different secrets for dev/production
- Rotate `NEXTAUTH_SECRET` periodically

## Future Enhancements (Week 2+)

**Google OAuth (Week 1 stretch goal or Week 2):**
- Add Google provider to NextAuth config
- Same user table, different provider in `accounts` table
- Allow linking email + Google to same account

**QR invite system (Week 2):**
- Use NextAuth sessions for invite flow
- Link pre-created friend profiles to new accounts

**Session management UI (Week 3):**
- Admin can view active sessions
- Revoke sessions (delete from database)
- Session activity log

## References

- [NextAuth v5 Documentation](https://authjs.dev/)
- [Drizzle Adapter](https://authjs.dev/reference/adapter/drizzle)
- [Resend Documentation](https://resend.com/docs)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
