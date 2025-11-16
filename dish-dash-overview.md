# DishDash - Project Overview

## Project Description
DishDash is a mobile-first, installable PWA for food explorers. It helps users track, plan, and share restaurant adventures by:
- Saving restaurants they want to try on a "ToDo Eat List"
- Logging actual visits with friends
- Inviting people via QR codes
- Capturing optional post-meal photos
- Seeing trends in what they eat and where

Every friend has either a real photo or a generated avatar. The admin (Navin) has full control; everyone else is a regular user.

## Core Features

### 1. Authentication & Roles
- **Sign-in Methods**: Magic link (email) or Google OAuth
- **Roles**:
  - **Admin (Navin)**: Full control over users, restaurants, visits, and photo moderation
  - **User**: Regular diner with standard permissions
- Admin can manage users, restaurants, visits, and moderate photos

### 2. Restaurants, Friends & the "ToDo Eat List"

#### Restaurants
- Add restaurant with:
  - Name
  - Location
  - Cuisine tags
  - Optional photo and notes (e.g., "hype from TikTok")
- Restaurant statuses:
  - **ToDo Eat**: On the "want to try" list, not visited yet
  - **Eaten**: At least one visit logged

#### ToDo Eat List
- Dedicated view showing restaurants user wants to try
- Easy add flows:
  - From ToDo Eat List page: "Add restaurant" with minimal fields (name + location)
  - From anywhere (global "+" button): add new restaurant and mark as "ToDo Eat"

#### Auto-marking as Eaten
- When user logs a visit to a restaurant:
  - If restaurant is on their ToDo Eat List:
    - Automatically marked as "Eaten" for that user
    - Visually shown as completed (strike-through or "Done" badge)
  - If creating visit with new restaurant not on list:
    - Restaurant created directly in "Eaten" state
  - Optional: Show celebratory "You ate from your list!" moment when ToDo item completed

#### Dining Buddies (Friends)
- Add buddies with name (email optional)
- Photo optional:
  - If not provided, generate deterministic avatar (DiceBear/Jdenticon)
- Friends can later join via QR flow and take over their pre-created profile

### 3. QR Invites & Account Linking
- Generate QR code encoding one-time join link to DishDash
- When scanned:
  - Person signs in via email or Google
  - If email already exists (pre-added by admin), they assume that profile
  - If email is new, new account created and linked
  - Clear confirmation screen showing which profile is being claimed

### 4. Visit Logging (Mobile-First)
Quick "Log Visit" flow:
- Pick restaurant (from list, search, or ToDo Eat entry)
- Choose date/time (default to now)
- Add companions
- Rating (stars / emoji scale)
- Price band or rough cost
- Notes (best dish, service, vibe)
- Optional post-meal group photo at end of logging (skip or add later)

When visit is logged:
- Check if restaurant is on user's ToDo Eat List
- If yes, mark that entry as "Eaten/Done"

### 5. Discovery & Tracking

#### ToDo Eat List Features
- Central home section for "restaurants I want to try"
- Filter/sort by cuisine, neighborhood, or priority
- Badges showing how many ToDo items completed

#### History & Stats
- Visits by cuisine, city, or companion
- Favorite restaurants by average rating
- Simple spending/price level patterns (if tracked)
- Recent photos from meals

### 6. PWA Experience
- Installable on mobile homescreen
- Works offline for:
  - ToDo Eat List
  - Draft visits
  - Recent restaurants and visits
- "Resume logging" banner if user started a visit and got distracted

## Avatar Behavior
Every friend displays:
- Their uploaded photo (if present)
- Otherwise, stable generated avatar seeded by email/ID
- Admin (Navin) gets subtle chef-hat or star badge

## Roles & Guardrails

### Admin (Navin)
- Create/edit/merge restaurants and friends
- Moderate photos and notes
- Fix incorrect links or merges

### User
- Manage their own visits, ToDo Eat List, and profile

### Guardrails
- Confirm identity in QR linking
- Rate-limit invites and uploads
- Avoid accidental ToDo removal when visits edited or deleted (undo or confirmation)

## Technical Stack

### Hosting & Runtime
- **Hosting**: Vercel (Hobby - free tier)
- **Framework**: Next.js 16 (App Router, Route Handlers)

### Authentication
- **Auth**: NextAuth v5 (Auth.js)
- Magic Link + Google OAuth
- JWT sessions

### Data & Storage
- **Database**: Vercel Postgres (restaurants, friends, visits, ToDo flags)
- **File Storage**: Vercel Blob (restaurant and visit photos)

### UI & Styling
- **Styling**: Tailwind CSS (+ optional shadcn/ui)
- **Avatars**: DiceBear or Jdenticon (deterministic generation)
- **Charts**: Recharts (cuisine, rating, and visit patterns)
- **QR Codes**: qrcode.react

