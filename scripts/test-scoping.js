/**
 * test-scoping.js
 *
 * Tests that all data is strictly scoped per school.
 * - Admin creates 2 schools, each with their own users/data
 * - Verifies cross-school isolation (school A token cannot see school B data)
 *
 * Run: node scripts/test-scoping.js
 */

const axios = require('axios');

const BASE        = 'http://localhost:5000/api/v1';
const ADMIN_EMAIL = 'admin@cbcplatform.co.ke';
const ADMIN_PASS  = 'ChangeMe@2024!';

let passed = 0;
let failed = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── request helper ────────────────────────────────────────────────────────────
async function api(method, path, data, token) {
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
    console.error(`  ❌  [${res.status}] ${label} →`, res.data?.message || JSON.stringify(res.data)?.slice(0, 120));
  }
  return ok;
}

function checkIsolation(label, res, forbiddenId) {
  // pass if response is 403/404 OR if data doesn't contain the forbidden ID
  const body = JSON.stringify(res.data?.data ?? '');
  const leaked = body.includes(forbiddenId);
  if ([403, 404, 400].includes(res.status) || !leaked) {
    passed++;
    console.log(`  ✅  [${res.status}] ${label} — isolated`);
  } else {
    failed++;
    console.error(`  ❌  [${res.status}] ${label} — DATA LEAKED across schools!`);
  }
}

