import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { connectToDatabase } from '@/lib/db';
import { SupplierAccountModel } from '@/lib/models';
import { getCurrentSupplierSession } from '@/lib/session';

export async function POST(request: Request) {
  const session = await getCurrentSupplierSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const newPassword = String(body.newPassword || '');
  const confirmPassword = String(body.confirmPassword || '');

  if (newPassword.length < 8) {
    return NextResponse.json({ message: 'New password must be at least 8 characters.' }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ message: 'New password and confirm password must match.' }, { status: 400 });
  }

  await connectToDatabase();

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await SupplierAccountModel.findByIdAndUpdate(session.account._id, {
    password: hashedPassword,
    mustChangePassword: false,
  });

  return NextResponse.json({ message: 'Password updated successfully.' });
}
