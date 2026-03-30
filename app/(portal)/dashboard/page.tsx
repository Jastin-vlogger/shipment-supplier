import Link from 'next/link';

import { connectToDatabase } from '@/lib/db';
import { canAccessSupplierFunctions, canManageSupplierSchedules, normalizeSupplierOnboardingState } from '@/lib/profile-completion';
import { listSupplierShipmentSchedules } from '@/lib/shipment-schedules';
import { requireSupplierSession } from '@/lib/session';

export default async function DashboardPage() {
  const session = await requireSupplierSession();
  const onboardingState = normalizeSupplierOnboardingState(session.supplier);
  const profileComplete = canAccessSupplierFunctions(session.supplier);
  const canManageSchedules = canManageSupplierSchedules(session.supplier);
  await connectToDatabase();

  const schedules = profileComplete ? await listSupplierShipmentSchedules(String(session.supplier._id)) : [];
  const recentSchedules = schedules.slice(0, 5);

  const counts = schedules.reduce<Record<string, number>>((accumulator, schedule) => {
    accumulator[schedule.status] = (accumulator[schedule.status] || 0) + 1;
    return accumulator;
  }, {});

  return (
    <div className="stack-lg">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Overview</p>
          <h3>{session.supplier.companyName || session.supplier.name}</h3>
          <p>
            Supplier code <strong>{session.supplier.supplierCode}</strong> is connected to the shared shipment tracker database.
          </p>
        </div>
        <div className="hero-card-actions">
          <Link href="/profile" className="ghost-link">
            Update profile
          </Link>
          {!canManageSchedules ? (
            <span className="secondary-button" aria-disabled="true" title={!profileComplete ? 'Complete profile first' : 'Awaiting admin activation'}>
              {!profileComplete ? `Complete profile (${onboardingState.profileCompletionPercent}%)` : 'Awaiting activation'}
            </span>
          ) : null}
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Total rows</span>
          <strong>{schedules.length}</strong>
        </article>
        <article className="stat-card">
          <span>Editable</span>
          <strong>{canManageSchedules ? schedules.length : 0}</strong>
        </article>
        <article className="stat-card">
          <span>Planned</span>
          <strong>{counts.Planned || 0}</strong>
        </article>
        <article className="stat-card">
          <span>Actual / locked</span>
          <strong>{counts.Actual || 0}</strong>
        </article>
      </section>

      <section className="card">
        <div className="card-header-row">
          <div>
            <p className="eyebrow">Linked shipment rows</p>
            <h3>Latest shipment baseline schedules</h3>
          </div>
          <Link href="/schedules" className="ghost-link">
            View all
          </Link>
        </div>
        <div className="table-shell premium-schedule-table premium-schedule-table-compact">
          <table>
            <thead>
              <tr>
                <th>Shipment no</th>
                <th>Reference</th>
                <th>ETD / ETA</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {recentSchedules.length ? (
                recentSchedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td data-label="Shipment no">
                      <div className="schedule-primary-cell">
                        <Link href={`/schedules/${schedule.containerId}`}>{schedule.shipmentNo}</Link>
                        <span>{schedule.route}</span>
                      </div>
                    </td>
                    <td data-label="Reference"><span className="schedule-metric-pill">{schedule.referenceNo || '—'}</span></td>
                    <td data-label="ETD / ETA"><span className="schedule-date-pill">{`${schedule.etd ? new Date(schedule.etd).toLocaleDateString() : '—'} / ${schedule.eta ? new Date(schedule.eta).toLocaleDateString() : '—'}`}</span></td>
                    <td data-label="Updated" className="schedule-updated-cell">{new Date(schedule.updatedAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    {profileComplete ? 'No linked shipment baseline rows are available yet.' : 'No linked shipment schedules are visible until your profile is complete.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
