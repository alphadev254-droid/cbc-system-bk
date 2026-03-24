import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { NotificationChannel } from '../config/constants';

export interface NotificationAttributes {
  id: string;
  schoolId: string;
  userId?: string;
  type: string;
  channel: NotificationChannel;
  message: string;
  isRead: boolean;
  sentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

type NotificationCreationAttributes = Optional<NotificationAttributes, 'id' | 'isRead'>;

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: string;
  public schoolId!: string;
  public userId?: string;
  public type!: string;
  public channel!: NotificationChannel;
  public message!: string;
  public isRead!: boolean;
  public sentAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    schoolId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID },
    type: { type: DataTypes.STRING, allowNull: false },
    channel: { type: DataTypes.ENUM(...Object.values(NotificationChannel)), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    sentAt: { type: DataTypes.DATE },
  },
  { sequelize, tableName: 'notifications', modelName: 'Notification' }
);

export default Notification;
