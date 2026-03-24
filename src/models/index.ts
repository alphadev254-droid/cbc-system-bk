import School from './School.model';
import User from './User.model';
import RefreshToken from './RefreshToken.model';
import SubscriptionTier from './SubscriptionTier.model';
import Subscription from './Subscription.model';
import AcademicYear from './AcademicYear.model';
import Term from './Term.model';
import Student from './Student.model';
import Subject from './Subject.model';
import FeeType from './FeeType.model';
import FeeRecord from './FeeRecord.model';
import Payment from './Payment.model';
import ExamType from './ExamType.model';
import Mark from './Mark.model';
import Notification from './Notification.model';
import AuditLog from './AuditLog.model';
import PermissionModel from './Permission.model';
import RolePermission from './RolePermission.model';
import SchoolRole from './SchoolRole.model';
import Pathway from './Pathway.model';
import PathwaySubject from './PathwaySubject.model';
import StudentPathway from './StudentPathway.model';

// ─── School ───────────────────────────────────────────────────────────────────
School.hasMany(User,         { foreignKey: 'schoolId', as: 'users' });
School.hasMany(Student,      { foreignKey: 'schoolId', as: 'students' });
School.hasMany(AcademicYear, { foreignKey: 'schoolId', as: 'academicYears' });
School.hasMany(Subscription, { foreignKey: 'schoolId', as: 'subscriptions' });
School.hasMany(FeeType,      { foreignKey: 'schoolId', as: 'feeTypes' });
School.hasMany(Subject,      { foreignKey: 'schoolId', as: 'subjects' });
School.hasMany(Notification, { foreignKey: 'schoolId', as: 'notifications' });
School.hasMany(SchoolRole,   { foreignKey: 'schoolId', as: 'members' });
School.hasMany(Pathway,      { foreignKey: 'schoolId', as: 'pathways' });

// ─── User ─────────────────────────────────────────────────────────────────────
User.belongsTo(School,      { foreignKey: 'schoolId', as: 'school' });
User.hasMany(RefreshToken,  { foreignKey: 'userId',   as: 'refreshTokens' });
User.hasMany(SchoolRole,    { foreignKey: 'userId',   as: 'schoolRoles' });

// ─── RefreshToken ─────────────────────────────────────────────────────────────
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ─── SchoolRole ───────────────────────────────────────────────────────────────
SchoolRole.belongsTo(User,   { foreignKey: 'userId' });
SchoolRole.belongsTo(School, { foreignKey: 'schoolId' });

// ─── Permission / RolePermission ──────────────────────────────────────────────
RolePermission.belongsTo(PermissionModel, { foreignKey: 'permissionId', as: 'permission' });
PermissionModel.hasMany(RolePermission,   { foreignKey: 'permissionId', as: 'rolePermissions' });

// ─── Subscription ─────────────────────────────────────────────────────────────
Subscription.belongsTo(School,           { foreignKey: 'schoolId', as: 'school' });
Subscription.belongsTo(SubscriptionTier, { foreignKey: 'tierId',   as: 'tier' });
SubscriptionTier.hasMany(Subscription,   { foreignKey: 'tierId',   as: 'subscriptions' });

// ─── AcademicYear / Term ──────────────────────────────────────────────────────
AcademicYear.belongsTo(School,   { foreignKey: 'schoolId',       as: 'school' });
AcademicYear.hasMany(Term,       { foreignKey: 'academicYearId', as: 'terms' });
AcademicYear.hasMany(Pathway,    { foreignKey: 'academicYearId', as: 'pathways' });
Term.belongsTo(AcademicYear,     { foreignKey: 'academicYearId', as: 'academicYear' });
Term.belongsTo(School,           { foreignKey: 'schoolId',       as: 'school' });
Term.hasMany(StudentPathway,     { foreignKey: 'termId' });

// ─── Student ──────────────────────────────────────────────────────────────────
Student.belongsTo(School,           { foreignKey: 'schoolId',  as: 'school' });
Student.belongsTo(User,             { foreignKey: 'parentId',  as: 'parent' });
Student.hasMany(FeeRecord,          { foreignKey: 'studentId', as: 'feeRecords' });
Student.hasMany(Mark,               { foreignKey: 'studentId', as: 'marks' });
Student.hasMany(StudentPathway,     { foreignKey: 'studentId', as: 'pathwayEnrollments' });

