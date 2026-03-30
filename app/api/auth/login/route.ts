import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { connectToDatabase } from '@/lib/db';
import { SupplierAccountModel, SupplierModel } from '@/lib/models';
import { SESSION_COOKIE, signSupplierToken } from '@/lib/session';

function getCookieSecureFlag() {
  if (process.env.COOKIE_SECURE === 'true') return true;
  if (process.env.COOKIE_SECURE === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
  }

  await connectToDatabase();

  const account = await SupplierAccountModel.findOne({ email }).select('+password');
  if (!account) {
    return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
  }

  const supplier = await SupplierModel.findById(account.supplierId);
  if (!supplier || supplier.status === 'Inactive' || !account.isActive) {
    return NextResponse.json({ message: 'Supplier account is inactive.' }, { status: 403 });
  }

  const passwordMatches = await bcrypt.compare(password, account.password);
  if (!passwordMatches) {
    return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
  }

  account.lastLoginAt = new Date();
  await account.save();

  const token = signSupplierToken({
    supplierId: String(supplier._id),
    supplierAccountId: String(account._id),
    email: account.email,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: getCookieSecureFlag(),
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({
    message: 'Login successful.',
    mustChangePassword: Boolean(account.mustChangePassword),
  });
}
