import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PathwaySubjectAttributes {
  id: string;
  pathwayId: string;
  subjectId: string;
  isCompulsory: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type PathwaySubjectCreationAttributes = Optional<PathwaySubjectAttributes, 'id' | 'isCompulsory'>;

export class PathwaySubject
  extends Model<PathwaySubjectAttributes, PathwaySubjectCreationAttributes>
  implements PathwaySubjectAttributes
{
  public id!: string;
  public pathwayId!: string;
  public subjectId!: string;
  public isCompulsory!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PathwaySubject.init(
  {
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    pathwayId:    { type: DataTypes.UUID, allowNull: false },
    subjectId:    { type: DataTypes.UUID, allowNull: false },
    isCompulsory: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'pathway_subjects',
    modelName: 'PathwaySubject',
    indexes: [{ unique: true, fields: ['pathwayId', 'subjectId'] }],
  }
);

export default PathwaySubject;
