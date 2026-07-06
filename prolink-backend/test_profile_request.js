const http = require('http');
const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/profiles/me',
  method: 'GET',
  headers: {
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoyfSwiaWF0IjoxNzYwMjc3NDUxLCJleHAiOjE3NjAyOTU0NTF9.4EzFeTwkdkBX2iZN91mteTIlDHBvO8Kqg5rCLMcJSoI'
  }
};
const req = http.request(options, (res) => {
  console.log('status', res.statusCode);
  let d = '';
  res.on('data', (c) => d += c);
  res.on('end', () => console.log('body', d));
});
req.on('error', (e) => console.error('err', e));
req.end();
