async function testEnroll() {
  const loginRes = await fetch('http://localhost:3002/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@example.com', password: 'Password123' })
  });
  const { access_token } = await loginRes.json();

  const coursesRes = await fetch('http://localhost:3002/api/courses/?type=free');
  const coursesJson = await coursesRes.json();
  const freeCourse = coursesJson.data.courses[0];
  console.log('Free course:', { id: freeCourse.id, title: freeCourse.title });

  const orderRes = await fetch('http://localhost:3002/api/orders/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    },
    body: JSON.stringify({ courseId: freeCourse.id })
  });
  console.log('Order result:', await orderRes.json());
}

testEnroll().catch(console.error);
