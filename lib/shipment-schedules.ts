import mongoose from 'mongoose';

import { connectToDatabase } from '@/lib/db';
import { AuditLogModel, ShipmentTrackerContainerModel, ShipmentTrackerShipmentModel } from '@/lib/shipment-tracker-models';

export interface SupplierShipmentScheduleRow {
  id: string;
  containerId: string;
  shipmentId: string;
  shipmentNo: string;
  referenceNo: string;
  route: string;
  etd: string | null;
  eta: string | null;
  fcl: number;
  size: string;
  qtyMT: number;
  month: string;
  week: string;
  buyingUnit: string;
  currentStage: string;
  status: string;
  updatedAt: string;
}

export interface SupplierShipmentScheduleHistoryEntry {
  id: string;
  action: string;
  actorName: string;
  actorType: 'Supplier' | 'Admin' | 'System';
  remarks: string;
  createdAt: string;
  changes: {
    field: 'plannedDepartureDate' | 'plannedArrivalDate';
    label: 'ETD' | 'ETA';
    previousValue: string;
    nextValue: string;
  }[];
}

export interface SupplierShipmentScheduleDetail extends SupplierShipmentScheduleRow {
  origin: string;
  destination: string;
  history: SupplierShipmentScheduleHistoryEntry[];
}

type PlannedSnapshot = {
  containerId?: string;
  etd?: string | Date | null;
  eta?: string | Date | null;
  qtyMT?: number | null;
  FCL?: number | null;
  size?: string | number | null;
  weekWiseShipment?: string | null;
  buyingUnit?: string | null;
};

function asObjectId(value: string | mongoose.Types.ObjectId) {
  return typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;
}

function formatIsoDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatDateLabel(value?: Date | string | null) {
  const isoValue = formatIsoDate(value);
  if (!isoValue) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoValue));
}

function getMonth(value?: Date | string | null) {
  const isoValue = formatIsoDate(value);
  if (!isoValue) return '—';
  return new Date(isoValue).toLocaleString('en-US', { month: 'short' });
}

function getWeek(value?: Date | string | null, fallback?: string | null) {
  const isoValue = formatIsoDate(value);
  if (!isoValue) return fallback?.trim() || '—';
  const date = new Date(isoValue);
  return `W${Math.ceil(date.getDate() / 7)}`;
}

function buildShipmentRow(
  shipment: {
    _id: mongoose.Types.ObjectId;
    shipmentNo?: string;
    poNumber?: string;
    piNo?: string;
    portOfLoading?: string;
    portOfDischarge?: string;
    currentStage?: string;
  },
  container: {
    _id: mongoose.Types.ObjectId;
    planned?: {
      etd?: Date | null;
      eta?: Date | null;
      FCL?: number | null;
      size?: string | number | null;
      qtyMT?: number | null;
      weekWiseShipment?: string | null;
      buyingUnit?: string | null;
    };
    status?: string;
    updatedAt: Date;
  }
): SupplierShipmentScheduleRow {
  return {
    id: String(container._id),
    containerId: String(container._id),
    shipmentId: String(shipment._id),
    shipmentNo: shipment.shipmentNo || `Shipment ${String(shipment._id)}`,
    referenceNo: shipment.piNo || shipment.poNumber || '—',
    route: [shipment.portOfLoading, shipment.portOfDischarge].filter(Boolean).join(' -> ') || '—',
    etd: formatIsoDate(container.planned?.etd),
    eta: formatIsoDate(container.planned?.eta),
    fcl: Number(container.planned?.FCL) || 0,
    size: String(container.planned?.size ?? '—'),
    qtyMT: Number(container.planned?.qtyMT) || 0,
    month: getMonth(container.planned?.eta),
    week: getWeek(container.planned?.eta, container.planned?.weekWiseShipment),
    buyingUnit: String(container.planned?.buyingUnit || 'MT'),
    currentStage: shipment.currentStage || 'Shipment Tracker',
    status: container.status || 'Planned',
    updatedAt: container.updatedAt.toISOString(),
  };
}

