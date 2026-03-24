import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { FeeStatus } from '../config/constants';

export interface FeeRecordAttributes {
  id: string;
  studentId: string;
  feeTypeId: string;
  termId: string;
  amount: number;
  dueDate: Date;
  paidAmount: number;
  balance: number;
  status: FeeStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

type FeeRecordCreationAttributes = Optional<FeeRecordAttributes, 'id' | 'paidAmount' | 'balance' | 'status'>;

export class FeeRecord
  extends Model<FeeRecordAttributes, FeeRecordCreationAttributes>
  implements FeeRecordAttributes
{
  public id!: string;
  public studentId!: string;
  public feeTypeId!: string;
  public termId!: string;
  public amount!: number;
  public dueDate!: Date;
  public paidAmount!: number;
  public balance!: number;
  public status!: FeeStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FeeRecord.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studentId: { type: DataTypes.UUID, allowNull: false },
    feeTypeId: { type: DataTypes.UUID, allowNull: false },
    termId: { type: DataTypes.UUID, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false },
    paidAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    balance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    status: { type: DataTypes.ENUM(...Object.values(FeeStatus)), defaultValue: FeeStatus.PENDING },
  },
  { sequelize, tableName: 'fee_records', modelName: 'FeeRecord' }
);

export default FeeRecord;
