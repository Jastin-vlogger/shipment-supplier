import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

import { connectToDatabase } from '@/lib/db';
import { SupplierAccountModel, SupplierModel } from '@/lib/models';
import { calculateSupplierOnboardingState } from '@/lib/profile-completion';
import { ensureUniqueSupplierEmail, generateSupplierCode } from '@/lib/supplier';

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!body.companyName || !body.contactPersonName || !body.country || !body.contactPhone || !email || !password) {
    return NextResponse.json({ message: 'All registration fields are required.' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ message: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  await connectToDatabase();

  const uniqueEmail = await ensureUniqueSupplierEmail(email);
  if (!uniqueEmail) {
    return NextResponse.json({ message: 'A supplier with this email already exists.' }, { status: 400 });
  }

  const supplierCode = await generateSupplierCode();
  const hashedPassword = await bcrypt.hash(password, 10);
  const onboardingState = calculateSupplierOnboardingState({
    name: body.companyName,
    companyName: body.companyName,
    country: body.country,
    contactPersonName: body.contactPersonName,
    contactEmail: email,
    contactPhone: body.contactPhone,
    registrationNotes: '',
  });

  const supplier = await SupplierModel.create({
    supplierCode,
    name: body.companyName,
    companyName: body.companyName,
    country: body.country,
    status: 'Pending',
    contactPersonName: body.contactPersonName,
    contactEmail: email,
    contactPhone: body.contactPhone,
    registrationNotes: '',
    registrationStage: onboardingState.registrationStage,
    profileCompletionPercent: onboardingState.profileCompletionPercent,
    profileCompletedAt: onboardingState.profileCompletedAt,
  });

  await SupplierAccountModel.create({
    supplierId: supplier._id,
    email,
    password: hashedPassword,
    isActive: true,
  });

  return NextResponse.json({
    message: 'Supplier account created successfully. Complete your profile to unlock admin review.',
  });
}
