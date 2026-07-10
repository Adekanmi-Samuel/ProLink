/**
 * ProLink Comprehensive E2E Test Script
 * Tests backend API endpoints and frontend page availability
 * Uses only built-in https module (no external dependencies)
 */

const https = require('https');
const http = require('http');

// ── Configuration ──────────────────────────────────────────────
const BACKEND = 'prolink-backend.vercel.app';
const FRONTEND = 'prolink-eight.vercel.app';

// Generate unique test data (truly unique per run)
const timestamp = Date.now();
const randomSuffix = Math.random().toString(36).substring(2, 8);
const TEST_EMAIL = `testuser_${timestamp}_${randomSuffix}@prolink-test.com`;
const TEST_PASSWORD = 'TestPass123!';
const TEST_FULLNAME = 'Test User E2E';
const TEST_PHONE = `080${String(Math.floor(10000000 + Math.random() * 89999999)).substring(0, 8)}`;
const PROVIDER_EMAIL = `testprov_${timestamp}_${randomSuffix}@prolink-test.com`;

// Shared state
let authToken = null;
let createdJobId = null;
let testUserId = null;

// ── Results tracking ───────────────────────────────────────────
const results = [];
let totalPass = 0;
let totalFail = 0;

// ── HTTP helper ────────────────────────────────────────────────
function request(options) {
  return new Promise((resolve, reject) => {
    const host = options.host || options.hostname || '';
    const mod = host.includes('localhost') ? http : https;
    const req = mod.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, body, parsed });
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')); });
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ── Test helper ────────────────────────────────────────────────
function record(section, name, pass, status, detail) {
  const icon = pass ? 'PASS' : 'FAIL';
  const line = `  [${icon}] ${name} (HTTP ${status}) ${detail ? '- ' + detail : ''}`;
  console.log(line);
  results.push({ section, name, pass, status, detail });
  if (pass) totalPass++; else totalFail++;
}

function makeReq(method, host, path, body, token) {
  const headers = {
    'Host': host,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const payload = body ? JSON.stringify(body) : null;
  if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
  return request({
    hostname: host,
    port: 443,
    path,
    method,
    headers,
    body: payload,
  });
}

// ══════════════════════════════════════════════════════════════
// SECTION 1: Backend Health Checks
// ══════════════════════════════════════════════════════════════
async function testHealth() {
  console.log('\n========================================');
  console.log(' SECTION 1: Backend Health Checks');
  console.log('========================================');

  // 1a. Liveness
  try {
    const res = await makeReq('GET', BACKEND, '/health/liveness');
    const ok = res.status === 200 && res.parsed && res.parsed.status === 'ok';
    record('Health', 'GET /health/liveness', ok, res.status,
      ok ? `status=${res.parsed.status}` : (res.parsed ? JSON.stringify(res.parsed) : res.body.substring(0, 120)));
  } catch (e) {
    record('Health', 'GET /health/liveness', false, 0, e.message);
  }

  // 1b. Readiness
  try {
    const res = await makeReq('GET', BACKEND, '/health/readiness');
    const ok = (res.status === 200 || res.status === 503) && res.parsed && res.parsed.checks;
    const detail = ok
      ? `status=${res.parsed.status} db=${res.parsed.checks.database} cache=${res.parsed.checks.cache}`
      : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120));
    record('Health', 'GET /health/readiness', ok, res.status, detail);
  } catch (e) {
    record('Health', 'GET /health/readiness', false, 0, e.message);
  }

  // 1c. Metrics
  try {
    const res = await makeReq('GET', BACKEND, '/health/metrics');
    const ok = res.status === 200 && res.parsed && res.parsed.uptime !== undefined;
    record('Health', 'GET /health/metrics', ok, res.status,
      ok ? `uptime=${res.parsed.uptime}s` : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Health', 'GET /health/metrics', false, 0, e.message);
  }
}

// ══════════════════════════════════════════════════════════════
// SECTION 2: Auth Flow
// ══════════════════════════════════════════════════════════════
async function testAuth() {
  console.log('\n========================================');
  console.log(' SECTION 2: Auth Flow');
  console.log('========================================');

  // 2a. Register new client
  try {
    const res = await makeReq('POST', BACKEND, '/api/auth/register', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      user_type: 'client',
      full_name: TEST_FULLNAME,
      phone_number: TEST_PHONE,
      state: 'Lagos',
      city: 'Ikeja',
    });
    const ok = res.status === 201 && res.parsed && res.parsed.token;
    if (ok) {
      authToken = res.parsed.token;
      testUserId = res.parsed.user?.id;
    }
    record('Auth', `POST /api/auth/register (${TEST_EMAIL})`, ok, res.status,
      ok ? `token received, user_id=${testUserId}` : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Auth', 'POST /api/auth/register', false, 0, e.message);
  }

  // 2b. Login with registered user
  try {
    const res = await makeReq('POST', BACKEND, '/api/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    const ok = res.status === 200 && res.parsed && res.parsed.token;
    if (ok) authToken = res.parsed.token;
    record('Auth', 'POST /api/auth/login', ok, res.status,
      ok ? 'token received' : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Auth', 'POST /api/auth/login', false, 0, e.message);
  }

  // 2c. Verify email with OTP (test with invalid OTP - should return 400)
  try {
    const res = await makeReq('POST', BACKEND, '/api/auth/verify-otp', {
      token: '000000',  // fake OTP
    });
    // Expect 400 for invalid OTP
    const ok = res.status === 400 && res.parsed && res.parsed.error;
    record('Auth', 'POST /api/auth/verify-otp (invalid OTP)', ok, res.status,
      ok ? `correctly rejected: ${res.parsed.error}` : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Auth', 'POST /api/auth/verify-otp', false, 0, e.message);
  }

  // 2d. Verify email via GET with invalid token
  try {
    const res = await makeReq('GET', BACKEND, '/api/auth/verify?token=fake_token_123');
    const ok = res.status === 400 && res.parsed && res.parsed.error;
    record('Auth', 'GET /api/auth/verify (invalid token)', ok, res.status,
      ok ? `correctly rejected: ${res.parsed.error}` : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Auth', 'GET /api/auth/verify', false, 0, e.message);
  }

  // 2e. Resend verification (requires auth)
  try {
    const res = await makeReq('POST', BACKEND, '/api/auth/resend-verification', null, authToken);
    const ok = res.status === 200 && res.parsed && res.parsed.message;
    record('Auth', 'POST /api/auth/resend-verification', ok, res.status,
      ok ? res.parsed.message : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Auth', 'POST /api/auth/resend-verification', false, 0, e.message);
  }

  // 2f. Forgot password
  try {
    const res = await makeReq('POST', BACKEND, '/api/auth/forgot-password', {
      email: TEST_EMAIL,
    });
    const ok = res.status === 200 && res.parsed && res.parsed.message;
    record('Auth', 'POST /api/auth/forgot-password', ok, res.status,
      ok ? res.parsed.message : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Auth', 'POST /api/auth/forgot-password', false, 0, e.message);
  }

  // 2g. Reset password with invalid token
  try {
    const res = await makeReq('POST', BACKEND, '/api/auth/reset-password', {
      token: 'invalid_reset_token',
      password: 'NewPass123!',
    });
    const ok = res.status === 400 && res.parsed && res.parsed.error;
    record('Auth', 'POST /api/auth/reset-password (invalid token)', ok, res.status,
      ok ? `correctly rejected: ${res.parsed.error}` : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Auth', 'POST /api/auth/reset-password', false, 0, e.message);
  }

  // 2h. Register a provider (needed for later tests)
  const providerPhone = `080${String(Math.floor(10000000 + Math.random() * 89999999)).substring(0, 8)}`;
  try {
    const res = await makeReq('POST', BACKEND, '/api/auth/register', {
      email: PROVIDER_EMAIL,
      password: TEST_PASSWORD,
      user_type: 'provider',
      full_name: 'Test Provider E2E',
      phone_number: providerPhone,
      state: 'Lagos',
      city: 'Victoria Island',
    });
    const ok = res.status === 201 && res.parsed && res.parsed.token;
    record('Auth', `POST /api/auth/register (provider: ${PROVIDER_EMAIL})`, ok, res.status,
      ok ? 'provider registered' : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Auth', 'POST /api/auth/register (provider)', false, 0, e.message);
  }

  // 2i. Logout
  try {
    const res = await makeReq('POST', BACKEND, '/api/auth/logout', null, authToken);
    const ok = res.status === 200 && res.parsed && res.parsed.message;
    record('Auth', 'POST /api/auth/logout', ok, res.status,
      ok ? res.parsed.message : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Auth', 'POST /api/auth/logout', false, 0, e.message);
  }

  // Re-login for subsequent tests
  try {
    const res = await makeReq('POST', BACKEND, '/api/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (res.status === 200 && res.parsed && res.parsed.token) {
      authToken = res.parsed.token;
      record('Auth', 'POST /api/auth/login (re-login for tests)', true, res.status, 'token refreshed');
    } else {
      record('Auth', 'POST /api/auth/login (re-login)', false, res.status,
        res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120));
    }
  } catch (e) {
    record('Auth', 'POST /api/auth/login (re-login)', false, 0, e.message);
  }

  // 2j. Unauthorized access test
  try {
    const res = await makeReq('GET', BACKEND, '/api/profiles/me', null, null);
    const ok = res.status === 401;
    record('Auth', 'GET /api/profiles/me (no token - expect 401)', ok, res.status,
      ok ? 'correctly rejected unauthorized' : `expected 401 but got ${res.status}`);
  } catch (e) {
    record('Auth', 'GET /api/profiles/me (unauthorized)', false, 0, e.message);
  }
}

// ══════════════════════════════════════════════════════════════
// SECTION 3: Taxonomy
// ══════════════════════════════════════════════════════════════
async function testTaxonomy() {
  console.log('\n========================================');
  console.log(' SECTION 3: Taxonomy');
  console.log('========================================');

  // 3a. Skills
  try {
    const res = await makeReq('GET', BACKEND, '/api/taxonomy/skills');
    const ok = res.status === 200 && Array.isArray(res.parsed);
    const count = ok ? res.parsed.length : 0;
    const pass = ok && count >= 247;
    record('Taxonomy', `GET /api/taxonomy/skills (count=${count})`, pass, res.status,
      pass ? `${count} skills returned (>= 247)` : (ok ? `only ${count} skills found, expected 247+` : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120))));
  } catch (e) {
    record('Taxonomy', 'GET /api/taxonomy/skills', false, 0, e.message);
  }

  // 3b. Categories
  try {
    const res = await makeReq('GET', BACKEND, '/api/taxonomy/categories');
    const ok = res.status === 200 && Array.isArray(res.parsed);
    const count = ok ? res.parsed.length : 0;
    const pass = ok && count >= 20;
    record('Taxonomy', `GET /api/taxonomy/categories (count=${count})`, pass, res.status,
      pass ? `${count} categories returned (>= 20)` : (ok ? `only ${count} categories found, expected 20+` : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120))));
  } catch (e) {
    record('Taxonomy', 'GET /api/taxonomy/categories', false, 0, e.message);
  }
}

// ══════════════════════════════════════════════════════════════
// SECTION 4: Job Creation & Retrieval
// ══════════════════════════════════════════════════════════════
async function testJobs() {
  console.log('\n========================================');
  console.log(' SECTION 4: Jobs');
  console.log('========================================');

  // 4a. Create job (requires verified client - this may fail if user is unverified, which is expected)
  try {
    const res = await makeReq('POST', BACKEND, '/api/jobs', {
      title: `E2E Test Job ${timestamp} - Web Development Project`,
      description: 'This is a comprehensive e2e test job for web development. We need a full-stack developer to build a responsive web application with modern frameworks.',
      budget: 50000,
      job_type: 'digital',
      payment_type: 'fixed',
      state: 'Lagos',
      city: 'Ikeja',
    }, authToken);
    const ok = res.status === 201 && res.parsed && res.parsed.id;
    const unverified = res.status === 403;
    if (ok) createdJobId = res.parsed.id;
    record('Jobs', 'POST /api/jobs (create job as client)', ok || unverified, res.status,
      ok ? `job created, id=${createdJobId}` :
      unverified ? 'expected 403 for unverified user (OK)' :
      (res.parsed ? JSON.stringify(res.parsed).substring(0, 150) : res.body.substring(0, 150)));
  } catch (e) {
    record('Jobs', 'POST /api/jobs', false, 0, e.message);
  }

  // 4b. Get my jobs
  try {
    const res = await makeReq('GET', BACKEND, '/api/jobs/my-jobs', null, authToken);
    const ok = res.status === 200 && res.parsed && (Array.isArray(res.parsed) || res.parsed.jobs !== undefined);
    const count = Array.isArray(res.parsed) ? res.parsed.length : (res.parsed?.jobs?.length || 0);
    record('Jobs', 'GET /api/jobs/my-jobs', ok, res.status,
      ok ? `${count} jobs returned` : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Jobs', 'GET /api/jobs/my-jobs', false, 0, e.message);
  }

  // 4c. Get public jobs
  try {
    const res = await makeReq('GET', BACKEND, '/api/jobs');
    const ok = res.status === 200;
    const isArray = Array.isArray(res.parsed);
    const isObj = res.parsed && (res.parsed.jobs || res.parsed.data);
    const pass = ok && (isArray || isObj);
    const count = isArray ? res.parsed.length : (res.parsed.jobs?.length || res.parsed.data?.length || 0);
    record('Jobs', `GET /api/jobs (public jobs, count=${count})`, pass, res.status,
      pass ? `${count} public jobs available` : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Jobs', 'GET /api/jobs (public)', false, 0, e.message);
  }

  // 4d. Get single job by ID (if we created one, or get any job)
  if (createdJobId) {
    try {
      const res = await makeReq('GET', BACKEND, `/api/jobs/${createdJobId}`);
      const ok = res.status === 200 && res.parsed && res.parsed.id;
      record('Jobs', `GET /api/jobs/${createdJobId}`, ok, res.status,
        ok ? `title="${res.parsed.title}"` : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
    } catch (e) {
      record('Jobs', `GET /api/jobs/${createdJobId}`, false, 0, e.message);
    }
  } else {
    // Try to get any existing job
    try {
      const listRes = await makeReq('GET', BACKEND, '/api/jobs');
      let jobId = null;
      if (listRes.status === 200) {
        const jobs = Array.isArray(listRes.parsed) ? listRes.parsed : (listRes.parsed?.jobs || listRes.parsed?.data || []);
        if (jobs.length > 0) jobId = jobs[0].id;
      }
      if (jobId) {
        const res = await makeReq('GET', BACKEND, `/api/jobs/${jobId}`);
        const ok = res.status === 200 && res.parsed && res.parsed.id;
        record('Jobs', `GET /api/jobs/${jobId} (existing job)`, ok, res.status,
          ok ? `title="${res.parsed.title}"` : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
      } else {
        record('Jobs', 'GET /api/jobs/:id (skipped - no jobs found)', false, 0, 'no jobs available to fetch');
      }
    } catch (e) {
      record('Jobs', 'GET /api/jobs/:id', false, 0, e.message);
    }
  }
}

// ══════════════════════════════════════════════════════════════
// SECTION 5: Profile
// ══════════════════════════════════════════════════════════════
async function testProfiles() {
  console.log('\n========================================');
  console.log(' SECTION 5: Profiles');
  console.log('========================================');

  // 5a. GET /profiles/me
  try {
    const res = await makeReq('GET', BACKEND, '/api/profiles/me', null, authToken);
    const ok = res.status === 200 && res.parsed && (res.parsed.user || res.parsed.full_name || res.parsed.email);
    if (ok && !testUserId && res.parsed.user?.id) testUserId = res.parsed.user.id;
    record('Profiles', 'GET /api/profiles/me', ok, res.status,
      ok ? `user=${res.parsed.full_name || res.parsed.user?.full_name || 'found'}` :
      (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Profiles', 'GET /api/profiles/me', false, 0, e.message);
  }

  // 5b. PUT /profiles/me (full update)
  try {
    const res = await makeReq('PUT', BACKEND, '/api/profiles/me', {
      full_name: TEST_FULLNAME,
      bio: 'E2E test user bio for automated testing',
      state: 'Lagos',
      city: 'Ikeja',
    }, authToken);
    const ok = res.status === 200 && res.parsed && res.parsed.msg;
    record('Profiles', 'PUT /api/profiles/me', ok, res.status,
      ok ? res.parsed.msg : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Profiles', 'PUT /api/profiles/me', false, 0, e.message);
  }

  // 5c. PATCH /profiles/me (partial update)
  try {
    const res = await makeReq('PATCH', BACKEND, '/api/profiles/me', {
      availability: 'available',
    }, authToken);
    const ok = res.status === 200 && res.parsed && res.parsed.msg;
    record('Profiles', 'PATCH /api/profiles/me', ok, res.status,
      ok ? res.parsed.msg : (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Profiles', 'PATCH /api/profiles/me', false, 0, e.message);
  }

  // 5d. PATCH with no valid fields (should return 400)
  try {
    const res = await makeReq('PATCH', BACKEND, '/api/profiles/me', {
      invalid_field: 'test',
    }, authToken);
    const ok = res.status === 400;
    record('Profiles', 'PATCH /api/profiles/me (invalid fields - expect 400)', ok, res.status,
      ok ? 'correctly rejected' : `expected 400 but got ${res.status}`);
  } catch (e) {
    record('Profiles', 'PATCH /api/profiles/me (invalid)', false, 0, e.message);
  }

  // 5e. GET /profiles/:id (public)
  if (testUserId) {
    try {
      const res = await makeReq('GET', BACKEND, `/api/profiles/${testUserId}`);
      const ok = res.status === 200 && res.parsed;
      record('Profiles', `GET /api/profiles/${testUserId}`, ok, res.status,
        ok ? `profile found for user ${testUserId}` :
        (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
    } catch (e) {
      record('Profiles', `GET /api/profiles/${testUserId}`, false, 0, e.message);
    }
  } else {
    record('Profiles', 'GET /api/profiles/:id', false, 0, 'skipped - no user ID available');
  }

  // 5f. GET /profiles/:id (non-existent - should 404)
  try {
    const res = await makeReq('GET', BACKEND, '/api/profiles/99999999');
    const ok = res.status === 404;
    record('Profiles', 'GET /api/profiles/99999999 (non-existent - expect 404)', ok, res.status,
      ok ? 'correctly returned 404' : `expected 404 but got ${res.status}`);
  } catch (e) {
    record('Profiles', 'GET /api/profiles/99999999', false, 0, e.message);
  }
}

// ══════════════════════════════════════════════════════════════
// SECTION 6: Search
// ══════════════════════════════════════════════════════════════
async function testSearch() {
  console.log('\n========================================');
  console.log(' SECTION 6: Search');
  console.log('========================================');

  // 6a. Search jobs
  try {
    const res = await makeReq('GET', BACKEND, '/api/search/jobs?q=web');
    const ok = res.status === 200;
    const hasResults = res.parsed && (Array.isArray(res.parsed) || res.parsed.jobs || res.parsed.data || res.parsed.results !== undefined);
    const count = Array.isArray(res.parsed) ? res.parsed.length :
                  res.parsed?.jobs?.length || res.parsed?.data?.length || res.parsed?.results?.length || 0;
    record('Search', `GET /api/search/jobs?q=web (results=${count})`, ok && hasResults, res.status,
      (ok && hasResults) ? `${count} job results for "web"` :
      (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Search', 'GET /api/search/jobs?q=web', false, 0, e.message);
  }

  // 6b. Search providers
  try {
    const res = await makeReq('GET', BACKEND, '/api/search/providers?q=developer');
    const ok = res.status === 200;
    const hasResults = res.parsed && (Array.isArray(res.parsed) || res.parsed.providers || res.parsed.data || res.parsed.results !== undefined);
    const count = Array.isArray(res.parsed) ? res.parsed.length :
                  res.parsed?.providers?.length || res.parsed?.data?.length || res.parsed?.results?.length || 0;
    record('Search', `GET /api/search/providers?q=developer (results=${count})`, ok && hasResults, res.status,
      (ok && hasResults) ? `${count} provider results for "developer"` :
      (res.parsed ? JSON.stringify(res.parsed).substring(0, 120) : res.body.substring(0, 120)));
  } catch (e) {
    record('Search', 'GET /api/search/providers?q=developer', false, 0, e.message);
  }

  // 6c. Search with empty query (should still work or return meaningful error)
  try {
    const res = await makeReq('GET', BACKEND, '/api/search/jobs?q=');
    record('Search', 'GET /api/search/jobs?q= (empty query)', res.status === 200 || res.status === 400, res.status,
      res.status === 200 ? 'returned results for empty query' : 'returned error for empty query (acceptable)');
  } catch (e) {
    record('Search', 'GET /api/search/jobs?q= (empty)', false, 0, e.message);
  }
}

// ══════════════════════════════════════════════════════════════
// SECTION 7: Frontend Pages
// ══════════════════════════════════════════════════════════════
async function testFrontend() {
  console.log('\n========================================');
  console.log(' SECTION 7: Frontend Pages');
  console.log('========================================');

  const frontendPages = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify',
    '/verify-email',
    '/dashboard',
    '/dashboard/my-jobs',
    '/dashboard/my-bids',
    '/dashboard/saved-jobs',
    '/dashboard/portfolio',
    '/dashboard/verification',
    '/dashboard/messages',
    '/dashboard/contracts',
    '/dashboard/disputes',
    '/dashboard/wallet',
    '/jobs',
    '/jobs/new',
    '/profile',
    '/profile/edit',
    '/talent',
    '/chat/test-thread',
    '/admin',
    '/admin/users',
    '/admin/jobs',
    '/admin/disputes',
    '/admin/verifications',
    '/terms',
    '/privacy',
    '/dispute-policy',
    '/mock-paystack',
  ];

  // Test each page (use HTTP redirect-follow isn't needed; just check status)
  for (const page of frontendPages) {
    try {
      const headers = {
        'Host': FRONTEND,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'ProLink-E2E-Test/1.0',
      };
      const res = await request({
        hostname: FRONTEND,
        port: 443,
        path: page,
        method: 'GET',
        headers,
      });
      // Next.js typically returns 200 for all pages (even auth pages render client-side)
      // 3xx redirects are also acceptable (e.g., middleware redirects)
      const ok = res.status >= 200 && res.status < 400;
      record('Frontend', `GET ${page}`, ok, res.status,
        ok ? 'page loads' : `unexpected status ${res.status}`);
    } catch (e) {
      record('Frontend', `GET ${page}`, false, 0, e.message);
    }
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   ProLink Comprehensive E2E Test Suite               ║');
  console.log(`║   Backend:  https://${BACKEND}     ║`);
  console.log(`║   Frontend: https://${FRONTEND}   ║`);
  console.log(`║   Date: ${new Date().toISOString().split('T')[0]}                                  ║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  try { await testHealth(); } catch (e) { console.error('Health section error:', e.message); }
  try { await testAuth(); } catch (e) { console.error('Auth section error:', e.message); }
  try { await testTaxonomy(); } catch (e) { console.error('Taxonomy section error:', e.message); }
  try { await testJobs(); } catch (e) { console.error('Jobs section error:', e.message); }
  try { await testProfiles(); } catch (e) { console.error('Profiles section error:', e.message); }
  try { await testSearch(); } catch (e) { console.error('Search section error:', e.message); }
  try { await testFrontend(); } catch (e) { console.error('Frontend section error:', e.message); }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // ── Summary ────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                   TEST SUMMARY                       ║');
  console.log('╠══════════════════════════════════════════════════════╣');

  const sections = [...new Set(results.map(r => r.section))];
  for (const section of sections) {
    const secResults = results.filter(r => r.section === section);
    const secPass = secResults.filter(r => r.pass).length;
    const secFail = secResults.filter(r => !r.pass).length;
    const status = secFail === 0 ? 'ALL PASS' : `${secFail} FAILED`;
    console.log(`║  ${section.padEnd(12)} ${secPass}/${secResults.length} passed  ${status.padEnd(10)} ║`);
  }

  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  TOTAL: ${totalPass} PASSED / ${totalFail} FAILED / ${results.length} TOTAL`.padEnd(55) + '║');
  console.log(`║  Time: ${elapsed}s`.padEnd(55) + '║');
  console.log('╚══════════════════════════════════════════════════════╝');

  // List all failures
  const failures = results.filter(r => !r.pass);
  if (failures.length > 0) {
    console.log('\n--- FAILED TESTS ---');
    for (const f of failures) {
      console.log(`  [FAIL] [${f.section}] ${f.name} (HTTP ${f.status}) ${f.detail ? '- ' + f.detail : ''}`);
    }
  }

  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
