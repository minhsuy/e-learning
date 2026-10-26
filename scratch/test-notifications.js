
async function test() {
  const loginData = JSON.stringify({
    email: 'student@example.com',
    password: 'Password123'
  });

  const loginRes = await fetch('http://localhost:3002/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: loginData
  });

  const loginJson = await loginRes.json();
  console.log('Login Response:', JSON.stringify(loginJson, null, 2));

  if (!loginJson.access_token) {
    console.log('Login failed!');
    return;
  }

  const token = loginJson.access_token;

  // 1. Check /api/users/me
  const meRes = await fetch('http://localhost:3002/api/users/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('User Profile:', await meRes.json());

  // 2. Check /api/enrollments/my
  const enrollRes = await fetch('http://localhost:3002/api/enrollments/my', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Enrollments:', await enrollRes.json());

  // 3. Check /api/notifications/
  const notifRes = await fetch('http://localhost:3002/api/notifications/?page=1&limit=20', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Notifications (trailing slash):', JSON.stringify(await notifRes.json(), null, 2));

  // 5. Check public courses
  const coursesRes = await fetch('http://localhost:3002/api/courses/');
  const coursesJson = await coursesRes.json();
  console.log('Courses:', JSON.stringify(coursesJson.data?.courses?.map(c => ({ id: c.id, title: c.title, author: c.author })), null, 2));
}

test().catch(console.error);
