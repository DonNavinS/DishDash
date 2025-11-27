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