function getSnapshotRow(rows: PlannedSnapshot[] | undefined, containerId: string) {
  return (rows || []).find((row) => String(row?.containerId || '') === containerId);
}

function buildHistoryChanges(before: PlannedSnapshot | undefined, after: PlannedSnapshot | undefined) {
  const changes: SupplierShipmentScheduleHistoryEntry['changes'] = [];
  const fieldMap = [
    { key: 'etd', field: 'plannedDepartureDate' as const, label: 'ETD' as const },
    { key: 'eta', field: 'plannedArrivalDate' as const, label: 'ETA' as const },
  ];

  fieldMap.forEach(({ key, field, label }) => {
    const previousValue = formatDateLabel(before?.[key as keyof PlannedSnapshot] as Date | string | null | undefined);
    const nextValue = formatDateLabel(after?.[key as keyof PlannedSnapshot] as Date | string | null | undefined);
    if (previousValue !== nextValue) {
      changes.push({ field, label, previousValue, nextValue });
    }
  });

  return changes;
}

export async function listSupplierShipmentSchedules(supplierId: string) {
  await connectToDatabase();

  const shipments = await ShipmentTrackerShipmentModel.find({ supplierId: asObjectId(supplierId) })
    .sort({ updatedAt: -1 })
    .lean();

  if (!shipments.length) {
    return [] as SupplierShipmentScheduleRow[];
  }

  const shipmentIds = shipments.map((shipment) => shipment._id);
  const containers = await ShipmentTrackerContainerModel.find({
    shipmentId: { $in: shipmentIds },
    status: { $in: ['Planned', 'Actual'] },
  })
    .sort({ createdAt: 1 })
    .lean();

  const shipmentMap = new Map(shipments.map((shipment) => [String(shipment._id), shipment]));

  return containers
    .map((container) => {
      const shipment = shipmentMap.get(String(container.shipmentId));
      if (!shipment) return null;
      return buildShipmentRow(shipment, container);
    })
    .filter((row): row is SupplierShipmentScheduleRow => Boolean(row))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

export async function getSupplierShipmentScheduleDetail(supplierId: string, containerId: string) {
  await connectToDatabase();

  const container = await ShipmentTrackerContainerModel.findById(containerId).lean();
  if (!container) return null;

  const shipment = await ShipmentTrackerShipmentModel.findOne({
    _id: container.shipmentId,
    supplierId: asObjectId(supplierId),
  }).lean();

  if (!shipment) return null;

  const row = buildShipmentRow(shipment, container);
  const auditLogs = await AuditLogModel.find({
    module: 'Purchase',
    entity: 'Shipment',
    entityId: shipment._id,
    action: { $in: ['ScheduledBaselineCreated', 'ScheduledBaselineUpdated'] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const history = auditLogs
    .map((entry) => {
      const before = getSnapshotRow(entry.before?.plannedContainers as PlannedSnapshot[] | undefined, String(container._id));
      const after = getSnapshotRow(entry.after?.plannedContainers as PlannedSnapshot[] | undefined, String(container._id));
      const changes = buildHistoryChanges(before, after);
      if (!changes.length) {
        return null;
      }

      const actorName =
        String(entry.after?.historyActorName || entry.before?.historyActorName || '').trim() ||
        (entry.action === 'ScheduledBaselineCreated' ? 'System' : 'System');
      const actorType = String(entry.after?.historyActorType || entry.before?.historyActorType || 'System') as
        | 'Supplier'
        | 'Admin'
        | 'System';

      return {
        id: String(entry._id),
        action: entry.action,
        actorName,
        actorType,
        remarks: entry.remarks || '',
        createdAt: entry.createdAt.toISOString(),
        changes,
      } satisfies SupplierShipmentScheduleHistoryEntry;
    })
    .filter((entry): entry is SupplierShipmentScheduleHistoryEntry => Boolean(entry));

  return {
    ...row,
    origin: shipment.portOfLoading || '',
    destination: shipment.portOfDischarge || '',
    history,
  } satisfies SupplierShipmentScheduleDetail;
}
