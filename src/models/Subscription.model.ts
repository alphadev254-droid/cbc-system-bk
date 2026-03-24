import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { BillingCycle, SubscriptionStatus } from '../config/constants';

export interface SubscriptionAttributes {
  id: string;
  schoolId: string;
  tierId: string;
  startDate: Date;
  endDate: Date;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

type SubscriptionCreationAttributes = Optional<SubscriptionAttributes, 'id'>;

export class Subscription
  extends Model<SubscriptionAttributes, SubscriptionCreationAttributes>
  implements SubscriptionAttributes
{
  public id!: string;
  public schoolId!: string;
  public tierId!: string;
  public startDate!: Date;
  public endDate!: Date;
  public billingCycle!: BillingCycle;
  public status!: SubscriptionStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Subscription.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    schoolId: { type: DataTypes.UUID, allowNull: false },
    tierId: { type: DataTypes.UUID, allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    billingCycle: { type: DataTypes.ENUM(...Object.values(BillingCycle)), allowNull: false },
    status: { type: DataTypes.ENUM(...Object.values(SubscriptionStatus)), defaultValue: SubscriptionStatus.TRIAL },
  },
  { sequelize, tableName: 'subscriptions', modelName: 'Subscription' }
);

export default Subscription;
