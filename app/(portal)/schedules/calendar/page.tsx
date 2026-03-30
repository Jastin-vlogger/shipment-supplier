import Link from 'next/link';

import { canAccessSupplierFunctions } from '@/lib/profile-completion';
import { listSupplierShipmentSchedules } from '@/lib/shipment-schedules';
import { requireSupplierSession } from '@/lib/session';

function groupByMonth(
  schedules: Awaited<ReturnType<typeof listSupplierShipmentSchedules>>
) {
  return schedules.reduce<Record<string, typeof schedules>>((accumulator, schedule) => {
    const key = schedule.eta
      ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(schedule.eta))
      : 'No ETA';
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(schedule);
    return accumulator;
  }, {});
}

export default async function SupplierEtaCalendarPage() {
  const session = await requireSupplierSession();
  const profileComplete = canAccessSupplierFunctions(session.supplier);
  const schedules = profileComplete ? await listSupplierShipmentSchedules(String(session.supplier._id)) : [];
  const grouped = groupByMonth(schedules);
  const groups = Object.entries(grouped);

  return (
    <div className="stack-lg">
      <section className="card">
        <div className="card-header-row">
          <div>
            <p className="eyebrow">ETA Calendar</p>
            <h3>Track scheduled arrivals by month</h3>
          </div>
          <Link href="/schedules" className="ghost-link">
            Back to schedules
          </Link>
        </div>

        {!profileComplete ? (
          <div className="feedback-panel suggestion-panel">
            <strong>Profile completion required</strong>
            <p>Finish your supplier profile to 100% and linked shipment ETA rows will appear here automatically.</p>
          </div>
        ) : groups.length ? (
          <div className="stack-lg">
            {groups.map(([label, rows]) => (
              <div key={label} className="calendar-month-card">
                <div className="calendar-month-header">
                  <h4>{label}</h4>
                  <span>{rows.length} row{rows.length === 1 ? '' : 's'}</span>
                </div>
                <div className="calendar-month-grid">
                  {rows.map((row) => (
                    <article key={row.id} className="calendar-schedule-card">
                      <div className="calendar-schedule-card__top">
                        <strong>{row.shipmentNo}</strong>
                        <span>{row.week}</span>
                      </div>
                      <p>{row.route}</p>
                      <div className="calendar-schedule-card__dates">
                        <span>ETD: {row.etd ? new Date(row.etd).toLocaleDateString() : '—'}</span>
                        <span>ETA: {row.eta ? new Date(row.eta).toLocaleDateString() : '—'}</span>
                      </div>
                      <div className="calendar-schedule-card__meta">
                        <span>FCL {row.fcl}</span>
                        <span>{row.qtyMT.toFixed(2)} MT</span>
                      </div>
                      <Link href={`/schedules/${row.containerId}`} className="schedule-action-link">
                        Open row
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No linked ETA rows are available yet.</p>
        )}
      </section>
    </div>
  );
}
