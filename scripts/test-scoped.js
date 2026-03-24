/**
 * test-scoped.js
 *
 * Tests role scoping and cross-school isolation:
 *   1. SYSTEM_ADMIN  — creates two schools, seeds data in each
 *   2. HEAD_TEACHER  — full CRUD scoped to their school only
 *   3. TEACHER       — can view + enter marks, cannot manage fees/users
 *   4. FINANCE_OFFICER — can manage fees, cannot enter marks
 *   5. PARENT        — read-only on their child
 *   6. Cross-school  — HEAD_TEACHER of school A cannot access school B data
 *   7. Cleanup       — SYSTEM_ADMIN deletes both schools
 */

const axios = require('axios');

const BASE = 'http://localhost:5000/api/v1';

// ── credentials ───────────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@cbcplatform.co.ke';
const ADMIN_PASS  = 'ChangeMe@2024!';
const ts          = Date.now();

const HT_A_EMAIL  = `ht_a_${ts}@cbcplatform.co.ke`;
const HT_B_EMAIL  = `ht_b_${ts}@cbcplatform.co.ke`;
const TCH_EMAIL   = `teacher_${ts}@cbcplatform.co.ke`;
const FIN_EMAIL   = `finance_${ts}@cbcplatform.co.ke`;
const PAR_EMAIL   = `parent_${ts}@cbcplatform.co.ke`;
const PASS        = 'Test1234!';

// ── state ─────────────────────────────────────────────────────────────────────
let adminToken = '';

let schoolAId = ''; let schoolBId = '';
let htAId = '';     let htBId = '';
let teacherId = ''; let financeId = ''; let parentId = '';
let studentAId = ''; let studentBId = '';
let subjectAId = '';
let academicYearAId = ''; let termAId = '';
let examTypeAId = '';
let feeTypeAId = ''; let feeRecordAId = '';
let pathwayAId = '';
let tierId = '';

let htAToken = '';   // HEAD_TEACHER school A
let htBToken = '';   // HEAD_TEACHER school B
let tchToken = '';   // TEACHER school A
let finToken = '';   // FINANCE_OFFICER school A
let parToken = '';   // PARENT school A

let passed = 0; let failed = 0; let skipped = 0;

// ── helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, data, token) {
  await sleep(120);
  return axios({
    method, url: BASE + path, data,
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    validateStatus: () => true,
  });
}

function check(label, res, expected, extract) {
  const ok = expected.includes(res.status);
  if (ok) {
    passed++;
    console.log(`  ✅  [${res.status}] ${label}`);
    if (extract) extract(res.data?.data);
  } else {
    failed++;
    console.error(`  ❌  [${res.status}] ${label} →`, res.data?.message || res.status);
  }
  return ok;
}

// expect a DENIAL (401/403/400) — role should NOT be able to do this
function deny(label, res) {
  const denied = [400, 401, 403].includes(res.status);
  if (denied) {
    passed++;
    console.log(`  🚫  [${res.status}] DENIED (correct): ${label}`);
  } else {
    failed++;
    console.error(`  ❌  [${res.status}] SHOULD HAVE BEEN DENIED: ${label}`);
  }
}

function section(title) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(50));
}

