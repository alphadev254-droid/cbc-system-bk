import { CurriculumType } from '../config/constants';

export interface GradeResult {
  grade: string;
  points: number;
  remarks: string;
}

export const getGrade = (score: number, curriculum: CurriculumType): GradeResult => {
  if (curriculum === CurriculumType.CBC) {
    if (score >= 80) return { grade: 'EE', points: 4, remarks: 'Exceeds Expectation' };
    if (score >= 60) return { grade: 'ME', points: 3, remarks: 'Meets Expectation' };
    if (score >= 40) return { grade: 'AE', points: 2, remarks: 'Approaches Expectation' };
    return { grade: 'BE', points: 1, remarks: 'Below Expectation' };
  }
  // 8-4-4
  if (score >= 75) return { grade: 'A', points: 12, remarks: 'Excellent' };
  if (score >= 70) return { grade: 'A-', points: 11, remarks: 'Excellent' };
  if (score >= 65) return { grade: 'B+', points: 10, remarks: 'Very Good' };
  if (score >= 60) return { grade: 'B', points: 9, remarks: 'Very Good' };
  if (score >= 55) return { grade: 'B-', points: 8, remarks: 'Good' };
  if (score >= 50) return { grade: 'C+', points: 7, remarks: 'Good' };
  if (score >= 45) return { grade: 'C', points: 6, remarks: 'Average' };
  if (score >= 40) return { grade: 'C-', points: 5, remarks: 'Average' };
  if (score >= 35) return { grade: 'D+', points: 4, remarks: 'Below Average' };
  if (score >= 30) return { grade: 'D', points: 3, remarks: 'Below Average' };
  if (score >= 25) return { grade: 'D-', points: 2, remarks: 'Poor' };
  return { grade: 'E', points: 1, remarks: 'Very Poor' };
};

export const computeAggregate = (points: number[]): number =>
  points.reduce((sum, p) => sum + p, 0);
