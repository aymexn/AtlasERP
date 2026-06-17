const http = require('http');

http.get('http://localhost:3000/health', (res) => {
  console.log('STATUS:', res.statusCode);
  res.on('data', (d) => process.stdout.write(d));
}).on('error', (e) => {
  console.error('ERROR:', e.message);
});
