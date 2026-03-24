import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { PaymentMethod } from '../config/constants';

export interface PaymentAttributes {
  id: string;
  feeRecordId: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  paidAt: Date;
  createdAt?: Date;
}

type PaymentCreationAttributes = Optional<PaymentAttributes, 'id'>;

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: string;
  public feeRecordId!: string;
  public studentId!: string;
  public amount!: number;
  public method!: PaymentMethod;
  public reference!: string;
  public paidAt!: Date;
  public readonly createdAt!: Date;
}

Payment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    feeRecordId: { type: DataTypes.UUID, allowNull: false },
    studentId: { type: DataTypes.UUID, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    method: { type: DataTypes.ENUM(...Object.values(PaymentMethod)), allowNull: false },
    reference: { type: DataTypes.STRING, allowNull: false },
    paidAt: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, tableName: 'payments', modelName: 'Payment', updatedAt: false }
);

export default Payment;
