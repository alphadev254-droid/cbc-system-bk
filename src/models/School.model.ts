import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { CurriculumType } from '../config/constants';

export interface SchoolAttributes {
  id: string;
  name: string;
  logo?: string;
  county: string;
  curriculumType: CurriculumType;
  subscriptionTier?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type SchoolCreationAttributes = Optional<SchoolAttributes, 'id' | 'isActive'>;

export class School extends Model<SchoolAttributes, SchoolCreationAttributes> implements SchoolAttributes {
  public id!: string;
  public name!: string;
  public logo?: string;
  public county!: string;
  public curriculumType!: CurriculumType;
  public subscriptionTier?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

School.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    logo: { type: DataTypes.STRING },
    county: { type: DataTypes.STRING, allowNull: false },
    curriculumType: { type: DataTypes.ENUM(...Object.values(CurriculumType)), allowNull: false },
    subscriptionTier: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, tableName: 'schools', modelName: 'School' }
);

export default School;
