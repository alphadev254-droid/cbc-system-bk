import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PermissionAttributes {
  id: string;
  key: string;         // e.g. 'manage:students'
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type PermissionCreationAttributes = Optional<PermissionAttributes, 'id'>;

export class PermissionModel
  extends Model<PermissionAttributes, PermissionCreationAttributes>
  implements PermissionAttributes
{
  public id!: string;
  public key!: string;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PermissionModel.init(
  {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    key:         { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, tableName: 'permissions', modelName: 'Permission' }
);

export default PermissionModel;
