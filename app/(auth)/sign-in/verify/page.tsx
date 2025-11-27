'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
          <svg
            className="h-6 w-6 text-orange-600"
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

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Check your email
        </h1>

        <p className="mb-4 text-gray-600">
          We sent a magic link to <strong>{email}</strong>
        </p>

        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="mb-2">Click the link in the email to sign in.</p>
          <p className="text-xs text-gray-500">
            The link expires in 24 hours. If you don&apos;t see the email, check your
            spam folder.
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

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
