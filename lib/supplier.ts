import { connectToDatabase } from '@/lib/db';
import { SupplierAccountModel, SupplierModel } from '@/lib/models';

export async function generateSupplierCode() {
  await connectToDatabase();

  let unique = false;
  let code = '';

  while (!unique) {
    code = `SUP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const existing = await SupplierModel.findOne({ supplierCode: code }).lean();
    if (!existing) {
      unique = true;
    }
  }

  return code;
}

export async function ensureUniqueSupplierEmail(email: string, ignoreSupplierId?: string) {
  await connectToDatabase();
  const normalizedEmail = email.trim().toLowerCase();

  const account = await SupplierAccountModel.findOne({ email: normalizedEmail }).lean();
  if (account && String(account.supplierId) !== ignoreSupplierId) {
    return false;
  }

  const supplier = await SupplierModel.findOne({ contactEmail: normalizedEmail }).lean();
  if (supplier && String(supplier._id) !== ignoreSupplierId) {
    return false;
  }

  return true;
}
