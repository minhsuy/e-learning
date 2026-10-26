async function checkRecentLessons() {
  const chapters = [
    'f8e587af-6653-5241-80ca-85584cddf48d',
    'ed63111f-a4d4-58a2-a7e3-fc7916c9195b'
  ];

  for (const ch of chapters) {
    const res = await fetch('http://localhost:3002/api/lessons/chapter/' + ch);
    const json = await res.json();
    console.log('Chapter', ch, 'lessons:', json.data?.map(l => ({ id: l.id, title: l.title, createdAt: l.createdAt })));
  }
}

checkRecentLessons().catch(console.error);
