async function checkCourse() {
  const enrollRes = await fetch('http://localhost:3002/api/enrollments/my', {
    headers: {
      'Authorization': 'Bearer ' + (await (await fetch('http://localhost:3002/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student@example.com', password: 'Password123' })
      })).json()).access_token
    }
  });
  const enrollJson = await enrollRes.json();
  const enrolledCourse = enrollJson.data[0];
  console.log('Enrolled Course:', JSON.stringify(enrolledCourse, null, 2));

  // Get chapter for this course
  const chapRes = await fetch('http://localhost:3002/api/chapters/course/' + enrolledCourse.courseId);
  console.log('Chapters:', JSON.stringify(await chapRes.json(), null, 2));
}

checkCourse().catch(console.error);
