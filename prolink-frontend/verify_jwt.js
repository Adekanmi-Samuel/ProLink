const jwt = require('jsonwebtoken');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoyfSwiaWF0IjoxNzYwMjc3NDUxLCJleHAiOjE3NjAyOTU0NTF9.4EzFeTwkdkBX2iZN91mteTIlDHBvO8Kqg5rCLMcJSoI';
const secret = 'PROLINK_IS_THE_BEST_SECRET_EVER_REPLACE_THIS_LATER';
try {
  const decoded = jwt.verify(token, secret);
  console.log('VERIFIED', decoded);
} catch (err) {
  console.error('VERIFY_ERROR', err.message);
}
