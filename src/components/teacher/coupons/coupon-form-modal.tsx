'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  Percent,
  DollarSign,
  Search,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  CouponItem,
  CreateCouponDto,
  UpdateCouponDto,
} from '@/types/coupon';
import { TeacherCourseItem } from '@/types/course';
import { courseService } from '@/services/course.service';

interface CouponFormModalProps {
  isOpen: boolean;
  coupon: CouponItem | null; // null => Create, not null => Edit
  onClose: () => void;
  onSubmit: (data: CreateCouponDto | UpdateCouponDto, isEdit: boolean, id?: string) => Promise<void>;
  isSubmitting: boolean;
}

function CouponFormModalContent({
  coupon,
  onClose,
  onSubmit,
  isSubmitting,
}: Omit<CouponFormModalProps, 'isOpen'>) {
  const isEdit = !!coupon;

  // Initialize form states directly from coupon prop
  const [title, setTitle] = useState(coupon?.title || '');
  const [code, setCode] = useState(coupon?.code || '');
  const [type, setType] = useState<'percentage' | 'number'>(
    (coupon?.type || '').toLowerCase() === 'number' ? 'number' : 'percentage'
  );
  const [value, setValue] = useState<number | ''>(
    typeof coupon?.value === 'number' ? coupon.value : 20
  );
  const [limit, setLimit] = useState<number | ''>(
    typeof coupon?.limit === 'number' ? coupon.limit : 50
  );
  const [startDate, setStartDate] = useState(
    coupon?.startDate ? coupon.startDate.split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    coupon?.endDate ? coupon.endDate.split('T')[0] : ''
  );
  const [active, setActive] = useState(coupon?.active ?? true);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(() => {
    if (coupon?.courses && Array.isArray(coupon.courses)) {
      return coupon.courses
        .map((c) => (typeof c === 'string' ? c : c.id || c._id || ''))
        .filter(Boolean);
    }
    if (coupon?.courseIds && Array.isArray(coupon.courseIds)) {
      return coupon.courseIds;
    }
    return [];
  });

  // Courses state for picker
  const [teacherCourses, setTeacherCourses] = useState<TeacherCourseItem[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');

  // Form error states
  const [formError, setFormError] = useState<string | null>(null);

  // Load teacher courses when modal opens
  useEffect(() => {
    let isMounted = true;
    const fetchTeacherCourses = async () => {
      try {
        setIsLoadingCourses(true);
        const res = await courseService.getTeacherCourses({ limit: 100 });
        if (isMounted && res.data?.courses) {
          setTeacherCourses(res.data.courses);
        }
      } catch (err: unknown) {
        console.warn('Could not load teacher courses for coupon modal:', err);
      } finally {
        if (isMounted) setIsLoadingCourses(false);
      }
    };

    fetchTeacherCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered courses by search
  const filteredCourses = teacherCourses.filter((c) =>
    c.title.toLowerCase().includes(courseSearch.trim().toLowerCase())
  );

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleSelectAllCourses = () => {
    if (selectedCourseIds.length === teacherCourses.length) {
      setSelectedCourseIds([]);
    } else {
      setSelectedCourseIds(teacherCourses.map((c) => c.id || c._id || ''));
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Force uppercase, alphanumeric only, no spaces
    const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    setCode(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    const cleanTitle = title.trim();
    const cleanCode = code.trim();

    if (!cleanTitle) {
      setFormError('Vui lòng nhập tiêu đề chương trình mã giảm giá.');
      return;
    }
    if (!cleanCode) {
      setFormError('Vui lòng nhập mã ưu đãi (Coupon Code).');
      return;
    }
    if (cleanCode.length < 3) {
      setFormError('Mã ưu đãi phải có ít nhất 3 ký tự.');
      return;
    }
    if (value === '' || Number(value) <= 0) {
      setFormError('Vui lòng nhập giá trị giảm hợp lệ (> 0).');
      return;
    }
    if (type === 'percentage' && (Number(value) < 1 || Number(value) > 100)) {
      setFormError('Giảm giá theo phần trăm phải nằm trong khoảng từ 1% đến 100%.');
      return;
    }
    if (type === 'number' && Number(value) < 1000) {
      setFormError('Giảm giá theo số tiền cố định phải tối thiểu từ 1.000 đ trở lên.');
      return;
    }
    if (selectedCourseIds.length === 0) {
      setFormError('Giảng viên bắt buộc phải chọn ít nhất 1 khóa học do mình sở hữu để áp dụng mã.');
      return;
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setFormError('Ngày kết thúc phải diễn ra sau ngày bắt đầu.');
      return;
    }

    const payload: CreateCouponDto = {
      title: cleanTitle,
      code: cleanCode,
      type,
      value: Number(value),
      limit: limit !== '' ? Number(limit) : undefined,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      active,
      courses: selectedCourseIds,
    };

    try {
      const couponId = coupon?.id || coupon?._id;
      await onSubmit(payload, isEdit, couponId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Không thể lưu mã giảm giá. Vui lòng kiểm tra lại thông tin.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1a1622] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="coupon-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-between bg-[#fdfaff] dark:bg-[#17141f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7240b8]/10 dark:bg-[#a87ffb]/20 text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="coupon-modal-title"
                className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                {isEdit ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
              </h2>
              <p className="text-xs text-[#7c7483] dark:text-[#968e9e]">
                {isEdit
                  ? 'Cập nhật điều kiện áp dụng và trạng thái khuyến mãi'
                  : 'Thiết lập mã ưu đãi dành riêng cho các khóa học của bạn'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng"
            className="p-1.5 rounded-lg text-[#7c7483] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body with Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Error Banner */}
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Row 1: Title & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4] mb-1.5">
                Tiêu đề chương trình <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Ưu đãi chào mừng hè 2026"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ff] dark:bg-[#1f1b29] border border-[#e8ddfc] dark:border-[#382e4a] text-xs text-[#1c192c] dark:text-[#f4eeff] placeholder-[#9c93a4] focus:outline-hidden focus:border-[#7240b8] dark:focus:border-[#a87ffb] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4] mb-1.5">
                Mã giảm giá (Code) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="Ví dụ: SUMMER2026"
                required
                maxLength={20}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ff] dark:bg-[#1f1b29] border border-[#e8ddfc] dark:border-[#382e4a] text-xs font-mono font-bold uppercase tracking-wider text-[#7240b8] dark:text-[#a87ffb] placeholder-[#9c93a4] focus:outline-hidden focus:border-[#7240b8] dark:focus:border-[#a87ffb] transition-colors"
              />
              <p className="text-[10px] text-[#7c7483] dark:text-[#968e9e] mt-1">
                Tự động viết hoa, không khoảng trắng (3-20 ký tự).
              </p>
            </div>
          </div>

          {/* Row 2: Discount Type & Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4] mb-1.5">
                Loại chiết khấu <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('percentage')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === 'percentage'
                      ? 'bg-[#7240b8] text-white border-[#7240b8] shadow-xs'
                      : 'bg-[#faf6ff] dark:bg-[#1f1b29] border-[#e8ddfc] dark:border-[#382e4a] text-[#635a72] dark:text-[#cdc3d4] hover:border-[#7240b8]/40'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Phần trăm (%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('number')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === 'number'
                      ? 'bg-[#7240b8] text-white border-[#7240b8] shadow-xs'
                      : 'bg-[#faf6ff] dark:bg-[#1f1b29] border-[#e8ddfc] dark:border-[#382e4a] text-[#635a72] dark:text-[#cdc3d4] hover:border-[#7240b8]/40'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Số tiền (VND)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4] mb-1.5">
                {type === 'percentage' ? 'Tỷ lệ giảm (%)' : 'Số tiền giảm (VND)'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={type === 'percentage' ? 1 : 1000}
                  max={type === 'percentage' ? 100 : undefined}
                  step={type === 'percentage' ? 1 : 1000}
                  value={value}
                  onChange={(e) => setValue(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={type === 'percentage' ? 'Ví dụ: 25' : 'Ví dụ: 100000'}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ff] dark:bg-[#1f1b29] border border-[#e8ddfc] dark:border-[#382e4a] text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] placeholder-[#9c93a4] focus:outline-hidden focus:border-[#7240b8] dark:focus:border-[#a87ffb] transition-colors pr-12"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7c7483] dark:text-[#968e9e]">
                  {type === 'percentage' ? '%' : 'đ'}
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: Usage Limit & Active status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4] mb-1.5">
                Giới hạn lượt sử dụng
              </label>
              <input
                type="number"
                min={1}
                value={limit}
                onChange={(e) => setLimit(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Để trống nếu không giới hạn"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ff] dark:bg-[#1f1b29] border border-[#e8ddfc] dark:border-[#382e4a] text-xs text-[#1c192c] dark:text-[#f4eeff] placeholder-[#9c93a4] focus:outline-hidden focus:border-[#7240b8] dark:focus:border-[#a87ffb] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4] mb-1.5">
                Trạng thái kích hoạt
              </label>
              <div
                onClick={() => setActive(!active)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#faf6ff] dark:bg-[#1f1b29] border border-[#e8ddfc] dark:border-[#382e4a] cursor-pointer hover:border-[#7240b8]/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      active ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                    {active ? 'Đang kích hoạt (Cho phép áp dụng)' : 'Tạm dừng (Vô hiệu hóa)'}
                  </span>
                </div>
                <div
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    active ? 'bg-[#7240b8]' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      active ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4] mb-1.5">
                Ngày bắt đầu (Tùy chọn)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ff] dark:bg-[#1f1b29] border border-[#e8ddfc] dark:border-[#382e4a] text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:border-[#7240b8] dark:focus:border-[#a87ffb] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4] mb-1.5">
                Ngày kết thúc / Hết hạn (Tùy chọn)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ff] dark:bg-[#1f1b29] border border-[#e8ddfc] dark:border-[#382e4a] text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:border-[#7240b8] dark:focus:border-[#a87ffb] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Applicable Courses Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4]">
                Khóa học áp dụng mã <span className="text-red-500">*</span>{' '}
                <span className="font-normal text-[#7c7483] dark:text-[#968e9e]">
                  (Đã chọn: {selectedCourseIds.length} / {teacherCourses.length})
                </span>
              </label>
              <button
                type="button"
                onClick={handleSelectAllCourses}
                className="text-[11px] font-bold text-[#7240b8] dark:text-[#a87ffb] hover:underline cursor-pointer"
              >
                {selectedCourseIds.length === teacherCourses.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>

            {/* Course search input */}
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7c7483]" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Tìm nhanh trong các khóa học của bạn..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg bg-[#faf6ff] dark:bg-[#1f1b29] border border-[#e8ddfc] dark:border-[#382e4a] text-[#1c192c] dark:text-[#f4eeff] placeholder-[#9c93a4] focus:outline-hidden focus:border-[#7240b8]"
              />
            </div>

            {/* Courses list */}
            <div className="border border-[#e8ddfc] dark:border-[#382e4a] rounded-xl bg-[#faf6ff] dark:bg-[#1f1b29] max-h-48 overflow-y-auto divide-y divide-[#f1ebff] dark:divide-[#2b2438]">
              {isLoadingCourses ? (
                <div className="p-6 text-center text-xs text-[#7c7483] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#7240b8]" />
                  <span>Đang tải danh sách khóa học của bạn...</span>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#7c7483]">
                  {courseSearch
                    ? 'Không tìm thấy khóa học khớp từ khóa'
                    : 'Bạn chưa có khóa học nào để gán mã giảm giá'}
                </div>
              ) : (
                filteredCourses.map((c) => {
                  const courseId = c.id || c._id || '';
                  const isChecked = selectedCourseIds.includes(courseId);

                  return (
                    <div
                      key={courseId}
                      onClick={() => handleToggleCourse(courseId)}
                      className={`p-3 flex items-center justify-between text-xs hover:bg-[#f3eaff] dark:hover:bg-[#282136] cursor-pointer transition-colors ${
                        isChecked ? 'bg-[#ede0ff]/50 dark:bg-[#2d2242]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-3">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-[#7240b8] border-[#7240b8] text-white'
                              : 'border-[#b5a7cf] dark:border-[#4d4062] bg-white dark:bg-[#1a1622]'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff] truncate">
                            {c.title}
                          </p>
                          <p className="text-[10px] text-[#7c7483] dark:text-[#968e9e]">
                            {typeof c.price === 'number' && c.price > 0
                              ? `${c.price.toLocaleString('vi-VN')} đ`
                              : 'Miễn phí'}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 bg-[#e8ddfc] dark:bg-[#342948] text-[#5e3299] dark:text-[#c4a9f9]">
                        {c.status || 'Active'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-[10px] text-[#7c7483] dark:text-[#968e9e] mt-1.5">
              Quy tắc bảo vệ: Giảng viên chỉ có quyền áp dụng mã ưu đãi cho các khóa học do chính mình tạo ra.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#f1ebff] dark:border-[#2b2438] bg-[#fdfaff] dark:bg-[#17141f] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-[#e2d8f3] dark:border-[#382e4a] text-xs font-semibold text-[#635a72] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#221c2e] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Tag className="w-4 h-4" />
                <span>{isEdit ? 'Lưu thay đổi' : 'Tạo mã ưu đãi'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CouponFormModal(props: CouponFormModalProps) {
  if (!props.isOpen) return null;
  return (
    <CouponFormModalContent
      key={props.coupon?.id || props.coupon?._id || 'new-coupon'}
      {...props}
    />
  );
}
