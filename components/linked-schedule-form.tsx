'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import type { SupplierShipmentScheduleDetail } from '@/lib/shipment-schedules';

interface LinkedScheduleFormProps {
  canEdit: boolean;
  lockReason?: string;
  schedule: SupplierShipmentScheduleDetail;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function LinkedScheduleForm({ canEdit, lockReason, schedule }: LinkedScheduleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function saveSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;

    setLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData(event.currentTarget);
    const payload = {
      plannedDepartureDate: String(formData.get('plannedDepartureDate') || ''),
      plannedArrivalDate: String(formData.get('plannedArrivalDate') || ''),
    };

    const response = await fetch(`/api/shipment-schedules/${schedule.containerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.message || 'Unable to save ETA / ETD.');
      return;
    }

    setMessage(data.message || 'ETA and ETD updated successfully.');
    router.refresh();
  }

  return (
    <form className="card form-grid" onSubmit={saveSchedule}>
      <div className="card-header-row">
        <div>
          <p className="eyebrow">Shipment schedule</p>
          <h3>Update ETA and ETD</h3>
        </div>
        <span className={`status-badge status-${schedule.status.toLowerCase()}`}>{schedule.status}</span>
      </div>

      <label>
        Shipment no
        <input value={schedule.shipmentNo} disabled readOnly />
      </label>
      <label>
        Reference no
        <input value={schedule.referenceNo || '—'} disabled readOnly />
      </label>
      <label>
        Origin
        <input value={schedule.origin || '—'} disabled readOnly />
      </label>
      <label>
        Destination
        <input value={schedule.destination || '—'} disabled readOnly />
      </label>
      <label>
        FCL
        <input value={String(schedule.fcl)} disabled readOnly />
      </label>
      <label>
        Qty MT
        <input value={String(schedule.qtyMT)} disabled readOnly />
      </label>
      <label>
        Size
        <input value={schedule.size} disabled readOnly />
      </label>
      <label>
        Buying unit
        <input value={schedule.buyingUnit} disabled readOnly />
      </label>
      <label>
        ETD
        <input
          name="plannedDepartureDate"
          type="date"
          defaultValue={schedule.etd?.slice(0, 10) || ''}
          disabled={!canEdit}
        />
      </label>
      <label>
        ETA
        <input
          name="plannedArrivalDate"
          type="date"
          defaultValue={schedule.eta?.slice(0, 10) || ''}
          disabled={!canEdit}
        />
      </label>

      <div className="full-width feedback-panel suggestion-panel">
        <strong>Supplier update scope</strong>
        <p>Only ETA and ETD are editable in the supplier portal. The rest of the shipment baseline stays synced from the internal tracker.</p>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>Current route:</strong> {schedule.route}
        </p>
        <p>
          <strong>Last saved ETD / ETA:</strong> {formatDate(schedule.etd)} / {formatDate(schedule.eta)}
        </p>
      </div>

      {error ? <p className="form-error full-width">{error}</p> : null}
      {message ? <p className="form-success full-width">{message}</p> : null}
      {!canEdit && lockReason ? (
        <div className="full-width feedback-panel suggestion-panel">
          <strong>Action locked</strong>
          <p>{lockReason}</p>
        </div>
      ) : null}

      <div className="full-width actions-row">
        <button type="submit" className="primary-button" disabled={loading || !canEdit}>
          {loading ? 'Saving...' : 'Save ETA / ETD'}
        </button>
      </div>

      <div className="full-width feedback-panel suggestion-panel">
        <strong>Schedule history</strong>
        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.75rem' }}>
          {schedule.history.length ? (
            schedule.history.map((entry) => (
              <div
                key={entry.id}
                style={{ border: '1px solid var(--line)', borderRadius: '0.9rem', padding: '0.9rem 1rem', background: '#fff' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <strong>{entry.actorType === 'Supplier' ? 'Supplier ETA / ETD update' : entry.action}</strong>
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                    {entry.actorName || entry.actorType} • {formatDate(entry.createdAt)}
                  </span>
                </div>
                {entry.remarks ? <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)' }}>{entry.remarks}</p> : null}
                <div style={{ marginTop: '0.6rem', display: 'grid', gap: '0.35rem' }}>
                  {entry.changes.map((change, changeIndex) => (
                    <p key={`${change.field}-${changeIndex}`} style={{ margin: 0 }}>
                      <strong>{change.label}:</strong> {change.previousValue || '—'} → {change.nextValue || '—'}
                    </p>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p style={{ margin: 0 }}>No ETA / ETD updates have been saved yet.</p>
          )}
        </div>
      </div>
    </form>
  );
}
