import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Role } from '../config/constants';

export interface SchoolRoleAttributes {
  id: string;
  userId: string;
  schoolId: string | null;  // null = platform-wide SYSTEM_ADMIN
  role: Role;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type SchoolRoleCreationAttributes = Optional<SchoolRoleAttributes, 'id' | 'isActive'>;

export class SchoolRole
  extends Model<SchoolRoleAttributes, SchoolRoleCreationAttributes>
  implements SchoolRoleAttributes
{
  public id!: string;
  public userId!: string;
  public schoolId!: string | null;
  public role!: Role;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SchoolRole.init(
  {
    id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId:   { type: DataTypes.UUID, allowNull: false },
    schoolId: { type: DataTypes.UUID, allowNull: true },   // null = global SYSTEM_ADMIN
    role:     { type: DataTypes.ENUM(...Object.values(Role)), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'school_roles',
    modelName: 'SchoolRole',
    indexes: [{ unique: true, fields: ['userId', 'schoolId'] }],
  }
);

export default SchoolRole;
