import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { CurriculumType, Gender, StudentStatus } from '../config/constants';

export interface StudentAttributes {
  id: string;
  schoolId: string;
  admissionNumber: string;
  fullName: string;
  dob: Date;
  gender: Gender;
  grade: string;
  curriculumType: CurriculumType;
  parentId?: string;
  status: StudentStatus;
  photo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type StudentCreationAttributes = Optional<StudentAttributes, 'id' | 'status'>;

export class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  public id!: string;
  public schoolId!: string;
  public admissionNumber!: string;
  public fullName!: string;
  public dob!: Date;
  public gender!: Gender;
  public grade!: string;
  public curriculumType!: CurriculumType;
  public parentId?: string;
  public status!: StudentStatus;
  public photo?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Student.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    schoolId: { type: DataTypes.UUID, allowNull: false },
    admissionNumber: { type: DataTypes.STRING, allowNull: false },
    fullName: { type: DataTypes.STRING, allowNull: false },
    dob: { type: DataTypes.DATEONLY, allowNull: false },
    gender: { type: DataTypes.ENUM(...Object.values(Gender)), allowNull: false },
    grade: { type: DataTypes.STRING, allowNull: false },
    curriculumType: { type: DataTypes.ENUM(...Object.values(CurriculumType)), allowNull: false },
    parentId: { type: DataTypes.UUID },
    status: { type: DataTypes.ENUM(...Object.values(StudentStatus)), defaultValue: StudentStatus.ACTIVE },
    photo: { type: DataTypes.STRING },
  },
  {
    sequelize,
    tableName: 'students',
    modelName: 'Student',
    indexes: [{ unique: true, fields: ['schoolId', 'admissionNumber'] }],
  }
);

export default Student;
