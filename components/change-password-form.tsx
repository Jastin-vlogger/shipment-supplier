'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export function ChangePasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get('newPassword') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');

    if (newPassword !== confirmPassword) {
      setLoading(false);
      setError('New password and confirm password must match.');
      return;
    }

    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword, confirmPassword }),
    });

    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(data?.message || 'Unable to update password.');
      return;
    }

    setMessage(data?.message || 'Password updated successfully.');
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="auth-card">
      <div className="auth-copy">
        <p className="eyebrow">Password Update</p>
        <h1>Set your new supplier password</h1>
        <p>Your temporary invite password worked once. Please set a new password before continuing into the supplier portal.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          New password
          <input name="newPassword" type="password" required minLength={8} placeholder="Minimum 8 characters" />
        </label>
        <label>
          Confirm password
          <input name="confirmPassword" type="password" required minLength={8} placeholder="Re-enter your new password" />
        </label>

        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-success">{message}</p> : null}

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Updating password...' : 'Save new password'}
        </button>
      </form>
    </div>
  );
}
