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
