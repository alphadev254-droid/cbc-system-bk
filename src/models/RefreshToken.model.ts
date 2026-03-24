import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface RefreshTokenAttributes {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt?: Date;
}

type RefreshTokenCreationAttributes = Optional<RefreshTokenAttributes, 'id' | 'isRevoked'>;

export class RefreshToken
  extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
  implements RefreshTokenAttributes
{
  public id!: string;
  public userId!: string;
  public token!: string;
  public expiresAt!: Date;
  public isRevoked!: boolean;
  public readonly createdAt!: Date;
}

RefreshToken.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    token: { type: DataTypes.TEXT, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    isRevoked: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, tableName: 'refresh_tokens', modelName: 'RefreshToken', updatedAt: false }
);

export default RefreshToken;
