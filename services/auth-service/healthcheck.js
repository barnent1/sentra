const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3005,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const request = http.request(options, (response) => {
  if (response.statusCode === 200) {
    console.log('Health check passed');
    process.exit(0);
  } else {
    console.log(`Health check failed with status: ${response.statusCode}`);
    process.exit(1);
  }
});

request.on('error', (error) => {
  console.error('Health check error:', error.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.error('Health check timeout');
  request.destroy();
  process.exit(1);
});

request.end();