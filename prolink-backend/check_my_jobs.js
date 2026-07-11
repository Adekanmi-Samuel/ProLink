const jobsService = require('./src/services/jobsService');
jobsService.getMyJobs(2).then(res => console.log(JSON.stringify(res, null, 2))).catch(console.error).finally(() => process.exit(0));
