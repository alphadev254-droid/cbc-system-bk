// @ts-nocheck
import { Request } from 'express';
import { Role } from '../config/constants';

// Extends Express Request with typed user + tenant
export interface AuthRequest extends Request {
  user: {
    userId: string;
    schoolId: string;
    role: Role;
    permissions: string[];
    isGlobalAdmin: boolean;
  };
  tenant: {
    schoolId: string;
  };
}

// Pathway types
export type PathwayEnrollmentStatus = 'ACTIVE' | 'TRANSFERRED' | 'COMPLETED';

export interface StudentSubjectsResult {
  pathwayId: string | null;
  pathwayName: string | null;
  subjects: Array<{
    id: string;
    name: string;
    isCompulsory: boolean;
  }>;
}

export interface BulkEnrollResult {
  enrolled: number;
  skipped: string[];
  errors: Array<{ studentId: string; reason: string }>;
}

// Role context — returned by roleContext.service
export interface RoleContext {
  userId: string;
  schoolId: string | null;
  role: Role;
  permissions: string[];
  isGlobalAdmin: boolean;
  school: {
    id: string;
    name: string;
    curriculumType: string;
  } | null;
}
