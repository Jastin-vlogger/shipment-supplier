export const SUPPLIER_PROFILE_FIELDS = [
  'name',
  'companyName',
  'contactPersonName',
  'contactEmail',
  'contactPhone',
  'country',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'postalCode',
  'registrationNotes',
] as const;

export type SupplierProfileField = (typeof SUPPLIER_PROFILE_FIELDS)[number];
export type RegistrationStage = 'In Progress' | 'Draft';

type SupplierProfileShape = Partial<Record<SupplierProfileField, unknown>> & {
  registrationStage?: string;
  profileCompletionPercent?: number;
  profileCompletedAt?: Date | string | null;
  status?: string;
};

export interface SupplierOnboardingState {
  registrationStage: RegistrationStage;
  profileCompletionPercent: number;
  profileCompletedAt: Date | null;
  missingFields: SupplierProfileField[];
}

function hasValue(value: unknown) {
  return String(value ?? '').trim().length > 0;
}

export function calculateSupplierOnboardingState(supplier: SupplierProfileShape): SupplierOnboardingState {
  const missingFields = SUPPLIER_PROFILE_FIELDS.filter((field) => !hasValue(supplier[field]));
  const completedFields = SUPPLIER_PROFILE_FIELDS.length - missingFields.length;
  const profileCompletionPercent =
    completedFields === SUPPLIER_PROFILE_FIELDS.length
      ? 100
      : Math.round((completedFields / SUPPLIER_PROFILE_FIELDS.length) * 100);
  const registrationStage: RegistrationStage = profileCompletionPercent === 100 ? 'Draft' : 'In Progress';
  const completedAt =
    profileCompletionPercent === 100
      ? supplier.profileCompletedAt
        ? new Date(supplier.profileCompletedAt)
        : new Date()
      : null;

  return {
    registrationStage,
    profileCompletionPercent,
    profileCompletedAt: completedAt,
    missingFields,
  };
}

export function normalizeSupplierOnboardingState(supplier: SupplierProfileShape): SupplierOnboardingState {
  if (
    typeof supplier.profileCompletionPercent === 'number' &&
    (supplier.registrationStage === 'In Progress' || supplier.registrationStage === 'Draft')
  ) {
    return {
      registrationStage: supplier.registrationStage,
      profileCompletionPercent: supplier.profileCompletionPercent,
      profileCompletedAt: supplier.profileCompletedAt ? new Date(supplier.profileCompletedAt) : null,
      missingFields: SUPPLIER_PROFILE_FIELDS.filter((field) => !hasValue(supplier[field])),
    };
  }

  if (supplier.status === 'Active') {
    return {
      registrationStage: 'Draft',
      profileCompletionPercent: 100,
      profileCompletedAt: supplier.profileCompletedAt ? new Date(supplier.profileCompletedAt) : new Date(),
      missingFields: [],
    };
  }

  return calculateSupplierOnboardingState(supplier);
}

export function canAccessSupplierFunctions(supplier: SupplierProfileShape) {
  return normalizeSupplierOnboardingState(supplier).profileCompletionPercent === 100;
}

export function canManageSupplierSchedules(supplier: SupplierProfileShape) {
  return canAccessSupplierFunctions(supplier) && supplier.status === 'Active';
}