// ── main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   CBC Platform — Multi-Role Scoping Tests        ║');
  console.log('╚══════════════════════════════════════════════════╝');

  let r;

  // ══════════════════════════════════════════════════════════════════════════
  section('PHASE 1 — SYSTEM_ADMIN: Login + Setup');
  // ══════════════════════════════════════════════════════════════════════════

  r = await api('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASS });
  check('Admin login', r, [200], (d) => { adminToken = d.accessToken; });

  // subscription tier
  r = await api('POST', '/subscriptions/tiers', {
    name: `Tier ${ts}`, monthlyPrice: 500, annualPrice: 5000,
    maxStudents: 500, modules: ['fees', 'exams'],
  }, adminToken);
  check('Create subscription tier', r, [200, 201], (d) => { tierId = d.id; });

  // school A
  r = await api('POST', '/schools', { name: `School A ${ts}`, county: 'Nairobi', curriculumType: 'CBC' }, adminToken);
  check('Create School A', r, [200, 201], (d) => { schoolAId = d.id; console.log(`     🏫 School A: ${schoolAId}`); });

  // school B
  r = await api('POST', '/schools', { name: `School B ${ts}`, county: 'Mombasa', curriculumType: 'CBC' }, adminToken);
  check('Create School B', r, [200, 201], (d) => { schoolBId = d.id; console.log(`     🏫 School B: ${schoolBId}`); });

  // assign subscriptions
  r = await api('POST', '/subscriptions/assign', { schoolId: schoolAId, tierId, billingCycle: 'monthly', startDate: new Date().toISOString() }, adminToken);
  check('Assign subscription to School A', r, [200, 201]);

  r = await api('POST', '/subscriptions/assign', { schoolId: schoolBId, tierId, billingCycle: 'monthly', startDate: new Date().toISOString() }, adminToken);
  check('Assign subscription to School B', r, [200, 201]);

  // create users via admin
  r = await api('POST', '/users', { schoolId: schoolAId, name: 'Head Teacher A', email: HT_A_EMAIL, password: PASS, role: 'HEAD_TEACHER' }, adminToken);
  check('Create HEAD_TEACHER for School A', r, [200, 201], (d) => { htAId = d.id; });

  r = await api('POST', '/users', { schoolId: schoolBId, name: 'Head Teacher B', email: HT_B_EMAIL, password: PASS, role: 'HEAD_TEACHER' }, adminToken);
  check('Create HEAD_TEACHER for School B', r, [200, 201], (d) => { htBId = d.id; });

  r = await api('POST', '/users', { schoolId: schoolAId, name: 'Teacher A', email: TCH_EMAIL, password: PASS, role: 'TEACHER' }, adminToken);
  check('Create TEACHER for School A', r, [200, 201], (d) => { teacherId = d.id; });

  r = await api('POST', '/users', { schoolId: schoolAId, name: 'Finance A', email: FIN_EMAIL, password: PASS, role: 'FINANCE_OFFICER' }, adminToken);
  check('Create FINANCE_OFFICER for School A', r, [200, 201], (d) => { financeId = d.id; });

  r = await api('POST', '/users', { schoolId: schoolAId, name: 'Parent A', email: PAR_EMAIL, password: PASS, role: 'PARENT' }, adminToken);
  check('Create PARENT for School A', r, [200, 201], (d) => { parentId = d.id; });

  // assign members to schools
  r = await api('POST', `/schools/${schoolAId}/members`, { userId: htAId, role: 'HEAD_TEACHER' }, adminToken);
  check('Assign HT-A to School A', r, [200, 201, 409]);

  r = await api('POST', `/schools/${schoolBId}/members`, { userId: htBId, role: 'HEAD_TEACHER' }, adminToken);
  check('Assign HT-B to School B', r, [200, 201, 409]);

  r = await api('POST', `/schools/${schoolAId}/members`, { userId: teacherId, role: 'TEACHER' }, adminToken);
  check('Assign Teacher to School A', r, [200, 201, 409]);

  r = await api('POST', `/schools/${schoolAId}/members`, { userId: financeId, role: 'FINANCE_OFFICER' }, adminToken);
  check('Assign Finance to School A', r, [200, 201, 409]);

  r = await api('POST', `/schools/${schoolAId}/members`, { userId: parentId, role: 'PARENT' }, adminToken);
  check('Assign Parent to School A', r, [200, 201, 409]);

  // ══════════════════════════════════════════════════════════════════════════
  section('PHASE 2 — HEAD_TEACHER School A: Full CRUD');
  // ══════════════════════════════════════════════════════════════════════════

  // HT-A login — JWT will carry schoolAId automatically
  r = await api('POST', '/auth/login', { email: HT_A_EMAIL, password: PASS });
  check('HT-A login', r, [200], (d) => {
    htAToken = d.accessToken;
    console.log(`     🔑 HT-A schoolId in token: ${d.user?.schools?.[0]?.schoolId}`);
  });

  // academic year
  r = await api('POST', '/academic-years', { year: `${new Date().getFullYear()}` }, htAToken);
  check('HT-A: Create academic year', r, [200, 201], (d) => { academicYearAId = d.id; });

  r = await api('GET', `/academic-years?schoolId=${schoolAId}`, null, htAToken);
  check('HT-A: Get academic years', r, [200]);

  r = await api('PATCH', `/academic-years/${academicYearAId}/activate`, null, htAToken);
  check('HT-A: Activate academic year', r, [200]);

  r = await api('POST', '/academic-years/terms', {
    academicYearId: academicYearAId, termNumber: 1,
    startDate: '2025-01-06', endDate: '2025-04-04',
  }, htAToken);
  check('HT-A: Create term', r, [200, 201], (d) => { termAId = d.id; });

  r = await api('PATCH', `/academic-years/terms/${termAId}/activate`, null, htAToken);
  check('HT-A: Activate term', r, [200]);

  // subject
  r = await api('POST', '/subjects', { name: 'Science', curriculumType: 'CBC', gradeLevel: 'Grade 7', weeklyHours: 4 }, htAToken);
  check('HT-A: Create subject', r, [200, 201], (d) => { subjectAId = d.id; });

  r = await api('GET', `/subjects?schoolId=${schoolAId}`, null, htAToken);
  check('HT-A: Get subjects', r, [200]);

  r = await api('PUT', `/subjects/${subjectAId}`, { weeklyHours: 5 }, htAToken);
  check('HT-A: Update subject', r, [200]);

  // student
  r = await api('POST', '/students', {
    admissionNumber: `SA${ts}`, fullName: 'Alice Wanjiru',
    dob: '2011-06-10T00:00:00.000Z', gender: 'female', grade: 'Grade 7', curriculumType: 'CBC',
    parentId: parentId,
  }, htAToken);
  check('HT-A: Create student in School A', r, [200, 201], (d) => { studentAId = d.id; console.log(`     🎒 Student A: ${studentAId}`); });

  r = await api('GET', `/students?schoolId=${schoolAId}`, null, htAToken);
  check('HT-A: Get students', r, [200]);

  r = await api('GET', `/students/${studentAId}`, null, htAToken);
  check('HT-A: Get student by ID', r, [200]);

  r = await api('PUT', `/students/${studentAId}`, { grade: 'Grade 8' }, htAToken);
  check('HT-A: Update student', r, [200]);

  // pathway
  r = await api('POST', '/pathways', {
    name: 'Science Pathway', gradeLevel: 'Grade 7',
    academicYearId: academicYearAId, subjectIds: [subjectAId],
  }, htAToken);
  check('HT-A: Create pathway', r, [200, 201], (d) => { pathwayAId = d.id; });

  r = await api('POST', `/pathways/${pathwayAId}/enroll`, { studentId: studentAId, termId: termAId }, htAToken);
  check('HT-A: Enroll student in pathway', r, [200, 201]);

  // exam type
  r = await api('POST', '/exams/types', { name: 'Mid Term', weight: 50, termId: termAId }, htAToken);
  check('HT-A: Create exam type', r, [200, 201], (d) => { examTypeAId = d.id; });

  // fee type
  r = await api('POST', '/fees/types', { name: 'School Fees', amount: 12000, frequency: 'per_term' }, htAToken);
  check('HT-A: Create fee type', r, [200, 201], (d) => { feeTypeAId = d.id; });

  r = await api('POST', '/fees/assign', { studentId: studentAId, feeTypeId: feeTypeAId, termId: termAId, dueDate: '2025-02-01', amount: 12000 }, htAToken);
  check('HT-A: Assign fee to student', r, [200, 201], (d) => { feeRecordAId = d.id; });

  // users management
  r = await api('GET', `/users?schoolId=${schoolAId}`, null, htAToken);
  check('HT-A: List users in School A', r, [200]);

  r = await api('POST', '/users', { schoolId: schoolAId, name: 'Extra Teacher', email: `extra_${ts}@cbcplatform.co.ke`, password: PASS, role: 'TEACHER' }, htAToken);
  check('HT-A: Create user in own school', r, [200, 201]);

  // notifications
  r = await api('POST', '/notifications', { userId: teacherId, type: 'INFO', channel: 'in_app', message: 'Staff meeting tomorrow.' }, htAToken);
  check('HT-A: Send notification', r, [200, 201]);

  // reports
  r = await api('GET', `/reports/class-performance?termId=${termAId}`, null, htAToken);
  check('HT-A: Class performance report', r, [200]);

  r = await api('GET', `/reports/enrollment`, null, htAToken);
  check('HT-A: Enrollment report', r, [200]);

  // ══════════════════════════════════════════════════════════════════════════
  section('PHASE 3 — TEACHER School A: Allowed + Denied');
  // ══════════════════════════════════════════════════════════════════════════

  r = await api('POST', '/auth/login', { email: TCH_EMAIL, password: PASS });
  check('Teacher login', r, [200], (d) => { tchToken = d.accessToken; });

  // ALLOWED — view
  r = await api('GET', `/students?schoolId=${schoolAId}`, null, tchToken);
  check('Teacher: View students (allowed)', r, [200]);

  r = await api('GET', `/subjects?schoolId=${schoolAId}`, null, tchToken);
  check('Teacher: View subjects (allowed)', r, [200]);

  r = await api('GET', `/exams/types?schoolId=${schoolAId}`, null, tchToken);
  check('Teacher: View exam types (allowed)', r, [200]);

  r = await api('GET', `/pathways?schoolId=${schoolAId}`, null, tchToken);
  check('Teacher: View pathways (allowed)', r, [200]);

  // ALLOWED — enter marks
  r = await api('POST', '/exams/marks', { studentId: studentAId, subjectId: subjectAId, examTypeId: examTypeAId, termId: termAId, score: 72, maxScore: 100 }, tchToken);
  check('Teacher: Enter marks (allowed)', r, [200, 201]);

  r = await api('GET', `/exams/marks/${studentAId}?schoolId=${schoolAId}`, null, tchToken);
  check('Teacher: View marks (allowed)', r, [200]);

  // DENIED — cannot manage fees
  r = await api('POST', '/fees/types', { name: 'Extra Fee', amount: 500, frequency: 'once' }, tchToken);
  deny('Teacher: Create fee type (denied)', r);

  r = await api('POST', '/fees/assign', { studentId: studentAId, feeTypeId: feeTypeAId, termId: termAId, dueDate: '2025-02-01' }, tchToken);
  deny('Teacher: Assign fee (denied)', r);

  // DENIED — cannot manage users
  r = await api('POST', '/users', { schoolId: schoolAId, name: 'Rogue User', email: `rogue_${ts}@cbcplatform.co.ke`, password: PASS, role: 'TEACHER' }, tchToken);
  deny('Teacher: Create user (denied)', r);

  // DENIED — cannot approve marks
  r = await api('GET', `/exams/marks/${studentAId}?schoolId=${schoolAId}`, null, tchToken);
  const markId = r.data?.data?.[0]?.id;
  if (markId) {
    r = await api('PATCH', `/exams/marks/${markId}/approve`, null, tchToken);
    deny('Teacher: Approve mark (denied)', r);
  }

  // DENIED — cannot delete subjects
  r = await api('DELETE', `/subjects/${subjectAId}`, null, tchToken);
  deny('Teacher: Delete subject (denied)', r);

  // ══════════════════════════════════════════════════════════════════════════
  section('PHASE 4 — FINANCE_OFFICER School A: Allowed + Denied');
  // ══════════════════════════════════════════════════════════════════════════

  r = await api('POST', '/auth/login', { email: FIN_EMAIL, password: PASS });
  check('Finance login', r, [200], (d) => { finToken = d.accessToken; });

  // ALLOWED — fees
  r = await api('GET', `/fees/types?schoolId=${schoolAId}`, null, finToken);
  check('Finance: View fee types (allowed)', r, [200]);

  r = await api('GET', `/fees/balances?schoolId=${schoolAId}`, null, finToken);
  check('Finance: View balances (allowed)', r, [200]);

  r = await api('GET', `/fees/statement/${studentAId}?schoolId=${schoolAId}&termId=${termAId}`, null, finToken);
  check('Finance: View fee statement (allowed)', r, [200]);

  r = await api('POST', '/fees/payments', {
    feeRecordId: feeRecordAId, amount: 6000, method: 'mpesa',
    reference: `FIN${ts}`, paidAt: new Date().toISOString(),
  }, finToken);
  check('Finance: Record payment (allowed)', r, [200, 201]);

  // ALLOWED — view students
  r = await api('GET', `/students?schoolId=${schoolAId}`, null, finToken);
  check('Finance: View students (allowed)', r, [200]);

  // DENIED — cannot enter marks
  r = await api('POST', '/exams/marks', { studentId: studentAId, subjectId: subjectAId, examTypeId: examTypeAId, termId: termAId, score: 80 }, finToken);
  deny('Finance: Enter marks (denied)', r);

  // DENIED — cannot manage users
  r = await api('POST', '/users', { schoolId: schoolAId, name: 'Rogue', email: `rogue2_${ts}@cbcplatform.co.ke`, password: PASS, role: 'TEACHER' }, finToken);
  deny('Finance: Create user (denied)', r);

  // DENIED — cannot manage subjects
  r = await api('POST', '/subjects', { name: 'Art', curriculumType: 'CBC', gradeLevel: 'Grade 7', weeklyHours: 2 }, finToken);
  deny('Finance: Create subject (denied)', r);

  // ══════════════════════════════════════════════════════════════════════════
  section('PHASE 5 — PARENT School A: Read-only');
  // ══════════════════════════════════════════════════════════════════════════

  r = await api('POST', '/auth/login', { email: PAR_EMAIL, password: PASS });
  check('Parent login', r, [200], (d) => { parToken = d.accessToken; });

  // ALLOWED — view own child
  r = await api('GET', `/students/${studentAId}`, null, parToken);
  check('Parent: View student (allowed)', r, [200]);

  r = await api('GET', `/exams/marks/${studentAId}?schoolId=${schoolAId}`, null, parToken);
  check('Parent: View marks (allowed)', r, [200]);

  r = await api('GET', `/fees/statement/${studentAId}?schoolId=${schoolAId}&termId=${termAId}`, null, parToken);
  check('Parent: View fee statement (allowed)', r, [200]);

  r = await api('GET', `/reports/report-card?schoolId=${schoolAId}&studentId=${studentAId}&termId=${termAId}`, null, parToken);
  check('Parent: View report card (allowed)', r, [200]);

  // DENIED — cannot create anything
  r = await api('POST', '/students', { admissionNumber: `PAR${ts}`, fullName: 'Rogue Student', dob: '2012-01-01T00:00:00.000Z', gender: 'male', grade: 'Grade 7', curriculumType: 'CBC' }, parToken);
  deny('Parent: Create student (denied)', r);

  r = await api('POST', '/fees/types', { name: 'Rogue Fee', amount: 100, frequency: 'once' }, parToken);
  deny('Parent: Create fee type (denied)', r);

  r = await api('POST', '/exams/marks', { studentId: studentAId, subjectId: subjectAId, examTypeId: examTypeAId, termId: termAId, score: 99 }, parToken);
  deny('Parent: Enter marks (denied)', r);

  // ══════════════════════════════════════════════════════════════════════════
  section('PHASE 6 — CROSS-SCHOOL ISOLATION: HT-A cannot access School B');
  // ══════════════════════════════════════════════════════════════════════════

  // HT-B login and create a student in School B
  r = await api('POST', '/auth/login', { email: HT_B_EMAIL, password: PASS });
  check('HT-B login', r, [200], (d) => { htBToken = d.accessToken; });

  r = await api('POST', '/academic-years', { year: `${new Date().getFullYear()}` }, htBToken);
  let yearBId = '';
  check('HT-B: Create academic year', r, [200, 201], (d) => { yearBId = d.id; });

  r = await api('POST', '/students', {
    admissionNumber: `SB${ts}`, fullName: 'Bob Kamau',
    dob: '2011-09-20T00:00:00.000Z', gender: 'male', grade: 'Grade 7', curriculumType: 'CBC',
  }, htBToken);
  check('HT-B: Create student in School B', r, [200, 201], (d) => { studentBId = d.id; console.log(`     🎒 Student B: ${studentBId}`); });

  // HT-A tries to access School B student — should be denied or return empty
  r = await api('GET', `/students/${studentBId}`, null, htAToken);
  const crossOk = [403, 404].includes(r.status) || (r.status === 200 && !r.data?.data);
  if (crossOk) {
    passed++;
    console.log(`  🚫  [${r.status}] ISOLATED (correct): HT-A cannot see School B student`);
  } else {
    failed++;
    console.error(`  ❌  [${r.status}] ISOLATION BREACH: HT-A accessed School B student!`);
  }

  // HT-A tries to create student in School B by passing schoolBId in body
  r = await api('POST', '/students', {
    schoolId: schoolBId,
    admissionNumber: `BREACH${ts}`, fullName: 'Breach Attempt',
    dob: '2012-01-01T00:00:00.000Z', gender: 'male', grade: 'Grade 7', curriculumType: 'CBC',
  }, htAToken);
  // HT-A token has schoolAId — tenantContext will use token schoolId, not body schoolId for non-admin
  const breachOk = [400, 403, 404].includes(r.status) ||
    (r.status === 201 && r.data?.data?.schoolId === schoolAId); // created in A, not B
  if (breachOk) {
    passed++;
    console.log(`  🚫  [${r.status}] ISOLATED (correct): HT-A cannot create student in School B`);
  } else {
    failed++;
    console.error(`  ❌  [${r.status}] ISOLATION BREACH: HT-A created student in School B!`);
  }

  // HT-A tries to access School B members
  r = await api('GET', `/schools/${schoolBId}/members`, null, htAToken);
  deny('HT-A: Access School B members (denied)', r);

  // HT-B tries to access School A subjects
  r = await api('GET', `/subjects?schoolId=${schoolAId}`, null, htBToken);
  // should return empty or denied — not School A's subjects
  const subjectIsolation = r.status === 403 || r.status === 400 ||
    (r.status === 200 && (r.data?.data?.length === 0 || !r.data?.data?.find((s) => s.id === subjectAId)));
  if (subjectIsolation) {
    passed++;
    console.log(`  🚫  [${r.status}] ISOLATED (correct): HT-B cannot see School A subjects`);
  } else {
    failed++;
    console.error(`  ❌  [${r.status}] ISOLATION BREACH: HT-B accessed School A subjects!`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  section('PHASE 7 — SYSTEM_ADMIN: Cleanup both schools');
  // ══════════════════════════════════════════════════════════════════════════

  r = await api('DELETE', `/schools/${schoolAId}`, null, adminToken);
  check('Admin: Delete School A', r, [200, 204]);

  r = await api('DELETE', `/schools/${schoolBId}`, null, adminToken);
  check('Admin: Delete School B', r, [200, 204]);

  // verify schools are gone
  r = await api('GET', `/schools/${schoolAId}`, null, adminToken);
  check('Admin: School A no longer exists', r, [404]);

  r = await api('GET', `/schools/${schoolBId}`, null, adminToken);
  check('Admin: School B no longer exists', r, [404]);

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log(`║  Total: ${String(total).padEnd(4)} ✅ Passed: ${String(passed).padEnd(4)} ❌ Failed: ${String(failed).padEnd(4)}      ║`);
  console.log('╚══════════════════════════════════════════════════╝\n');

  if (failed > 0) process.exit(1);
}

run().catch((err) => { console.error('Fatal:', err.message); process.exit(1); });
