import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { FeeFrequency } from '../config/constants';

export interface FeeTypeAttributes {
  id: string;
  schoolId: string;
  name: string;
  amount: number;
  frequency: FeeFrequency;
  createdAt?: Date;
  updatedAt?: Date;
}

type FeeTypeCreationAttributes = Optional<FeeTypeAttributes, 'id'>;

export class FeeType extends Model<FeeTypeAttributes, FeeTypeCreationAttributes> implements FeeTypeAttributes {
  public id!: string;
  public schoolId!: string;
  public name!: string;
  public amount!: number;
  public frequency!: FeeFrequency;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FeeType.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    schoolId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    frequency: { type: DataTypes.ENUM(...Object.values(FeeFrequency)), allowNull: false },
  },
  { sequelize, tableName: 'fee_types', modelName: 'FeeType' }
);

export default FeeType;
