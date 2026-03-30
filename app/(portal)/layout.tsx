import { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { PortalShell } from '@/components/portal-shell';
import { RealTimeProvider } from '@/components/real-time-provider';
import { normalizeSupplierOnboardingState } from '@/lib/profile-completion';
import { requireSupplierSession } from '@/lib/session';

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await requireSupplierSession();
  if (session.account.mustChangePassword) {
    redirect('/change-password');
  }
  const onboardingState = normalizeSupplierOnboardingState(session.supplier);

  return (
    <>
    <RealTimeProvider supplierId={String(session.supplier._id)}>
      <PortalShell
        supplierName={session.supplier.companyName || session.supplier.name}
        supplierStatus={session.supplier.status}
        registrationStage={onboardingState.registrationStage}
        profileCompletionPercent={onboardingState.profileCompletionPercent}
        profileComplete={onboardingState.profileCompletionPercent === 100}
      >
        {onboardingState.profileCompletionPercent < 100 ? (
          <div className="notice-banner">
            <strong>Registration in progress.</strong> Your supplier profile is {onboardingState.profileCompletionPercent}% complete. Finish every field on the profile page before supplier-side actions unlock and the admin team can review your account.
          </div>
        ) : session.supplier.status !== 'Active' ? (
          <div className="notice-banner">
            <strong>{session.supplier.status} account.</strong> Your registration is complete and visible to admin, but schedule actions stay locked until admin activation.
          </div>
        ) : null}
        {children}
      </PortalShell>
    </RealTimeProvider>
    </>
  );
}
