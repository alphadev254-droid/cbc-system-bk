import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { CurriculumType } from '../config/constants';

export interface SubjectAttributes {
  id: string;
  schoolId: string;
  name: string;
  curriculumType: CurriculumType;
  gradeLevel: string;
  weeklyHours: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type SubjectCreationAttributes = Optional<SubjectAttributes, 'id'>;

export class Subject extends Model<SubjectAttributes, SubjectCreationAttributes> implements SubjectAttributes {
  public id!: string;
  public schoolId!: string;
  public name!: string;
  public curriculumType!: CurriculumType;
  public gradeLevel!: string;
  public weeklyHours!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Subject.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    schoolId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    curriculumType: { type: DataTypes.ENUM(...Object.values(CurriculumType)), allowNull: false },
    gradeLevel: { type: DataTypes.STRING, allowNull: false },
    weeklyHours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: 'subjects', modelName: 'Subject' }
);

export default Subject;
