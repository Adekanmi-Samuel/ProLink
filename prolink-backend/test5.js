const auth = require('./src/services/authService');

auth.registerUser({
  email: `final_working_${Date.now()}@test.com`,
  password: 'TestPassword@123',
  user_type: 'client',
  full_name: 'Test Final'
}).then(console.log).catch(console.error);
