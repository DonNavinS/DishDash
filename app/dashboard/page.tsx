import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Welcome back!</h2>
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

      <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-6">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          🎉 Authentication Working!
        </h3>
        <p className="text-sm text-gray-700">
          NextAuth v5 is successfully configured. You're seeing this page
          because you're authenticated.
        </p>
      </div>
    </div>
  );
}