// ─── Subject ──────────────────────────────────────────────────────────────────
Subject.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });
Subject.hasMany(Mark,     { foreignKey: 'subjectId', as: 'marks' });
Subject.belongsToMany(Pathway, {
  through: PathwaySubject,
  foreignKey: 'subjectId',
  as: 'pathways',
});

// ─── FeeType / FeeRecord / Payment ────────────────────────────────────────────
FeeType.belongsTo(School,    { foreignKey: 'schoolId',   as: 'school' });
FeeType.hasMany(FeeRecord,   { foreignKey: 'feeTypeId',  as: 'feeRecords' });
FeeRecord.belongsTo(Student, { foreignKey: 'studentId',  as: 'student' });
FeeRecord.belongsTo(FeeType, { foreignKey: 'feeTypeId',  as: 'feeType' });
FeeRecord.belongsTo(Term,    { foreignKey: 'termId',     as: 'term' });
FeeRecord.hasMany(Payment,   { foreignKey: 'feeRecordId', as: 'payments' });
Payment.belongsTo(FeeRecord, { foreignKey: 'feeRecordId', as: 'feeRecord' });
Payment.belongsTo(Student,   { foreignKey: 'studentId',  as: 'student' });

// ─── ExamType / Mark ──────────────────────────────────────────────────────────
ExamType.belongsTo(School,  { foreignKey: 'schoolId',  as: 'school' });
ExamType.belongsTo(Term,    { foreignKey: 'termId',    as: 'term' });
ExamType.hasMany(Mark,      { foreignKey: 'examTypeId', as: 'marks' });
Mark.belongsTo(Student,     { foreignKey: 'studentId',  as: 'student' });
Mark.belongsTo(Subject,     { foreignKey: 'subjectId',  as: 'subject' });
Mark.belongsTo(ExamType,    { foreignKey: 'examTypeId', as: 'examType' });
Mark.belongsTo(Term,        { foreignKey: 'termId',     as: 'term' });

// ─── Notification ─────────────────────────────────────────────────────────────
Notification.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });
Notification.belongsTo(User,   { foreignKey: 'userId',   as: 'user' });

// ─── AuditLog ─────────────────────────────────────────────────────────────────
AuditLog.belongsTo(User,   { foreignKey: 'userId',   as: 'user' });
AuditLog.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

// ─── Pathway ──────────────────────────────────────────────────────────────────
Pathway.belongsTo(School,       { foreignKey: 'schoolId' });
Pathway.belongsTo(AcademicYear, { foreignKey: 'academicYearId' });
Pathway.belongsToMany(Subject, {
  through: PathwaySubject,
  foreignKey: 'pathwayId',
  as: 'subjects',
});
Pathway.hasMany(PathwaySubject,  { foreignKey: 'pathwayId', as: 'pathwaySubjects' });
Pathway.hasMany(StudentPathway,  { foreignKey: 'pathwayId', as: 'studentEnrollments' });

// ─── PathwaySubject ───────────────────────────────────────────────────────────
PathwaySubject.belongsTo(Pathway, { foreignKey: 'pathwayId' });
PathwaySubject.belongsTo(Subject, { foreignKey: 'subjectId' });

// ─── StudentPathway ───────────────────────────────────────────────────────────
StudentPathway.belongsTo(Student, { foreignKey: 'studentId' });
StudentPathway.belongsTo(Pathway, { foreignKey: 'pathwayId', as: 'pathway' });
StudentPathway.belongsTo(Term,    { foreignKey: 'termId' });

export {
  School, User, RefreshToken, SubscriptionTier, Subscription,
  AcademicYear, Term, Student, Subject, FeeType, FeeRecord,
  Payment, ExamType, Mark, Notification, AuditLog,
  PermissionModel, RolePermission, SchoolRole,
  Pathway, PathwaySubject, StudentPathway,
};
