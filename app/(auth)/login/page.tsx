import Image from 'next/image';

import { AuthForm } from '@/components/auth-form';

export default function LoginPage() {
  return (
    <div className="auth-layout">
      <section className="auth-hero auth-hero-centered">
        <div className="auth-logo-card rounded-[1.5rem] bg-white px-6 py-7 shadow-sm">
          <div className="relative h-[120px] w-full">
            <Image
              src="/royal-horizon-supplier-logo.jpeg"
              alt="Royal Horizon"
              fill
              className="object-contain object-center"
              sizes="(max-width: 768px) 80vw, 40vw"
              priority
            />
          </div>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
            Supplier Portal
          </p>
        </div>
      </section>
      <section className="auth-panel">
        <AuthForm mode="login" />
      </section>
    </div>
  );
}