// ── main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   CBC Platform — Multi-School Scoping Tests          ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const ts = Date.now();
  let r;

  // ── STEP 1: Admin login ───────────────────────────────────────────────────
  console.log('── STEP 1: Admin Login ───────────────────────────────');

  r = await api('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASS });
  let adminToken = '';
  check('Admin login', r, [200], (d) => { adminToken = d.accessToken; });

  // ── STEP 2: Create 2 schools ──────────────────────────────────────────────
  console.log('\n── STEP 2: Create 2 Schools ──────────────────────────');

  r = await api('POST', '/schools', { name: `School Alpha ${ts}`, county: 'Nairobi', curriculumType: 'CBC' }, adminToken);
  let schoolA = '';
  check('Create School A', r, [200, 201], (d) => { schoolA = d.id; console.log(`       🏫 School A: ${schoolA}`); });

  r = await api('POST', '/schools', { name: `School Beta ${ts}`, county: 'Mombasa', curriculumType: 'CBC' }, adminToken);
  let schoolB = '';
  check('Create School B', r, [200, 201], (d) => { schoolB = d.id; console.log(`       🏫 School B: ${schoolB}`); });

  // ── STEP 3: Create subscription tier & assign to both schools ─────────────
  console.log('\n── STEP 3: Assign Subscriptions ──────────────────────');

  r = await api('POST', '/subscriptions/tiers', { name: `Tier ${ts}`, monthlyPrice: 999, annualPrice: 9999, maxStudents: 300, modules: ['fees', 'exams'] }, adminToken);
  let tierId = '';
  check('Create tier', r, [200, 201], (d) => { tierId = d.id; });

  r = await api('POST', '/subscriptions/assign', { schoolId: schoolA, tierId, billingCycle: 'monthly', startDate: new Date().toISOString() }, adminToken);
  check('Assign tier to School A', r, [200, 201]);

  r = await api('POST', '/subscriptions/assign', { schoolId: schoolB, tierId, billingCycle: 'monthly', startDate: new Date().toISOString() }, adminToken);
  check('Assign tier to School B', r, [200, 201]);

  // ── STEP 4: Create users for each school ──────────────────────────────────
  console.log('\n── STEP 4: Create Users Per School ───────────────────');

  // School A users
  r = await api('POST', '/users', { schoolId: schoolA, name: 'HT Alpha', email: `ht_a_${ts}@cbcplatform.co.ke`, password: 'Pass1234!', role: 'HEAD_TEACHER' }, adminToken);
  let htAId = '', htAEmail = `ht_a_${ts}@cbcplatform.co.ke`;
  check('Create HEAD_TEACHER for School A', r, [200, 201], (d) => { htAId = d.id; });

  r = await api('POST', '/users', { schoolId: schoolA, name: 'Teacher Alpha', email: `teacher_a_${ts}@cbcplatform.co.ke`, password: 'Pass1234!', role: 'TEACHER' }, adminToken);
  let teacherAId = '', teacherAEmail = `teacher_a_${ts}@cbcplatform.co.ke`;
  check('Create TEACHER for School A', r, [200, 201], (d) => { teacherAId = d.id; });

  r = await api('POST', '/users', { schoolId: schoolA, name: 'Finance Alpha', email: `finance_a_${ts}@cbcplatform.co.ke`, password: 'Pass1234!', role: 'FINANCE_OFFICER' }, adminToken);
  let financeAId = '';
  check('Create FINANCE_OFFICER for School A', r, [200, 201], (d) => { financeAId = d.id; });

  r = await api('POST', '/users', { schoolId: schoolA, name: 'Parent Alpha', email: `parent_a_${ts}@cbcplatform.co.ke`, password: 'Pass1234!', role: 'PARENT' }, adminToken);
  let parentAId = '';
  check('Create PARENT for School A', r, [200, 201], (d) => { parentAId = d.id; });

  // School B users
  r = await api('POST', '/users', { schoolId: schoolB, name: 'HT Beta', email: `ht_b_${ts}@cbcplatform.co.ke`, password: 'Pass1234!', role: 'HEAD_TEACHER' }, adminToken);
  let htBId = '', htBEmail = `ht_b_${ts}@cbcplatform.co.ke`;
  check('Create HEAD_TEACHER for School B', r, [200, 201], (d) => { htBId = d.id; });

  r = await api('POST', '/users', { schoolId: schoolB, name: 'Teacher Beta', email: `teacher_b_${ts}@cbcplatform.co.ke`, password: 'Pass1234!', role: 'TEACHER' }, adminToken);
  let teacherBId = '', teacherBEmail = `teacher_b_${ts}@cbcplatform.co.ke`;
  check('Create TEACHER for School B', r, [200, 201], (d) => { teacherBId = d.id; });

  r = await api('POST', '/users', { schoolId: schoolB, name: 'Finance Beta', email: `finance_b_${ts}@cbcplatform.co.ke`, password: 'Pass1234!', role: 'FINANCE_OFFICER' }, adminToken);
  let financeBId = '';
  check('Create FINANCE_OFFICER for School B', r, [200, 201], (d) => { financeBId = d.id; });

  // ── STEP 5: Login as each role ────────────────────────────────────────────
  console.log('\n── STEP 5: Login As Each Role ────────────────────────');

  r = await api('POST', '/auth/login', { email: htAEmail, password: 'Pass1234!' });
  let htAToken = '';
  check('Login as HEAD_TEACHER School A', r, [200], (d) => { htAToken = d.accessToken; });

  r = await api('POST', '/auth/login', { email: teacherAEmail, password: 'Pass1234!' });
  let teacherAToken = '';
  check('Login as TEACHER School A', r, [200], (d) => { teacherAToken = d.accessToken; });

  r = await api('POST', '/auth/login', { email: `finance_a_${ts}@cbcplatform.co.ke`, password: 'Pass1234!' });
  let financeAToken = '';
  check('Login as FINANCE_OFFICER School A', r, [200], (d) => { financeAToken = d.accessToken; });

  r = await api('POST', '/auth/login', { email: `parent_a_${ts}@cbcplatform.co.ke`, password: 'Pass1234!' });
  let parentAToken = '';
  check('Login as PARENT School A', r, [200], (d) => { parentAToken = d.accessToken; });

  r = await api('POST', '/auth/login', { email: htBEmail, password: 'Pass1234!' });
  let htBToken = '';
  check('Login as HEAD_TEACHER School B', r, [200], (d) => { htBToken = d.accessToken; });

  r = await api('POST', '/auth/login', { email: teacherBEmail, password: 'Pass1234!' });
  let teacherBToken = '';
  check('Login as TEACHER School B', r, [200], (d) => { teacherBToken = d.accessToken; });

  // ── STEP 6: School A — HEAD_TEACHER sets up school data ───────────────────
  console.log('\n── STEP 6: School A Setup (HEAD_TEACHER) ─────────────');

  r = await api('POST', '/academic-years', { schoolId: schoolA, year: `${new Date().getFullYear()}` }, htAToken);
  let yearA = '';
  check('[A] Create academic year', r, [200, 201], (d) => { yearA = d.id; });

  r = await api('PATCH', `/academic-years/${yearA}/activate`, { schoolId: schoolA }, htAToken);
  check('[A] Activate academic year', r, [200]);

  r = await api('POST', '/academic-years/terms', { schoolId: schoolA, academicYearId: yearA, termNumber: 1, startDate: '2025-01-06', endDate: '2025-04-04' }, htAToken);
  let termA = '';
  check('[A] Create term', r, [200, 201], (d) => { termA = d.id; });

  r = await api('PATCH', `/academic-years/terms/${termA}/activate`, { schoolId: schoolA }, htAToken);
  check('[A] Activate term', r, [200]);

  r = await api('POST', '/subjects', { schoolId: schoolA, name: 'Maths A', curriculumType: 'CBC', gradeLevel: 'Grade 7', weeklyHours: 5 }, htAToken);
  let subjectA = '';
  check('[A] Create subject', r, [200, 201], (d) => { subjectA = d.id; });

  r = await api('POST', '/students', { schoolId: schoolA, admissionNumber: `A${ts}`, fullName: 'Student Alpha', dob: '2012-01-01T00:00:00.000Z', gender: 'male', grade: 'Grade 7', curriculumType: 'CBC' }, htAToken);
  let studentA = '';
  check('[A] Create student', r, [200, 201], (d) => { studentA = d.id; });

  r = await api('POST', '/pathways', { schoolId: schoolA, name: 'STEM A', gradeLevel: 'Grade 7', academicYearId: yearA, subjectIds: [subjectA] }, htAToken);
  let pathwayA = '';
  check('[A] Create pathway', r, [200, 201], (d) => { pathwayA = d.id; });

  r = await api('POST', `/pathways/${pathwayA}/enroll`, { schoolId: schoolA, studentId: studentA, termId: termA }, htAToken);
  check('[A] Enroll student in pathway', r, [200, 201]);

  r = await api('POST', '/fees/types', { schoolId: schoolA, name: 'Tuition A', amount: 10000, frequency: 'per_term' }, htAToken);
  let feeTypeA = '';
  check('[A] Create fee type', r, [200, 201], (d) => { feeTypeA = d.id; });

  r = await api('POST', '/exams/types', { schoolId: schoolA, name: 'End Term A', weight: 100, termId: termA }, htAToken);
  let examTypeA = '';
  check('[A] Create exam type', r, [200, 201], (d) => { examTypeA = d.id; });

  // ── STEP 7: School B — HEAD_TEACHER sets up school data ───────────────────
  console.log('\n── STEP 7: School B Setup (HEAD_TEACHER) ─────────────');

  r = await api('POST', '/academic-years', { schoolId: schoolB, year: `${new Date().getFullYear()}` }, htBToken);
  let yearB = '';
  check('[B] Create academic year', r, [200, 201], (d) => { yearB = d.id; });

  r = await api('PATCH', `/academic-years/${yearB}/activate`, { schoolId: schoolB }, htBToken);
  check('[B] Activate academic year', r, [200]);

  r = await api('POST', '/academic-years/terms', { schoolId: schoolB, academicYearId: yearB, termNumber: 1, startDate: '2025-01-06', endDate: '2025-04-04' }, htBToken);
  let termB = '';
  check('[B] Create term', r, [200, 201], (d) => { termB = d.id; });

  r = await api('PATCH', `/academic-years/terms/${termB}/activate`, { schoolId: schoolB }, htBToken);
  check('[B] Activate term', r, [200]);

  r = await api('POST', '/subjects', { schoolId: schoolB, name: 'Maths B', curriculumType: 'CBC', gradeLevel: 'Grade 7', weeklyHours: 5 }, htBToken);
  let subjectB = '';
  check('[B] Create subject', r, [200, 201], (d) => { subjectB = d.id; });

  r = await api('POST', '/students', { schoolId: schoolB, admissionNumber: `B${ts}`, fullName: 'Student Beta', dob: '2012-01-01T00:00:00.000Z', gender: 'female', grade: 'Grade 7', curriculumType: 'CBC' }, htBToken);
  let studentB = '';
  check('[B] Create student', r, [200, 201], (d) => { studentB = d.id; });

  r = await api('POST', '/pathways', { schoolId: schoolB, name: 'STEM B', gradeLevel: 'Grade 7', academicYearId: yearB, subjectIds: [subjectB] }, htBToken);
  let pathwayB = '';
  check('[B] Create pathway', r, [200, 201], (d) => { pathwayB = d.id; });

  r = await api('POST', `/pathways/${pathwayB}/enroll`, { schoolId: schoolB, studentId: studentB, termId: termB }, htBToken);
  check('[B] Enroll student in pathway', r, [200, 201]);

  r = await api('POST', '/fees/types', { schoolId: schoolB, name: 'Tuition B', amount: 12000, frequency: 'per_term' }, htBToken);
  let feeTypeB = '';
  check('[B] Create fee type', r, [200, 201], (d) => { feeTypeB = d.id; });

  r = await api('POST', '/exams/types', { schoolId: schoolB, name: 'End Term B', weight: 100, termId: termB }, htBToken);
  let examTypeB = '';
  check('[B] Create exam type', r, [200, 201], (d) => { examTypeB = d.id; });

  // ── STEP 8: TEACHER School A — can read/write own school ──────────────────
  console.log('\n── STEP 8: TEACHER School A — Own School Access ──────');

  r = await api('GET', `/students?schoolId=${schoolA}`, null, teacherAToken);
  check('[A TEACHER] Can list School A students', r, [200]);

  r = await api('GET', `/subjects?schoolId=${schoolA}`, null, teacherAToken);
  check('[A TEACHER] Can list School A subjects', r, [200]);

  r = await api('GET', `/pathways?schoolId=${schoolA}`, null, teacherAToken);
  check('[A TEACHER] Can list School A pathways', r, [200]);

  r = await api('POST', '/exams/marks', { schoolId: schoolA, studentId: studentA, subjectId: subjectA, examTypeId: examTypeA, termId: termA, score: 78, maxScore: 100 }, teacherAToken);
  let markA = '';
  check('[A TEACHER] Can enter marks for School A student', r, [200, 201], (d) => { markA = d.id; });

  r = await api('GET', `/exams/marks/${studentA}?schoolId=${schoolA}`, null, teacherAToken);
  check('[A TEACHER] Can view School A student marks', r, [200]);

  // ── STEP 9: TEACHER School A — CANNOT access School B data ───────────────
  console.log('\n── STEP 9: TEACHER School A — Cross-School Isolation ─');

  r = await api('GET', `/students?schoolId=${schoolB}`, null, teacherAToken);
  checkIsolation('[A TEACHER] Cannot list School B students', r, studentB);

  r = await api('GET', `/subjects?schoolId=${schoolB}`, null, teacherAToken);
  checkIsolation('[A TEACHER] Cannot list School B subjects', r, subjectB);

  r = await api('GET', `/pathways?schoolId=${schoolB}`, null, teacherAToken);
  checkIsolation('[A TEACHER] Cannot list School B pathways', r, pathwayB);

  r = await api('POST', '/exams/marks', { schoolId: schoolB, studentId: studentB, subjectId: subjectB, examTypeId: examTypeB, termId: termB, score: 90, maxScore: 100 }, teacherAToken);
  checkIsolation('[A TEACHER] Cannot enter marks for School B student', r, studentB);

  r = await api('GET', `/students/${studentB}?schoolId=${schoolB}`, null, teacherAToken);
  checkIsolation('[A TEACHER] Cannot get School B student by ID', r, studentB);

  // ── STEP 10: FINANCE_OFFICER School A — fees scoped ──────────────────────
  console.log('\n── STEP 10: FINANCE_OFFICER School A — Fee Scoping ───');

  r = await api('POST', '/fees/assign', { schoolId: schoolA, studentId: studentA, feeTypeId: feeTypeA, termId: termA, dueDate: '2025-03-01', amount: 10000 }, financeAToken);
  let feeRecordA = '';
  check('[A FINANCE] Can assign fee to School A student', r, [200, 201], (d) => { feeRecordA = d.id; });

  r = await api('GET', `/fees/statement/${studentA}?schoolId=${schoolA}&termId=${termA}`, null, financeAToken);
  check('[A FINANCE] Can view School A fee statement', r, [200]);

  r = await api('GET', `/fees/balances?schoolId=${schoolA}`, null, financeAToken);
  check('[A FINANCE] Can view School A balances', r, [200]);

  if (feeRecordA) {
    r = await api('POST', '/fees/payments', { schoolId: schoolA, feeRecordId: feeRecordA, amount: 10000, method: 'mpesa', reference: `PAY_A_${ts}`, paidAt: new Date().toISOString() }, financeAToken);
    check('[A FINANCE] Can record payment for School A', r, [200, 201]);
  }

  // Finance A cannot assign fees to School B student
  r = await api('POST', '/fees/assign', { schoolId: schoolB, studentId: studentB, feeTypeId: feeTypeB, termId: termB, dueDate: '2025-03-01', amount: 12000 }, financeAToken);
  checkIsolation('[A FINANCE] Cannot assign fee to School B student', r, studentB);

  r = await api('GET', `/fees/statement/${studentB}?schoolId=${schoolB}&termId=${termB}`, null, financeAToken);
  checkIsolation('[A FINANCE] Cannot view School B fee statement', r, studentB);

  // ── STEP 11: PARENT School A — read-only own school ───────────────────────
  console.log('\n── STEP 11: PARENT School A — Read-Only Scoping ──────');

  r = await api('GET', `/students?schoolId=${schoolA}`, null, parentAToken);
  check('[A PARENT] Can list School A students', r, [200]);

  r = await api('GET', `/exams/marks/${studentA}?schoolId=${schoolA}`, null, parentAToken);
  check('[A PARENT] Can view School A marks', r, [200]);

  r = await api('GET', `/fees/statement/${studentA}?schoolId=${schoolA}&termId=${termA}`, null, parentAToken);
  check('[A PARENT] Can view School A fee statement', r, [200]);

  // Parent cannot write
  r = await api('POST', '/students', { schoolId: schoolA, admissionNumber: `PA${ts}`, fullName: 'Unauthorized', dob: '2012-01-01T00:00:00.000Z', gender: 'male', grade: 'Grade 7', curriculumType: 'CBC' }, parentAToken);
  check('[A PARENT] Cannot create student (no permission)', r, [403]);

  r = await api('POST', '/exams/marks', { schoolId: schoolA, studentId: studentA, subjectId: subjectA, examTypeId: examTypeA, termId: termA, score: 50, maxScore: 100 }, parentAToken);
  check('[A PARENT] Cannot enter marks (no permission)', r, [403]);

  // Parent cannot access School B
  r = await api('GET', `/students?schoolId=${schoolB}`, null, parentAToken);
  checkIsolation('[A PARENT] Cannot list School B students', r, studentB);

  // ── STEP 12: TEACHER School B — own school only ───────────────────────────
  console.log('\n── STEP 12: TEACHER School B — Own School Access ─────');

  r = await api('GET', `/students?schoolId=${schoolB}`, null, teacherBToken);
  check('[B TEACHER] Can list School B students', r, [200]);

  r = await api('POST', '/exams/marks', { schoolId: schoolB, studentId: studentB, subjectId: subjectB, examTypeId: examTypeB, termId: termB, score: 85, maxScore: 100 }, teacherBToken);
  check('[B TEACHER] Can enter marks for School B student', r, [200, 201]);

  // Teacher B cannot access School A
  r = await api('GET', `/students?schoolId=${schoolA}`, null, teacherBToken);
  checkIsolation('[B TEACHER] Cannot list School A students', r, studentA);

  r = await api('POST', '/exams/marks', { schoolId: schoolA, studentId: studentA, subjectId: subjectA, examTypeId: examTypeA, termId: termA, score: 99, maxScore: 100 }, teacherBToken);
  checkIsolation('[B TEACHER] Cannot enter marks for School A student', r, studentA);

  // ── STEP 13: HEAD_TEACHER cannot manage other school's members ────────────
  console.log('\n── STEP 13: HEAD_TEACHER Cross-School Member Isolation ');

  r = await api('GET', `/schools/${schoolB}/members`, null, htAToken);
  check('[A HT] Cannot list School B members', r, [403]);

  r = await api('POST', `/schools/${schoolB}/members`, { userId: teacherAId, role: 'TEACHER' }, htAToken);
  check('[A HT] Cannot assign member to School B', r, [403]);

  // ── STEP 14: Admin sees all schools ───────────────────────────────────────
  console.log('\n── STEP 14: Admin Global Visibility ──────────────────');

  r = await api('GET', `/students?schoolId=${schoolA}`, null, adminToken);
  check('[ADMIN] Can list School A students', r, [200]);

  r = await api('GET', `/students?schoolId=${schoolB}`, null, adminToken);
  check('[ADMIN] Can list School B students', r, [200]);

  r = await api('GET', `/schools/${schoolA}`, null, adminToken);
  check('[ADMIN] Can view School A', r, [200]);

  r = await api('GET', `/schools/${schoolB}`, null, adminToken);
  check('[ADMIN] Can view School B', r, [200]);

  r = await api('GET', `/schools/${schoolA}/members`, null, adminToken);
  check('[ADMIN] Can list School A members', r, [200]);

  r = await api('GET', `/schools/${schoolB}/members`, null, adminToken);
  check('[ADMIN] Can list School B members', r, [200]);

  // ── STEP 15: Cleanup — Admin deletes both schools ─────────────────────────
  console.log('\n── STEP 15: Cleanup ──────────────────────────────────');

  r = await api('DELETE', `/schools/${schoolA}`, null, adminToken);
  check('Admin deletes School A', r, [200, 204]);

  r = await api('DELETE', `/schools/${schoolB}`, null, adminToken);
  check('Admin deletes School B', r, [200, 204]);

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log(`║  Total: ${String(total).padEnd(4)} ✅ Passed: ${String(passed).padEnd(4)} ❌ Failed: ${String(failed).padEnd(4)}          ║`);
  console.log('╚══════════════════════════════════════════════════════╝\n');

  if (failed > 0) process.exit(1);
}

run().catch((err) => { console.error('Fatal:', err.message); process.exit(1); });
