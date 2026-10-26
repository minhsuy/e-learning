async function findTodayLessons() {
  const coursesRes = await fetch('http://localhost:3002/api/courses/?limit=100');
  const coursesJson = await coursesRes.json();

  for (const c of coursesJson.data.courses) {
    const detailRes = await fetch('http://localhost:3002/api/courses/' + c.slug);
    const detail = await detailRes.json();
    if (!detail.data?.chapters) continue;

    for (const ch of detail.data.chapters) {
      const lessonsRes = await fetch('http://localhost:3002/api/lessons/chapter/' + ch.id);
      const lessonsJson = await lessonsRes.json();
      if (!lessonsJson.data) continue;

      for (const l of lessonsJson.data) {
        if (l.createdAt && (l.createdAt.includes('2026-10') || l.order > 8)) {
          console.log('FOUND RECENT LESSON:', {
            lessonId: l.id,
            title: l.title,
            courseId: c.id,
            courseTitle: c.title,
            chapterId: ch.id,
            createdAt: l.createdAt
          });
        }
      }
    }
  }
}

findTodayLessons().catch(console.error);
