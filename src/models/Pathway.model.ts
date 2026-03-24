import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PathwayAttributes {
  id: string;
  schoolId: string;
  academicYearId: string;
  name: string;
  description?: string;
  gradeLevel: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

type PathwayCreationAttributes = Optional<PathwayAttributes, 'id' | 'isActive'>;

export class Pathway
  extends Model<PathwayAttributes, PathwayCreationAttributes>
  implements PathwayAttributes
{
  public id!: string;
  public schoolId!: string;
  public academicYearId!: string;
  public name!: string;
  public description?: string;
  public gradeLevel!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

Pathway.init(
  {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    schoolId:       { type: DataTypes.UUID, allowNull: false },
    academicYearId: { type: DataTypes.UUID, allowNull: false },
    name:           { type: DataTypes.STRING, allowNull: false },
    description:    { type: DataTypes.TEXT },
    gradeLevel:     { type: DataTypes.STRING, allowNull: false },
    isActive:       { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'pathways',
    modelName: 'Pathway',
    paranoid: true,
    indexes: [{ unique: true, fields: ['schoolId', 'name', 'gradeLevel', 'academicYearId'] }],
  }
);

export default Pathway;
