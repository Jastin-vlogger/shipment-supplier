import { redirect } from 'next/navigation';

import { getCurrentSupplierSession } from '@/lib/session';

export default async function HomePage() {
  const session = await getCurrentSupplierSession();
  redirect(session ? '/dashboard' : '/login');
}
