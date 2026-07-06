# ProLink Performance & Optimization Plan

## Issues Found

### 🔴 N+1 Queries
1. **jobsService.js:getJobById()** — Fetches job with `bids: true`, then immediately re-fetches `bid.findMany` with provider info. Double query!
2. **chatsService.js:sendMessage()** — Fetches thread, then fetches block separately. Two queries where one suffices.

### 🔴 Missing Pagination
1. **jobsService.js:getPublicJobs()** — No `take`/`skip`. Could return 1000s of jobs.
2. **jobsService.js:getMyJobs()** — No limit.
3. **jobsService.js:getMyBids()** — No limit.
4. **profilesService.js:getProfileReviews()** — No limit.

### 🔴 SELECT * (fetching too much)
1. **jobsService.js:getPublicJobs()** L75 — `include: { client: { include: { profile: true } } }` fetches ALL profile fields (bio, ratings, badges, etc.) when only `full_name` needed.
2. **jobsService.js:getMyJobs()** — Uses spread `...job` returning ALL fields.

### 🔴 Blocking Main Thread
1. **jobsService.js:getPublicJobs()** — Unbounded query with no pagination = slow + memory heavy.
2. **profilesService.js:getMyEarnings()** — Nested JS loops over milestones.

### 🔴 Missing Indexes
1. `User.otp_code` — Used in verification lookups
2. `User.reset_token` — Used in password reset
3. `Job.job_type` — Used in filtering
4. `Profile.nin_status`, `Profile.cac_status` — Used in filtering/verification
