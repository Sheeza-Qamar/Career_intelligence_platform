// Quick test script to verify the job search route is accessible
const axios = require('axios');

async function testRoute() {
  try {
    console.log('Testing /api/job-search route...');
    const response = await axios.post('http://localhost:5000/api/job-search', {
      job_role: 'Software Engineer',
      location: 'San Francisco, CA'
    }, {
      timeout: 5000
    });
    console.log('✅ Route is accessible!');
    console.log('Response:', response.status, response.statusText);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Backend server is not running on port 5000');
      console.error('   Please start the backend server: cd backend && npm start');
    } else if (error.response) {
      console.error('❌ Route returned error:', error.response.status, error.response.statusText);
      console.error('   Response:', error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testRoute();
