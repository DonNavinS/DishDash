import Link from 'next/link';
import { auth, signOut } from '@/auth';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-white px-4">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-5xl font-bold text-gray-900">🍽️ DishDash</h1>
        <p className="mb-8 text-xl text-gray-600">
          Track, plan, and share your restaurant adventures
        </p>

        <div className="space-y-4">
          {session ? (
            <div className="space-y-4">
              <p className="text-gray-700">
                Welcome back, <strong>{session.user?.email}</strong>!
              </p>
              <div className="flex justify-center gap-4">
                <Button asChild size="lg">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <form
                  action={async () => {
                    'use server';
                    await signOut();
                  }}
                >
                  <Button variant="outline" size="lg" type="submit">
                    Sign Out
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <Button asChild size="lg">
              <Link href="/sign-in">Get Started</Link>
            </Button>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 text-left md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 text-2xl">📝</div>
            <h3 className="mb-2 font-semibold text-gray-900">ToDo Eat List</h3>
            <p className="text-sm text-gray-600">
              Save restaurants you want to try and track your progress
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 text-2xl">🎉</div>
            <h3 className="mb-2 font-semibold text-gray-900">Log Visits</h3>
            <p className="text-sm text-gray-600">
              Record your dining experiences with friends
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 text-2xl">📊</div>
            <h3 className="mb-2 font-semibold text-gray-900">Track Stats</h3>
            <p className="text-sm text-gray-600">
              See trends in your cuisine preferences and spending
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
