import mongoose, { Model, Schema, models } from 'mongoose';
import bcrypt from 'bcryptjs';

import { RegistrationStage } from './profile-completion';

export type SupplierStatus = 'Pending' | 'Active' | 'Inactive';

export interface SupplierDocument {
  _id: mongoose.Types.ObjectId;
  supplierCode: string;
  name: string;
  companyName?: string;
  country: string;
  status: SupplierStatus;
  contactPersonName?: string;
  contactEmail: string;
  contactPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  registrationNotes?: string;
  registrationStage: RegistrationStage;
  profileCompletionPercent: number;
  profileCompletedAt?: Date | null;
  activatedAt?: Date | null;
  activatedBy?: mongoose.Types.ObjectId | null;
  lastProfileUpdatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierAccountDocument {
  _id: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  email: string;
  password: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: Date | null;
  comparePassword(password: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<SupplierDocument>(
  {
    supplierCode: { type: String, unique: true, required: true },
    name: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    country: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Pending', 'Active', 'Inactive'], default: 'Pending' },
    contactPersonName: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true, required: true, index: true },
    contactPhone: { type: String, trim: true },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    registrationNotes: { type: String, trim: true },
    registrationStage: { type: String, enum: ['In Progress', 'Draft'], default: 'Draft' },
    profileCompletionPercent: { type: Number, default: 100 },
    profileCompletedAt: { type: Date, default: null },
    activatedAt: { type: Date, default: null },
    activatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    lastProfileUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const supplierAccountSchema = new Schema<SupplierAccountDocument>(
  {
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      unique: true,
      index: true,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

supplierAccountSchema.methods.comparePassword = function comparePassword(password: string) {
  return bcrypt.compare(password, this.password);
};

export const SupplierModel = (models.Supplier as Model<SupplierDocument>) || mongoose.model<SupplierDocument>('Supplier', supplierSchema);
export const SupplierAccountModel =
  (models.SupplierAccount as Model<SupplierAccountDocument>) ||
  mongoose.model<SupplierAccountDocument>('SupplierAccount', supplierAccountSchema);
