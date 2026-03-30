'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

import { SUPPLIER_PROFILE_FIELDS, SupplierProfileField } from '@/lib/profile-completion';

interface ProfileFormProps {
  supplier: {
    companyName?: string;
    name: string;
    contactPersonName?: string;
    contactEmail: string;
    contactPhone?: string;
    country: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    registrationNotes?: string;
    status: string;
    registrationStage: string;
    profileCompletionPercent: number;
    missingFields: SupplierProfileField[];
  };
}

export function ProfileForm({ supplier }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(supplier.profileCompletionPercent);
  const [missingFields, setMissingFields] = useState<SupplierProfileField[]>(supplier.missingFields);
  const currentStage = progress === 100 ? 'Draft' : 'In Progress';
  const completedCount = SUPPLIER_PROFILE_FIELDS.length - missingFields.length;

  const fieldLabels = useMemo<Record<SupplierProfileField, string>>(
    () => ({
      name: 'Display name',
      companyName: 'Company name',
      contactPersonName: 'Contact person',
      contactEmail: 'Contact email',
      contactPhone: 'Contact phone',
      country: 'Country',
      addressLine1: 'Address line 1',
      addressLine2: 'Address line 2',
      city: 'City',
      state: 'State',
      postalCode: 'Postal code',
      registrationNotes: 'Registration notes',
    }),
    []
  );

  function updateLiveProgress(form: HTMLFormElement) {
    const formData = new FormData(form);
    const missing = SUPPLIER_PROFILE_FIELDS.filter((field) => !String(formData.get(field) || '').trim());
    const completedFields = SUPPLIER_PROFILE_FIELDS.length - missing.length;
    const percent =
      completedFields === SUPPLIER_PROFILE_FIELDS.length
        ? 100
        : Math.round((completedFields / SUPPLIER_PROFILE_FIELDS.length) * 100);

    setProgress(percent);
    setMissingFields(missing);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.message || 'Could not save profile.');
      return;
    }

    setMessage('Profile updated successfully.');
    setProgress(data.supplier?.profileCompletionPercent ?? 100);
    setMissingFields(data.supplier?.missingFields ?? []);
    router.refresh();
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit} onInput={(event) => updateLiveProgress(event.currentTarget)}>
      <div className="card-header-row">
        <div>
          <p className="eyebrow">Profile</p>
          <h3>Supplier details</h3>
        </div>
        <span className={`status-badge status-${supplier.status.toLowerCase()}`}>{supplier.status}</span>
      </div>

      <div className="full-width onboarding-progress-card">
        <div className="progress-header">
          <div>
            <p className="eyebrow">Registration progress</p>
            <h4>{progress}% complete</h4>
            <p className="progress-meta">
              {completedCount} of {SUPPLIER_PROFILE_FIELDS.length} fields completed
            </p>
          </div>
          <span className={`status-badge status-${currentStage.toLowerCase().replace(/\s+/g, '-')}`}>
            {currentStage}
          </span>
        </div>
        <div className="progress-track" aria-label="Profile completion">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-scale" aria-hidden="true">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        <p className="progress-copy">
          {progress === 100
            ? 'Your profile is complete. The supplier is now ready for admin review.'
            : 'Complete every profile field to reach 100% and unlock supplier-side functionality.'}
        </p>
        {missingFields.length ? (
          <div className="missing-fields">
            {missingFields.map((field) => (
              <span key={field} className="missing-field-pill">
                {fieldLabels[field]}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <label>
        Display name
        <input name="name" defaultValue={supplier.name} required />
      </label>
      <label>
        Company name
        <input name="companyName" defaultValue={supplier.companyName || ''} required />
      </label>
      <label>
        Contact person
        <input name="contactPersonName" defaultValue={supplier.contactPersonName || ''} required />
      </label>
      <label>
        Contact email
        <input name="contactEmail" type="email" defaultValue={supplier.contactEmail} required />
      </label>
      <label>
        Contact phone
        <input name="contactPhone" defaultValue={supplier.contactPhone || ''} required />
      </label>
      <label>
        Country
        <input name="country" defaultValue={supplier.country} required />
      </label>
      <label>
        Address line 1
        <input name="addressLine1" defaultValue={supplier.addressLine1 || ''} />
      </label>
      <label>
        Address line 2
        <input name="addressLine2" defaultValue={supplier.addressLine2 || ''} />
      </label>
      <label>
        City
        <input name="city" defaultValue={supplier.city || ''} />
      </label>
      <label>
        State
        <input name="state" defaultValue={supplier.state || ''} />
      </label>
      <label>
        Postal code
        <input name="postalCode" defaultValue={supplier.postalCode || ''} />
      </label>
      <label className="full-width">
        Registration notes
        <textarea name="registrationNotes" defaultValue={supplier.registrationNotes || ''} rows={4} />
      </label>

      {error ? <p className="form-error full-width">{error}</p> : null}
      {message ? <p className="form-success full-width">{message}</p> : null}

      <div className="full-width actions-row">
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Saving...' : 'Save profile'}
        </button>
      </div>
    </form>
  );
}
