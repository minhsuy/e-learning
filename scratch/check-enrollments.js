async function checkEnrollments() {
  // Test login with student
  const studentLogin = await (await fetch('http://localhost:3002/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@example.com', password: 'Password123' })
  })).json();

  console.log('Student ID:', studentLogin.access_token ? JSON.parse(Buffer.from(studentLogin.access_token.split('.')[1], 'base64').toString()) : null);

  const enrollRes = await fetch('http://localhost:3002/api/enrollments/my', {
    headers: { 'Authorization': `Bearer ${studentLogin.access_token}` }
  });
  const enrollJson = await enrollRes.json();
  console.log('Student Enrolled Courses:', JSON.stringify(enrollJson.data?.map(e => ({ courseId: e.courseId, title: e.course?.title, status: e.status })), null, 2));
}

checkEnrollments().catch(console.error);
