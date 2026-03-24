import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { PathwayEnrollmentStatus } from '../config/constants';

export interface StudentPathwayAttributes {
  id: string;
  studentId: string;
  pathwayId: string;
  termId: string;
  enrolledAt: Date;
  status: PathwayEnrollmentStatus;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

type StudentPathwayCreationAttributes = Optional<StudentPathwayAttributes, 'id' | 'enrolledAt' | 'status'>;

export class StudentPathway
  extends Model<StudentPathwayAttributes, StudentPathwayCreationAttributes>
  implements StudentPathwayAttributes
{
  public id!: string;
  public studentId!: string;
  public pathwayId!: string;
  public termId!: string;
  public enrolledAt!: Date;
  public status!: PathwayEnrollmentStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

StudentPathway.init(
  {
    id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studentId:  { type: DataTypes.UUID, allowNull: false },
    pathwayId:  { type: DataTypes.UUID, allowNull: false },
    termId:     { type: DataTypes.UUID, allowNull: false },
    enrolledAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status:     {
      type: DataTypes.ENUM(...Object.values(PathwayEnrollmentStatus)),
      defaultValue: PathwayEnrollmentStatus.ACTIVE,
    },
  },
  {
    sequelize,
    tableName: 'student_pathways',
    modelName: 'StudentPathway',
    paranoid: true,
    indexes: [{ unique: true, fields: ['studentId', 'termId'] }],
  }
);

export default StudentPathway;
