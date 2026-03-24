import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Role } from '../config/constants';

export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  schoolId: string;
  isActive: boolean;
  lastLogin?: Date;
  twoFactorEnabled: boolean;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserCreationAttributes = Optional<UserAttributes, 'id' | 'isActive' | 'twoFactorEnabled'>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public name!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: Role;
  public schoolId!: string;
  public isActive!: boolean;
  public lastLogin?: Date;
  public twoFactorEnabled!: boolean;
  public passwordResetToken?: string;
  public passwordResetExpiry?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM(...Object.values(Role)), allowNull: false },
    schoolId: { type: DataTypes.UUID, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    lastLogin: { type: DataTypes.DATE },
    twoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    passwordResetToken: { type: DataTypes.STRING },
    passwordResetExpiry: { type: DataTypes.DATE },
  },
  { sequelize, tableName: 'users', modelName: 'User' }
);

export default User;
