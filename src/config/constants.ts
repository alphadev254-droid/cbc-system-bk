// @ts-nocheck
export enum Role {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  HEAD_TEACHER = 'HEAD_TEACHER',
  TEACHER = 'TEACHER',
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  PARENT = 'PARENT',
}

export enum CurriculumType {
  CBC = 'CBC',
  EIGHT_FOUR_FOUR = '844',
  BOTH = 'BOTH',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
}

export enum FeeFrequency {
  PER_TERM = 'per_term',
  ANNUAL = 'annual',
  ONCE = 'once',
}

export enum FeeStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export enum PaymentMethod {
  MPESA = 'mpesa',
  BANK = 'bank',
  CASH = 'cash',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  SMS = 'sms',
  EMAIL = 'email',
}

export enum StudentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRANSFERRED = 'transferred',
  GRADUATED = 'graduated',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum PathwayEnrollmentStatus {
  ACTIVE      = 'ACTIVE',
  TRANSFERRED = 'TRANSFERRED',
  COMPLETED   = 'COMPLETED',
}

// Fine-grained permissions
export enum Permission {
  // School
  MANAGE_SCHOOL        = 'manage:school',
  VIEW_SCHOOL          = 'view:school',
  // Users
  MANAGE_USERS         = 'manage:users',
  VIEW_USERS           = 'view:users',
  // Students
  MANAGE_STUDENTS      = 'manage:students',
  VIEW_STUDENTS        = 'view:students',
  // Academic
  MANAGE_ACADEMIC      = 'manage:academic',
  VIEW_ACADEMIC        = 'view:academic',
  // Subjects
  MANAGE_SUBJECTS      = 'manage:subjects',
  VIEW_SUBJECTS        = 'view:subjects',
  // Pathways
  MANAGE_PATHWAYS      = 'manage:pathways',
  VIEW_PATHWAYS        = 'view:pathways',
  ENROLL_PATHWAYS      = 'enroll:pathways',
  // Exams & Marks
  MANAGE_EXAMS         = 'manage:exams',
  ENTER_MARKS          = 'enter:marks',
  APPROVE_MARKS        = 'approve:marks',
  VIEW_MARKS           = 'view:marks',
  // Fees
  MANAGE_FEES          = 'manage:fees',
  RECORD_PAYMENTS      = 'record:payments',
  VIEW_FEES            = 'view:fees',
  // Reports
  VIEW_REPORTS         = 'view:reports',
  // Notifications
  SEND_NOTIFICATIONS   = 'send:notifications',
  // Subscriptions
  MANAGE_SUBSCRIPTIONS = 'manage:subscriptions',
}

// Default permissions per role — seeded into RolePermission table
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SYSTEM_ADMIN]: Object.values(Permission),
  [Role.HEAD_TEACHER]: [
    Permission.VIEW_SCHOOL,
    Permission.MANAGE_USERS, Permission.VIEW_USERS,
    Permission.MANAGE_STUDENTS, Permission.VIEW_STUDENTS,
    Permission.MANAGE_ACADEMIC, Permission.VIEW_ACADEMIC,
    Permission.MANAGE_SUBJECTS, Permission.VIEW_SUBJECTS,
    Permission.MANAGE_PATHWAYS, Permission.VIEW_PATHWAYS, Permission.ENROLL_PATHWAYS,
    Permission.MANAGE_EXAMS, Permission.ENTER_MARKS, Permission.APPROVE_MARKS, Permission.VIEW_MARKS,
    Permission.MANAGE_FEES, Permission.RECORD_PAYMENTS, Permission.VIEW_FEES,
    Permission.VIEW_REPORTS,
    Permission.SEND_NOTIFICATIONS,
  ],
  [Role.TEACHER]: [
    Permission.VIEW_SCHOOL,
    Permission.VIEW_STUDENTS,
    Permission.VIEW_ACADEMIC,
    Permission.VIEW_SUBJECTS,
    Permission.VIEW_PATHWAYS, Permission.ENROLL_PATHWAYS,
    Permission.ENTER_MARKS, Permission.VIEW_MARKS,
    Permission.VIEW_REPORTS,
  ],
  [Role.FINANCE_OFFICER]: [
    Permission.VIEW_SCHOOL,
    Permission.VIEW_STUDENTS,
    Permission.MANAGE_FEES, Permission.RECORD_PAYMENTS, Permission.VIEW_FEES,
    Permission.VIEW_REPORTS,
    Permission.SEND_NOTIFICATIONS,
  ],
  [Role.PARENT]: [
    Permission.VIEW_STUDENTS,
    Permission.VIEW_FEES,
    Permission.VIEW_MARKS,
    Permission.VIEW_REPORTS,
  ],
};

export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY = '30d';
export const BCRYPT_ROUNDS = 12;
export const MAX_LOGIN_ATTEMPTS = 5;
export const PASSWORD_RESET_EXPIRY_MINUTES = 60;
