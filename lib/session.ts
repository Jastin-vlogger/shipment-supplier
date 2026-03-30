import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { redirect } from 'next/navigation';

import { connectToDatabase } from '@/lib/db';
import { SupplierAccountModel, SupplierModel } from '@/lib/models';

export const SESSION_COOKIE = 'shipment_supplier_session';

const JWT_SECRET = process.env.SUPPLIER_JWT_SECRET || process.env.JWT_SECRET || 'shipment-supplier-secret';

export interface SupplierSessionPayload extends JwtPayload {
  supplierId: string;
  supplierAccountId: string;
  email: string;
}

export function signSupplierToken(payload: SupplierSessionPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

export function verifySupplierToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as SupplierSessionPayload;
}

export async function getCurrentSupplierSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifySupplierToken(token);
    await connectToDatabase();

    const [account, supplier] = await Promise.all([
      SupplierAccountModel.findById(payload.supplierAccountId).lean(),
      SupplierModel.findById(payload.supplierId).lean(),
    ]);

    if (!account || !supplier || !account.isActive || supplier.status === 'Inactive') {
      return null;
    }

    return {
      token,
      payload,
      account,
      supplier,
    };
  } catch {
    return null;
  }
}

export async function requireSupplierSession() {
  const session = await getCurrentSupplierSession();
  if (!session) {
    redirect('/login');
  }

  return session;
}
