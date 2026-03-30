import { ProfileForm } from '@/components/profile-form';
import { normalizeSupplierOnboardingState } from '@/lib/profile-completion';
import { requireSupplierSession } from '@/lib/session';

export default async function ProfilePage() {
  const session = await requireSupplierSession();
  const onboardingState = normalizeSupplierOnboardingState(session.supplier);

  return (
    <div className="stack-lg">
      <ProfileForm
        supplier={{
          name: session.supplier.name,
          companyName: session.supplier.companyName,
          contactPersonName: session.supplier.contactPersonName,
          contactEmail: session.supplier.contactEmail,
          contactPhone: session.supplier.contactPhone,
          country: session.supplier.country,
          addressLine1: session.supplier.addressLine1,
          addressLine2: session.supplier.addressLine2,
          city: session.supplier.city,
          state: session.supplier.state,
          postalCode: session.supplier.postalCode,
          registrationNotes: session.supplier.registrationNotes,
          status: session.supplier.status,
          registrationStage: onboardingState.registrationStage,
          profileCompletionPercent: onboardingState.profileCompletionPercent,
          missingFields: onboardingState.missingFields,
        }}
      />
    </div>
  );
}
