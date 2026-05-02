const axios = require('axios');

async function test() {
  try {
    // Login to get token
    const loginRes = await axios.post('http://localhost:3008/auth/login', {
      email: 'admin@admin.com',
      password: 'password' // We don't know the password, but we can bypass or we can just try to see what error it gives
    });
  } catch(e) {
    console.log(e.response?.data);
  }
}
test();
