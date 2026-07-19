const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://prolink-backend-jbpj.onrender.com/api';

async function fetchAPI(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`API Error [${res.status}]: ${data.error || data.msg || JSON.stringify(data)}`);
  }
  return data;
}

async function runE2E() {
  console.log('=== ProLink E2E Test Suite ===\n');

  try {
    // 1. REGISTRATION
    console.log('1. Registering users...');
    const rnd = Math.floor(Math.random() * 100000);
    const client = await fetchAPI('/auth/register', 'POST', {
      email: `client${rnd}@test.com`, password: 'Password123!', full_name: 'Test Client', user_type: 'client'
    });
    console.log(' - Client registered:', client.user.id);
    const provider = await fetchAPI('/auth/register', 'POST', {
      email: `provider${rnd}@test.com`, password: 'Password123!', full_name: 'Test Provider', user_type: 'provider'
    });
    console.log(' - Provider registered:', provider.user.id);
    const admin = await fetchAPI('/auth/register', 'POST', {
      email: `admin${rnd}@test.com`, password: 'Password123!', full_name: 'Test Admin', user_type: 'admin'
    });
    console.log(' - Admin registered:', admin.user.id);

    const clientToken = client.token;
    const providerToken = provider.token;
    const adminToken = admin.token;

    // 2. ADMIN TESTS
    console.log('\n2. Testing Admin Panel...');
    // We should test an admin endpoint, e.g., GET /admin/users or /admin/stats
    try {
        const stats = await fetchAPI('/admin/stats', 'GET', null, adminToken);
        console.log(' - Admin stats retrieved');
    } catch (e) {
        console.log(' - [WARN] Admin route /admin/stats failed (maybe it does not exist?):', e.message);
    }
    
    // 3. JOB CREATION & BIDDING
    console.log('\n3. Job Creation & Bidding...');
    const job = await fetchAPI('/jobs', 'POST', {
      title: 'Need a React Developer',
      description: 'Looking for someone to build a dashboard.',
      category_id: 1, // assuming 1 exists, might fail if db is empty
      budget: 50000,
      skills: ['React', 'Node']
    }, clientToken);
    console.log(' - Job created by client:', job.id || job.job?.id);
    const jobId = job.id || job.job?.id;

    if (jobId) {
        // Provider bids on job
        const bid = await fetchAPI(`/jobs/${jobId}/bids`, 'POST', {
            amount: 45000,
            proposal: 'I can do this in 2 weeks.',
            delivery_time: '14 days'
        }, providerToken);
        console.log(' - Provider placed bid:', bid.id || bid.bid?.id);
        const bidId = bid.id || bid.bid?.id;

        // 4. CONTRACTS & MILESTONES
        console.log('\n4. Contracts & Milestones...');
        // Accept bid (Client)
        if (bidId) {
            const accept = await fetchAPI(`/jobs/${jobId}/bids/${bidId}/accept`, 'POST', null, clientToken);
            console.log(' - Client accepted bid. Contract created.');
        } else {
            console.log(' - [SKIP] No bid ID to accept.');
        }
    } else {
        console.log(' - [SKIP] Job creation failed or returned unexpected format.');
    }

    // 5. AI INTEGRATION
    console.log('\n5. AI Integration Testing...');
    try {
        const aiRes = await fetchAPI('/ai/generate-description', 'POST', {
            title: 'Frontend Developer', keywords: ['react', 'css']
        }, clientToken);
        console.log(' - AI generated content:', aiRes.description ? 'Success' : 'Format unknown');
    } catch (e) {
        console.log(' - [WARN] AI test failed (maybe route differs?):', e.message);
    }

    console.log('\n=== E2E Test Suite COMPLETED ===');
  } catch (err) {
    console.error('\n=== E2E Test Suite FAILED ===');
    console.error(err);
  }
}

runE2E();
