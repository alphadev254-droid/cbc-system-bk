const axios = require('axios');

const BASE        = 'http://localhost:5000/api/v1';
const ADMIN_EMAIL = 'admin@cbcplatform.co.ke';
const ADMIN_PASS  = 'ChangeMe@2024!';

let token        = '';
let refreshToken = '';
let schoolId     = '';
let userId       = '';
let studentId    = '';
let subjectId    = '';
let academicYearId = '';
let termId       = '';
let feeTypeId    = '';
let feeRecordId  = '';
let examTypeId   = '';
let markId       = '';
let pathwayId    = '';
let tierId       = '';
let notifId      = '';

let passed = 0;
let failed = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, data) {
  await sleep(150);
  return axios({
    method, url: BASE + path, data,
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    validateStatus: () => true,
  });
}

function check(label, res, expectedStatuses, extract) {
  const ok = expectedStatuses.includes(res.status);
  if (ok) {
    passed++;
    console.log(`  ✅  [${res.status}] ${label}`);
    if (extract) extract(res.data?.data);
  } else {
    failed++;
    console.error(`  ❌  [${res.status}] ${label} →`, res.data?.message || res.data);
  }
}

async function run() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   CBC Platform — SYSTEM_ADMIN API Tests      ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  const ts = Date.now();
  let r;

  // ── AUTH ──────────────────────────────────────────────────────────────────
  console.log('── AUTH ──────────────────────────────────────');

  r = await api('POST', '/auth/register', { name: 'System Admin', email: ADMIN_EMAIL, password: ADMIN_PASS });
  check('Register SYSTEM_ADMIN', r, [201, 409]);

  r = await api('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASS });
  check('Login', r, [200], (d) => {
    token        = d.accessToken;
    refreshToken = d.refreshToken;
    console.log(`       🔑 accessToken: ${token.slice(0, 40)}...`);
  });

  r = await api('POST', '/auth/refresh', { refreshToken });
  check('Refresh token', r, [200, 401], (d) => { if (d) token = d.accessToken; });

  // ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────
  console.log('\n── SUBSCRIPTIONS ─────────────────────────────');

  // unique name each run to avoid unique constraint
  r = await api('POST', '/subscriptions/tiers', {
    name: `Basic Plan ${ts}`, monthlyPrice: 999, annualPrice: 9999,
    maxStudents: 300, modules: ['fees', 'exams', 'reports'],
  });
  check('Create subscription tier', r, [200, 201], (d) => { tierId = d.id; });

  r = await api('GET', '/subscriptions/tiers');
  check('Get all tiers', r, [200]);

  r = await api('PUT', `/subscriptions/tiers/${tierId}`, { monthlyPrice: 1200, annualPrice: 11000 });
  check('Update tier', r, [200]);

  // ── SCHOOLS ───────────────────────────────────────────────────────────────
  console.log('\n── SCHOOLS ───────────────────────────────────');

  r = await api('POST', '/schools', {
    name: `Test School ${ts}`, county: 'Nairobi', curriculumType: 'CBC',
  });
  check('Create school', r, [200, 201], (d) => {
    schoolId = d.id;
    console.log(`       🏫 schoolId: ${schoolId}`);
  });

  r = await api('GET', '/schools');
  check('Get all schools', r, [200]);

  r = await api('GET', `/schools/${schoolId}`);
  check('Get school by ID', r, [200]);

  // update only isActive — avoid unique name constraint
  r = await api('PUT', `/schools/${schoolId}`, { isActive: true });
  check('Update school', r, [200]);

  r = await api('POST', '/subscriptions/assign', {
    schoolId, tierId, billingCycle: 'monthly', startDate: new Date().toISOString(),
  });
  check('Assign subscription to school', r, [200, 201]);

  // ── USERS ─────────────────────────────────────────────────────────────────
  console.log('\n── USERS ─────────────────────────────────────');

  // schoolId in body — read by tenantContext, NOT spread into Prisma data by user.service
  r = await api('POST', '/users', {
    schoolId,
    name: 'Head Teacher', email: `ht${ts}@cbcplatform.co.ke`,
    password: 'Teacher1234!', role: 'HEAD_TEACHER',
  });
  check('Create HEAD_TEACHER user', r, [200, 201], (d) => {
    userId = d.id;
    console.log(`       👤 userId: ${userId}`);
  });

  r = await api('GET', `/users?schoolId=${schoolId}`);
  check('Get all users', r, [200]);

  r = await api('GET', `/users/${userId}?schoolId=${schoolId}`);
  check('Get user by ID', r, [200]);

  // schoolId in body for PATCH/PUT tenant routes
  r = await api('PUT', `/users/${userId}`, { schoolId, name: 'Head Teacher (Updated)' });
  check('Update user', r, [200]);

  // ── SCHOOL MEMBERS ────────────────────────────────────────────────────────
  console.log('\n── SCHOOL MEMBERS ────────────────────────────');

  r = await api('GET', `/schools/${schoolId}/members`);
  check('List school members', r, [200]);

  r = await api('POST', `/schools/${schoolId}/members`, { userId, role: 'HEAD_TEACHER' });
  check('Assign member to school', r, [200, 201, 409]);

  r = await api('PATCH', `/schools/${schoolId}/members/${userId}`, { role: 'TEACHER' });
  check('Update member role', r, [200]);

  // ── ACADEMIC YEARS ────────────────────────────────────────────────────────
  console.log('\n── ACADEMIC YEARS ────────────────────────────');

  r = await api('POST', '/academic-years', { schoolId, year: `${new Date().getFullYear()}` });
  check('Create academic year', r, [200, 201], (d) => { academicYearId = d.id; });

  r = await api('GET', `/academic-years?schoolId=${schoolId}`);
  check('Get all academic years', r, [200]);

  r = await api('PATCH', `/academic-years/${academicYearId}/activate`, { schoolId });
  check('Activate academic year', r, [200]);

  r = await api('POST', '/academic-years/terms', {
    schoolId, academicYearId, termNumber: 1,
    startDate: '2025-01-06', endDate: '2025-04-04',
  });
  check('Create term', r, [200, 201], (d) => {
    termId = d.id;
    console.log(`       📅 termId: ${termId}`);
  });

  r = await api('PATCH', `/academic-years/terms/${termId}/activate`, { schoolId });
  check('Activate term', r, [200]);

  // ── SUBJECTS ──────────────────────────────────────────────────────────────
  console.log('\n── SUBJECTS ──────────────────────────────────');

  // schoolId only for tenantContext — NOT spread into Prisma SubjectCreateInput
  r = await api('POST', '/subjects', {
    schoolId, name: 'Mathematics', curriculumType: 'CBC', gradeLevel: 'Grade 7', weeklyHours: 5,
  });
  check('Create subject', r, [200, 201], (d) => { subjectId = d.id; });

  r = await api('GET', `/subjects?schoolId=${schoolId}`);
  check('Get all subjects', r, [200]);

  r = await api('GET', `/subjects/${subjectId}?schoolId=${schoolId}`);
  check('Get subject by ID', r, [200]);

  // no schoolId in update body — controller uses req.tenant.schoolId
  r = await api('PUT', `/subjects/${subjectId}`, { schoolId, weeklyHours: 6 });
  check('Update subject', r, [200]);

  // ── STUDENTS ──────────────────────────────────────────────────────────────
  console.log('\n── STUDENTS ──────────────────────────────────');

  // dob must be full ISO-8601 datetime for Prisma
  r = await api('POST', '/students', {
    schoolId,
    admissionNumber: `ADM${ts}`, fullName: 'Jane Doe',
    dob: '2012-03-15T00:00:00.000Z', gender: 'female', grade: 'Grade 7', curriculumType: 'CBC',
  });
  check('Create student', r, [200, 201], (d) => {
    studentId = d.id;
    console.log(`       🎒 studentId: ${studentId}`);
  });

  r = await api('GET', `/students?schoolId=${schoolId}`);
  check('Get all students', r, [200]);

  r = await api('GET', `/students/${studentId}?schoolId=${schoolId}`);
  check('Get student by ID', r, [200]);

  r = await api('PUT', `/students/${studentId}`, { schoolId, grade: 'Grade 8' });
  check('Update student', r, [200]);

  // ── PATHWAYS ──────────────────────────────────────────────────────────────
  console.log('\n── PATHWAYS ──────────────────────────────────');

  r = await api('POST', '/pathways', {
    schoolId, name: 'STEM Pathway', gradeLevel: 'Grade 7',
    academicYearId, subjectIds: [subjectId],
  });
  check('Create pathway', r, [200, 201], (d) => { pathwayId = d.id; });

  r = await api('GET', `/pathways?schoolId=${schoolId}`);
  check('Get all pathways', r, [200]);

  r = await api('GET', `/pathways/${pathwayId}?schoolId=${schoolId}`);
  check('Get pathway by ID', r, [200]);

  r = await api('PUT', `/pathways/${pathwayId}`, { schoolId, name: 'STEM Pathway (Updated)' });
  check('Update pathway', r, [200]);

  r = await api('POST', `/pathways/${pathwayId}/subjects`, { schoolId, subjectIds: [subjectId], isCompulsory: true });
  check('Add subjects to pathway', r, [200, 201]);

  r = await api('POST', `/pathways/${pathwayId}/enroll`, { schoolId, studentId, termId });
  check('Enroll student in pathway', r, [200, 201]);

  r = await api('POST', `/pathways/${pathwayId}/bulk-enroll`, { schoolId, studentIds: [studentId], termId });
  check('Bulk enroll students', r, [200, 201, 409]);

  r = await api('GET', `/pathways/${pathwayId}/students?schoolId=${schoolId}`);
  check('Get students in pathway', r, [200]);

  r = await api('GET', `/pathways/student/${studentId}/subjects?schoolId=${schoolId}`);
  check('Get student pathway subjects', r, [200]);

  // ── EXAMS ─────────────────────────────────────────────────────────────────
  console.log('\n── EXAMS ─────────────────────────────────────');

  r = await api('POST', '/exams/types', { schoolId, name: 'End Term Exam', weight: 100, termId });
  check('Create exam type', r, [200, 201], (d) => { examTypeId = d.id; });

  r = await api('GET', `/exams/types?schoolId=${schoolId}`);
  check('Get exam types', r, [200]);

  r = await api('POST', '/exams/marks', { schoolId, studentId, subjectId, examTypeId, termId, score: 85, maxScore: 100 });
  check('Enter marks', r, [200, 201], (d) => { markId = d.id; });

  r = await api('POST', '/exams/marks/bulk', {
    schoolId, marks: [{ studentId, subjectId, examTypeId, termId, score: 90, maxScore: 100 }],
  });
  check('Bulk enter marks', r, [200, 201]);

  r = await api('GET', `/exams/marks/${studentId}?schoolId=${schoolId}`);
  check('Get student marks', r, [200]);

  if (markId) {
    r = await api('PATCH', `/exams/marks/${markId}/approve`, { schoolId });
    check('Approve mark', r, [200]);
  }

  // ── FEES ──────────────────────────────────────────────────────────────────
  console.log('\n── FEES ──────────────────────────────────────');

  r = await api('POST', '/fees/types', { schoolId, name: 'Tuition Fee', amount: 15000, frequency: 'per_term' });
  check('Create fee type', r, [200, 201], (d) => { feeTypeId = d.id; });

  r = await api('GET', `/fees/types?schoolId=${schoolId}`);
  check('Get fee types', r, [200]);

  r = await api('POST', '/fees/assign', { schoolId, studentId, feeTypeId, termId, dueDate: '2025-03-01', amount: 15000 });
  check('Assign fee to student', r, [200, 201], (d) => { feeRecordId = d.id; });

  r = await api('GET', `/fees/statement/${studentId}?schoolId=${schoolId}&termId=${termId}`);
  check('Get fee statement', r, [200]);

  r = await api('GET', `/fees/balances?schoolId=${schoolId}`);
  check('Get fee balances', r, [200]);

  if (feeRecordId) {
    r = await api('POST', '/fees/payments', {
      schoolId, feeRecordId, amount: 15000, method: 'mpesa',
      reference: `MPESA${ts}`, paidAt: new Date().toISOString(),
    });
    check('Record payment', r, [200, 201]);
  }

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
  console.log('\n── NOTIFICATIONS ─────────────────────────────');

  r = await api('POST', '/notifications', { schoolId, userId, type: 'GENERAL', channel: 'in_app', message: 'Welcome!' });
  check('Send notification', r, [200, 201], (d) => { notifId = d?.id; });

  r = await api('GET', `/notifications/me?schoolId=${schoolId}`);
  check('Get my notifications', r, [200]);

  r = await api('POST', '/notifications/bulk', { schoolId, userIds: [userId], type: 'ANNOUNCEMENT', channel: 'in_app', message: 'School starts Monday.' });
  check('Bulk notify', r, [200, 201]);

  if (notifId) {
    r = await api('PATCH', `/notifications/${notifId}/read`, { schoolId });
    check('Mark notification read', r, [200]);
  }

  r = await api('PATCH', '/notifications/read-all', { schoolId });
  check('Mark all notifications read', r, [200]);

  // ── REPORTS ───────────────────────────────────────────────────────────────
  console.log('\n── REPORTS ───────────────────────────────────');

  r = await api('GET', `/reports/report-card?schoolId=${schoolId}&studentId=${studentId}&termId=${termId}`);
  check('Report card', r, [200]);

  r = await api('GET', `/reports/class-performance?schoolId=${schoolId}&termId=${termId}`);
  check('Class performance', r, [200]);

  r = await api('GET', `/reports/fee-collection?schoolId=${schoolId}&termId=${termId}`);
  check('Fee collection report', r, [200]);

  r = await api('GET', `/reports/enrollment?schoolId=${schoolId}`);
  check('Enrollment report', r, [200]);

  // ── CLEANUP ───────────────────────────────────────────────────────────────
  console.log('\n── CLEANUP ───────────────────────────────────');

  r = await api('DELETE', `/pathways/${pathwayId}/subjects/${subjectId}`, { schoolId });
  check('Remove subject from pathway', r, [200, 204]);

  r = await api('DELETE', `/pathways/${pathwayId}`, { schoolId });
  check('Delete pathway', r, [200, 204]);

  r = await api('DELETE', `/subjects/${subjectId}`, { schoolId });
  check('Delete subject', r, [200, 204]);

  r = await api('DELETE', `/schools/${schoolId}/members/${userId}`);
  check('Remove school member', r, [200, 204]);

  r = await api('PATCH', `/users/${userId}/deactivate`, { schoolId });
  check('Deactivate user', r, [200]);

  r = await api('DELETE', `/schools/${schoolId}`);
  check('Delete school', r, [200, 204]);

  r = await api('POST', '/auth/logout', { refreshToken });
  check('Logout', r, [200]);

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log(`║  Total: ${String(total).padEnd(4)} ✅ Passed: ${String(passed).padEnd(4)} ❌ Failed: ${String(failed).padEnd(4)}  ║`);
  console.log('╚══════════════════════════════════════════════╝\n');

  if (failed > 0) process.exit(1);
}

run().catch((err) => { console.error('Fatal:', err.message); process.exit(1); });
