
🍽️ DishDash – Project Brief (Updated)
A mobile-first PWA for tracking, planning, and sharing restaurant adventures.
Overview
DishDash is a mobile-first, installable PWA for food explorers like Navin.
It lets him:
Save restaurants he wants to try on a “ToDo Eat List”Log actual visits with friendsInvite people via QRCapture optional post-meal photosSee trends in what he eats and whereEvery friend has either a real photo or a generated avatar. Navin is the admin; everyone else is a regular user.

Core Features
1. Authentication & Roles
Sign-in via magic link (email) or Google.Roles:Admin (Navin) – full control.User – regular diner.Admin can manage users, restaurants, visits, and moderate photos.
2. Restaurants, Friends & the “ToDo Eat List”
Restaurants
Add a restaurant with:NameLocationCuisine tagsOptional photo and notes (e.g., “hype from TikTok”)Each restaurant has a status like:ToDo Eat – on the “want to try” list, not visited yetEaten – at least one visit loggedToDo Eat List
A dedicated “ToDo Eat List” view showing restaurants Navin (or a user) wants to try.Easy add flow:From the ToDo Eat List page: “Add restaurant” with minimal fields (name + location).From anywhere (e.g., global “+” button): add a new restaurant and mark it as “ToDo Eat”.Auto-marking as eaten
When a user logs a visit to a restaurant:If that restaurant is on their ToDo Eat List, it is automatically:Marked as “Eaten” for that user.Visually shown as completed (e.g., strike-through or “Done” badge).If they create a visit with a new restaurant that was never on the list:The restaurant is created directly in the “Eaten” state for that user.Optional: show a tiny celebratory “You ate from your list!” moment when a ToDo item is completed.Dining buddies (friends)
Add buddies with name (email optional).Photo optional:If not provided, generate a deterministic avatar (DiceBear/Jdenticon).Friends can later join via the QR flow and take over their pre-created profile.
3. QR Invites & Account Linking
Show a QR that encodes a one-time join link to DishDash.When scanned:The person signs in via email or Google.If the email already exists (Navin pre-added them), they assume that profile.If the email is new, a new account is created and linked.Clear confirmation screen showing which profile is being claimed.
4. Visit Logging (Mobile-First)
Quick “Log Visit” flow:Pick restaurant (from list, search, or a ToDo Eat entry).Choose date/time (default to now).Add companions.Rating (stars / emoji scale).Price band or rough cost.Notes (best dish, service, vibe).Optional post-meal group photo at the end of logging (skip or add later).When the visit is logged:Check if this restaurant is on the user’s ToDo Eat List.If yes, mark that entry as “Eaten / done”.
5. Discovery & Tracking
ToDo Eat List:Central home section for “restaurants I want to try.”Ability to filter/sort by cuisine, neighborhood, or priority.Badges showing how many ToDo items have been completed.History & Stats:Visits by cuisine, city, or companion.Favorite restaurants by average rating.Simple spending/price level patterns (if tracked).Recent photos from meals.
6. PWA Experience
Installable on mobile homescreen.Works offline for:ToDo Eat ListDraft visitsRecent restaurants and visits“Resume logging” banner if you started a visit and got distracted.
Avatar Behavior
Every friend displays:Their uploaded photo (if present).Otherwise, a stable generated avatar seeded by email/ID.Admin (Navin) gets a subtle chef-hat or star badge.
Roles & Guardrails
Admin (Navin):
Create/edit/merge restaurants and friends.Moderate photos and notes.Fix incorrect links or merges.User:
Manage their own visits, ToDo Eat List, and profile.Guardrails:
Confirm identity in QR linking.Rate-limit invites and uploads.Avoid accidental ToDo removal when visits are edited or deleted (e.g., undo or confirmation).
Suggested Tech Stack
This is a suggestion only, based on all free technologies. Navin can swap components if he prefers.Hosting & runtime: Vercel (Hobby)Framework: Next.js 16 (App Router, Route Handlers)Auth: NextAuth v5 (Auth.js) – Magic Link + Google, JWT sessionsDatabase: Vercel Postgres (restaurants, friends, visits, ToDo flags)Storage: Vercel Blob – for restaurant and visit photosAvatars: DiceBear or Jdenticon (deterministic)Charts: Recharts – cuisine, rating, and visit patternsStyling: Tailwind CSS (+ shadcn/ui optional)PWA: next-pwa – offline cache + installabilityQR Codes: qrcode.reactEmail: free SMTP (Resend or another provider)Automation: Vercel Cron – expire invites, clean stale drafts
Success Metrics
< 2 minutes from first sign-in to adding at least one restaurant to the ToDo Eat List.3 restaurants on ToDo Eat List completed (visited) by the end of week 3.≥ 80% QR invite success (scan → join).≥ 50% visits linked to ToDo Eat entries (shows system being used).

🍜 DishDash – 3-Week Challenge (Updated)
Goal
Ship a working DishDash PWA in 3 weeks, with a fully functioning ToDo Eat List and visit logging, all running on free-tier services.

🗓️ Week 1 – Foundations & Lists
Theme: Stock the pantry.
Goals
Set up Next.js 16 + Tailwind on Vercel.Configure NextAuth v5 with Magic Link + Google.Implement admin role for Navin.Build initial navigation and layout.Implement basic Restaurant and Friend management.Create the ToDo Eat List page:Add new restaurant as ToDo.View all “want to try” entries.Deliverables
Working sign-in flow with admin badge for Navin.“Add Restaurant” form that can:Add directly to the ToDo Eat List.“Add Friend” form with deterministic avatars.ToDo Eat List view (even if visually minimal).
🗓️ Week 2 – Visits, ToDo Completion & QR Magic
Theme: Order the first course.
Goals
Implement Visit Logging flow:Restaurant selection (including from ToDo Eat list).Date/time, rating, companions, notes.Implement business logic:When a visit is created for a restaurant that exists on the user’s ToDo Eat List, automatically:Mark the ToDo entry as completed/eaten.Add a simple status indicator: ToDo vs Eaten.Build QR-based invite and account linking flow (existing vs new email).Deliverables
Users can:Add restaurants to ToDo Eat List.Log a visit for a restaurant.See the ToDo entry auto-marked as “Done/Eaten”.QR invite works and links accounts as expected.The ToDo Eat List visually distinguishes completed vs pending entries.
🗓️ Week 3 – Photos, Stats & PWA Polish
Theme: Enjoy dessert.
Goals
Add optional post-meal photo to a visit and show it on visit detail.Create a Dashboard for:ToDo Eat progress (e.g., “10 to try · 3 eaten”).Top cuisines.Favorite restaurants.Improve list filtering (e.g., only ToDo, only eaten, by cuisine).Implement PWA behavior:Install prompt.Offline access to ToDo Eat List and recent visits.Add Cron jobs to:Expire old invites.Optionally clean stale visit drafts.Deliverables
Visit detail page shows restaurant, companions, rating, notes, and optional photo.Dashboard displays at least basic charts (e.g., cuisine breakdown, ToDo vs Eaten).PWA installable and usable offline for ToDo Eat List and latest visits.Invite cleanup runs via Vercel Cron (or at least is wired and testable).
🏁 Challenge Completion
By the end of week 3:
Navin (admin) can:Add restaurants to the ToDo Eat List,Invite friends by QR,Log visits, andWatch ToDo items automatically flip to “Eaten” as he completes them.Friends can join, see shared restaurants, and log visits themselves.The app runs fully on free Vercel + open-source tooling.