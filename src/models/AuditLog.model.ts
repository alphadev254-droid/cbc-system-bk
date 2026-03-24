import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface AuditLogAttributes {
  id: string;
  userId: string;
  schoolId: string;
  action: string;
  entity: string;
  entityId: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ip?: string;
  createdAt?: Date;
}

type AuditLogCreationAttributes = Optional<AuditLogAttributes, 'id'>;

export class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  public id!: string;
  public userId!: string;
  public schoolId!: string;
  public action!: string;
  public entity!: string;
  public entityId!: string;
  public oldData?: Record<string, unknown>;
  public newData?: Record<string, unknown>;
  public ip?: string;
  public readonly createdAt!: Date;
}

AuditLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    schoolId: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    entity: { type: DataTypes.STRING, allowNull: false },
    entityId: { type: DataTypes.UUID, allowNull: false },
    oldData: { type: DataTypes.JSONB },
    newData: { type: DataTypes.JSONB },
    ip: { type: DataTypes.STRING },
  },
  { sequelize, tableName: 'audit_logs', modelName: 'AuditLog', updatedAt: false }
);

export default AuditLog;
