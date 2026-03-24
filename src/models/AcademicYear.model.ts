import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface AcademicYearAttributes {
  id: string;
  schoolId: string;
  year: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type AcademicYearCreationAttributes = Optional<AcademicYearAttributes, 'id' | 'isActive'>;

export class AcademicYear
  extends Model<AcademicYearAttributes, AcademicYearCreationAttributes>
  implements AcademicYearAttributes
{
  public id!: string;
  public schoolId!: string;
  public year!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AcademicYear.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    schoolId: { type: DataTypes.UUID, allowNull: false },
    year: { type: DataTypes.STRING(9), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, tableName: 'academic_years', modelName: 'AcademicYear' }
);

export default AcademicYear;
