'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/hooks/use-auth';
import { enrollmentService } from '@/services/enrollment.service';
import { progressService } from '@/services/progress.service';
import { certificateService } from '@/services/certificate.service';
import { CertificateCard } from '@/components/certificate/certificate-card';
import { CertificateEligibilityModal } from '@/components/certificate/certificate-eligibility-modal';
import { CertificateViewerModal } from '@/components/certificate/certificate-viewer-modal';
import { ApiCertificate } from '@/types/certificate';
import { ApiEnrollmentItem } from '@/types/enrollment';
import { ApiCourseProgressData } from '@/types/progress';
import { AppApiError } from '@/types/api';

function CertificatesContent() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');

  // Core Data States
  const [certificates, setCertificates] = useState<ApiCertificate[]>([]);
  const [enrollments, setEnrollments] = useState<ApiEnrollmentItem[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ApiCourseProgressData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tabs & Search
  const [filterTab, setFilterTab] = useState<'issued' | 'eligible' | 'in_progress'>('issued');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [activeEligibilityCourseId, setActiveEligibilityCourseId] = useState<string | null>(null);
  const [viewingCertificate, setViewingCertificate] = useState<ApiCertificate | null>(null);

  const studentDisplayName = user?.username || user?.email?.split('@')[0] || 'Học viên TMdemy';

  // Load official issued certificates and enrollments from backend
  const loadData = useCallback(async (signal?: AbortSignal) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Clean up any stale localStorage keys
      certificateService.clearStoredCertificates(user.id);

      // 1. Fetch official issued certificates from GET /api/certificates/my
      const certsPromise = certificateService.getMyCertificates({ signal }).catch((err: unknown) => {
        if (err instanceof AppApiError && err.statusCode === 404) {
          return { success: true, message: '', data: [] };
        }
        throw err;
      });

      // 2. Fetch student's enrollments to support graduation issuance flow
      const enrollsPromise = enrollmentService.getMyEnrollments({ signal }).catch(() => ({
        success: true,
        message: '',
        data: [],
      }));

      const [certsRes, enrollRes] = await Promise.all([certsPromise, enrollsPromise]);
      if (signal?.aborted) return;

      const myCerts = Array.isArray(certsRes?.data) ? certsRes.data : [];
      setCertificates(myCerts);

      const validEnrollments = (enrollRes?.data || []).filter(
        (e) => e && e.status !== 'CANCELED' && (e.course?.id || e.courseId)
      );
      setEnrollments(validEnrollments);

      // 3. Fetch detailed course progress for enrollments not yet certified
      const uncertifiedCourseIds = validEnrollments
        .map((e) => e.course?.id || e.courseId)
        .filter((cId): cId is string => Boolean(cId) && !myCerts.some((c) => c.courseId === cId));

      if (uncertifiedCourseIds.length > 0) {
        const progressResults = await Promise.allSettled(
          uncertifiedCourseIds.map(async (cId) => {
            const prog = await progressService.getCourseProgress(cId, { signal });
            return { courseId: cId, data: prog.data };
          })
        );

        if (!signal?.aborted) {
          const pMap: Record<string, ApiCourseProgressData> = {};
          progressResults.forEach((res) => {
            if (res.status === 'fulfilled' && res.value?.data) {
              pMap[res.value.courseId] = res.value.data;
            }
          });
          setProgressMap(pMap);
        }
      }

      // 4. Handle preselectedCourseId from URL query
      if (preselectedCourseId) {
        const existingCert = myCerts.find((c) => c.courseId === preselectedCourseId);
        if (existingCert) {
          setViewingCertificate(existingCert);
          setFilterTab('issued');
        } else if (
          validEnrollments.some((e) => (e.course?.id || e.courseId) === preselectedCourseId)
        ) {
          setActiveEligibilityCourseId(preselectedCourseId);
          setFilterTab('eligible');
        }
      }
    } catch (err: unknown) {
      if (signal?.aborted) return;
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg =
        err instanceof AppApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Không thể kết nối đến máy chủ quản lý chứng chỉ TMdemy.';
      setError(msg);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [user, preselectedCourseId]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !user?.id) {
      return;
    }

    let isCurrent = true;
    const controller = new AbortController();

    queueMicrotask(() => {
      if (isCurrent) {
        loadData(controller.signal);
      }
    });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [isAuthLoading, isAuthenticated, user, loadData]);

  // Handle successful certificate issuance callback
  const handleCertificateIssued = (newCert: ApiCertificate) => {
    setCertificates((prev) => {
      const exists = prev.some((c) => c.id === newCert.id || c.courseId === newCert.courseId);
      if (exists) {
        return prev.map((c) => (c.courseId === newCert.courseId ? newCert : c));
      }
      return [newCert, ...prev];
    });
    setViewingCertificate(newCert);
    setFilterTab('issued');
  };

  // Helper to compute eligibility for an enrollment
  const getEligibilityForEnrollment = useCallback(
    (enrollment: ApiEnrollmentItem) => {
      const cId = enrollment.course?.id || enrollment.courseId;
      const detailed = progressMap[cId];
      const isAlreadyIssued = certificates.some((c) => c.courseId === cId);

      const progressVal =
        detailed?.percent !== undefined
          ? Math.min(100, Math.max(0, detailed.percent))
          : Math.min(100, Math.max(0, enrollment.progress ?? 0));

      return certificateService.calculateEligibility({
        isEnrolled: true,
        progressPercent: progressVal,
        isAlreadyIssued,
        enrollmentStatus: enrollment.status,
      });
    },
    [certificates, progressMap]
  );

  // Statistics calculation
  const stats = useMemo(() => {
    const earnedCount = certificates.length;
    let eligibleCount = 0;
    let inProgressCount = 0;

    enrollments.forEach((e) => {
      const cId = e.course?.id || e.courseId;
      const hasCert = certificates.some((c) => c.courseId === cId);
      if (!hasCert) {
        const elig = getEligibilityForEnrollment(e);
        if (elig.isEligible) {
          eligibleCount++;
        } else {
          inProgressCount++;
        }
      }
    });

    return {
      earnedCount,
      eligibleCount,
      inProgressCount,
      totalEnrollments: enrollments.length,
    };
  }, [certificates, enrollments, getEligibilityForEnrollment]);

  // Filtered issued certificates from GET /api/certificates/my
  const filteredCertificates = useMemo(() => {
    if (!searchQuery.trim()) return certificates;
    const query = searchQuery.trim().toLowerCase();
    return certificates.filter((c) => {
      const title = (c.course?.title || '').toLowerCase();
      const code = (c.code || c.id || '').toLowerCase();
      return title.includes(query) || code.includes(query);
    });
  }, [certificates, searchQuery]);

  // Filtered eligible enrollments
  const eligibleEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      const cId = e.course?.id || e.courseId;
      const hasCert = certificates.some((c) => c.courseId === cId);
      if (hasCert) return false;
      const elig = getEligibilityForEnrollment(e);
      if (!elig.isEligible) return false;

      if (searchQuery.trim()) {
        const title = (e.course?.title || '').toLowerCase();
        return title.includes(searchQuery.trim().toLowerCase());
      }
      return true;
    });
  }, [enrollments, certificates, getEligibilityForEnrollment, searchQuery]);

  // Filtered in-progress enrollments
  const inProgressEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      const cId = e.course?.id || e.courseId;
      const hasCert = certificates.some((c) => c.courseId === cId);
      if (hasCert) return false;
      const elig = getEligibilityForEnrollment(e);
      if (elig.isEligible) return false;

      if (searchQuery.trim()) {
        const title = (e.course?.title || '').toLowerCase();
        return title.includes(searchQuery.trim().toLowerCase());
      }
      return true;
    });
  }, [enrollments, certificates, getEligibilityForEnrollment, searchQuery]);

  // Active enrollment for eligibility modal
  const activeEligibilityEnrollment = useMemo(() => {
    if (!activeEligibilityCourseId) return null;
    return (
      enrollments.find(
        (e) => (e.course?.id || e.courseId) === activeEligibilityCourseId
      ) || null
    );
  }, [activeEligibilityCourseId, enrollments]);

  const activeEligibilityData = useMemo(() => {
    if (!activeEligibilityEnrollment) return null;
    return getEligibilityForEnrollment(activeEligibilityEnrollment);
  }, [activeEligibilityEnrollment, getEligibilityForEnrollment]);

  return (
    <AppShell>
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 flex flex-col gap-8">
        {/* 1. TOP HEADER & NOTICE BANNER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">
                verified
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Chứng Chỉ Tốt Nghiệp
              </h1>
            </div>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
              Quản lý và tra cứu chứng chỉ tốt nghiệp chính thức được thẩm định và cấp bởi Viện Công nghệ TMdemy
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <Link
              href="/my-courses"
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-[#2f2742] text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#282136] transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[18px]">school</span>
              <span>Khóa học của tôi</span>
            </Link>
            <Link
              href="/courses"
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">add_task</span>
              <span>Khám phá khóa học</span>
            </Link>
          </div>
        </div>

        {/* Technical Notice Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-primary/5 to-transparent border border-purple-200 dark:border-purple-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-700 dark:text-zinc-300">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[22px] shrink-0">
              verified_user
            </span>
            <div className="space-y-0.5">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                Hệ thống Quản lý và Xác thực Chứng chỉ Số TMdemy (REST API Certified)
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Chứng chỉ được ký số tự động bởi máy chủ và có mã QR công khai xác minh tính toàn vẹn.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shrink-0 self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Đồng bộ thời gian thực từ PostgreSQL</span>
          </span>
        </div>

        {/* 2. STATS ACHIEVEMENT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Earned count */}
          <div
            onClick={() => setFilterTab('issued')}
            className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
              filterTab === 'issued'
                ? 'bg-purple-50/50 dark:bg-[#251e38] border-primary shadow-sm'
                : 'bg-white dark:bg-[#1a1528] border-zinc-200 dark:border-[#2f2742] hover:border-zinc-300'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">workspace_premium</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {isLoading ? '...' : stats.earnedCount}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Chứng chỉ đã được cấp
              </span>
            </div>
          </div>

          {/* 2. Eligible count */}
          <div
            onClick={() => setFilterTab('eligible')}
            className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
              filterTab === 'eligible'
                ? 'bg-purple-50/50 dark:bg-[#251e38] border-primary shadow-sm'
                : 'bg-white dark:bg-[#1a1528] border-zinc-200 dark:border-[#2f2742] hover:border-zinc-300'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-primary dark:text-[#a87ffb] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">verified</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {isLoading ? '...' : stats.eligibleCount}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Khóa học đủ điều kiện nhận bằng
              </span>
            </div>
          </div>

          {/* 3. In Progress */}
          <div
            onClick={() => setFilterTab('in_progress')}
            className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
              filterTab === 'in_progress'
                ? 'bg-purple-50/50 dark:bg-[#251e38] border-primary shadow-sm'
                : 'bg-white dark:bg-[#1a1528] border-zinc-200 dark:border-[#2f2742] hover:border-zinc-300'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">pending_actions</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {isLoading ? '...' : stats.inProgressCount}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Khóa học đang hoàn thiện
              </span>
            </div>
          </div>
        </div>

        {/* 3. TOOLBAR: TABS & SEARCH */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-[#2f2742] pb-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setFilterTab('issued')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'issued'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white dark:bg-[#1a1528] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#251e38] border border-zinc-200 dark:border-[#2f2742]'
              }`}
            >
              <span>Chứng chỉ của tôi</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                {stats.earnedCount}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('eligible')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'eligible'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white dark:bg-[#1a1528] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#251e38] border border-zinc-200 dark:border-[#2f2742]'
              }`}
            >
              <span>Đủ điều kiện cấp</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                {stats.eligibleCount}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('in_progress')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'in_progress'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white dark:bg-[#1a1528] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#251e38] border border-zinc-200 dark:border-[#2f2742]'
              }`}
            >
              <span>Đang học</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300">
                {stats.inProgressCount}
              </span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[260px] md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder={
                filterTab === 'issued'
                  ? 'Tìm kiếm theo tên khóa học hoặc mã chứng chỉ...'
                  : 'Tìm kiếm theo tên khóa học...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-[#1a1528] border border-zinc-200 dark:border-[#2f2742] text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-[14px]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 4. MAIN CONTENT AREA */}
        {!isAuthenticated && !isAuthLoading ? (
          /* Unauthenticated State */
          <div className="p-10 rounded-2xl bg-white dark:bg-[#1a1528] border border-zinc-200 dark:border-[#2f2742] text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">lock</span>
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                Yêu Cầu Đăng Nhập
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Vui lòng đăng nhập vào tài khoản học viên TMdemy để xem danh sách chứng chỉ và gửi yêu cầu cấp bằng.
              </p>
            </div>
            <Link
              href="/login?redirect=/certificates"
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-md"
            >
              Đăng nhập ngay
            </Link>
          </div>
        ) : isLoading ? (
          /* Loading Skeleton Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-zinc-200 dark:border-[#2f2742] bg-white dark:bg-[#1a1528] overflow-hidden flex flex-col justify-between animate-pulse"
              >
                <div className="aspect-[16/10] bg-zinc-200 dark:bg-zinc-800" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
                  <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-8 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-center flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-rose-500 text-[36px]">error</span>
            <div>
              <h3 className="text-base font-bold text-rose-800 dark:text-rose-200">
                Không thể tải dữ liệu chứng chỉ
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-300 mt-1">{error}</p>
            </div>
            <button
              onClick={() => loadData()}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
            >
              Thử lại ngay
            </button>
          </div>
        ) : filterTab === 'issued' ? (
          /* TAB 1: ISSUED CERTIFICATES (Source: GET /api/certificates/my) */
          filteredCertificates.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white dark:bg-[#1a1528] border border-dashed border-zinc-300 dark:border-zinc-700 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px]">workspace_premium</span>
              </div>
              <div className="max-w-md">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  {searchQuery
                    ? `Không tìm thấy chứng chỉ khớp với "${searchQuery}"`
                    : 'Bạn chưa có chứng chỉ nào'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {searchQuery
                    ? 'Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc mã chứng chỉ.'
                    : 'Hãy hoàn thành các khóa học đã ghi danh để nhận chứng chỉ tốt nghiệp chính thức từ TMdemy.'}
                </p>
              </div>
              {stats.eligibleCount > 0 ? (
                <button
                  onClick={() => setFilterTab('eligible')}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">stars</span>
                  <span>Xem {stats.eligibleCount} khóa học đủ điều kiện nhận bằng</span>
                </button>
              ) : (
                <Link
                  href="/my-courses"
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">school</span>
                  <span>Xem khóa học của tôi</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCertificates.map((cert) => (
                <CertificateCard
                  key={cert.id}
                  certificate={cert}
                  studentName={studentDisplayName}
                  onViewCertificate={(c) => setViewingCertificate(c)}
                />
              ))}
            </div>
          )
        ) : filterTab === 'eligible' ? (
          /* TAB 2: ELIGIBLE ENROLLMENTS (Pending request to POST /api/certificates) */
          eligibleEnrollments.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-[#1a1528] border border-zinc-200 dark:border-[#2f2742] text-center flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">search_off</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Chưa có khóa học nào mới đạt điều kiện cấp chứng chỉ
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Yêu cầu đạt tối thiểu 70% bài giảng và 60% bài kiểm tra để yêu cầu cấp chứng chỉ.
                </p>
              </div>
              <button
                onClick={() => setFilterTab('in_progress')}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-[#2f2742] text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#282136] transition-colors"
              >
                Xem các khóa học đang học
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eligibleEnrollments.map((enrollment) => {
                const cId = enrollment.course?.id || enrollment.courseId;
                const eligibility = getEligibilityForEnrollment(enrollment);

                return (
                  <CertificateCard
                    key={cId}
                    enrollment={enrollment}
                    eligibility={eligibility}
                    studentName={studentDisplayName}
                    onViewCertificate={(c) => setViewingCertificate(c)}
                    onCheckEligibility={(courseId) => setActiveEligibilityCourseId(courseId)}
                  />
                );
              })}
            </div>
          )
        ) : (
          /* TAB 3: IN PROGRESS ENROLLMENTS */
          inProgressEnrollments.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-[#1a1528] border border-zinc-200 dark:border-[#2f2742] text-center flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">school</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Không có khóa học nào đang ở trạng thái này
                </h3>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgressEnrollments.map((enrollment) => {
                const cId = enrollment.course?.id || enrollment.courseId;
                const eligibility = getEligibilityForEnrollment(enrollment);

                return (
                  <CertificateCard
                    key={cId}
                    enrollment={enrollment}
                    eligibility={eligibility}
                    studentName={studentDisplayName}
                    onViewCertificate={(c) => setViewingCertificate(c)}
                    onCheckEligibility={(courseId) => setActiveEligibilityCourseId(courseId)}
                  />
                );
              })}
            </div>
          )
        )}
      </div>

      {/* 5. MODALS */}
      {/* Eligibility Modal */}
      {activeEligibilityEnrollment && activeEligibilityData && (
        <CertificateEligibilityModal
          isOpen={!!activeEligibilityCourseId}
          onClose={() => setActiveEligibilityCourseId(null)}
          courseId={activeEligibilityEnrollment.course?.id || activeEligibilityEnrollment.courseId}
          courseTitle={activeEligibilityEnrollment.course?.title || 'Khóa học TMdemy'}
          courseSlug={activeEligibilityEnrollment.course?.slug}
          userId={user?.id}
          eligibility={activeEligibilityData}
          onCertificateIssued={handleCertificateIssued}
        />
      )}

      {/* Certificate Viewer Modal */}
      <CertificateViewerModal
        isOpen={!!viewingCertificate}
        onClose={() => setViewingCertificate(null)}
        certificate={viewingCertificate}
        courseTitle={viewingCertificate?.course?.title}
        studentName={studentDisplayName}
      />
    </AppShell>
  );
}

export default function CertificatesPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6">
            <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-64 mb-6 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-64 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse"
                />
              ))}
            </div>
          </div>
        </AppShell>
      }
    >
      <CertificatesContent />
    </Suspense>
  );
}
