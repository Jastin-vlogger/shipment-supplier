import { NextResponse } from 'next/server';

import { connectToDatabase } from '@/lib/db';
import { SupplierAccountModel, SupplierModel } from '@/lib/models';
import { calculateSupplierOnboardingState, normalizeSupplierOnboardingState } from '@/lib/profile-completion';
import { getCurrentSupplierSession } from '@/lib/session';
import { ensureUniqueSupplierEmail } from '@/lib/supplier';

export async function GET() {
  const session = await getCurrentSupplierSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const onboardingState = normalizeSupplierOnboardingState(session.supplier);

  return NextResponse.json({
    supplier: {
      ...session.supplier,
      registrationStage: onboardingState.registrationStage,
      profileCompletionPercent: onboardingState.profileCompletionPercent,
      profileCompletedAt: onboardingState.profileCompletedAt,
      missingFields: onboardingState.missingFields,
    },
  });
}

export async function PUT(request: Request) {
  const session = await getCurrentSupplierSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const contactEmail = String(body.contactEmail || '').trim().toLowerCase();
  if (!body.name || !body.companyName || !body.contactPersonName || !contactEmail || !body.country) {
    return NextResponse.json({ message: 'Required profile fields are missing.' }, { status: 400 });
  }

  await connectToDatabase();

  const uniqueEmail = await ensureUniqueSupplierEmail(contactEmail, String(session.supplier._id));
  if (!uniqueEmail) {
    return NextResponse.json({ message: 'Another supplier already uses this email.' }, { status: 400 });
  }

  const supplier = await SupplierModel.findById(session.supplier._id);
  if (!supplier) {
    return NextResponse.json({ message: 'Supplier not found.' }, { status: 404 });
  }

  supplier.name = String(body.name || '').trim();
  supplier.companyName = String(body.companyName || '').trim();
  supplier.contactPersonName = String(body.contactPersonName || '').trim();
  supplier.contactPhone = String(body.contactPhone || '').trim();
  supplier.country = String(body.country || '').trim();
  supplier.addressLine1 = String(body.addressLine1 || '').trim();
  supplier.addressLine2 = String(body.addressLine2 || '').trim();
  supplier.city = String(body.city || '').trim();
  supplier.state = String(body.state || '').trim();
  supplier.postalCode = String(body.postalCode || '').trim();
  supplier.registrationNotes = String(body.registrationNotes || '').trim();
  supplier.contactEmail = contactEmail;
  supplier.lastProfileUpdatedAt = new Date();
  const onboardingState = calculateSupplierOnboardingState({
    name: supplier.name,
    companyName: supplier.companyName,
    contactPersonName: supplier.contactPersonName,
    contactEmail: supplier.contactEmail,
    contactPhone: supplier.contactPhone,
    country: supplier.country,
    addressLine1: supplier.addressLine1,
    addressLine2: supplier.addressLine2,
    city: supplier.city,
    state: supplier.state,
    postalCode: supplier.postalCode,
    registrationNotes: supplier.registrationNotes,
    profileCompletedAt: supplier.profileCompletedAt,
  });
  supplier.registrationStage = onboardingState.registrationStage;
  supplier.profileCompletionPercent = onboardingState.profileCompletionPercent;
  supplier.profileCompletedAt = onboardingState.profileCompletedAt;
  await supplier.save();

  await SupplierAccountModel.findByIdAndUpdate(session.account._id, {
    email: contactEmail,
  });

  return NextResponse.json({
    message: 'Profile updated successfully.',
    supplier: {
      ...supplier.toObject(),
      registrationStage: onboardingState.registrationStage,
      profileCompletionPercent: onboardingState.profileCompletionPercent,
      profileCompletedAt: onboardingState.profileCompletedAt,
      missingFields: onboardingState.missingFields,
    },
  });
}
