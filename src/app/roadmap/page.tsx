'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { mockRoadmapData } from '@/data/mock-roadmap';

export default function LearningRoadmapPage() {
  const roadmap = mockRoadmapData;

  return (
    <AppShell>
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 flex flex-col gap-8">
        {/* 1. HEADER & ACTION BUTTONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#7240b8] text-[28px]">
                conversion_path
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1c192c] tracking-tight">
                Lộ Trình Học Tập (Roadmap)
              </h1>
            </div>
            <p className="text-xs md:text-sm text-[#635a72]">
              {roadmap.title} • Được cá nhân hóa theo định hướng nghề nghiệp của bạn
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => alert('F4 UI: Demo tùy biến lộ trình học tập')}
              className="px-4 py-2.5 rounded-xl border border-[#e6dffa] text-xs font-semibold text-[#4b4452] hover:bg-[#f7f1ff] transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>Tùy biến mục tiêu</span>
            </button>
            <Link
              href="/courses"
              className="px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">explore</span>
              <span>Khám phá các lộ trình khác</span>
            </Link>
          </div>
        </div>

        {/* 2. STATS OVERVIEW CARDS (5 metrics) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Progress */}
          <div className="p-4 rounded-xl bg-white border border-[#f1ebff] shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#635a72] font-medium">Tổng tiến độ</span>
              <span className="p-1.5 rounded-lg bg-[#ebe5ff] text-[#7240b8]">
                <span className="material-symbols-outlined text-[18px]">donut_large</span>
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#7240b8]">
                {roadmap.overviewStats.totalProgressPercent}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#ebe5ff] overflow-hidden mt-0.5">
              <div
                className="h-full rounded-full bg-[#7240b8]"
                style={{ width: `${roadmap.overviewStats.totalProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Completed Courses */}
          <div className="p-4 rounded-xl bg-white border border-[#f1ebff] shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#635a72] font-medium">Đã hoàn thành</span>
              <span className="p-1.5 rounded-lg bg-[#00855b]/15 text-[#00855b]">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#1c192c]">
                {roadmap.overviewStats.completedCourses}
              </span>
              <span className="text-xs text-[#635a72]">khóa</span>
            </div>
            <span className="text-[11px] text-[#00855b] font-semibold">Đạt chuẩn năng lực</span>
          </div>

          {/* In Progress */}
          <div className="p-4 rounded-xl bg-white border border-[#f1ebff] shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#635a72] font-medium">Đang theo học</span>
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <span className="material-symbols-outlined text-[18px]">pending</span>
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#1c192c]">
                {roadmap.overviewStats.inProgressCourses}
              </span>
              <span className="text-xs text-[#635a72]">khóa</span>
            </div>
            <span className="text-[11px] text-amber-700 font-semibold">Đang tiếp diễn tuần 42</span>
          </div>

          {/* Learning Hours */}
          <div className="p-4 rounded-xl bg-white border border-[#f1ebff] shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#635a72] font-medium">Thời gian học</span>
              <span className="p-1.5 rounded-lg bg-[#ebe5ff] text-[#7240b8]">
                <span className="material-symbols-outlined text-[18px]">timelapse</span>
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#1c192c]">
                {roadmap.overviewStats.learningHours}
              </span>
              <span className="text-xs text-[#635a72]">giờ</span>
            </div>
            <span className="text-[11px] text-[#7240b8] font-semibold">Tích lũy kinh nghiệm</span>
          </div>

          {/* Streak Days */}
          <div className="p-4 rounded-xl bg-white border border-[#f1ebff] shadow-xs flex flex-col gap-2 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#635a72] font-medium">Chuỗi chuyên cần</span>
              <span className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                <span className="material-symbols-outlined text-[18px]">local_fire_department</span>
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-rose-600">
                {roadmap.overviewStats.streakDays}
              </span>
              <span className="text-xs text-[#635a72]">ngày liên tiếp</span>
            </div>
            <span className="text-[11px] text-rose-600 font-semibold">Duy trì phong độ tuyệt vời!</span>
          </div>
        </div>

        {/* 3. CURRENT ACTIVE TRACK BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7240b8] via-[#8b5ad3] to-[#5b27a1] p-6 md:p-8 text-white shadow-md">
          <div className="absolute -right-8 -bottom-8 w-60 h-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white">
                  Lộ trình trọng tâm
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-400/20 text-[#6ffbbe] text-xs font-bold">
                  Bước {roadmap.currentStep}/{roadmap.totalSteps} • Thời lượng: {roadmap.estimatedDuration}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-white">
                {roadmap.trackName}
              </h2>
              <p className="text-xs md:text-sm text-white/90 leading-relaxed">
                Chuỗi kỹ năng hoàn chỉnh từ Frontend React &amp; Next.js 14, TypeScript Clean Architecture, Backend Node.js REST API đến CI/CD Cloud và Capstone Project quy mô lớn.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <Link
                href="/learn/react-nextjs-14"
                className="px-5 py-3 rounded-xl bg-white text-[#7240b8] font-bold text-xs md:text-sm hover:bg-[#f7f1ff] transition-all flex items-center gap-2 shadow-sm"
              >
                <span>Học tiếp Giai đoạn 3</span>
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4. VERTICAL ROADMAP TIMELINE (6 STAGES) */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#7240b8] text-[24px]">
                timeline
              </span>
              <h2 className="text-lg md:text-xl font-bold text-[#1c192c]">
                Hành trình 6 Giai đoạn Chuyên sâu
              </h2>
            </div>
            <span className="text-xs text-[#635a72]">
              Nhấp vào giai đoạn để xem chi tiết các khóa học
            </span>
          </div>

          <div className="relative pl-6 md:pl-10 space-y-8 before:absolute before:left-3 md:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#e6dffa]">
            {roadmap.stages.map((stage) => {
              const isCompleted = stage.status === 'completed';
              const isActive = stage.status === 'active';
              const isLocked = stage.status === 'locked';

              return (
                <div key={stage.id} className="relative group">
                  {/* Timeline Node Badge Icon */}
                  <div
                    className={`absolute -left-6 md:-left-10 top-3.5 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-transform transform group-hover:scale-110 shadow-xs ${
                      isCompleted
                        ? 'bg-[#00855b] text-white ring-4 ring-[#00855b]/20'
                        : isActive
                        ? 'bg-[#7240b8] text-white ring-4 ring-[#7240b8]/20 animate-pulse'
                        : 'bg-[#ebe5ff] text-[#7c7483] ring-2 ring-white'
                    }`}
                  >
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    ) : isLocked ? (
                      <span className="material-symbols-outlined text-[16px]">lock</span>
                    ) : (
                      <span>{stage.stepNumber}</span>
                    )}
                  </div>

                  {/* Stage Card Box */}
                  <div
                    className={`rounded-2xl p-5 md:p-6 transition-all border ${
                      isActive
                        ? 'bg-white border-[#7240b8] shadow-md ring-1 ring-[#7240b8]/30'
                        : isCompleted
                        ? 'bg-white border-[#f1ebff] shadow-xs'
                        : 'bg-[#faf7fc] border-[#f1ebff] opacity-80'
                    }`}
                  >
                    {/* Stage Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f7f1ff]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isCompleted
                                ? 'bg-[#00855b]/15 text-[#00855b]'
                                : isActive
                                ? 'bg-[#eddcff] text-[#5b27a1]'
                                : 'bg-[#e7dbf7] text-[#675f76]'
                            }`}
                          >
                            Giai đoạn {stage.stepNumber} • {isCompleted ? 'Đã hoàn thành' : isActive ? 'Đang thực hiện' : 'Chưa mở khóa'}
                          </span>
                          <span className="text-xs text-[#635a72]">
                            ({stage.completedCourses}/{stage.totalCourses} khóa học)
                          </span>
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-[#1c192c]">
                          {stage.title}
                        </h3>
                        <p className="text-xs text-[#635a72] max-w-3xl leading-relaxed">
                          {stage.subtitle}
                        </p>
                      </div>

                      {/* Progress bar indicator */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                        <span className="text-xs font-bold text-[#7240b8]">
                          {stage.progressPercent}% hoàn thành
                        </span>
                        <div className="w-28 h-2 rounded-full bg-[#ebe5ff] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isCompleted ? 'bg-[#00855b]' : 'bg-[#7240b8]'
                            }`}
                            style={{ width: `${stage.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stage Courses List */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4">
                      {stage.courses.map((course) => {
                        const isCourseCompleted = course.status === 'completed';
                        const isCourseInProgress = course.status === 'in-progress';
                        const isCourseAvailable = course.status === 'available';
                        const isCourseLocked = course.status === 'locked';

                        return (
                          <div
                            key={course.id}
                            className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                              isCourseInProgress
                                ? 'bg-[#f7f1ff] border-[#7240b8]/40 shadow-xs'
                                : isCourseCompleted
                                ? 'bg-white border-[#f1ebff] hover:border-[#e6dffa]'
                                : 'bg-white/60 border-[#f1ebff]'
                            }`}
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ebe5ff] text-[#4b4452]">
                                  {course.level}
                                </span>
                                {isCourseCompleted ? (
                                  <span className="flex items-center gap-1 text-[11px] text-[#00855b] font-bold">
                                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                    <span>Xong</span>
                                  </span>
                                ) : isCourseInProgress ? (
                                  <span className="flex items-center gap-1 text-[11px] text-[#7240b8] font-bold">
                                    <span className="material-symbols-outlined text-[16px]">timelapse</span>
                                    <span>{course.progressPercent}%</span>
                                  </span>
                                ) : isCourseLocked ? (
                                  <span className="material-symbols-outlined text-[#7c7483] text-[16px]">
                                    lock
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-[#7240b8] font-semibold">
                                    Sẵn sàng
                                  </span>
                                )}
                              </div>

                              <h4 className="text-xs font-bold text-[#1c192c] line-clamp-2 leading-snug">
                                {course.title}
                              </h4>

                              <div className="flex items-center gap-2 text-[11px] text-[#635a72]">
                                <span>{course.duration}</span>
                                <span>•</span>
                                <span>{course.lessonCount} bài giảng</span>
                              </div>
                            </div>

                            {/* Action CTA */}
                            <div className="pt-2 border-t border-[#f7f1ff]">
                              {isCourseInProgress ? (
                                <Link
                                  href={`/learn/${course.slug}`}
                                  className="w-full py-1.5 px-3 rounded-lg bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                                  <span>Học tiếp</span>
                                </Link>
                              ) : isCourseCompleted ? (
                                <Link
                                  href={`/courses/${course.slug}`}
                                  className="w-full py-1.5 px-3 rounded-lg bg-[#ebe5ff] hover:bg-[#e6dffa] text-[#7240b8] text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                                >
                                  <span>Ôn tập lại</span>
                                </Link>
                              ) : isCourseAvailable ? (
                                <Link
                                  href={`/courses/${course.slug}`}
                                  className="w-full py-1.5 px-3 rounded-lg bg-[#f7f1ff] hover:bg-[#7240b8] hover:text-white text-[#7240b8] text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                                >
                                  <span>Bắt đầu học</span>
                                </Link>
                              ) : (
                                <span className="w-full py-1.5 px-3 rounded-lg bg-[#f7f1ff] text-[#7c7483] text-xs font-medium flex items-center justify-center gap-1 cursor-not-allowed">
                                  <span className="material-symbols-outlined text-[14px]">lock</span>
                                  <span>Khóa giai đoạn</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. RECOMMENDED NEXT COURSES SECTION */}
        <div className="flex flex-col gap-4 pt-4 border-t border-[#f1ebff]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#7240b8] text-[22px]">
                recommend
              </span>
              <h3 className="text-base font-bold text-[#1c192c]">
                Khóa học đề xuất tiếp nối lộ trình
              </h3>
            </div>
            <Link
              href="/courses"
              className="text-xs font-semibold text-[#7240b8] hover:underline"
            >
              Xem tất cả danh mục
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roadmap.recommendedCourses.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl bg-white border border-[#f1ebff] shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={rec.thumbnail}
                    alt={rec.title}
                    className="w-20 h-14 rounded-lg object-cover"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-[#7240b8] uppercase">
                      {rec.category}
                    </span>
                    <h4 className="text-xs font-bold text-[#1c192c] line-clamp-1">
                      {rec.title}
                    </h4>
                    <span className="text-[11px] text-[#635a72]">
                      Giảng viên: {rec.instructor} • ★ {rec.rating} ({rec.studentCount} học viên)
                    </span>
                  </div>
                </div>

                <Link
                  href={`/courses/${rec.slug}`}
                  className="px-4 py-2 rounded-xl bg-[#ebe5ff] hover:bg-[#7240b8] hover:text-white text-[#7240b8] text-xs font-bold transition-colors shrink-0"
                >
                  Xem chi tiết
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
