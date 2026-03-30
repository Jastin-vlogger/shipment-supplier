import { connectToDatabase } from '@/lib/db';
import { canAccessSupplierFunctions, canManageSupplierSchedules, normalizeSupplierOnboardingState } from '@/lib/profile-completion';
import { listSupplierShipmentSchedules } from '@/lib/shipment-schedules';
import { requireSupplierSession } from '@/lib/session';
import Link from 'next/link';

export default async function SchedulesPage() {
  const session = await requireSupplierSession();
  const onboardingState = normalizeSupplierOnboardingState(session.supplier);
  const profileComplete = canAccessSupplierFunctions(session.supplier);
  const canManageSchedules = canManageSupplierSchedules(session.supplier);
  await connectToDatabase();

  const schedules = profileComplete ? await listSupplierShipmentSchedules(String(session.supplier._id)) : [];

  return (
    <section className="card">
      <div className="card-header-row">
        <div>
          <p className="eyebrow">Schedules</p>
          <h3>Track shipment baseline schedules</h3>
        </div>
        <div className="actions-row">
          {profileComplete ? (
            <Link href="/schedules/calendar" className="ghost-link">
              ETA Calendar
            </Link>
          ) : null}
          {!canManageSchedules ? (
            <span className="secondary-button" aria-disabled="true">
              {!profileComplete ? `Complete profile (${onboardingState.profileCompletionPercent}%)` : 'Awaiting activation'}
            </span>
          ) : null}
        </div>
      </div>

      {!profileComplete ? (
        <div className="feedback-panel suggestion-panel" style={{ marginBottom: '1rem' }}>
          <strong>Profile completion required</strong>
          <p>Finish your profile to 100% and the linked shipment schedule rows will appear here automatically.</p>
        </div>
      ) : null}

      {profileComplete && !canManageSchedules ? (
        <div className="feedback-panel suggestion-panel" style={{ marginBottom: '1rem' }}>
          <strong>Read-only until activation</strong>
          <p>Your shipment rows are visible, but ETA / ETD editing unlocks only after admin activation.</p>
        </div>
      ) : null}

      <div className="table-shell premium-schedule-table">
        <table>
          <thead>
            <tr>
              <th>Shipment no</th>
              <th>FCL</th>
              <th>Size</th>
              <th>Qty MT</th>
              <th>ETD</th>
              <th>ETA</th>
              <th>Week</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {schedules.length ? (
              schedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td data-label="Shipment no">
                    <div className="schedule-primary-cell">
                      <Link href={`/schedules/${schedule.containerId}`}>{schedule.shipmentNo}</Link>
                      <span>{schedule.route}</span>
                    </div>
                  </td>
                  <td data-label="FCL"><span className="schedule-metric-pill">{schedule.fcl}</span></td>
                  <td data-label="Size"><span className="schedule-metric-pill">{schedule.size}</span></td>
                  <td data-label="Qty MT"><span className="schedule-metric-pill">{schedule.qtyMT.toFixed(2)}</span></td>
                  <td data-label="ETD">
                    <span className="schedule-date-pill">{schedule.etd ? new Date(schedule.etd).toLocaleDateString() : '—'}</span>
                  </td>
                  <td data-label="ETA">
                    <span className="schedule-date-pill">{schedule.eta ? new Date(schedule.eta).toLocaleDateString() : '—'}</span>
                  </td>
                  <td data-label="Week"><span className="schedule-week-pill">{schedule.week}</span></td>
                  <td data-label="Updated" className="schedule-updated-cell">{new Date(schedule.updatedAt).toLocaleString()}</td>
                  <td data-label="Action">
                    <Link href={`/schedules/${schedule.containerId}`} className="schedule-action-link">
                      {canManageSchedules ? 'Update ETA / ETD' : 'View'}
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9}>
                  {profileComplete
                    ? 'No linked shipment baseline rows are available for this supplier yet.'
                    : 'No linked shipment schedules are visible until your profile is complete.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
