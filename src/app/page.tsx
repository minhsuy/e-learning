'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { mockDashboardData } from '@/data/mock-dashboard';
import { useAuth } from '@/hooks/use-auth';
import { getRankBadgeConfig, useGamificationOverview } from '@/hooks/use-gamification';
import { enrollmentService } from '@/services/enrollment.service';
import { progressService } from '@/services/progress.service';
import { ApiEnrollmentItem } from '@/types/enrollment';
import { ApiCourseProgressData } from '@/types/progress';

export default function HomePage() {
  const { user } = useAuth();
  const { xpSummary, streak, position, hasStudiedToday, progressPercent } = useGamificationOverview();
  const [selectedFilter, setSelectedFilter] = useState('Tất cả');
  const filters = ['Tất cả', 'Thịnh hành', 'Lập trình Web', 'Trí tuệ nhân tạo', 'Dữ liệu'];

  const [realEnrollments, setRealEnrollments] = useState<ApiEnrollmentItem[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ApiCourseProgressData>>({});
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();

    async function fetchEnrollments() {
      if (!user) {
        setRealEnrollments([]);
        setProgressMap({});
        return;
      }
      setIsLoadingEnrollments(true);
      try {
        const res = await enrollmentService.getMyEnrollments({ signal: controller.signal });
        if (isCurrent && res.success && Array.isArray(res.data)) {
          const valid = res.data.filter(
            (e) => e && e.course && (e.course.slug || e.course.id || e.course._id)
          );
          setRealEnrollments(valid);

          // Fetch progress in parallel for top enrolled courses
          const courseIds = valid
            .map((e) => e.courseId || e.course?.id || e.course?._id)
            .filter((id): id is string => Boolean(id));
          const uniqueCourseIds = Array.from(new Set(courseIds)).slice(0, 5);

          if (uniqueCourseIds.length > 0) {
            const progressResults = await Promise.allSettled(
              uniqueCourseIds.map(async (cId) => {
                const pRes = await progressService.getCourseProgress(cId, { signal: controller.signal });
                return { cId, data: pRes.data };
              })
            );

            if (isCurrent) {
              const newMap: Record<string, ApiCourseProgressData> = {};
              progressResults.forEach((result) => {
                if (result.status === 'fulfilled' && result.value?.data) {
                  newMap[result.value.cId] = result.value.data;
                }
              });
              setProgressMap(newMap);
            }
          }
        }
      } catch {
        // Non-blocking
      } finally {
        if (isCurrent) setIsLoadingEnrollments(false);
      }
    }

    fetchEnrollments();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [user]);

  // Helper to find the next uncompleted lesson
  const getNextLesson = (courseId: string) => {
    const detailed = progressMap[courseId];
    if (!detailed || !detailed.lessons || detailed.lessons.length === 0) return null;
    const sorted = [...detailed.lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const nextUncompleted = sorted.find((l) => !l.completed);
    if (nextUncompleted) {
      return {
        id: nextUncompleted.id || nextUncompleted._id || '',
        title: nextUncompleted.title || '',
        order: nextUncompleted.order ?? 1,
      };
    }
    const first = sorted[0];
    return {
      id: first.id || first._id || '',
      title: first.title || '',
      order: first.order ?? 1,
    };
  };

  // Sort enrollments: Prioritize active in-progress courses (0 < progress < 100) first
  const sortedEnrollments = React.useMemo(() => {
    return [...realEnrollments].sort((a, b) => {
      const cIdA = a.courseId || a.course?.id || a.course?._id || '';
      const cIdB = b.courseId || b.course?.id || b.course?._id || '';
      const progA = progressMap[cIdA]?.percent ?? a.progress ?? 0;
      const progB = progressMap[cIdB]?.percent ?? b.progress ?? 0;
      const isDoneA = progA >= 100 || a.status === 'COMPLETED';
      const isDoneB = progB >= 100 || b.status === 'COMPLETED';

      // 1. Active in-progress comes first
      const inProgA = progA > 0 && !isDoneA ? 1 : 0;
      const inProgB = progB > 0 && !isDoneB ? 1 : 0;
      if (inProgB !== inProgA) return inProgB - inProgA;

      // 2. Not-started comes before completed
      if (isDoneA !== isDoneB) return isDoneA ? 1 : -1;

      // 3. Newest date
      return new Date(b.enrolledAt || b.createdAt || 0).getTime() - new Date(a.enrolledAt || a.createdAt || 0).getTime();
    });
  }, [realEnrollments, progressMap]);

  // Find active course for hero action
  const activeCourse = sortedEnrollments[0] || null;

  const activeCourseId = activeCourse?.courseId || activeCourse?.course?.id || activeCourse?.course?._id || '';
  const activeCourseSlug = activeCourse?.course?.slug || activeCourseId;
  const nextActiveLesson = activeCourseId ? getNextLesson(activeCourseId) : null;
  const heroClassroomUrl = activeCourseSlug
    ? (nextActiveLesson ? `/learn/${activeCourseSlug}?lesson=${encodeURIComponent(nextActiveLesson.id)}` : `/learn/${activeCourseSlug}`)
    : (user ? '/my-courses' : '/courses');

  const studentDisplayName = user?.username || mockDashboardData.studentName;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  return (
    <AppShell>
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* CENTER MAIN CONTENT AREA (8 cols desktop) */}
          <section className="xl:col-span-8 flex flex-col gap-8">
            {/* 1. Welcome Banner / Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7240b8] via-[#8b5ad3] to-[#635a72] p-6 md:p-8 shadow-md text-white">
              {/* Ambient blur glow */}
              <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="absolute right-8 top-4 opacity-15 pointer-events-none">
                <span className="material-symbols-outlined text-[130px]">school</span>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md w-fit">
                    <span className="material-symbols-outlined text-[#6ffbbe] text-[16px]">
                      verified
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {user
                        ? hasStudiedToday
                          ? `Tuyệt vời! Bạn đã duy trì chuỗi học ${streak?.currentStreak ?? 1} ngày hôm nay!`
                          : `Chuỗi học hiện tại: ${streak?.currentStreak ?? 0} ngày • Vào học để giữ chuỗi!`
                        : 'Hệ sinh thái học tập trực tuyến chuẩn quốc tế'}
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-1">
                    {user
                      ? `Chào mừng trở lại, ${user.username}! 👋`
                      : 'Chào mừng bạn đến với TMdemy! 👋'}
                  </h1>
                  <p className="text-sm md:text-base text-white/90 leading-relaxed">
                    {user
                      ? 'Hôm nay là thời điểm tuyệt vời để hoàn thành mục tiêu học tập tuần này. Bạn chỉ còn 1 bài thực hành nữa thôi!'
                      : 'Khám phá hơn 450+ khóa học chuyên sâu từ các giảng viên hàng đầu. Nâng tầm kỹ năng công nghệ cùng TMdemy ngay hôm nay.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <Link
                    href={heroClassroomUrl}
                    className="px-5 py-3 bg-white text-[#7240b8] rounded-xl font-bold text-sm shadow-sm hover:bg-[#f7f1ff] transition-all flex items-center gap-2 group cursor-pointer"
                  >
                    <span>Vào lớp ngay</span>
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-0.5 transition-transform">
                      play_circle
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            {/* 2. Section: Tiếp tục học (Continue Learning) */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[24px]">
                    timelapse
                  </span>
                  <h2 className="text-lg md:text-xl font-bold text-[#1c192c] dark:text-[#f4eeff]">Tiếp tục học</h2>
                  <span className="ml-1 px-2.5 py-0.5 rounded-full bg-[#ebe5ff] dark:bg-[#282136] text-[#4b4452] dark:text-[#b4a9c7] text-xs font-semibold">
                    {user ? realEnrollments.length : mockDashboardData.inProgressCourses.length} khóa
                  </span>
                </div>
                <Link
                  href={user ? '/my-courses' : '/courses'}
                  className="text-xs md:text-sm font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Xem tất cả</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </Link>
              </div>

              {/* In-progress Horizontal 3 Cards Grid */}
              {user && sortedEnrollments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sortedEnrollments.slice(0, 3).map((item) => {
                    const c = item.course;
                    if (!c) return null;
                    const cSlug = c.slug || c.id || c._id;
                    const cId = item.courseId || c.id || c._id || '';
                    const progressDetail = progressMap[cId];
                    const progressVal = progressDetail?.percent !== undefined
                      ? Math.min(100, Math.max(0, progressDetail.percent))
                      : Math.min(100, Math.max(0, item.progress ?? 0));
                    const isDone = progressVal >= 100 || item.status === 'COMPLETED';
                    const nextLesson = getNextLesson(cId);
                    const learnUrl = nextLesson
                      ? `/learn/${cSlug}?lesson=${encodeURIComponent(nextLesson.id)}`
                      : `/learn/${cSlug}`;

                    return (
                      <div
                        key={item.id || item._id || cSlug}
                        className="group bg-white dark:bg-[#1d1926] rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between border border-[#f1ebff] dark:border-[#2f2742]"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="relative overflow-hidden rounded-lg aspect-video bg-[#f7f1ff] dark:bg-[#16131e]">
                            <img
                              src={c.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'}
                              alt={c.title || 'Course thumbnail'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-[#1d1926]/90 backdrop-blur-md text-[#7240b8] dark:text-[#a87ffb] text-[11px] font-bold">
                              {isDone ? 'Đã hoàn thành' : 'Đang học'}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1">
                            <Link href={`/learn/${cSlug}`}>
                              <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] line-clamp-2 group-hover:text-[#7240b8] dark:group-hover:text-[#a87ffb] transition-colors leading-snug">
                                {c.title}
                              </h3>
                            </Link>

                            {/* Next lesson snippet */}
                            {nextLesson && !isDone && (
                              <div className="flex items-center gap-1 text-[11px] text-[#7240b8] dark:text-[#a87ffb] font-medium truncate mt-0.5">
                                <span className="material-symbols-outlined text-[13px]">play_circle</span>
                                <span className="truncate">Bài tiếp theo: {nextLesson.title}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-1.5 mt-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-[#635a72] dark:text-[#b4a9c7]">
                                {progressDetail && progressDetail.totalLessons > 0
                                  ? `Tiến độ (${progressDetail.completedLessons}/${progressDetail.totalLessons} bài)`
                                  : 'Tiến độ học'}
                              </span>
                              <span className="text-[#7240b8] dark:text-[#a87ffb] font-bold">
                                {progressVal}%
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-[#ebe5ff] dark:bg-[#282136] overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isDone ? 'bg-[#00855b]' : 'bg-[#7240b8] dark:bg-[#a87ffb]'
                                }`}
                                style={{ width: `${progressVal}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-2">
                          <Link
                            href={isDone ? `/learn/${cSlug}` : learnUrl}
                            className="w-full py-2 px-3 rounded-lg bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {isDone ? 'replay' : 'play_arrow'}
                            </span>
                            <span>{isDone ? 'Xem lại bài học' : 'Tiếp tục học'}</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : user && !isLoadingEnrollments && realEnrollments.length === 0 ? (
                <div className="p-6 rounded-xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] shadow-xs flex flex-col items-center justify-center text-center gap-3">
                  <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[36px]">
                    school
                  </span>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      Bạn chưa tham gia khóa học nào
                    </p>
                    <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                      Khám phá các khóa học phù hợp với mục tiêu phát triển của bạn trên TMdemy.
                    </p>
                  </div>
                  <Link
                    href="/courses"
                    className="px-4 py-2 rounded-lg bg-[#7240b8] text-white text-xs font-semibold hover:bg-[#8b5ad3] transition-colors"
                  >
                    Khám phá khóa học ngay
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mockDashboardData.inProgressCourses.map((course) => (
                    <div
                      key={course.id}
                      className="group bg-white dark:bg-[#1d1926] rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between border border-[#f1ebff] dark:border-[#2f2742]"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="relative overflow-hidden rounded-lg aspect-video bg-[#f7f1ff] dark:bg-[#16131e]">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-[#1d1926]/90 backdrop-blur-md text-[#7240b8] dark:text-[#a87ffb] text-[11px] font-bold">
                            {course.category}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <Link href={`/courses/${course.slug}`}>
                            <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] line-clamp-2 group-hover:text-[#7240b8] dark:group-hover:text-[#a87ffb] transition-colors leading-snug">
                              {course.title}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-1.5 text-[#635a72] dark:text-[#b4a9c7] text-xs mt-0.5">
                            <span className="material-symbols-outlined text-[15px]">schedule</span>
                            <span>{course.remainingTime}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 mt-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[#635a72] dark:text-[#b4a9c7]">
                              Tiến độ ({course.completedLessons}/{course.totalLessons} bài)
                            </span>
                            <span className="text-[#7240b8] dark:text-[#a87ffb] font-bold">
                              {course.progressPercent}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#ebe5ff] dark:bg-[#282136] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#7240b8] dark:bg-[#a87ffb] transition-all duration-500"
                              style={{ width: `${course.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-2">
                        <Link
                          href={`/learn/${course.slug}`}
                          className="w-full py-2 px-3 rounded-lg bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                          <span>Tiếp tục học</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Section: Khóa học đề xuất cho bạn (Recommended Courses) */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                    Khóa học đề xuất cho bạn
                  </h2>
                  <p className="text-xs md:text-sm text-[#635a72] dark:text-[#b4a9c7] mt-0.5">
                    Dựa trên lộ trình và sở thích chuyên ngành của bạn
                  </p>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {filters.map((filter) => {
                    const isSelected = selectedFilter === filter;
                    return (
                      <button
                        key={filter}
                        onClick={() => setSelectedFilter(filter)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                          isSelected
                            ? 'bg-[#7240b8] text-white shadow-xs'
                            : 'bg-[#ebe5ff] dark:bg-[#282136] text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#e6dffa] dark:hover:bg-[#342a47]'
                        }`}
                      >
                        {filter}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4 Recommended Course Cards in 2x2 Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockDashboardData.recommendedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="group bg-white dark:bg-[#1d1926] rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between border border-[#f1ebff] dark:border-[#2f2742]"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="relative overflow-hidden rounded-lg aspect-[16/9] bg-[#f7f1ff] dark:bg-[#16131e]">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 flex gap-1">
                          {course.badge && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[11px] font-bold shadow-xs">
                              {course.badge}
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-[#1d1926]/90 backdrop-blur-md text-[#1c192c] dark:text-[#f4eeff] text-[11px] font-semibold">
                            {course.category}
                          </span>
                        </div>
                        <button
                          aria-label="Lưu vào danh sách mong muốn"
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 dark:bg-[#1d1926]/80 backdrop-blur-md flex items-center justify-center text-[#635a72] dark:text-[#b4a9c7] hover:text-[#ba1a1a] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">bookmark</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-[#635a72] dark:text-[#b4a9c7]">
                          <span className="flex items-center text-amber-500 font-bold">
                            <span
                              className="material-symbols-outlined text-[15px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                            {course.rating.toFixed(1)}
                          </span>
                          <span>•</span>
                          <span>({course.studentCount} học viên)</span>
                          <span>•</span>
                          <span>{course.lessonCount} bài giảng</span>
                        </div>

                        <Link href={`/courses/${course.slug}`}>
                          <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] group-hover:text-[#7240b8] dark:group-hover:text-[#a87ffb] transition-colors line-clamp-2 mt-0.5">
                            {course.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                          Giảng viên: {course.instructorName}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-2 flex items-center justify-between border-t border-[#f7f1ff] dark:border-[#282136]">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-[#7240b8] dark:text-[#a87ffb]">
                          {formatPrice(course.price)}
                        </span>
                        {course.originalPrice && (
                          <span className="text-xs text-[#7c7483] dark:text-[#b4a9c7] line-through">
                            {formatPrice(course.originalPrice)}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/courses/${course.slug}`}
                        className="px-3.5 py-1.5 rounded-lg bg-[#ebe5ff] dark:bg-[#282136] hover:bg-[#7240b8] hover:text-white text-[#7240b8] dark:text-[#a87ffb] text-xs font-semibold transition-all"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* RIGHT SIDEBAR: LEARNING STATISTICS PANEL (4 cols desktop) */}
          <aside className="xl:col-span-4 flex flex-col gap-6">
            {/* 1. Profile Summary Card */}
            <div className="bg-white dark:bg-[#1d1926] rounded-xl p-5 shadow-xs flex flex-col gap-4 border border-[#f1ebff] dark:border-[#2f2742]">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    alt={studentDisplayName}
                    src={user?.avatar || mockDashboardData.avatar}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-[#7240b8]/20 dark:ring-[#a87ffb]/20"
                  />
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#00855b] shadow-xs flex items-center justify-center text-white text-[10px] font-bold">
                    ✓
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                    {studentDisplayName}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {user && xpSummary ? (
                      <span className="text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb]">
                        {xpSummary.rank.name} • Cấp {getRankBadgeConfig(xpSummary.rank.name).level}
                      </span>
                    ) : (
                      <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                        {mockDashboardData.studentRole}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#eddcff] dark:bg-[#282136] text-[#5b27a1] dark:text-[#d6c4ff] text-[11px] font-bold w-fit">
                    <span>
                      ⭐{' '}
                      {(user && xpSummary
                        ? xpSummary.xpTotal
                        : mockDashboardData.rewardPoints
                      ).toLocaleString()}{' '}
                      Điểm XP
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress to next rank (if authenticated) */}
              {user && xpSummary?.nextRank && (
                <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[#fdf8ff] dark:bg-[#181420] border border-[#f1ebff] dark:border-[#282136]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#635a72] dark:text-[#b4a9c7] font-medium">
                      Tiến độ lên {xpSummary.nextRank.name}
                    </span>
                    <strong className="text-[#7240b8] dark:text-[#a87ffb]">
                      {progressPercent}%
                    </strong>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#ebe5ff] dark:bg-[#282136] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#7240b8] dark:bg-[#a87ffb] transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#7c7483] dark:text-[#8e8596]">
                    Còn thiếu {xpSummary.xpToNextRank.toLocaleString()} XP nữa
                  </span>
                </div>
              )}

              {/* 2. Learning Metrics 3-column Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#f7f1ff] dark:border-[#282136]">
                {/* Streak Metric */}
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#f7f1ff] dark:bg-[#16131e] text-center border border-transparent dark:border-[#282136]">
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      hasStudiedToday
                        ? 'text-amber-500 animate-pulse'
                        : 'text-[#7240b8] dark:text-[#a87ffb]'
                    }`}
                  >
                    local_fire_department
                  </span>
                  <span className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] mt-0.5">
                    {user && streak !== null ? streak.currentStreak : mockDashboardData.streakDays}
                  </span>
                  <span className="text-[10px] text-[#635a72] dark:text-[#b4a9c7]">
                    {hasStudiedToday ? 'Đã học ✓' : 'Ngày Streak'}
                  </span>
                </div>

                {/* Leaderboard Rank Metric */}
                <Link
                  href="/leaderboard"
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#f7f1ff] dark:bg-[#16131e] text-center border border-transparent dark:border-[#282136] hover:border-[#7240b8] transition-all group"
                  title="Xem chi tiết Bảng xếp hạng"
                >
                  <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[20px] group-hover:scale-110 transition-transform">
                    military_tech
                  </span>
                  <span className="text-base font-bold text-[#7240b8] dark:text-[#a87ffb] mt-0.5">
                    {user && position !== null ? `#${position.rank}` : mockDashboardData.ranking}
                  </span>
                  <span className="text-[10px] text-[#635a72] dark:text-[#b4a9c7] group-hover:underline">
                    Toàn trường
                  </span>
                </Link>

                {/* Level / Status Metric */}
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#f7f1ff] dark:bg-[#16131e] text-center border border-transparent dark:border-[#282136]">
                  <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[20px]">
                    workspace_premium
                  </span>
                  <span className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] mt-0.5">
                    {user && xpSummary
                      ? `Lv.${getRankBadgeConfig(xpSummary.rank.name).level}`
                      : mockDashboardData.todayMinutes}
                  </span>
                  <span className="text-[10px] text-[#635a72] dark:text-[#b4a9c7]">
                    {user && xpSummary ? 'Cấp bậc' : 'Phút/Hôm nay'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Weekly Activity & Streak Tracker Calendar */}
            <div className="bg-white dark:bg-[#1d1926] rounded-xl p-5 shadow-xs flex flex-col gap-3 border border-[#f1ebff] dark:border-[#2f2742]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[20px]">
                    calendar_month
                  </span>
                  Chuỗi chuyên cần
                </span>
                <span
                  className={`text-xs font-bold ${
                    hasStudiedToday
                      ? 'text-[#00855b] dark:text-[#4edea3]'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {hasStudiedToday ? 'Đã học hôm nay ✓' : 'Hôm nay chưa học'}
                </span>
              </div>

              {/* Mon to Sun visual indicators */}
              <div className="grid grid-cols-7 gap-1.5 text-center pt-1">
                {mockDashboardData.weeklyActivity.map((day) => (
                  <div key={day.day} className="flex flex-col items-center gap-1.5">
                    <span
                      className={`text-[11px] font-semibold ${
                        day.day === 'T7' ? 'text-[#7240b8] dark:text-[#a87ffb] font-bold' : 'text-[#635a72] dark:text-[#b4a9c7]'
                      }`}
                    >
                      {day.day}
                    </span>
                    {day.isCompleted ? (
                      <div className="w-8 h-8 rounded-lg bg-[#7240b8] text-white flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[#ebe5ff] dark:bg-[#282136] text-[#7c7483] dark:text-[#b4a9c7] flex items-center justify-center font-bold text-xs">
                        --
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Thời gian học trong tuần (Weekly Watch Time Chart) */}
            <div className="bg-white dark:bg-[#1d1926] rounded-xl p-5 shadow-xs flex flex-col gap-3 border border-[#f1ebff] dark:border-[#2f2742]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">Thời gian học tuần này</h3>
                  <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                    Tổng thời lượng:{' '}
                    <strong className="text-[#7240b8] dark:text-[#a87ffb] font-bold">
                      {mockDashboardData.weeklyTotalHours} giờ
                    </strong>
                  </p>
                </div>
                <div className="p-1.5 rounded-lg bg-[#ebe5ff] dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb]">
                  <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                </div>
              </div>

              {/* Stylized Inline SVG Bar Chart */}
              <div className="pt-2">
                <svg
                  className="w-full h-28 overflow-visible"
                  fill="none"
                  viewBox="0 0 300 120"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Grid lines */}
                  <line
                    className="stroke-[#f1ebff] dark:stroke-[#282136]"
                    strokeDasharray="3 3"
                    x1="0"
                    x2="300"
                    y1="20"
                    y2="20"
                  />
                  <line
                    className="stroke-[#f1ebff] dark:stroke-[#282136]"
                    strokeDasharray="3 3"
                    x1="0"
                    x2="300"
                    y1="60"
                    y2="60"
                  />
                  <line className="stroke-[#e6dffa] dark:stroke-[#342b47]" x1="0" x2="300" y1="100" y2="100" />

                  {/* Day 1: T2 (2.1h) */}
                  <rect
                    className="fill-[#ebe5ff] dark:fill-[#282136] hover:fill-[#7240b8] transition-colors cursor-pointer"
                    height="53"
                    rx="4"
                    width="22"
                    x="15"
                    y="47"
                  />
                  <text className="fill-[#635a72] dark:fill-[#b4a9c7]" fontSize="10" fontWeight="600" textAnchor="middle" x="26" y="116">
                    T2
                  </text>
                  <text className="fill-[#7240b8] dark:fill-[#a87ffb]" fontSize="9" fontWeight="600" textAnchor="middle" x="26" y="40">
                    2.1h
                  </text>

                  {/* Day 2: T3 (1.5h) */}
                  <rect
                    className="fill-[#ebe5ff] dark:fill-[#282136] hover:fill-[#7240b8] transition-colors cursor-pointer"
                    height="38"
                    rx="4"
                    width="22"
                    x="58"
                    y="62"
                  />
                  <text className="fill-[#635a72] dark:fill-[#b4a9c7]" fontSize="10" fontWeight="600" textAnchor="middle" x="69" y="116">
                    T3
                  </text>
                  <text className="fill-[#7240b8] dark:fill-[#a87ffb]" fontSize="9" fontWeight="600" textAnchor="middle" x="69" y="55">
                    1.5h
                  </text>

                  {/* Day 3: T4 (3.2h) */}
                  <rect
                    className="fill-[#ebe5ff] dark:fill-[#282136] hover:fill-[#7240b8] transition-colors cursor-pointer"
                    height="80"
                    rx="4"
                    width="22"
                    x="101"
                    y="20"
                  />
                  <text className="fill-[#635a72] dark:fill-[#b4a9c7]" fontSize="10" fontWeight="600" textAnchor="middle" x="112" y="116">
                    T4
                  </text>
                  <text className="fill-[#7240b8] dark:fill-[#a87ffb]" fontSize="9" fontWeight="600" textAnchor="middle" x="112" y="13">
                    3.2h
                  </text>

                  {/* Day 4: T5 (2.8h) */}
                  <rect
                    className="fill-[#ebe5ff] dark:fill-[#282136] hover:fill-[#7240b8] transition-colors cursor-pointer"
                    height="70"
                    rx="4"
                    width="22"
                    x="144"
                    y="30"
                  />
                  <text className="fill-[#635a72] dark:fill-[#b4a9c7]" fontSize="10" fontWeight="600" textAnchor="middle" x="155" y="116">
                    T5
                  </text>
                  <text className="fill-[#7240b8] dark:fill-[#a87ffb]" fontSize="9" fontWeight="600" textAnchor="middle" x="155" y="23">
                    2.8h
                  </text>

                  {/* Day 5: T6 (1.0h) */}
                  <rect
                    className="fill-[#ebe5ff] dark:fill-[#282136] hover:fill-[#7240b8] transition-colors cursor-pointer"
                    height="25"
                    rx="4"
                    width="22"
                    x="187"
                    y="75"
                  />
                  <text className="fill-[#635a72] dark:fill-[#b4a9c7]" fontSize="10" fontWeight="600" textAnchor="middle" x="198" y="116">
                    T6
                  </text>
                  <text className="fill-[#7240b8] dark:fill-[#a87ffb]" fontSize="9" fontWeight="600" textAnchor="middle" x="198" y="68">
                    1.0h
                  </text>

                  {/* Day 6: T7 (4.0h) Highest */}
                  <rect
                    className="fill-[#7240b8] cursor-pointer shadow-xs"
                    height="100"
                    rx="4"
                    width="22"
                    x="230"
                    y="0"
                  />
                  <text className="fill-[#7240b8] dark:fill-[#a87ffb]" fontSize="10" fontWeight="bold" textAnchor="middle" x="241" y="116">
                    T7
                  </text>
                  <text className="fill-[#7240b8] dark:fill-[#a87ffb]" fontSize="10" fontWeight="bold" textAnchor="middle" x="241" y="-5">
                    4.0h
                  </text>

                  {/* Day 7: CN (3.5h) */}
                  <rect
                    className="fill-[#ebe5ff] dark:fill-[#282136] hover:fill-[#7240b8] transition-colors cursor-pointer"
                    height="88"
                    rx="4"
                    width="22"
                    x="273"
                    y="12"
                  />
                  <text className="fill-[#635a72] dark:fill-[#b4a9c7]" fontSize="10" fontWeight="600" textAnchor="middle" x="284" y="116">
                    CN
                  </text>
                  <text className="fill-[#7240b8] dark:fill-[#a87ffb]" fontSize="9" fontWeight="600" textAnchor="middle" x="284" y="5">
                    3.5h
                  </text>
                </svg>
              </div>
            </div>

            {/* 5. Course Stats Summary & Urgent Reminder */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-[#1d1926] p-4 rounded-xl shadow-xs flex items-center gap-3 border border-[#f1ebff] dark:border-[#2f2742]">
                  <div className="w-10 h-10 rounded-lg bg-[#ebe5ff] dark:bg-[#282136] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
                    <span className="material-symbols-outlined text-[22px]">auto_stories</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-[#1c192c] dark:text-[#f4eeff] leading-tight">
                      {mockDashboardData.activeCoursesCount}
                    </span>
                    <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">Đang học</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1d1926] p-4 rounded-xl shadow-xs flex items-center gap-3 border border-[#f1ebff] dark:border-[#2f2742]">
                  <div className="w-10 h-10 rounded-lg bg-[#00855b]/15 dark:bg-[#005135]/40 flex items-center justify-center text-[#00855b] dark:text-[#4edea3]">
                    <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-[#1c192c] dark:text-[#f4eeff] leading-tight">
                      {mockDashboardData.completedCoursesCount}
                    </span>
                    <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">Đã hoàn thành</span>
                  </div>
                </div>
              </div>

              {/* Quick Reminder Card */}
              <div className="bg-[#e6dffa] dark:bg-[#231d30] rounded-xl p-4 shadow-xs flex flex-col gap-2 relative overflow-hidden border border-[#d7baff]/40 dark:border-[#382d50]">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-[#7240b8]/10 pointer-events-none" />
                <div className="flex items-center gap-1.5 text-[#7240b8] dark:text-[#a87ffb] text-xs font-bold">
                  <span className="material-symbols-outlined text-[18px]">notification_important</span>
                  <span>Nhắc nhở quan trọng</span>
                </div>
                <p className="text-xs text-[#1c192c] dark:text-[#f4eeff] font-medium leading-relaxed">
                  Bài kiểm tra cuối kỳ <strong className="text-[#7240b8] dark:text-[#a87ffb]">React &amp; Next.js</strong> sẽ mở trong 3 ngày nữa!
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">Hạn chót: 23:59 CN tuần này</span>
                  <Link
                    href={`/learn/${mockDashboardData.inProgressCourses[0]?.slug || 'react-nextjs-14'}`}
                    className="px-3 py-1 rounded-lg bg-[#7240b8] text-white text-xs font-semibold hover:bg-[#8b5ad3] transition-colors shadow-2xs"
                  >
                    Xem lịch
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
