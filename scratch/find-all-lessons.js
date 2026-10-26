async function checkAllLessons() {
  const coursesRes = await fetch('http://localhost:3002/api/courses/?limit=100');
  const coursesJson = await coursesRes.json();

  const allLessons = [];
  for (const c of coursesJson.data.courses) {
    const detail = await (await fetch('http://localhost:3002/api/courses/' + c.slug)).json();
    if (!detail.data?.chapters) continue;

    for (const ch of detail.data.chapters) {
      const lessonsRes = await fetch('http://localhost:3002/api/lessons/chapter/' + ch.id);
      const lessonsJson = await lessonsRes.json();
      if (!lessonsJson.data) continue;

      for (const l of lessonsJson.data) {
        allLessons.push({
          id: l.id,
          title: l.title,
          courseId: c.id,
          courseTitle: c.title,
          chapterId: ch.id,
          chapterTitle: ch.title,
          createdAt: l.createdAt
        });
      }
    }
  }

  // Sort by createdAt descending
  allLessons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  console.log('Total lessons across all chapters:', allLessons.length);
  console.log('Top 10 newest lessons:');
  console.log(JSON.stringify(allLessons.slice(0, 10), null, 2));
}

checkAllLessons().catch(console.error);
