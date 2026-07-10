const https = require('https');
const http = require('http');

const BACKEND = 'prolink-backend.vercel.app';
const FRONTEND = 'prolink-eight.vercel.app';

let PASS = 0, FAIL = 0, SKIP = 0;
const ok = (label) => { console.log('  ✅ ' + label); PASS++; };
const no = (label, detail) => { console.log('  ❌ ' + label + (detail ? ' — ' + detail : '')); FAIL++; };
const skip = (label) => { console.log('  ⏭️  ' + label); SKIP++; };
const section = (t) => console.log('\n═══ ' + t + ' ═══');

function call(method, path, data, token, host = BACKEND) {
  return new Promise((resolve) => {
    const opts = {
      hostname: host, port: 443, path, method,
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'ProLink-Audit' },
      timeout: 20000
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch {}
        const isHtml = !parsed && body.includes('<html');
        resolve({ status: res.statusCode, data: parsed, raw: body.substring(0, 200), isHtml });
      });
    });
    req.on('error', e => resolve({ status: 0, error: e.message, isHtml: false }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'TIMEOUT' }); });
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('    PROLINK COMPREHENSIVE AUDIT');
  console.log('═══════════════════════════════════════════════\n');

  // ── 1. HEALTH ──
  section('1. HEALTH');
  let h1 = await call('GET', '/health/liveness');
  h1.data?.status === 'ok' ? ok('liveness') : no('liveness', h1.status + ' ' + (h1.error || ''));

  let h2 = await call('GET', '/health/readiness');
  (h2.data?.checks?.database && h2.data?.checks?.cache && h2.data?.checks?.eventBus)
    ? ok('readiness (all 3 checks OK)')
    : no('readiness', JSON.stringify(h2.data?.checks));

  let h3 = await call('GET', '/health/metrics');
  h3.data?.uptime ? ok('metrics (uptime: ' + h3.data.uptimeHuman + ')') : no('metrics');

  // ── 2. TAXONOMY ──
  section('2. TAXONOMY');
  let sk = await call('GET', '/api/taxonomy/skills');
  Array.isArray(sk.data) ? ok('skills: ' + sk.data.length + ' skills') : no('skills returns: ' + (sk.error || sk.status));
  // Check skill count
  if (Array.isArray(sk.data) && sk.data.length < 200) no('skills count low at ' + sk.data.length + ' (expected 200+)', 'needs reseed');
  else if (Array.isArray(sk.data)) ok('skill count adequate (' + sk.data.length + ')');

  let ct = await call('GET', '/api/taxonomy/categories');
  Array.isArray(ct.data) ? ok('categories: ' + ct.data.length + ' categories') : no('categories');
  if (Array.isArray(ct.data) && ct.data.length < 15) no('only ' + ct.data.length + ' categories (expected 20)');

  // ── 3. AUTH ──
  section('3. AUTH');
  const email = 'audit_' + Date.now() + '@test.com';
  let reg = await call('POST', '/api/auth/register', { email, password: 'TestPass123!', full_name: 'Audit User', user_type: 'client' });
  let token = reg.data?.token;
  let userId = reg.data?.user?.id;
  token ? ok('register (userId: ' + userId + ')') : no('register', reg.status + ' ' + JSON.stringify(reg.data).substring(0, 100));

  // Login with same user
  let login = await call('POST', '/api/auth/login', { email, password: 'TestPass123!' });
  login.data?.token ? ok('login') : no('login', login.status + ' ' + JSON.stringify(login.data).substring(0, 80));

  // Verify endpoint returns 400 (expected - no valid OTP)
  let vfy = await call('GET', '/api/auth/verify?token=badotp');
  vfy.status === 400 && vfy.data?.error ? ok('verify (returns 400 as expected)') : no('verify', vfy.status + ' ' + JSON.stringify(vfy.data));

  // Verify-otp POST route
  let vfy2 = await call('POST', '/api/auth/verify-otp', { token: 'badotp' });
  vfy2.status === 400 && vfy2.data?.error ? ok('verify-otp POST (400 expected)') : no('verify-otp POST', vfy2.status + ' ' + JSON.stringify(vfy2.data));

  // ── 4. JOBS ──
  section('4. JOBS');
  let jobs = await call('GET', '/api/jobs?limit=3');
  (jobs.data?.jobs !== undefined || jobs.status === 200) ? ok('GET /api/jobs') : no('GET /api/jobs', jobs.status + ' ' + JSON.stringify(jobs.data).substring(0, 80));

  // ── 5. SEARCH ──
  section('5. SEARCH');
  let sj = await call('GET', '/api/search/jobs?q=test');
  (sj.data?.jobs !== undefined) ? ok('search jobs') : no('search jobs', sj.status + ' ' + JSON.stringify(sj.data).substring(0, 80));

  let sp = await call('GET', '/api/search/providers?q=test');
  (sp.data?.providers !== undefined) ? ok('search providers') : no('search providers', sp.status + ' ' + JSON.stringify(sp.data).substring(0, 80));

  // ── 6. AUTHENTICATED ENDPOINTS ──
  section('6. AUTHENTICATED');
  if (!token) { skip('no token — skipping authenticated tests'); }
  else {
    // Profile
    let me = await call('GET', '/api/profiles/me', null, token);
    me.data?.full_name ? ok('GET /profiles/me (' + me.data.full_name + ')') : no('GET /profiles/me', JSON.stringify(me.data).substring(0, 80));
    if (me.data) {
      // Check all important fields
      if (me.data.email) ok('  email present'); else no('  email missing');
      if (me.data.user_type) ok('  user_type present'); else no('  user_type missing');
      if (me.data.state) ok('  state present'); else no('  state missing');
    }

    // Update profile (full update via PUT)
    let up = await call('PUT', '/api/profiles/me', {
      full_name: 'Audit Updated', bio: 'Updated via audit', state: 'Lagos', city: 'Ikeja', gender: 'male',
      hourlyRate: 10000, ratePeriod: 'weekly', availability: 'full_time'
    }, token);
    up.data?.msg ? ok('PUT /profiles/me ' + up.data.msg) : no('PUT /profiles/me', up.status + ' ' + JSON.stringify(up.data).substring(0, 80));

    // Verify update persisted
    let me2 = await call('GET', '/api/profiles/me', null, token);
    me2.data?.full_name === 'Audit Updated' ? ok('  name persisted') : no('  name not updated: ' + me2.data?.full_name);
    me2.data?.city === 'Ikeja' ? ok('  city persisted') : no('  city not updated: ' + me2.data?.city);
    me2.data?.state === 'Lagos' ? ok('  state persisted') : no('  state not updated: ' + me2.data?.state);
    me2.data?.gender === 'male' ? ok('  gender persisted') : no('  gender not updated: ' + me2.data?.gender);
    me2.data?.hourly_rate == 10000 ? ok('  hourly_rate persisted') : no('  hourly_rate not updated: ' + me2.data?.hourly_rate);
    me2.data?.rate_period === 'weekly' ? ok('  rate_period persisted') : no('  rate_period not updated: ' + me2.data?.rate_period);

    // PATCH (was missing — Bug 1B)
    let pa = await call('PATCH', '/api/profiles/me', { availability: 'open' }, token);
    pa.status === 200 ? ok('PATCH /profiles/me (was missing, now fixed)') : no('PATCH /profiles/me', pa.status + ' ' + JSON.stringify(pa.data).substring(0, 80));

    // Verify patch persisted
    let me3 = await call('GET', '/api/profiles/me', null, token);
    me3.data?.availability === 'open' ? ok('  PATCH availability persisted') : no('  PATCH did not persist: ' + me3.data?.availability);

    // Earnings
    let ea = await call('GET', '/api/profiles/me/earnings', null, token);
    ea.data?.gross_earned !== undefined ? ok('earnings') : no('earnings', ea.status + ' ' + JSON.stringify(ea.data).substring(0, 60));

    let ec = await call('GET', '/api/profiles/me/earnings-chart', null, token);
    Array.isArray(ec.data) ? ok('earnings chart') : no('earnings chart', JSON.stringify(ec.data).substring(0, 60));

    // Bank
    let ba = await call('GET', '/api/profiles/me/bank', null, token);
    ba.status < 500 ? ok('bank account') : no('bank account', ba.status);

    // Notifications
    let n1 = await call('GET', '/api/notifications?limit=3', null, token);
    n1.status < 500 ? ok('notifications') : no('notifications', n1.status + ' ' + JSON.stringify(n1.data).substring(0, 60));

    let uc = await call('GET', '/api/notifications/unread-count', null, token);
    uc.status === 200 ? ok('unread count') : no('unread count', uc.status);

    // Saved items
    let sj2 = await call('GET', '/api/saved_jobs', null, token);
    sj2.status < 500 ? ok('saved jobs') : no('saved jobs', sj2.status);
    let ss = await call('GET', '/api/saved_searches', null, token);
    ss.status < 500 ? ok('saved searches') : no('saved searches', ss.status);

    // Recommendations
    let rec = await call('GET', '/api/recommendations', null, token);
    rec.status < 500 ? ok('recommendations') : no('recommendations', rec.status);

    // Chats
    let ch = await call('GET', '/api/chats', null, token);
    ch.status < 500 ? ok('chats') : no('chats', ch.status);

    // Portfolio
    let pf = await call('GET', '/api/portfolio', null, token);
    pf.status < 500 ? ok('portfolio') : no('portfolio', pf.status);

    // Verification endpoints
    let nin = await call('POST', '/api/verification/verify-nin', { nin_number: '12345678901' }, token);
    nin.status < 500 ? ok('NIN verification') : no('NIN verification', nin.status);
    let cac = await call('POST', '/api/verification/verify-cac', { cac_number: 'CAC-12345' }, token);
    cac.status < 500 ? ok('CAC verification') : no('CAC verification', cac.status);

    // Public profile by userId
    if (userId) {
      let pp = await call('GET', '/api/profiles/' + userId);
      pp.data?.full_name ? ok('public profile: ' + pp.data.full_name) : no('public profile', JSON.stringify(pp.data).substring(0, 80));
      // Check Bug 1F fix
      pp.data?.location ? ok('  location: ' + pp.data.location) : no('  location missing');
      pp.data?.user_type ? ok('  user_type: ' + pp.data.user_type) : no('  user_type missing');

      let rv = await call('GET', '/api/profiles/' + userId + '/reviews');
      rv.data?.reviews !== undefined ? ok('profile reviews') : no('profile reviews', JSON.stringify(rv.data).substring(0, 60));
    }

    // Update picture (with dummy URL)
    let pic = await call('PUT', '/api/profiles/me/picture', { profile_picture_url: 'https://example.com/test.jpg' }, token);
    pic.status < 500 ? ok('update picture') : no('update picture', pic.status);

    // Test skills
    let skills = await call('GET', '/api/taxonomy/skills');
    if (Array.isArray(skills.data) && skills.data.length > 0) {
      let firstSkillId = skills.data[0].id;
      let updWithSkills = await call('PUT', '/api/profiles/me', { skills: [firstSkillId] }, token);
      updWithSkills.status === 200 ? ok('save skills') : no('save skills', updWithSkills.status + ' ' + JSON.stringify(updWithSkills.data).substring(0, 60));
    }
  }

  // ── 7. STATS ──
  section('7. PUBLIC ENDPOINTS');
  let st = await call('GET', '/api/stats');
  st.data ? ok('public stats') : no('stats', st.status + ' ' + JSON.stringify(st.data).substring(0, 60));

  let rv = await call('GET', '/api/reviews?limit=3');
  rv.status < 500 ? ok('public reviews') : no('reviews', rv.status);

  // ── 8. FRONTEND ──
  section('8. FRONTEND PAGES');
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/jobs', name: 'Jobs' },
    { path: '/jobs/new', name: 'Post Job' },
    { path: '/login', name: 'Login' },
    { path: '/signup', name: 'Signup' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/profile', name: 'Profile' },
    { path: '/profile/edit', name: 'Edit Profile' },
    { path: '/admin', name: 'Admin' },
    { path: '/admin/users', name: 'Admin Users' },
    { path: '/terms', name: 'Terms' },
    { path: '/privacy', name: 'Privacy' },
    { path: '/verify', name: 'Verify Email' },
    { path: '/forgot-password', name: 'Forgot Password' },
    { path: '/sitemap.xml', name: 'Sitemap' },
    { path: '/robots.txt', name: 'Robots' },
  ];
  for (const page of pages) {
    let r = await call('GET', page.path, null, null, FRONTEND);
    if (r.status === 200 || r.status === 307 || r.status === 308) ok(page.name + ' (' + r.status + ', ' + (r.raw?.length || '0') + ' bytes)');
    else no(page.name, r.status + ' ' + (r.raw?.substring(0, 60) || ''));
  }

  // ── 9. CORS CHECK ──
  section('9. CORS');
  const https2 = require('https');
  await new Promise((resolve) => {
    const opts = { hostname: BACKEND, port: 443, path: '/health/liveness', method: 'OPTIONS', headers: { 'Origin': 'https://' + FRONTEND, 'Access-Control-Request-Method': 'GET' } };
    const req = https2.request(opts, (res) => {
      let corsOk = res.headers['access-control-allow-origin'] === 'https://' + FRONTEND;
      corsOk ? ok('CORS allows ' + FRONTEND) : no('CORS missing header', res.headers['access-control-allow-origin'] || 'none');
      resolve();
    });
    req.on('error', e => { no('CORS', e.message); resolve(); });
    req.end();
  });

  // ── SUMMARY ──
  console.log('\n═══════════════════════════════════════════════');
  console.log('  RESULTS');
  console.log('  ✅ PASS: ' + PASS);
  console.log('  ❌ FAIL: ' + FAIL);
  console.log('  ⏭️  SKIP: ' + SKIP);
  console.log('  📊 TOTAL: ' + (PASS + FAIL + SKIP));
  console.log('  🎯 RATE: ' + Math.round(PASS / (PASS + FAIL) * 100) + '%');
  console.log('═══════════════════════════════════════════════');
}

main().catch(e => console.error('FATAL:', e));
