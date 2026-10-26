'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { ratingService } from '@/services/rating.service';
import { ApiRatingItem } from '@/types/rating';
import { AppApiError } from '@/types/api';
import { toast } from '@/lib/toast';

interface CourseRatingSectionProps {
  courseId: string;
  courseSlug?: string;
  isEnrolled: boolean;
  initialRatings?: {
    averageRating: number;
    totalRatings: number;
    ratings: ApiRatingItem[];
  } | null;
  onRatingSubmitted?: () => void;
  className?: string;
}

const STAR_LABELS: Record<number, string> = {
  1: '1 sao — Rất không hài lòng',
  2: '2 sao — Chưa hài lòng',
  3: '3 sao — Bình thường',
  4: '4 sao — Hài lòng',
  5: '5 sao — Rất tuyệt vời!',
};

export function CourseRatingSection({
  courseId,
  courseSlug,
  isEnrolled,
  initialRatings,
  onRatingSubmitted,
  className = '',
}: CourseRatingSectionProps) {
  const { user, isAuthenticated } = useAuth();

  // Ratings Data State (internal state overrides initialRatings once refreshed)
  const [internalRatings, setInternalRatings] = useState<{
    averageRating: number;
    totalRatings: number;
    ratings: ApiRatingItem[];
  } | null>(null);
  const [isLoadingRatings, setIsLoadingRatings] = useState<boolean>(!initialRatings && Boolean(courseId));

  const ratingsData = internalRatings ?? initialRatings ?? null;

  // Form State
  const [selectedRate, setSelectedRate] = useState<number>(5);
  const [hoveredRate, setHoveredRate] = useState<number | null>(null);
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter & Pagination State
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');
  const [displayCount, setDisplayCount] = useState<number>(5);

  // Fetch / Refresh ratings from backend
  const fetchRatings = async () => {
    if (!courseId) return;
    try {
      setIsLoadingRatings(true);
      const res = await ratingService.getCourseRatings(courseId);
      if (res.success && res.data) {
        setInternalRatings(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch course ratings:', err);
    } finally {
      setIsLoadingRatings(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;
    if (!initialRatings && courseId) {
      ratingService
        .getCourseRatings(courseId)
        .then((res) => {
          if (isCurrent && res.success && res.data) {
            setInternalRatings(res.data);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isCurrent) setIsLoadingRatings(false);
        });
    }
    return () => {
      isCurrent = false;
    };
  }, [courseId, initialRatings]);

  // Current user's submitted review if already exists
  const myReview = useMemo(() => {
    if (!user || !ratingsData?.ratings) return null;
    const currentUserId = user.id || user._id;
    if (!currentUserId) return null;
    return ratingsData.ratings.find(
      (r) => r.user?.id === currentUserId || r.user?._id === currentUserId
    ) || null;
  }, [user, ratingsData]);

  // Overall Statistics
  const ratingValue =
    ratingsData?.averageRating && ratingsData.averageRating > 0
      ? ratingsData.averageRating
      : 5.0;
  const ratingCount = ratingsData?.totalRatings || 0;

  // Rating breakdown percentages
  const ratingBreakdown = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (!ratingsData?.ratings || ratingsData.ratings.length === 0) {
      return [
        { star: 5, percentage: 100, count: 0 },
        { star: 4, percentage: 0, count: 0 },
        { star: 3, percentage: 0, count: 0 },
        { star: 2, percentage: 0, count: 0 },
        { star: 1, percentage: 0, count: 0 },
      ];
    }
    ratingsData.ratings.forEach((r) => {
      const s = Math.round(r.rate);
      if (counts[s] !== undefined) counts[s]++;
    });
    const total = ratingsData.ratings.length;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: counts[star] || 0,
      percentage: total > 0 ? Math.round(((counts[star] || 0) / total) * 100) : 0,
    }));
  }, [ratingsData]);

  // Filtered Reviews list
  const filteredReviews = useMemo(() => {
    if (!ratingsData?.ratings) return [];
    if (starFilter === 'all') return ratingsData.ratings;
    return ratingsData.ratings.filter((r) => Math.round(r.rate) === starFilter);
  }, [ratingsData, starFilter]);

  const visibleReviews = useMemo(() => {
    return filteredReviews.slice(0, displayCount);
  }, [filteredReviews, displayCount]);

  // Handle Review Submission
  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để gửi đánh giá.');
      return;
    }
    if (!isEnrolled) {
      toast.error('Bạn cần ghi danh vào khóa học này để có thể gửi đánh giá.');
      return;
    }
    if (myReview) {
      toast.info('Bạn đã gửi đánh giá cho khóa học này rồi.');
      return;
    }

    const trimmed = content.trim();
    if (trimmed.length < 5) {
      setFormError('Nội dung nhận xét phải có tối thiểu 5 ký tự.');
      return;
    }
    if (trimmed.length > 500) {
      setFormError('Nội dung nhận xét tối đa 500 ký tự.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await ratingService.createRating({
        courseId,
        rate: selectedRate,
        content: trimmed,
      });

      if (res.success) {
        toast.success('Đánh giá của bạn đã được ghi nhận thành công!');
        setContent('');
        // Re-fetch ratings to ensure clean synchronization from backend
        await fetchRatings();
        if (onRatingSubmitted) {
          onRatingSubmitted();
        }
      } else {
        toast.error(res.message || 'Không thể gửi đánh giá.');
      }
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        if (err.statusCode === 400 && err.message.toLowerCase().includes('already rated')) {
          setFormError('Bạn đã đánh giá khóa học này trước đó rồi.');
          toast.warning('Bạn đã đánh giá khóa học này trước đó rồi.');
        } else if (err.statusCode === 403) {
          setFormError('Bạn chưa ghi danh vào khóa học này.');
          toast.error('Bạn chưa ghi danh vào khóa học này.');
        } else {
          setFormError(err.message);
          toast.error(err.message);
        }
      } else {
        const errorMsg = 'Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại sau.';
        setFormError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className={`p-6 md:p-8 rounded-2xl bg-white dark:bg-[#1d1926] shadow-xs border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-6 ${className}`}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-6 rounded-full bg-[#7240b8] dark:bg-[#a87ffb]" />
          <h2 className="text-lg md:text-xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Đánh giá từ học viên
          </h2>
        </div>
        <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
          {ratingCount} nhận xét
        </span>
      </div>

      {/* Breakdown Rating Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-5 rounded-xl bg-[#f7f1ff] dark:bg-[#16131e] border border-[#f1ebff] dark:border-[#282136]">
        {/* Score & Stars */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
          <span className="text-4xl md:text-5xl font-extrabold text-[#7240b8] dark:text-[#a87ffb] leading-none">
            {ratingValue.toFixed(1)}
          </span>
          <div className="flex text-amber-500 my-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className="material-symbols-outlined text-[18px]"
                style={{
                  fontVariationSettings: i <= Math.round(ratingValue) ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                star
              </span>
            ))}
          </div>
          <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
            Dựa trên {ratingCount.toLocaleString()} đánh giá học viên
          </span>
        </div>

        {/* Progress Bars Breakdown */}
        <div className="md:col-span-8 flex flex-col gap-2">
          {ratingBreakdown.map((item) => (
            <button
              key={item.star}
              onClick={() =>
                setStarFilter(starFilter === item.star ? 'all' : item.star)
              }
              className={`flex items-center gap-3 p-1 rounded-lg transition-colors cursor-pointer group text-left ${
                starFilter === item.star
                  ? 'bg-purple-100/60 dark:bg-purple-950/40'
                  : 'hover:bg-purple-50 dark:hover:bg-[#201a2b]'
              }`}
            >
              <span className="text-xs font-semibold w-12 text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-0.5">
                {item.star}{' '}
                <span className="material-symbols-outlined text-[13px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
              </span>
              <div className="flex-1 h-2 rounded-full bg-[#ebe5ff] dark:bg-[#282136] overflow-hidden">
                <div
                  className="h-full bg-[#7240b8] dark:bg-[#a87ffb] rounded-full transition-all duration-300"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="text-xs text-[#635a72] dark:text-[#b4a9c7] w-12 text-right font-medium">
                {item.count} ({item.percentage}%)
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ==================== STUDENT RATING INTERACTION ==================== */}
      <div className="pt-2">
        {/* State A: User already submitted a review */}
        {myReview ? (
          <div className="p-5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-[#e6dffa] dark:border-[#382d50] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#00855b]">
                  verified
                </span>
                <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Đánh giá của bạn cho khóa học này
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                  Đã ghi nhận
                </span>
              </div>
              <span className="text-[11px] text-[#7c7483] dark:text-[#b4a9c7]">
                {new Date(myReview.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>

            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className="material-symbols-outlined text-[16px]"
                  style={{
                    fontVariationSettings: i <= myReview.rate ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  star
                </span>
              ))}
              <span className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] ml-1.5">
                {myReview.rate} / 5 sao
              </span>
            </div>

            <p className="text-xs md:text-sm text-[#383141] dark:text-[#ded8e8] leading-relaxed italic bg-white/70 dark:bg-[#1d1926]/70 p-3 rounded-lg border border-purple-100 dark:border-purple-900/40">
              &ldquo;{myReview.content}&rdquo;
            </p>

            <p className="text-[11px] text-[#7c7483] dark:text-[#b4a9c7]">
              Mỗi học viên được gửi 1 đánh giá chính thức cho khóa học. Đánh giá của bạn đã được lưu an toàn trên hệ thống TMDEMY.
            </p>
          </div>
        ) : !isAuthenticated ? (
          /* State B: User not logged in */
          <div className="p-5 rounded-xl bg-[#f7f1ff] dark:bg-[#16131e] border border-[#f1ebff] dark:border-[#282136] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ebe5ff] dark:bg-[#282136] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb] shrink-0">
                <span className="material-symbols-outlined text-[20px]">rate_review</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Bạn đã tham gia khóa học này?
                </h3>
                <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                  Đăng nhập để chia sẻ trải nghiệm và gửi đánh giá cho giảng viên.
                </p>
              </div>
            </div>
            <Link
              href={`/login${courseSlug ? `?redirect=/courses/${courseSlug}` : ''}`}
              className="px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer text-center"
            >
              Đăng nhập để đánh giá
            </Link>
          </div>
        ) : !isEnrolled ? (
          /* State C: User logged in but not enrolled */
          <div className="p-5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[22px] shrink-0">
              info
            </span>
            <div className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
              <span className="font-bold text-[#1c192c] dark:text-[#f4eeff] block">
                Chỉ học viên đã ghi danh mới có thể đánh giá
              </span>
              Hãy đăng ký khóa học để trải nghiệm toàn bộ bài giảng và đóng góp ý kiến đánh giá chất lượng.
            </div>
          </div>
        ) : (
          /* State D: Enrolled user can write review */
          <form
            onSubmit={handleSubmitRating}
            className="p-5 rounded-xl bg-[#f7f1ff] dark:bg-[#16131e] border border-[#e6dffa] dark:border-[#382d50] flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#7240b8] dark:text-[#a87ffb]">
                  rate_review
                </span>
                <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Viết nhận xét &amp; đánh giá của bạn
                </h3>
              </div>
              <span className="text-[11px] text-[#7c7483] dark:text-[#b4a9c7]">
                Học viên chính thức
              </span>
            </div>

            {/* Interactive Star Picker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#282136]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mr-2">
                  Đánh giá:
                </span>
                {[1, 2, 3, 4, 5].map((star) => {
                  const activeStar = hoveredRate !== null ? hoveredRate : selectedRate;
                  const isFilled = star <= activeStar;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRate(star)}
                      onMouseEnter={() => setHoveredRate(star)}
                      onMouseLeave={() => setHoveredRate(null)}
                      className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                      aria-label={`Chọn ${star} sao`}
                    >
                      <span
                        className="material-symbols-outlined text-[24px]"
                        style={{
                          fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0",
                        }}
                      >
                        star
                      </span>
                    </button>
                  );
                })}
              </div>

              <span className="text-xs font-bold text-[#7240b8] dark:text-[#a87ffb]">
                {STAR_LABELS[hoveredRate !== null ? hoveredRate : selectedRate]}
              </span>
            </div>

            {/* Content Textarea */}
            <div className="flex flex-col gap-1.5">
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (formError) setFormError(null);
                }}
                disabled={isSubmitting}
                placeholder="Chia sẻ cảm nhận chi tiết về nội dung bài giảng, chất lượng video và sự hỗ trợ của giảng viên (tối thiểu 5 ký tự)..."
                rows={3}
                className="w-full p-3.5 rounded-xl border border-[#e6dffa] dark:border-[#382d50] bg-white dark:bg-[#1d1926] text-xs md:text-sm text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#968e9e] focus:outline-none focus:ring-2 focus:ring-[#7240b8] transition-all disabled:opacity-60"
              />

              <div className="flex items-center justify-between text-[11px]">
                <span
                  className={
                    content.trim().length > 0 && content.trim().length < 5
                      ? 'text-red-500 font-semibold'
                      : 'text-[#635a72] dark:text-[#b4a9c7]'
                  }
                >
                  {content.trim().length}/500 ký tự (Tối thiểu 5 ký tự)
                </span>
                {formError && (
                  <span className="text-red-500 font-medium">{formError}</span>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || content.trim().length < 5 || content.trim().length > 500}
                className="px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang gửi đánh giá...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>Gửi đánh giá</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ==================== REVIEWS FILTER CHIPS ==================== */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f1ebff] dark:border-[#282136]">
        <span className="text-xs font-semibold text-[#635a72] dark:text-[#b4a9c7] mr-1">
          Lọc đánh giá:
        </span>
        <button
          onClick={() => {
            setStarFilter('all');
            setDisplayCount(5);
          }}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            starFilter === 'all'
              ? 'bg-[#7240b8] text-white'
              : 'bg-[#f7f1ff] dark:bg-[#282136] text-[#635a72] dark:text-[#b4a9c7] hover:bg-[#ebe5ff]'
          }`}
        >
          Tất cả ({ratingsData?.ratings?.length || 0})
        </button>
        {[5, 4, 3, 2, 1].map((s) => {
          const count =
            ratingsData?.ratings?.filter((r) => Math.round(r.rate) === s).length || 0;
          return (
            <button
              key={s}
              onClick={() => {
                setStarFilter(s);
                setDisplayCount(5);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                starFilter === s
                  ? 'bg-[#7240b8] text-white'
                  : 'bg-[#f7f1ff] dark:bg-[#282136] text-[#635a72] dark:text-[#b4a9c7] hover:bg-[#ebe5ff]'
              }`}
            >
              <span>{s} sao</span>
              <span className="text-[10px] opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ==================== REVIEWS LIST ==================== */}
      {isLoadingRatings ? (
        <div className="py-12 text-center flex flex-col items-center justify-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-[#7240b8] border-t-transparent animate-spin" />
          <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
            Đang tải danh sách đánh giá...
          </span>
        </div>
      ) : visibleReviews.length > 0 ? (
        <div className="flex flex-col gap-4">
          {visibleReviews.map((rev, idx) => (
            <div
              key={rev.id || rev._id || idx}
              className="p-4 md:p-5 rounded-xl bg-[#f7f1ff] dark:bg-[#16131e] flex flex-col gap-2.5 border border-[#f1ebff] dark:border-[#282136] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      rev.user?.avatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
                    }
                    alt={rev.user?.username || 'Học viên'}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-[#e6dffa] dark:ring-[#382d50]"
                  />
                  <div>
                    <span className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] block">
                      {rev.user?.username || 'Học viên TMDEMY'}
                    </span>
                    <span className="text-[11px] text-[#00855b] dark:text-[#4edea3] font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      Đã ghi danh
                    </span>
                  </div>
                </div>
                <span className="text-xs text-[#7c7483] dark:text-[#b4a9c7]">
                  {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <div className="flex text-amber-500 my-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined text-[14px]"
                    style={{
                      fontVariationSettings: i <= rev.rate ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    star
                  </span>
                ))}
              </div>

              <p className="text-xs md:text-sm text-[#1c192c] dark:text-[#f4eeff] leading-relaxed">
                {rev.content}
              </p>
            </div>
          ))}

          {/* Load More Button */}
          {filteredReviews.length > visibleReviews.length && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setDisplayCount((prev) => prev + 5)}
                className="px-4 py-2 rounded-xl bg-[#ebe5ff] dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#7240b8] hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Xem thêm đánh giá ({filteredReviews.length - visibleReviews.length} còn lại)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-[#f7f1ff] dark:bg-[#16131e] border border-[#f1ebff] dark:border-[#282136] text-center text-xs text-[#635a72] dark:text-[#b4a9c7] flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[32px] text-[#968e9e]">
            rate_review
          </span>
          <p>
            {starFilter !== 'all'
              ? `Không tìm thấy đánh giá nào có mức xếp hạng ${starFilter} sao.`
              : 'Khóa học chưa có đánh giá nào từ học viên. Hãy là người đầu tiên tham gia và để lại nhận xét!'}
          </p>
          {starFilter !== 'all' && (
            <button
              onClick={() => setStarFilter('all')}
              className="text-xs text-[#7240b8] dark:text-[#a87ffb] font-bold underline cursor-pointer mt-1"
            >
              Xem tất cả đánh giá
            </button>
          )}
        </div>
      )}
    </section>
  );
}
