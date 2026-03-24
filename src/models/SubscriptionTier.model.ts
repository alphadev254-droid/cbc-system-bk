import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface SubscriptionTierAttributes {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  maxStudents: number;
  modules: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

type SubscriptionTierCreationAttributes = Optional<SubscriptionTierAttributes, 'id'>;

export class SubscriptionTier
  extends Model<SubscriptionTierAttributes, SubscriptionTierCreationAttributes>
  implements SubscriptionTierAttributes
{
  public id!: string;
  public name!: string;
  public monthlyPrice!: number;
  public annualPrice!: number;
  public maxStudents!: number;
  public modules!: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SubscriptionTier.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    monthlyPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    annualPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    maxStudents: { type: DataTypes.INTEGER, allowNull: false },
    modules: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  },
  { sequelize, tableName: 'subscription_tiers', modelName: 'SubscriptionTier' }
);

export default SubscriptionTier;
