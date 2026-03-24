import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface TermAttributes {
  id: string;
  academicYearId: string;
  schoolId: string;
  termNumber: 1 | 2 | 3;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type TermCreationAttributes = Optional<TermAttributes, 'id' | 'isActive'>;

export class Term extends Model<TermAttributes, TermCreationAttributes> implements TermAttributes {
  public id!: string;
  public academicYearId!: string;
  public schoolId!: string;
  public termNumber!: 1 | 2 | 3;
  public startDate!: Date;
  public endDate!: Date;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Term.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    academicYearId: { type: DataTypes.UUID, allowNull: false },
    schoolId: { type: DataTypes.UUID, allowNull: false },
    termNumber: { type: DataTypes.INTEGER, allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, tableName: 'terms', modelName: 'Term' }
);

export default Term;
