'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  Percent,
  DollarSign,
  Globe,
  BookOpen,
  Search,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { AdminCouponItem, UpdateAdminCouponDto } from '@/types/admin-coupon';
import {
  adminCouponService,
  normalizeCouponApiError,
} from '@/services/admin-coupon.service';
import { adminCourseService } from '@/services/admin-course.service';
import { AdminCourseItem } from '@/types/admin-course';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface EditCouponModalProps {
  coupon: AdminCouponItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCoupon: AdminCouponItem) => void;
}

function EditCouponModalContent({
  coupon,
  onClose,
  onSuccess,
}: Omit<EditCouponModalProps, 'isOpen'> & { coupon: AdminCouponItem }) {
  // Extract initial courses
  const initialCourseIds = (() => {
    if (coupon.courses && Array.isArray(coupon.courses)) {
      return coupon.courses
        .map((c) => (typeof c === 'string' ? c : c.id || c._id || ''))
        .filter(Boolean);
    }
    if (coupon.courseIds && Array.isArray(coupon.courseIds)) {
      return coupon.courseIds;
    }
    return [];
  })();

  const cleanType = (coupon.type || '').toLowerCase() === 'number' ? 'number' : 'percentage';
  const hasLim = typeof coupon.limit === 'number' && coupon.limit > 0;

  // Form fields initialized directly from coupon prop
  const [title, setTitle] = useState(coupon.title || '');
  const [code, setCode] = useState(coupon.code || '');
  const [type, setType] = useState<'percentage' | 'number'>(cleanType);
  const [value, setValue] = useState<number | ''>(typeof coupon.value === 'number' ? coupon.value : 20);
  const [isUnlimitedLimit, setIsUnlimitedLimit] = useState(!hasLim);
  const [limit, setLimit] = useState<number | ''>(hasLim ? coupon.limit! : '');
  const [startDate, setStartDate] = useState(coupon.startDate ? coupon.startDate.split('T')[0] : '');
  const [endDate, setEndDate] = useState(coupon.endDate ? coupon.endDate.split('T')[0] : '');
  const [active, setActive] = useState(coupon.active ?? true);

  // Scope & Course Selection
  const [scope, setScope] = useState<'global' | 'specific'>(initialCourseIds.length > 0 ? 'specific' : 'global');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(initialCourseIds);
  const [availableCourses, setAvailableCourses] = useState<AdminCourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available courses for picker
  useEffect(() => {
    let isMounted = true;
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const res = await adminCourseService.getCourses({
          limit: 100,
          status: 'approved',
        });
        if (isMounted && res.data?.courses) {
          setAvailableCourses(res.data.courses);
        }
      } catch {
        // Silently handle course list load failure
      } finally {
        if (isMounted) setLoadingCourses(false);
      }
    };

    void loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submitting, onClose]);

  const couponId = coupon.id || coupon._id;
  const usedCount = coupon.used || 0;

  // Toggle course selection
  const handleToggleCourse = (id: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filter courses by search
  const filteredCourses = availableCourses.filter((c) => {
    const titleMatch = (c.title || '').toLowerCase().includes(courseSearch.toLowerCase());
    const authorMatch = (c.author?.username || '').toLowerCase().includes(courseSearch.toLowerCase());
    return titleMatch || authorMatch;
  });

  // Check if form was changed
  const isFormChanged = () => {
    const origType = (coupon.type || '').toLowerCase() === 'number' ? 'number' : 'percentage';
    const origStartDate = coupon.startDate ? coupon.startDate.split('T')[0] : '';
    const origEndDate = coupon.endDate ? coupon.endDate.split('T')[0] : '';
    const origLimit = typeof coupon.limit === 'number' && coupon.limit > 0 ? coupon.limit : null;
    const currentLimit = isUnlimitedLimit ? null : Number(limit);

    if (title.trim() !== coupon.title) return true;
    if (code.trim().toUpperCase() !== coupon.code) return true;
    if (type !== origType) return true;
    if (Number(value) !== coupon.value) return true;
    if (active !== coupon.active) return true;
    if (startDate !== origStartDate) return true;
    if (endDate !== origEndDate) return true;
    if (currentLimit !== origLimit) return true;

    // Check courses
    const origCourseIds = (coupon.courses || [])
      .map((c) => (typeof c === 'string' ? c : c.id || c._id || ''))
      .filter(Boolean);
    const newCourseIds = scope === 'global' ? [] : selectedCourseIds;
    if (origCourseIds.length !== newCourseIds.length) return true;
    if (origCourseIds.some((id) => !newCourseIds.includes(id))) return true;

    return false;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponId) return;
    setError(null);

    // Validation
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Vui lòng nhập tiêu đề khuyến mãi.');
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Vui lòng nhập mã giảm giá.');
      return;
    }

    if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
      setError('Mã giảm giá chỉ được chứa chữ in hoa, chữ số, dấu gạch dưới hoặc gạch nối.');
      return;
    }

    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      setError('Vui lòng nhập giá trị giảm giá hợp lệ.');
      return;
    }

    if (type === 'percentage' && numValue > 100) {
      setError('Tỷ lệ giảm giá phần trăm không được vượt quá 100%.');
      return;
    }

    if (type === 'number' && numValue < 1000) {
      setError('Số tiền giảm giá cố định tối thiểu là 1,000 VNĐ.');
      return;
    }

    if (!isUnlimitedLimit) {
      const numLimit = Number(limit);
      if (isNaN(numLimit) || numLimit < 1) {
        setError('Vui lòng nhập giới hạn số lượt sử dụng tối thiểu là 1.');
        return;
      }
      if (numLimit < usedCount) {
        setError(
          `Giới hạn lượt dùng (${numLimit}) không được nhỏ hơn số lượt đã sử dụng (${usedCount}).`
        );
        return;
      }
    }

    if (startDate && endDate) {
      const s = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      if (end < s) {
        setError('Ngày kết thúc phải diễn ra sau ngày bắt đầu.');
        return;
      }
    }

    if (scope === 'specific' && selectedCourseIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 khóa học áp dụng khi chọn phạm vi Khóa học chỉ định.');
      return;
    }

    if (!isFormChanged()) {
      toast.info('Không có thay đổi nào được thực hiện.');
      onClose();
      return;
    }

    const payload: UpdateAdminCouponDto = {
      title: cleanTitle,
      code: cleanCode,
      type,
      value: numValue,
      limit: isUnlimitedLimit ? undefined : Number(limit),
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(`${endDate}T23:59:59.000Z`).toISOString() : undefined,
      active,
      courses: scope === 'global' ? [] : selectedCourseIds,
    };

    setSubmitting(true);

    try {
      const res = await adminCouponService.updateCoupon(couponId, payload);
      toast.success(res?.message || `Đã cập nhật mã giảm giá "${cleanCode}" thành công!`);
      if (res.data) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err: unknown) {
      const msg = normalizeCouponApiError(err, 'Không thể cập nhật mã giảm giá. Vui lòng thử lại.');
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-coupon-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7240b8] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="edit-coupon-title"
                className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Chỉnh sửa mã giảm giá: <span className="font-mono text-[#7240b8] dark:text-[#a87ffb]">{coupon.code}</span>
              </h3>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Cập nhật thông tin chiết khấu, hạn mức và phạm vi áp dụng
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-[#635a72] hover:text-[#1c192c] dark:text-[#a9a0b2] dark:hover:text-[#f4eeff] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Caution if Used */}
          {usedCount > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Lưu ý:</strong> Mã này đã có <strong>{usedCount} lượt sử dụng</strong> trong các đơn hàng trước đó. Hãy cẩn trọng khi sửa mức giảm giá hoặc thời hạn áp dụng.
              </span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7240b8] dark:text-[#a87ffb]">
              1. Thông tin cơ bản
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                  Mã giảm giá (Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  placeholder="VÍ DỤ: SUMMER2026"
                  disabled={submitting}
                  className="w-full h-10 px-3 font-mono font-bold text-xs sm:text-sm rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30 uppercase"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                  Tiêu đề chiến dịch <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Khuyến mãi chào hè 2026"
                  disabled={submitting}
                  className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Discount Configuration */}
          <div className="space-y-3 pt-3 border-t border-[#f1ebff] dark:border-[#2b2438]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7240b8] dark:text-[#a87ffb]">
              2. Mức chiết khấu & Loại giảm giá
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Discount Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                  Loại chiết khấu <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setType('percentage');
                      if (typeof value === 'number' && value > 100) setValue(20);
                    }}
                    className={cn(
                      'h-10 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                      type === 'percentage'
                        ? 'bg-[#f7f1ff] dark:bg-[#2b2438] border-[#7240b8] text-[#7240b8] dark:text-[#a87ffb]'
                        : 'border-[#f1ebff] dark:border-[#2b2438] text-[#635a72] dark:text-[#a9a0b2] hover:bg-black/5 dark:hover:bg-white/5'
                    )}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>Phần trăm (%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setType('number');
                      if (typeof value === 'number' && value <= 100) setValue(50000);
                    }}
                    className={cn(
                      'h-10 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                      type === 'number'
                        ? 'bg-[#f7f1ff] dark:bg-[#2b2438] border-[#7240b8] text-[#7240b8] dark:text-[#a87ffb]'
                        : 'border-[#f1ebff] dark:border-[#2b2438] text-[#635a72] dark:text-[#a9a0b2] hover:bg-black/5 dark:hover:bg-white/5'
                    )}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Số tiền (VNĐ)</span>
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                  Mức giảm ({type === 'percentage' ? '%' : 'VNĐ'}) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={type === 'percentage' ? 1 : 1000}
                    max={type === 'percentage' ? 100 : undefined}
                    step={type === 'percentage' ? 1 : 1000}
                    value={value}
                    onChange={(e) => setValue(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={submitting}
                    className="w-full h-10 px-3 pr-10 text-xs sm:text-sm font-bold rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                    {type === 'percentage' ? '%' : 'đ'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Scope Selection */}
          <div className="space-y-3 pt-3 border-t border-[#f1ebff] dark:border-[#2b2438]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7240b8] dark:text-[#a87ffb]">
              3. Phạm vi áp dụng khóa học
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={cn(
                  'p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all',
                  scope === 'global'
                    ? 'bg-[#f7f1ff] dark:bg-[#2b2438] border-[#7240b8] text-[#7240b8] dark:text-[#a87ffb]'
                    : 'border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                <input
                  type="radio"
                  name="edit-scope"
                  value="global"
                  checked={scope === 'global'}
                  onChange={() => setScope('global')}
                  className="mt-0.5 text-[#7240b8] focus:ring-[#7240b8]"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Toàn sàn (Tất cả khóa học)</span>
                  </div>
                  <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                    Áp dụng cho mọi khóa học hiện tại và tương lai
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  'p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all',
                  scope === 'specific'
                    ? 'bg-[#f7f1ff] dark:bg-[#2b2438] border-[#7240b8] text-[#7240b8] dark:text-[#a87ffb]'
                    : 'border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                <input
                  type="radio"
                  name="edit-scope"
                  value="specific"
                  checked={scope === 'specific'}
                  onChange={() => setScope('specific')}
                  className="mt-0.5 text-[#7240b8] focus:ring-[#7240b8]"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Khóa học chỉ định</span>
                  </div>
                  <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                    Chỉ áp dụng cho các khóa học được chọn dưới đây
                  </p>
                </div>
              </label>
            </div>

            {/* Course Picker List if Scope is Specific */}
            {scope === 'specific' && (
              <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                    Đã chọn: <strong>{selectedCourseIds.length}</strong> khóa học
                  </span>
                  {selectedCourseIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCourseIds([])}
                      className="text-xs text-rose-500 hover:underline cursor-pointer"
                    >
                      Bỏ chọn tất cả
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#635a72] dark:text-[#a9a0b2] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    placeholder="Tìm khóa học theo tên hoặc giảng viên..."
                    className="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {loadingCourses ? (
                    <div className="py-6 text-center text-xs text-[#635a72] dark:text-[#a9a0b2]">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                      Đang tải danh sách khóa học...
                    </div>
                  ) : filteredCourses.length === 0 ? (
                    <div className="py-4 text-center text-xs text-[#635a72] dark:text-[#a9a0b2]">
                      Không tìm thấy khóa học nào phù hợp
                    </div>
                  ) : (
                    filteredCourses.map((c) => {
                      const id = c.id || c._id || '';
                      const isChecked = selectedCourseIds.includes(id);

                      return (
                        <label
                          key={id}
                          className={cn(
                            'p-2 rounded-lg flex items-center justify-between gap-2 text-xs cursor-pointer transition-colors',
                            isChecked
                              ? 'bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb]'
                              : 'hover:bg-white dark:hover:bg-[#1d1926] text-[#1c192c] dark:text-[#f4eeff]'
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCourse(id)}
                              className="rounded-sm text-[#7240b8] focus:ring-[#7240b8]"
                            />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{c.title}</p>
                              <p className="text-[10px] text-[#635a72] dark:text-[#a9a0b2] truncate">
                                GV: {c.author?.username || 'TMdemy'}
                              </p>
                            </div>
                          </div>

                          <span className="font-bold shrink-0">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(c.price || 0)}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Limit & Validity */}
          <div className="space-y-3 pt-3 border-t border-[#f1ebff] dark:border-[#2b2438]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7240b8] dark:text-[#a87ffb]">
              4. Giới hạn lượt dùng & Thời hạn áp dụng
            </h4>

            {/* Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                    Tổng lượt dùng tối đa (Đã dùng: {usedCount})
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-[#635a72] dark:text-[#a9a0b2] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isUnlimitedLimit}
                      onChange={(e) => setIsUnlimitedLimit(e.target.checked)}
                      className="rounded-sm text-[#7240b8] focus:ring-[#7240b8]"
                    />
                    <span>Không giới hạn</span>
                  </label>
                </div>

                <input
                  type="number"
                  min={Math.max(1, usedCount)}
                  value={isUnlimitedLimit ? '' : limit}
                  onChange={(e) => setLimit(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={isUnlimitedLimit || submitting}
                  placeholder={isUnlimitedLimit ? 'Không giới hạn lượt dùng' : 'Ví dụ: 100'}
                  className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30 disabled:opacity-50"
                />
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
                <div>
                  <p className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                    Trạng thái kích hoạt
                  </p>
                  <p className="text-[10px] text-[#635a72] dark:text-[#a9a0b2]">
                    Bật để học viên có thể áp dụng mã
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  disabled={submitting}
                  className="w-5 h-5 rounded-md text-[#7240b8] focus:ring-[#7240b8] cursor-pointer"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={submitting}
                  className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={submitting}
                  className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#f1ebff] dark:border-[#2b2438]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-[#7240b8] hover:bg-[#5d3299] text-white shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <span>Lưu thay đổi</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditCouponModal({
  coupon,
  isOpen,
  onClose,
  onSuccess,
}: EditCouponModalProps) {
  if (!isOpen || !coupon) return null;

  return (
    <EditCouponModalContent
      key={coupon.id || coupon._id}
      coupon={coupon}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

