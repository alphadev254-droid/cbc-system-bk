import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface MarkAttributes {
  id: string;
  studentId: string;
  subjectId: string;
  examTypeId: string;
  termId: string;
  score: number;
  maxScore: number;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

type MarkCreationAttributes = Optional<MarkAttributes, 'id'>;

export class Mark extends Model<MarkAttributes, MarkCreationAttributes> implements MarkAttributes {
  public id!: string;
  public studentId!: string;
  public subjectId!: string;
  public examTypeId!: string;
  public termId!: string;
  public score!: number;
  public maxScore!: number;
  public approvedBy?: string;
  public approvedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Mark.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studentId: { type: DataTypes.UUID, allowNull: false },
    subjectId: { type: DataTypes.UUID, allowNull: false },
    examTypeId: { type: DataTypes.UUID, allowNull: false },
    termId: { type: DataTypes.UUID, allowNull: false },
    score: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    maxScore: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 100 },
    approvedBy: { type: DataTypes.UUID },
    approvedAt: { type: DataTypes.DATE },
  },
  { sequelize, tableName: 'marks', modelName: 'Mark' }
);

export default Mark;
