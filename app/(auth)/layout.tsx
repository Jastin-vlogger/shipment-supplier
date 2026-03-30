import { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { getCurrentSupplierSession } from '@/lib/session';

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSupplierSession();

  if (session) {
    redirect(session.account.mustChangePassword ? '/change-password' : '/dashboard');
  }

  return children;
}
