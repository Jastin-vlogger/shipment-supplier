'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type Mode = 'login' | 'register';

interface AuthFormProps {
  mode: Mode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    
    setLoading(false);

    if (!response.ok) {
      setError(data?.message || 'Something went wrong upon server request.');
      return;
    }

    if (mode === 'login') {
      router.push(data?.mustChangePassword ? '/change-password' : '/dashboard');
    } else {
      router.push('/login?registered=1');
    }
    router.refresh();
  }

  return (
    <div className="auth-card">
      <div className="auth-copy">
        <p className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Supplier onboarding'}</p>
        <h1>{mode === 'login' ? 'Sign in to your supplier portal' : 'Register your supplier account'}</h1>
        <p>
          {mode === 'login'
            ? 'Track approvals, rejection feedback, and schedule updates in one place.'
            : 'Create your supplier account now. After signup, complete the full profile to unlock admin review and later activation.'}
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <>
            <label>
              Company name
              <input name="companyName" required placeholder="Royal Horizon Foods" />
            </label>
            <label>
              Contact person
              <input name="contactPersonName" required placeholder="Amina Rahman" />
            </label>
            <label>
              Country
              <input name="country" required placeholder="United Arab Emirates" />
            </label>
            <label>
              Phone
              <input name="contactPhone" required placeholder="+971 50 123 4567" />
            </label>
          </>
        )}

        <label>
          Email
          <input name="email" type="email" required placeholder="supplier@example.com" />
        </label>

        <label>
          Password
          <input name="password" type="password" required minLength={6} placeholder="Minimum 6 characters" />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" className="primary-button" disabled={loading}>
          {loading
            ? mode === 'login'
              ? 'Signing in...'
              : 'Creating account...'
            : mode === 'login'
              ? 'Sign in'
              : 'Create supplier account'}
        </button>
      </form>

      <p className="auth-footnote">
        {mode === 'login' ? 'Need to register first?' : 'Already have an account?'}{' '}
        <Link href={mode === 'login' ? '/register' : '/login'}>
          {mode === 'login' ? 'Create your supplier profile' : 'Sign in'}
        </Link>
      </p>
    </div>
  );
}
