'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  User as UserIcon,
  Mail,
  Phone,
  FileText,
  Calendar,
  Share2,
  Edit3,
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Camera,
  Heart,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { RouteGuard } from '@/components/auth/route-guard';
import { useAuth } from '@/hooks/use-auth';
import { userService } from '@/services/user.service';
import { enrollmentService } from '@/services/enrollment.service';
import { UserProfile } from '@/types/auth';
import { ApiEnrollmentItem } from '@/types/enrollment';
import { EditProfileModal } from '@/components/profile/edit-profile-modal';
import { AccountSecurityCard } from '@/components/profile/account-security-card';
import { toast } from '@/lib/toast';

function formatRole(role?: string): string {
  if (!role) return 'Học viên';
  const r = role.toLowerCase();
  if (r === 'admin') return 'Quản trị viên';
  if (r === 'teacher') return 'Giảng viên';
  return 'Học viên';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Chưa cập nhật';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Chưa cập nhật';
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'Chưa cập nhật';
  }
}

function getInitials(name?: string): string {
  if (!name) return 'TM';
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(authUser);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(!authUser);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [enrollments, setEnrollments] = useState<ApiEnrollmentItem[]>([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState<boolean>(true);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);

  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Load Profile and Enrollments on mount
  useEffect(() => {
    let isCancelled = false;

    async function loadInitialData() {
      try {
        const [profileResult, enrollmentsResult] = await Promise.allSettled([
          userService.getMe(),
          enrollmentService.getMyEnrollments(),
        ]);

        if (isCancelled) return;

        if (profileResult.status === 'fulfilled') {
          setProfile(profileResult.value);
          setProfileError(null);
        } else {
          const err = profileResult.reason;
          const msg =
            err instanceof Error ? err.message : 'Không thể tải thông tin hồ sơ.';
          setProfileError(msg);
          if (authUser) {
            setProfile(authUser);
          }
        }
        setIsLoadingProfile(false);

        if (enrollmentsResult.status === 'fulfilled') {
          setEnrollments(
            Array.isArray(enrollmentsResult.value.data) ? enrollmentsResult.value.data : []
          );
          setEnrollmentError(null);
        } else {
          const err = enrollmentsResult.reason;
          const msg =
            err instanceof Error ? err.message : 'Không thể tải thông tin học tập.';
          setEnrollmentError(msg);
          setEnrollments([]);
        }
        setIsLoadingEnrollments(false);
      } catch {
        if (!isCancelled) {
          setIsLoadingProfile(false);
          setIsLoadingEnrollments(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      isCancelled = true;
    };
  }, [authUser]);

  // Retry Profile handler
  const handleRetryProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    setProfileError(null);
    try {
      const data = await userService.getMe();
      setProfile(data);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Không thể tải thông tin hồ sơ. Vui lòng thử lại.';
      setProfileError(errorMsg);
      if (authUser) {
        setProfile(authUser);
      }
    } finally {
      setIsLoadingProfile(false);
    }
  }, [authUser]);

  // Retry Enrollments handler
  const handleRetryEnrollments = useCallback(async () => {
    setIsLoadingEnrollments(true);
    setEnrollmentError(null);
    try {
      const res = await enrollmentService.getMyEnrollments();
      setEnrollments(Array.isArray(res.data) ? res.data : []);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Không thể tải thông tin học tập.';
      setEnrollmentError(errorMsg);
      setEnrollments([]);
    } finally {
      setIsLoadingEnrollments(false);
    }
  }, []);

  // Learning Stats Calculations
  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter(
    (e) => e.status === 'COMPLETED' || (e.progress ?? 0) >= 100
  ).length;
  const inProgressCourses = enrollments.filter(
    (e) => e.status === 'ACTIVE' && (e.progress ?? 0) < 100
  ).length;
  const averageProgress =
    totalCourses > 0
      ? Math.round(
          enrollments.reduce((sum, item) => sum + (item.progress ?? 0), 0) / totalCourses
        )
      : 0;

  const handleCopyProfileLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://tmdemy.edu.vn/profile';
    void navigator.clipboard?.writeText(url);
    toast.success('Đã sao chép liên kết trang hồ sơ cá nhân!');
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleProfileUpdated = async (updated: UserProfile) => {
    setProfile(updated);
    setAvatarError(false);
    await refreshUser();
  };

  return (
    <RouteGuard requireAuth>
      <AppShell>
        <div className="max-w-[1360px] mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-8">
          {/* Breadcrumb & Top Context */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#635a72] dark:text-[#a9a0b2] text-[11px] font-semibold">
                <Link href="/" className="hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors">
                  Trang chủ
                </Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-[#7240b8] dark:text-[#a87ffb]">Hồ sơ cá nhân</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
                Hồ sơ cá nhân
              </h1>
              <p className="text-xs md:text-sm text-[#635a72] dark:text-[#a9a0b2]">
                Xem thông tin tài khoản, liên hệ và tiến độ học tập của bạn tại TMdemy
              </p>
            </div>

            {/* Quick Status Badges */}
            {profile && (
              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ebe5ff] dark:bg-[#2b2438] text-[#4b4452] dark:text-[#cdc3d4] text-[11px] font-semibold">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      profile.status?.toUpperCase() === 'ACTIVE'
                        ? 'bg-[#006947] dark:bg-[#6ffbbe]'
                        : 'bg-[#ba1a1a] dark:bg-[#ffb4ab]'
                    }`}
                  />
                  {profile.status?.toUpperCase() === 'ACTIVE'
                    ? 'Tài khoản hoạt động'
                    : `Trạng thái: ${profile.status || 'N/A'}`}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold ${
                    profile.isVerified
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}
                >
                  {profile.isVerified ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Email đã xác thực
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Email chưa xác thực
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Error State with Retry Button */}
          {profileError && !profile && (
            <div className="rounded-2xl p-6 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    Không thể tải thông tin hồ sơ
                  </h3>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{profileError}</p>
                </div>
              </div>
              <button
                onClick={() => void handleRetryProfile()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Thử lại
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoadingProfile && !profile ? (
            <div className="flex flex-col gap-8 animate-pulse">
              <div className="h-64 rounded-2xl bg-[#f1ebff] dark:bg-[#221d2d]" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-[#f1ebff] dark:bg-[#221d2d]" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 h-96 rounded-2xl bg-[#f1ebff] dark:bg-[#221d2d]" />
                <div className="lg:col-span-5 h-96 rounded-2xl bg-[#f1ebff] dark:bg-[#221d2d]" />
              </div>
            </div>
          ) : profile ? (
            <>
              {/* SECTION 1: PROFILE HEADER CARD */}
              <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1a1722] shadow-sm border border-[#f1ebff] dark:border-[#2b2438]">
                {/* Decorative Banner */}
                <div className="relative h-40 md:h-48 w-full bg-gradient-to-r from-[#eddcff] via-[#e7dbf7] to-[#ebe5ff] dark:from-[#2a2139] dark:via-[#211a2e] dark:to-[#17141f] overflow-hidden">
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#7240b8_1px,transparent_1px)] [background-size:16px_16px]" />
                  <div className="absolute -right-12 -top-16 w-80 h-80 rounded-full bg-[#8b5ad3]/20 dark:bg-[#8b5ad3]/10 blur-3xl pointer-events-none" />
                  <div className="absolute left-1/3 bottom-0 w-64 h-32 rounded-full bg-[#6ffbbe]/25 dark:bg-[#6ffbbe]/10 blur-2xl pointer-events-none" />
                </div>

                {/* Content Area with Avatar */}
                <div className="px-6 md:px-8 pb-6">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 md:-mt-20">
                    {/* Avatar + Main Info */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
                      {/* Avatar Frame */}
                      <div className="relative group shrink-0">
                        <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden shadow-xl p-1 bg-white dark:bg-[#1a1722] ring-1 ring-[#f1ebff] dark:ring-[#2b2438]">
                          {profile.avatar && !avatarError ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              className="w-full h-full object-cover rounded-xl"
                              alt={profile.username}
                              src={profile.avatar}
                              onError={() => setAvatarError(true)}
                            />
                          ) : (
                            <div className="w-full h-full rounded-xl bg-[#7240b8] dark:bg-[#8b5ad3] text-white flex items-center justify-center text-3xl md:text-4xl font-bold">
                              {getInitials(profile.username)}
                            </div>
                          )}
                        </div>
                        {/* Quick camera edit trigger on hover */}
                        <button
                          type="button"
                          onClick={() => setIsEditModalOpen(true)}
                          aria-label="Thay đổi ảnh đại diện"
                          className="absolute inset-0 bg-[#312e42]/50 backdrop-blur-2xs rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-200 text-white text-xs font-semibold gap-1 cursor-pointer"
                        >
                          <Camera className="w-5 h-5" />
                          <span className="text-[10px]">Đổi ảnh</span>
                        </button>
                        {/* Status beacon */}
                        <span
                          className={`absolute bottom-2 right-2 w-4 h-4 rounded-full ring-4 ring-white dark:ring-[#1a1722] shadow-sm ${
                            profile.status?.toUpperCase() === 'ACTIVE'
                              ? 'bg-[#006947] dark:bg-[#6ffbbe]'
                              : 'bg-rose-500'
                          }`}
                          title={profile.status || 'Active'}
                        />
                      </div>

                      {/* Identity Text & Badges */}
                      <div className="flex flex-col gap-1.5 pt-2">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h2 className="text-xl md:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
                            {profile.username}
                          </h2>
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#eddcff] dark:bg-[#342747] text-[#5b27a1] dark:text-[#c4a4f8] text-[11px] font-bold">
                            <span className="material-symbols-outlined text-[16px] text-[#7240b8] dark:text-[#a87ffb]">
                              workspace_premium
                            </span>
                            {formatRole(profile.role)}
                          </span>
                        </div>

                        <p className="text-xs md:text-sm text-[#4b4452] dark:text-[#cdc3d4] flex items-center justify-center sm:justify-start gap-1.5">
                          <Mail className="w-4 h-4 text-[#7c7483] dark:text-[#968e9e]" />
                          <span>{profile.email}</span>
                        </p>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1 text-[#4b4452] dark:text-[#cdc3d4] text-[11px] font-semibold">
                          <span className="flex items-center gap-1.5 bg-[#f7f1ff] dark:bg-[#252030] px-2.5 py-1 rounded-md">
                            <Calendar className="w-3.5 h-3.5 text-[#635a72] dark:text-[#a9a0b2]" />
                            Tham gia từ: {formatDate(profile.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CTAs */}
                    <div className="flex items-center justify-center gap-2.5 pt-4 md:pt-0 flex-wrap">
                      <Link
                        href="/favorites"
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 h-10 rounded-xl bg-rose-50 dark:bg-[#2b1820] hover:bg-rose-100 dark:hover:bg-[#381c29] text-[#ba1a1a] dark:text-[#ffb4ab] text-xs font-semibold transition-colors cursor-pointer border border-rose-100 dark:border-rose-900/40"
                      >
                        <Heart className="w-4 h-4 fill-[#ba1a1a]/20" />
                        Khóa học yêu thích
                      </Link>

                      <button
                        onClick={handleCopyProfileLink}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] hover:bg-[#ebe5ff] dark:hover:bg-[#2d273a] text-[#1c192c] dark:text-[#f4eeff] text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Share2 className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                        Chia sẻ hồ sơ
                      </button>

                      <button
                        onClick={handleEditClick}
                        className="inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-semibold transition-colors shadow-md shadow-[#7240b8]/20 cursor-pointer"
                        title="Chỉnh sửa thông tin hồ sơ và ảnh đại diện"
                      >
                        <Edit3 className="w-4 h-4" />
                        Chỉnh sửa hồ sơ
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: LEARNING OVERVIEW KPI ROW */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Tổng khóa học */}
                <div className="flex flex-col p-4 rounded-2xl bg-white dark:bg-[#1a1722] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xs">
                  <div className="flex items-center justify-between text-[#635a72] dark:text-[#a9a0b2] mb-2">
                    <span className="text-[11px] font-semibold">Tổng khóa học</span>
                    <div className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#252030] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      {isLoadingEnrollments ? '...' : totalCourses}
                    </span>
                    <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">khóa</span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                    Đã đăng ký học
                  </div>
                </div>

                {/* 2. Đang học */}
                <div className="flex flex-col p-4 rounded-2xl bg-white dark:bg-[#1a1722] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xs">
                  <div className="flex items-center justify-between text-[#635a72] dark:text-[#a9a0b2] mb-2">
                    <span className="text-[11px] font-semibold">Đang học</span>
                    <div className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#252030] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      {isLoadingEnrollments ? '...' : inProgressCourses}
                    </span>
                    <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">khóa</span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#7240b8] dark:text-[#a87ffb] font-medium">
                    Đang tiếp tục
                  </div>
                </div>

                {/* 3. Đã hoàn thành */}
                <div className="flex flex-col p-4 rounded-2xl bg-white dark:bg-[#1a1722] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xs">
                  <div className="flex items-center justify-between text-[#635a72] dark:text-[#a9a0b2] mb-2">
                    <span className="text-[11px] font-semibold">Đã hoàn thành</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      {isLoadingEnrollments ? '...' : completedCourses}
                    </span>
                    <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">khóa</span>
                  </div>
                  <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Hoàn tất 100%
                  </div>
                </div>

                {/* 4. Tiến độ trung bình */}
                <div className="flex flex-col p-4 rounded-2xl bg-white dark:bg-[#1a1722] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xs">
                  <div className="flex items-center justify-between text-[#635a72] dark:text-[#a9a0b2] mb-2">
                    <span className="text-[11px] font-semibold">Tiến độ trung bình</span>
                    <div className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#252030] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      {isLoadingEnrollments ? '...' : `${averageProgress}%`}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                    Trên tổng số khóa học
                  </div>
                </div>
              </div>

              {/* SECTION 3: TWO-COLUMN MAIN CONTENT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Personal Information (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#1a1722] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xs flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#eddcff] dark:bg-[#342747] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
                          Thông tin cá nhân
                        </h3>
                      </div>
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Chỉnh sửa
                      </button>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Tên tài khoản */}
                      <div className="p-4 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                          Tên tài khoản (Username)
                        </span>
                        <span className="text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                          {profile.username}
                        </span>
                      </div>

                      {/* Vai trò */}
                      <div className="p-4 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                          Vai trò hệ thống
                        </span>
                        <span className="text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                          {formatRole(profile.role)}
                        </span>
                      </div>

                      {/* Email */}
                      <div className="p-4 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          Địa chỉ Email
                        </span>
                        <span className="text-sm font-medium text-[#1c192c] dark:text-[#f4eeff] truncate">
                          {profile.email}
                        </span>
                      </div>

                      {/* Số điện thoại */}
                      <div className="p-4 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Số điện thoại
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            profile.phone
                              ? 'text-[#1c192c] dark:text-[#f4eeff]'
                              : 'text-[#968e9e] italic'
                          }`}
                        >
                          {profile.phone || 'Chưa cập nhật'}
                        </span>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="p-4 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Giới thiệu bản thân
                      </span>
                      <p
                        className={`text-sm leading-relaxed ${
                          profile.bio
                            ? 'text-[#1c192c] dark:text-[#f4eeff]'
                            : 'text-[#968e9e] italic'
                        }`}
                      >
                        {profile.bio || 'Chưa có thông tin giới thiệu bản thân.'}
                      </p>
                    </div>

                    {/* Social Links */}
                    <div className="flex flex-col gap-2.5">
                      <span className="text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                        Kênh liên kết mạng xã hội
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* GitHub */}
                        <div className="p-3 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-[18px] text-[#1c192c] dark:text-[#f4eeff]">
                              terminal
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                                GitHub
                              </span>
                              <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] truncate">
                                {profile.socialLinks?.github ? 'Đã liên kết' : 'Chưa liên kết'}
                              </span>
                            </div>
                          </div>
                          {profile.socialLinks?.github && (
                            <a
                              href={profile.socialLinks.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#7240b8] dark:text-[#a87ffb] hover:opacity-80 transition-opacity"
                              title="Mở liên kết GitHub"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {/* Facebook */}
                        <div className="p-3 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-[18px] text-[#1877f2]">
                              share
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                                Facebook
                              </span>
                              <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] truncate">
                                {profile.socialLinks?.facebook ? 'Đã liên kết' : 'Chưa liên kết'}
                              </span>
                            </div>
                          </div>
                          {profile.socialLinks?.facebook && (
                            <a
                              href={profile.socialLinks.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#7240b8] dark:text-[#a87ffb] hover:opacity-80 transition-opacity"
                              title="Mở liên kết Facebook"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {/* Instagram */}
                        <div className="p-3 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-[18px] text-[#e4405f]">
                              photo_camera
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                                Instagram
                              </span>
                              <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] truncate">
                                {profile.socialLinks?.instagram ? 'Đã liên kết' : 'Chưa liên kết'}
                              </span>
                            </div>
                          </div>
                          {profile.socialLinks?.instagram && (
                            <a
                              href={profile.socialLinks.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#7240b8] dark:text-[#a87ffb] hover:opacity-80 transition-opacity"
                              title="Mở liên kết Instagram"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION: Account Security & Password */}
                  <AccountSecurityCard />
                </div>

                {/* RIGHT COLUMN: Learning Activity & Recent Courses (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#1a1722] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xs flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#e7dbf7] dark:bg-[#2e263d] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
                          Khóa học đã đăng ký
                        </h3>
                      </div>
                      <Link
                        href="/my-courses"
                        className="text-xs text-[#7240b8] dark:text-[#a87ffb] hover:underline font-semibold flex items-center gap-1"
                      >
                        Xem tất cả
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Enrollment Error with Retry */}
                    {enrollmentError && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300">
                        <span>{enrollmentError}</span>
                        <button
                          onClick={() => void handleRetryEnrollments()}
                          className="font-bold underline cursor-pointer"
                        >
                          Thử lại
                        </button>
                      </div>
                    )}

                    {/* Loading Enrollments */}
                    {isLoadingEnrollments ? (
                      <div className="flex flex-col gap-3 animate-pulse">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 rounded-xl bg-[#f7f1ff] dark:bg-[#252030]" />
                        ))}
                      </div>
                    ) : enrollments.length === 0 ? (
                      /* Empty State */
                      <div className="p-8 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] text-center flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-[#1a1722] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shadow-xs">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <h4 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                            Chưa có khóa học nào
                          </h4>
                          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] max-w-xs">
                            Bạn chưa đăng ký khóa học nào. Hãy khám phá thư viện khóa học để bắt đầu hành trình nâng cao kỹ năng!
                          </p>
                        </div>
                        <Link
                          href="/courses"
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-semibold transition-colors"
                        >
                          Khám phá khóa học
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ) : (
                      /* Enrolled Courses List (Top 4) */
                      <div className="flex flex-col gap-3">
                        {enrollments.slice(0, 4).map((item) => {
                          const progress = item.progress ?? 0;
                          const isComplete =
                            item.status === 'COMPLETED' || progress >= 100;

                          return (
                            <div
                              key={item.id || item._id || item.courseId}
                              className="p-3.5 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] flex flex-col gap-2 hover:bg-[#ebe5ff] dark:hover:bg-[#2e263d] transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] line-clamp-1">
                                    {item.course?.title || 'Khóa học'}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span
                                      className={`inline-block px-1.5 py-0.5 rounded-sm text-[10px] font-semibold ${
                                        isComplete
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                          : 'bg-purple-100 text-[#7240b8] dark:bg-purple-950/50 dark:text-[#c4a4f8]'
                                      }`}
                                    >
                                      {isComplete ? 'Đã hoàn thành' : 'Đang học'}
                                    </span>
                                    <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                                      {progress}%
                                    </span>
                                  </div>
                                </div>

                                <Link
                                  href={
                                    item.course?.slug
                                      ? `/courses/${item.course.slug}`
                                      : '/my-courses'
                                  }
                                  className="text-xs text-[#7240b8] dark:text-[#a87ffb] hover:underline font-semibold shrink-0"
                                >
                                  {isComplete ? 'Xem lại' : 'Học tiếp'}
                                </Link>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full h-1.5 rounded-full bg-[#e6dffa] dark:bg-[#352e43] overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isComplete
                                      ? 'bg-emerald-500'
                                      : 'bg-[#7240b8] dark:bg-[#a87ffb]'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}

                        <Link
                          href="/my-courses"
                          className="w-full py-2.5 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] hover:bg-[#ebe5ff] dark:hover:bg-[#2d273a] text-[#1c192c] dark:text-[#f4eeff] text-xs font-semibold text-center transition-colors"
                        >
                          Xem tất cả {enrollments.length} khóa học
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* SECTION: Khóa học yêu thích Shortcut Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50/50 to-[#fdf9ff] dark:from-[#251821] dark:to-[#1a1722] border border-rose-100/70 dark:border-rose-950/50 shadow-2xs flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-[#ba1a1a] dark:text-[#ffb4ab] flex items-center justify-center shrink-0">
                        <Heart className="w-5 h-5 fill-[#ba1a1a]/20" />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                          Khóa học yêu thích
                        </h4>
                        <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                          Xem lại và theo dõi các khóa học bạn đã đánh dấu
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/favorites"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#282136] text-[#ba1a1a] dark:text-[#ffb4ab] border border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors shrink-0 shadow-2xs"
                    >
                      <span>Khám phá</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Chỉnh Sửa Hồ Sơ */}
        {profile && (
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            profile={profile}
            onSuccess={handleProfileUpdated}
          />
        )}
      </AppShell>
    </RouteGuard>
  );
}
