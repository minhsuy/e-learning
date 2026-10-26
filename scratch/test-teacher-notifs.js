async function checkAll() {
  // Let's test if we can login with teacher or admin
  const logins = [
    { email: 'student@example.com', password: 'Password123' },
    { email: 'teacher_chineese@gmail.com', password: 'Password123' },
    { email: 'thaiminh0612@gmail.com', password: 'Password123' }
  ];

  for (const cred of logins) {
    try {
      const res = await fetch('http://localhost:3002/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred)
      });
      const data = await res.json();
      if (data.access_token) {
        console.log(`Login OK: ${cred.email}`);
        const nRes = await fetch('http://localhost:3002/api/notifications/', {
          headers: { 'Authorization': `Bearer ${data.access_token}` }
        });
        const nData = await nRes.json();
        console.log(`Notifications for ${cred.email}:`, JSON.stringify(nData.data?.notifications?.length, null, 2));
        if (nData.data?.notifications?.length > 0) {
          console.log('Sample notif:', JSON.stringify(nData.data.notifications[0], null, 2));
        }
      } else {
        console.log(`Login FAILED for ${cred.email}:`, data.message || data.error);
      }
    } catch (e) {
      console.log(`Error ${cred.email}:`, e.message);
    }
  }
}

checkAll().catch(console.error);
