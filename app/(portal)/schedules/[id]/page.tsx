import { notFound } from 'next/navigation';

import { LinkedScheduleForm } from '@/components/linked-schedule-form';
import { canAccessSupplierFunctions, canManageSupplierSchedules } from '@/lib/profile-completion';
import { getSupplierShipmentScheduleDetail } from '@/lib/shipment-schedules';
import { requireSupplierSession } from '@/lib/session';

export default async function ScheduleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSupplierSession();
  const { id } = await params;

  const schedule = await getSupplierShipmentScheduleDetail(String(session.supplier._id), id);
  if (!schedule) {
    notFound();
  }

  const profileComplete = canAccessSupplierFunctions(session.supplier);
  const canEdit = canManageSupplierSchedules(session.supplier);
  const lockReason = !profileComplete
    ? 'Complete your supplier profile to 100% before opening linked shipment schedules.'
    : 'Your supplier account must be active before ETA and ETD can be updated.';

  return <LinkedScheduleForm schedule={schedule} canEdit={canEdit} lockReason={canEdit ? undefined : lockReason} />;
}
