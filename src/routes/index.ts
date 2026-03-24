import { Router } from 'express';
import authRoutes         from '../modules/auth/auth.routes';
import schoolRoutes       from '../modules/schools/school.routes';
import subscriptionRoutes from '../modules/subscriptions/subscription.routes';
import userRoutes         from '../modules/users/user.routes';
import academicYearRoutes from '../modules/academic-years/academicYear.routes';
import studentRoutes      from '../modules/students/student.routes';
import subjectRoutes      from '../modules/subjects/subject.routes';
import feeRoutes          from '../modules/fees/fee.routes';
import examRoutes         from '../modules/exams/exam.routes';
import notificationRoutes from '../modules/notifications/notification.routes';
import reportRoutes       from '../modules/reports/report.routes';
import pathwayRoutes      from '../modules/pathways/pathway.routes';

const router = Router();

router.use('/auth',           authRoutes);
router.use('/schools',        schoolRoutes);
router.use('/subscriptions',  subscriptionRoutes);
router.use('/users',          userRoutes);
router.use('/academic-years', academicYearRoutes);
router.use('/students',       studentRoutes);
router.use('/subjects',       subjectRoutes);
router.use('/fees',           feeRoutes);
router.use('/exams',          examRoutes);
router.use('/notifications',  notificationRoutes);
router.use('/reports',        reportRoutes);
router.use('/pathways',       pathwayRoutes);

export default router;
