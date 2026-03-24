import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ExamTypeAttributes {
  id: string;
  schoolId: string;
  name: string;
  weight: number;
  termId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type ExamTypeCreationAttributes = Optional<ExamTypeAttributes, 'id'>;

export class ExamType extends Model<ExamTypeAttributes, ExamTypeCreationAttributes> implements ExamTypeAttributes {
  public id!: string;
  public schoolId!: string;
  public name!: string;
  public weight!: number;
  public termId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ExamType.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    schoolId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    weight: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    termId: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, tableName: 'exam_types', modelName: 'ExamType' }
);

export default ExamType;
