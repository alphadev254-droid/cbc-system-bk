import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Role } from '../config/constants';

export interface RolePermissionAttributes {
  id: string;
  role: Role;
  permissionId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type RolePermissionCreationAttributes = Optional<RolePermissionAttributes, 'id'>;

export class RolePermission
  extends Model<RolePermissionAttributes, RolePermissionCreationAttributes>
  implements RolePermissionAttributes
{
  public id!: string;
  public role!: Role;
  public permissionId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RolePermission.init(
  {
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    role:         { type: DataTypes.ENUM(...Object.values(Role)), allowNull: false },
    permissionId: { type: DataTypes.UUID, allowNull: false },
  },
  {
    sequelize,
    tableName: 'role_permissions',
    modelName: 'RolePermission',
    indexes: [{ unique: true, fields: ['role', 'permissionId'] }],
  }
);

export default RolePermission;
