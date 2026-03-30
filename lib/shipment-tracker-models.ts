import mongoose, { Model, Schema, models } from 'mongoose';

export interface ShipmentTrackerShipmentDocument {
  _id: mongoose.Types.ObjectId;
  supplierId?: mongoose.Types.ObjectId | null;
  shipmentNo?: string;
  poNumber?: string;
  piNo?: string;
  supplierName?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  plannedQtyMT?: number;
  currentStage?: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface ShipmentTrackerContainerDocument {
  _id: mongoose.Types.ObjectId;
  shipmentId: mongoose.Types.ObjectId;
  planned?: {
    size?: string | number | null;
    qtyMT?: number | null;
    FCL?: number | null;
    etd?: Date | null;
    eta?: Date | null;
    weekWiseShipment?: string | null;
    buyingUnit?: string | null;
  };
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogDocument {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  module: string;
  entity: string;
  entityId: mongoose.Types.ObjectId;
  action: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const shipmentTrackerShipmentSchema = new Schema<ShipmentTrackerShipmentDocument>(
  {
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', default: null },
    shipmentNo: { type: String, trim: true },
    poNumber: { type: String, trim: true },
    piNo: { type: String, trim: true },
    supplierName: { type: String, trim: true },
    portOfLoading: { type: String, trim: true },
    portOfDischarge: { type: String, trim: true },
    plannedQtyMT: { type: Number, default: 0 },
    currentStage: { type: String, trim: true, default: 'Shipment Entry' },
  },
  { timestamps: true, collection: 'shipments' }
);

const shipmentTrackerContainerSchema = new Schema<ShipmentTrackerContainerDocument>(
  {
    shipmentId: { type: Schema.Types.ObjectId, ref: 'Shipment', required: true, index: true },
    planned: {
      size: { type: Schema.Types.Mixed, default: null },
      qtyMT: { type: Number, default: 0 },
      FCL: { type: Number, default: 0 },
      etd: { type: Date, default: null },
      eta: { type: Date, default: null },
      weekWiseShipment: { type: String, trim: true, default: '' },
      buyingUnit: { type: String, trim: true, default: 'MT' },
    },
    status: { type: String, trim: true, default: 'Planned' },
  },
  { timestamps: true, collection: 'containers' }
);

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    module: { type: String, required: true, trim: true },
    entity: { type: String, required: true, trim: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, required: true, trim: true },
    before: { type: Schema.Types.Mixed, default: {} },
    after: { type: Schema.Types.Mixed, default: {} },
    remarks: { type: String, trim: true, default: '' },
  },
  { timestamps: true, collection: 'auditlogs' }
);

export const ShipmentTrackerShipmentModel =
  (models.Shipment as Model<ShipmentTrackerShipmentDocument>) ||
  mongoose.model<ShipmentTrackerShipmentDocument>('Shipment', shipmentTrackerShipmentSchema);

export const ShipmentTrackerContainerModel =
  (models.Container as Model<ShipmentTrackerContainerDocument>) ||
  mongoose.model<ShipmentTrackerContainerDocument>('Container', shipmentTrackerContainerSchema);

export const AuditLogModel =
  (models.AuditLog as Model<AuditLogDocument>) || mongoose.model<AuditLogDocument>('AuditLog', auditLogSchema);
