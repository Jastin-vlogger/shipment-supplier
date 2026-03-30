import Link from 'next/link';

import { AuthForm } from '@/components/auth-form';

export default function RegisterPage() {
  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <p className="eyebrow">Supplier Registration</p>
        <h1>Register once, then manage schedules from a single supplier workspace.</h1>
        <p>
          Your account is created immediately, but supplier actions stay locked until the profile reaches 100% completion and the admin team reviews it.
        </p>
        <div className="auth-hero-card">
          <span>What happens next</span>
          <ul>
            <li>Supplier profile is created in the shared shipment database</li>
            <li>Complete every profile field to move the registration to draft</li>
            <li>Admin team can then review and activate the supplier</li>
          </ul>
        </div>
        <Link href="/login" className="ghost-link">
          Already have an account? Sign in
        </Link>
      </section>
      <section className="auth-panel">
        <AuthForm mode="register" />
      </section>
    </div>
  );
}
