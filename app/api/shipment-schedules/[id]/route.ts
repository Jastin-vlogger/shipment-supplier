import { NextResponse } from 'next/server';

import { connectToDatabase } from '@/lib/db';
import { canAccessSupplierFunctions, canManageSupplierSchedules } from '@/lib/profile-completion';
import { AuditLogModel, ShipmentTrackerContainerModel, ShipmentTrackerShipmentModel } from '@/lib/shipment-tracker-models';
import { getCurrentSupplierSession } from '@/lib/session';

function toDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function getWeekString(date: Date | null) {
  if (!date) return '';
  return `W${Math.ceil(date.getDate() / 7)}`;
}

async function notifyShipmentUpdate(payload: {
  shipmentId: string;
  shipmentNo: string;
  supplierName: string;
  plannedDepartureDate: string;
  plannedArrivalDate: string;
}) {
  const baseUrl = process.env.SHIPMENT_TRACKER_API_BASE_URL || 'http://localhost:8080/api/v1';
  const internalKey = process.env.INTERNAL_API_KEY || process.env.SUPPLIER_INTERNAL_API_KEY || 'shipment-internal-key';
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/notifications/supplier-shipment-update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-key': internalKey,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || 'Admin notification could not be created.');
  }
}

function serializePlannedContainer(container: {
  _id: unknown;
  planned?: {
    size?: unknown;
    qtyMT?: unknown;
    bags?: unknown;
    FCL?: unknown;
    etd?: unknown;
    eta?: unknown;
    weekWiseShipment?: unknown;
    buyingUnit?: unknown;
  };
  status?: unknown;
}) {
  return {
    containerId: String(container._id),
    size: container.planned?.size ?? null,
    qtyMT: Number(container.planned?.qtyMT) || 0,
    bags: Number(container.planned?.bags) || 0,
    FCL: Number(container.planned?.FCL) || 0,
    etd: container.planned?.etd || null,
    eta: container.planned?.eta || null,
    weekWiseShipment: String(container.planned?.weekWiseShipment || ''),
    buyingUnit: String(container.planned?.buyingUnit || 'MT'),
    status: String(container.status || 'Planned'),
  };
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSupplierSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!canAccessSupplierFunctions(session.supplier)) {
    return NextResponse.json({ message: 'Complete your supplier profile to 100% before viewing shipment schedules.' }, { status: 403 });
  }

  if (!canManageSupplierSchedules(session.supplier)) {
    return NextResponse.json({ message: 'Only active suppliers can update ETA and ETD.' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const plannedDepartureDate = toDate(body.plannedDepartureDate);
  const plannedArrivalDate = toDate(body.plannedArrivalDate);

  if (!plannedDepartureDate || !plannedArrivalDate) {
    return NextResponse.json({ message: 'Both ETD and ETA are required.' }, { status: 400 });
  }

  if (plannedArrivalDate.getTime() < plannedDepartureDate.getTime()) {
    return NextResponse.json({ message: 'ETA must be on or after ETD.' }, { status: 400 });
  }

  await connectToDatabase();

  const container = await ShipmentTrackerContainerModel.findById(id);
  if (!container) {
    return NextResponse.json({ message: 'Shipment schedule row not found.' }, { status: 404 });
  }

  const shipment = await ShipmentTrackerShipmentModel.findOne({
    _id: container.shipmentId,
    supplierId: session.supplier._id,
  });

  if (!shipment) {
    return NextResponse.json({ message: 'Shipment schedule row not found.' }, { status: 404 });
  }

  const shipmentContainersBefore = await ShipmentTrackerContainerModel.find({ shipmentId: shipment._id }).sort({ createdAt: 1 }).lean();
  const beforeSnapshot = shipmentContainersBefore.map(serializePlannedContainer);

  container.planned = {
    ...container.planned,
    etd: plannedDepartureDate,
    eta: plannedArrivalDate,
    weekWiseShipment: getWeekString(plannedArrivalDate),
  };
  await container.save();

  const shipmentContainersAfter = await ShipmentTrackerContainerModel.find({ shipmentId: shipment._id }).sort({ createdAt: 1 }).lean();
  const afterSnapshot = shipmentContainersAfter.map(serializePlannedContainer);

  const actorName = session.supplier.companyName || session.supplier.name || session.account.email;
  await AuditLogModel.create({
    userId: session.account._id,
    module: 'Purchase',
    entity: 'Shipment',
    entityId: shipment._id,
    action: 'ScheduledBaselineUpdated',
    before: {
      plannedContainers: beforeSnapshot,
      historyActorName: actorName,
      historyActorType: 'Supplier',
      historyActorEmail: session.account.email,
    },
    after: {
      plannedContainers: afterSnapshot,
      historyActorName: actorName,
      historyActorType: 'Supplier',
      historyActorEmail: session.account.email,
    },
    remarks: `${actorName} updated ETD / ETA for ${shipment.shipmentNo || shipment.poNumber || 'shipment row'}.`,
  });

  let notificationStatusMessage = '';
  try {
    await notifyShipmentUpdate({
      shipmentId: String(shipment._id),
      shipmentNo: shipment.shipmentNo || shipment.poNumber || 'Shipment',
      supplierName: actorName,
      plannedDepartureDate: plannedDepartureDate.toISOString(),
      plannedArrivalDate: plannedArrivalDate.toISOString(),
    });
  } catch (error) {
    notificationStatusMessage = error instanceof Error ? error.message : 'Admin notification could not be created.';
  }

  return NextResponse.json({
    message: notificationStatusMessage
      ? `ETA and ETD updated successfully, but ${notificationStatusMessage}`
      : 'ETA and ETD updated successfully.',
    schedule: {
      containerId: String(container._id),
      shipmentId: String(shipment._id),
      plannedDepartureDate: plannedDepartureDate.toISOString(),
      plannedArrivalDate: plannedArrivalDate.toISOString(),
      weekWiseShipment: container.planned?.weekWiseShipment || '',
    },
  });
}
