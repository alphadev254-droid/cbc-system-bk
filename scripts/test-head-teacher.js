/**
 * CBC Platform — HEAD_TEACHER Scoped Tests
 *
 * Verifies that a HEAD_TEACHER:
 *   1. Can perform full CRUD on their own school's data
 *   2. Cannot access another school's resources (expects 403 / 404)
 *
 * Setup (runs as SYSTEM_ADMIN):
 *   - Creates School A + School B
 *   - Creates HEAD_TEACHER A (assigned to School A)
 *   - Creates HEAD_TEACHER B (assigned to School B)
 *
 * HEAD_TEACHER JWT carries schoolId — no need to pass it in body.
 */

const axios = require('axios');

const BASE        = 'http://localhost:5000/api/v1';
const ADMIN_EMAIL = 'admin@cbcplatform.co.ke';
const ADMIN_PASS  = 'ChangeMe@2024!';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0;
let failed = 0;

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function makeApi(tokenRef) {
  return async (method, path, data, params) => {
    await sleep(150);
    return axios({
      method,
      url: BASE + path,
      data,
      params,
      headers: { ...(tokenRef.value && { Authorization: `Bearer ${tokenRef.value}` }) },
      validateStatus: () => true,
    });
  };
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

// Expect a DENIAL (403 or 404) — cross-school access should be blocked
function checkDenied(label, res) {
  const denied = [403, 404].includes(res.status);
  if (denied) {
    passed++;
    console.log(`  ✅  [${res.status}] ${label} (correctly denied)`);
  } else {
    failed++;
    console.error(`  ❌  [${res.status}] ${label} — expected 403/404 but got ${res.status}`, res.data?.message || '');
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  CBC Platform — HEAD_TEACHER Scoped Tests    ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  const ts = Date.now();

  // Shared token refs so makeApi always uses the latest token
  const adminToken = { value: '' };
  const htAToken   = { value: '' };
  const htBToken   = { value: '' };

  const admin = makeApi(adminToken);
  const htA   = makeApi(htAToken);
  const htB   = makeApi(htBToken);

  let schoolAId = '', schoolBId = '';
  let htAId = '', htBId = '';
  let htAEmail = `hta${ts}@cbcplatform.co.ke`;
  let htBEmail = `htb${ts}@cbcplatform.co.ke`;
  const htPass = 'Teacher1234!';

  let yearAId = '', termAId = '';
  let subjectAId = '', studentAId = '', pathwayAId = '';
  let examTypeAId = '', feeTypeAId = '', feeRecordAId = '';
  let htARefresh = '', htBRefresh = '';

  // ── STEP 1: Admin setup ───────────────────────────────────────────────────
  console.log('── ADMIN SETUP ───────────────────────────────');

  let r = await admin('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASS });
  check('Admin login', r, [200], (d) => { adminToken.value = d.accessToken; });

  // Create School A
  r = await admin('POST', '/schools', { name: `School A ${ts}`, county: 'Nairobi', curriculumType: 'CBC' });
  check('Create School A', r, [200, 201], (d) => { schoolAId = d.id; console.log(`       🏫 schoolAId: ${schoolAId}`); });

  // Create School B
  r = await admin('POST', '/schools', { name: `School B ${ts}`, county: 'Mombasa', curriculumType: 'CBC' });
  check('Create School B', r, [200, 201], (d) => { schoolBId = d.id; console.log(`       🏫 schoolBId: ${schoolBId}`); });

  // Create HEAD_TEACHER A (School A)
  r = await admin('POST', '/users', {
    schoolId: schoolAId, name: 'HT Alpha',
    email: htAEmail, password: htPass, role: 'HEAD_TEACHER',
  });
  check('Create HEAD_TEACHER A', r, [200, 201], (d) => { htAId = d.id; });

  // Create HEAD_TEACHER B (School B)
  r = await admin('POST', '/users', {
    schoolId: schoolBId, name: 'HT Beta',
    email: htBEmail, password: htPass, role: 'HEAD_TEACHER',
  });
  check('Create HEAD_TEACHER B', r, [200, 201], (d) => { htBId = d.id; });

  // ── STEP 2: HEAD_TEACHER A login ──────────────────────────────────────────
  console.log('\n── HEAD_TEACHER A LOGIN ──────────────────────');

  r = await htA('POST', '/auth/login', { email: htAEmail, password: htPass });
  check('HT-A login', r, [200], (d) => {
    htAToken.value = d.accessToken;
    htARefresh     = d.refreshToken;
    console.log(`       🔑 HT-A schoolId in token: ${d.user?.schools?.[0]?.schoolId ?? '(check JWT)'}`);
  });

  // ── STEP 3: HEAD_TEACHER A — own school CRUD ──────────────────────────────
  console.log('\n── HT-A: OWN SCHOOL CRUD ─────────────────────');

  // Academic Year
  r = await htA('POST', '/academic-years', { year: `${new Date().getFullYear()}` });
  check('HT-A create academic year', r, [200, 201], (d) => { yearAId = d.id; });

  r = await htA('GET', '/academic-years');
  check('HT-A list academic years', r, [200]);

  r = await htA('PATCH', `/academic-years/${yearAId}/activate`);
  check('HT-A activate academic year', r, [200]);

  r = await htA('POST', '/academic-years/terms', {
    academicYearId: yearAId, termNumber: 1,
    startDate: '2025-01-06', endDate: '2025-04-04',
  });
  check('HT-A create term', r, [200, 201], (d) => { termAId = d.id; });

  r = await htA('PATCH', `/academic-years/terms/${termAId}/activate`);
  check('HT-A activate term', r, [200]);

  // Subject
  r = await htA('POST', '/subjects', { name: 'Science', curriculumType: 'CBC', gradeLevel: 'Grade 7', weeklyHours: 4 });
  check('HT-A create subject', r, [200, 201], (d) => { subjectAId = d.id; });

  r = await htA('GET', '/subjects');
  check('HT-A list subjects', r, [200]);

  r = await htA('PUT', `/subjects/${subjectAId}`, { weeklyHours: 5 });
  check('HT-A update subject', r, [200]);

  // Student
  r = await htA('POST', '/students', {
    admissionNumber: `ADMA${ts}`, fullName: 'Alice Wanjiru',
    dob: '2012-05-10T00:00:00.000Z', gender: 'female', grade: 'Grade 7', curriculumType: 'CBC',
  });
  check('HT-A create student', r, [200, 201], (d) => { studentAId = d.id; });

  r = await htA('GET', '/students');
  check('HT-A list students', r, [200]);

  r = await htA('PUT', `/students/${studentAId}`, { grade: 'Grade 8' });
  check('HT-A update student', r, [200]);

  // Pathway
  r = await htA('POST', '/pathways', {
    name: 'Arts Pathway', gradeLevel: 'Grade 7',
    academicYearId: yearAId, subjectIds: [subjectAId],
  });
  check('HT-A create pathway', r, [200, 201], (d) => { pathwayAId = d.id; });

  r = await htA('GET', '/pathways');
  check('HT-A list pathways', r, [200]);

  r = await htA('POST', `/pathways/${pathwayAId}/enroll`, { studentId: studentAId, termId: termAId });
  check('HT-A enroll student', r, [200, 201]);

  r = await htA('GET', `/pathways/${pathwayAId}/students`);
  check('HT-A list pathway students', r, [200]);

  // Exam
  r = await htA('POST', '/exams/types', { name: 'Mid Term', weight: 50, termId: termAId });
  check('HT-A create exam type', r, [200, 201], (d) => { examTypeAId = d.id; });

  r = await htA('POST', '/exams/marks', {
    studentId: studentAId, subjectId: subjectAId,
    examTypeId: examTypeAId, termId: termAId, score: 78, maxScore: 100,
  });
  check('HT-A enter marks', r, [200, 201]);

  r = await htA('GET', `/exams/marks/${studentAId}`);
  check('HT-A get student marks', r, [200]);

  // Fees
  r = await htA('POST', '/fees/types', { name: 'Activity Fee', amount: 5000, frequency: 'per_term' });
  check('HT-A create fee type', r, [200, 201], (d) => { feeTypeAId = d.id; });

  r = await htA('POST', '/fees/assign', {
    studentId: studentAId, feeTypeId: feeTypeAId,
    termId: termAId, dueDate: '2025-03-01', amount: 5000,
  });
  check('HT-A assign fee', r, [200, 201], (d) => { feeRecordAId = d.id; });

  r = await htA('GET', `/fees/statement/${studentAId}`, null, { termId: termAId });
  check('HT-A fee statement', r, [200]);

  // Reports
  r = await htA('GET', '/reports/report-card', null, { studentId: studentAId, termId: termAId });
  check('HT-A report card', r, [200]);

  r = await htA('GET', '/reports/class-performance', null, { termId: termAId });
  check('HT-A class performance', r, [200]);

  r = await htA('GET', '/reports/enrollment');
  check('HT-A enrollment report', r, [200]);

  // ── STEP 4: HEAD_TEACHER B login ──────────────────────────────────────────
  console.log('\n── HEAD_TEACHER B LOGIN ──────────────────────');

  r = await htB('POST', '/auth/login', { email: htBEmail, password: htPass });
  check('HT-B login', r, [200], (d) => {
    htBToken.value = d.accessToken;
    htBRefresh     = d.refreshToken;
  });

  // ── STEP 5: Cross-school isolation checks (HT-B → School A resources) ────
  console.log('\n── ISOLATION: HT-B cannot access School A data ──');

  // HT-B tries to read School A's student
  r = await htB('GET', `/students/${studentAId}`);
  checkDenied('HT-B cannot read School A student', r);

  // HT-B tries to update School A's student
  r = await htB('PUT', `/students/${studentAId}`, { grade: 'Grade 9' });
  checkDenied('HT-B cannot update School A student', r);

  // HT-B tries to read School A's subject
  r = await htB('GET', `/subjects/${subjectAId}`);
  checkDenied('HT-B cannot read School A subject', r);

  // HT-B tries to read School A's pathway
  r = await htB('GET', `/pathways/${pathwayAId}`);
  checkDenied('HT-B cannot read School A pathway', r);

  // HT-B tries to enroll into School A's pathway
  r = await htB('POST', `/pathways/${pathwayAId}/enroll`, { studentId: studentAId, termId: termAId });
  checkDenied('HT-B cannot enroll into School A pathway', r);

  // HT-B tries to read School A's exam marks
  r = await htB('GET', `/exams/marks/${studentAId}`);
  checkDenied('HT-B cannot read School A marks', r);

  // HT-B tries to read School A's fee statement
  r = await htB('GET', `/fees/statement/${studentAId}`, null, { termId: termAId });
  checkDenied('HT-B cannot read School A fee statement', r);

  // HT-B tries to read School A's academic year
  r = await htB('GET', `/academic-years/${yearAId}`);
  checkDenied('HT-B cannot read School A academic year', r);

  // ── STEP 6: Verify HT-B's own school lists are empty (not polluted) ───────
  console.log('\n── ISOLATION: HT-B own lists are clean ──────');

  r = await htB('GET', '/students');
  check('HT-B student list is empty', r, [200], (d) => {
    const items = Array.isArray(d) ? d : (d?.students ?? d?.items ?? []);
    if (items.length === 0) {
      console.log('       ✔ No School A students visible to HT-B');
    } else {
      // Check none of the returned students belong to School A
      const leak = items.find((s) => s.id === studentAId);
      if (leak) {
        failed++;
        passed--; // undo the check() pass
        console.error('  ❌  School A student leaked into HT-B student list!');
      } else {
        console.log('       ✔ School A student not in HT-B list');
      }
    }
  });

  r = await htB('GET', '/subjects');
  check('HT-B subject list has no School A subjects', r, [200], (d) => {
    const items = Array.isArray(d) ? d : (d?.subjects ?? d?.items ?? []);
    const leak = items.find((s) => s.id === subjectAId);
    if (leak) {
      failed++;
      passed--;
      console.error('  ❌  School A subject leaked into HT-B subject list!');
    } else {
      console.log('       ✔ School A subject not in HT-B list');
    }
  });

  // ── STEP 7: Cleanup (admin) ───────────────────────────────────────────────
  console.log('\n── CLEANUP ───────────────────────────────────');

  // Re-authenticate admin (token may have expired)
  r = await admin('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASS });
  check('Admin re-login for cleanup', r, [200], (d) => { adminToken.value = d.accessToken; });

  r = await admin('DELETE', `/pathways/${pathwayAId}/subjects/${subjectAId}`, { schoolId: schoolAId });
  check('Delete pathway subject', r, [200, 204]);

  r = await admin('DELETE', `/pathways/${pathwayAId}`, { schoolId: schoolAId });
  check('Delete pathway A', r, [200, 204]);

  r = await admin('DELETE', `/subjects/${subjectAId}`, { schoolId: schoolAId });
  check('Delete subject A', r, [200, 204]);

  r = await admin('DELETE', `/schools/${schoolAId}`);
  check('Delete School A', r, [200, 204]);

  r = await admin('DELETE', `/schools/${schoolBId}`);
  check('Delete School B', r, [200, 204]);

  r = await htA('POST', '/auth/logout', { refreshToken: htARefresh });
  check('HT-A logout', r, [200]);

  r = await htB('POST', '/auth/logout', { refreshToken: htBRefresh });
  check('HT-B logout', r, [200]);

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log(`║  Total: ${String(total).padEnd(4)} ✅ Passed: ${String(passed).padEnd(4)} ❌ Failed: ${String(failed).padEnd(4)}  ║`);
  console.log('╚══════════════════════════════════════════════╝\n');

  if (failed > 0) process.exit(1);
}

run().catch((err) => { console.error('Fatal:', err.message); process.exit(1); });