### PWA & Automation
- **PWA**: next-pwa (offline cache + installability)
- **Email**: Free SMTP (Resend or similar provider)
- **Automation**: Vercel Cron (expire invites, clean stale drafts)

## Timeline & Milestones

### Week 1: Foundations & Lists
**Theme**: Stock the pantry

**Goals**:
- Set up Next.js 16 + Tailwind on Vercel
- Configure NextAuth v5 with Magic Link + Google
- Implement admin role for Navin
- Build initial navigation and layout
- Implement basic Restaurant and Friend management
- Create ToDo Eat List page:
  - Add new restaurant as ToDo
  - View all "want to try" entries

**Deliverables**:
- Working sign-in flow with admin badge for Navin
- "Add Restaurant" form that can add directly to ToDo Eat List
- "Add Friend" form with deterministic avatars
- ToDo Eat List view (even if visually minimal)

### Week 2: Visits, ToDo Completion & QR Magic
**Theme**: Order the first course

**Goals**:
- Implement Visit Logging flow:
  - Restaurant selection (including from ToDo Eat list)
  - Date/time, rating, companions, notes
- Implement business logic:
  - When visit created for restaurant on user's ToDo Eat List:
    - Automatically mark ToDo entry as completed/eaten
  - Add simple status indicator: ToDo vs Eaten
- Build QR-based invite and account linking flow (existing vs new email)

**Deliverables**:
- Users can:
  - Add restaurants to ToDo Eat List
  - Log a visit for a restaurant
  - See ToDo entry auto-marked as "Done/Eaten"
- QR invite works and links accounts as expected
- ToDo Eat List visually distinguishes completed vs pending entries

### Week 3: Photos, Stats & PWA Polish
**Theme**: Enjoy dessert

**Goals**:
- Add optional post-meal photo to visit and show on visit detail
- Create Dashboard for:
  - ToDo Eat progress (e.g., "10 to try · 3 eaten")
  - Top cuisines
  - Favorite restaurants
- Improve list filtering (only ToDo, only eaten, by cuisine)
- Implement PWA behavior:
  - Install prompt
  - Offline access to ToDo Eat List and recent visits
- Add Cron jobs to:
  - Expire old invites
  - Optionally clean stale visit drafts

**Deliverables**:
- Visit detail page shows restaurant, companions, rating, notes, and optional photo
- Dashboard displays at least basic charts (cuisine breakdown, ToDo vs Eaten)
- PWA installable and usable offline for ToDo Eat List and latest visits
- Invite cleanup runs via Vercel Cron (or at least wired and testable)

## Success Metrics
- < 2 minutes from first sign-in to adding at least one restaurant to ToDo Eat List
- 3 restaurants on ToDo Eat List completed (visited) by end of week 3
- ≥ 80% QR invite success (scan → join)
- ≥ 50% visits linked to ToDo Eat entries (shows system being used)

## Challenge Completion Criteria
By end of week 3:
- Navin (admin) can:
  - Add restaurants to ToDo Eat List
  - Invite friends by QR
  - Log visits
  - Watch ToDo items automatically flip to "Eaten" as he completes them
- Friends can join, see shared restaurants, and log visits themselves
- App runs fully on free Vercel + open-source tooling

## User Stories Template
Each feature should be broken down into:
- User story format: "As a [user type], I want to [action] so that [benefit]"
- Acceptance criteria (specific, testable conditions)
- Technical implementation notes
- Dependencies on other stories
- Testing requirements
- PWA/offline considerations

## Database Schema Notes

### Key Entities
- **Users**: id, email, name, role (admin/user), avatar_url, created_at
- **Restaurants**: id, name, location, cuisine_tags, photo_url, notes, created_by, created_at
- **Friends**: id, name, email (optional), photo_url, user_id (if linked), created_at
- **Visits**: id, restaurant_id, user_id, date, rating, price_band, notes, photo_url, created_at
- **VisitCompanions**: visit_id, friend_id (junction table)
- **TodoEatList**: id, user_id, restaurant_id, status (todo/eaten), added_at, completed_at
- **Invites**: id, code, email (optional), created_by, expires_at, used_at

## Security & Privacy Considerations
- All user data private by default
- Admin can see all data for moderation
- QR invite codes expire after set period
- Rate limiting on:
  - Invite generation
  - Photo uploads
  - Restaurant creation
- Input validation on all forms
- Sanitize user-generated content (notes, restaurant names)
- HTTPS only
- Secure session management via NextAuth

## Offline/PWA Capabilities
- Cache ToDo Eat List for offline viewing
- Allow draft visit creation offline (sync when online)
- Cache recent restaurants and visits
- Service worker for asset caching
- Background sync for pending actions
- Install prompts on supported devices
