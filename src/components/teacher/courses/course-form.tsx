'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  UploadCloud,
  Loader2,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Play,
  TrendingDown,
  DollarSign,
  Info,
  Check,
  X,
  Star,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { CreateTeacherCourseDto } from '@/types/course';
import { categoryService } from '@/services/category.service';
import { Category } from '@/types/category';
import { useUploadThing } from '@/lib/uploadthing';
import { toast } from '@/lib/toast';

interface CourseFormProps {
  initialData?: Partial<CreateTeacherCourseDto> & {
    id?: string;
    _id?: string;
    slug?: string;
    status?: string;
  };
  isEdit?: boolean;
  onSubmit: (data: CreateTeacherCourseDto) => Promise<void>;
  isSubmitting: boolean;
}

export function CourseForm({
  initialData,
  isEdit = false,
  onSubmit,
  isSubmitting,
}: CourseFormProps) {
  // Categories State
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Form Fields
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialData?.category || '');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    (initialData?.level as 'beginner' | 'intermediate' | 'advanced') || 'beginner'
  );
  const [courseType, setCourseType] = useState<'paid' | 'free'>(
    (initialData?.type as 'paid' | 'free') || 'paid'
  );
  const [price, setPrice] = useState<string>(
    initialData?.price !== undefined ? String(initialData.price) : '499000'
  );
  const [oldPrice, setOldPrice] = useState<string>(
    initialData?.old_price !== undefined ? String(initialData.old_price) : '899000'
  );
  const [imageUrl, setImageUrl] = useState(initialData?.image || '');
  const [introUrl, setIntroUrl] = useState(initialData?.intro_url || '');

  // Derived slug preview (no setState in effect)
  const slugPreview = useMemo(() => {
    if (isEdit && initialData?.slug) {
      return initialData.slug;
    }
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }, [title, isEdit, initialData?.slug]);

  // Dynamic Lists for Info
  const [requirements, setRequirements] = useState<string[]>(
    initialData?.info?.requirements || ['Kiến thức cơ bản về lập trình', 'Máy tính có kết nối Internet']
  );
  const [newRequirement, setNewRequirement] = useState('');

  const [benefits, setBenefits] = useState<string[]>(
    initialData?.info?.benefits || ['Nắm vững kiến thức từ cơ bản đến thực chiến', 'Tự xây dựng dự án hoàn chỉnh']
  );
  const [newBenefit, setNewBenefit] = useState('');

  const [qaList, setQaList] = useState<Array<{ question: string; answer: string }>>(
    initialData?.info?.qa || [
      {
        question: 'Khóa học này dành cho ai?',
        answer: 'Dành cho các bạn mới bắt đầu hoặc người đã có nền tảng muốn nâng cao kỹ năng thực chiến.',
      },
    ]
  );
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  // Validation State
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // UploadThing Image Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { startUpload } = useUploadThing('avatarUploader', {
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      setUploadProgress(100);
      if (res && res[0]) {
        const uploadedUrl = res[0].url || res[0].ufsUrl;
        setImageUrl(uploadedUrl);
        toast.success('Tải ảnh đại diện khóa học thành công!');
      }
    },
    onUploadError: (err: Error) => {
      setIsUploading(false);
      toast.error(`Lỗi tải ảnh: ${err.message}`);
    },
  });

  // Fetch categories on mount
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const res = await categoryService.getCategories({ limit: 100 });
        if (isMounted && res?.data?.categories) {
          setCategories(res.data.categories);
          setSelectedCategory((prev) => prev || res.data.categories[0].id || res.data.categories[0]._id || '');
        }
      } catch (e) {
        console.error('Error fetching categories:', e);
      } finally {
        if (isMounted) setIsLoadingCategories(false);
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle requirement add/remove
  const handleAddRequirement = () => {
    const val = newRequirement.trim();
    if (val && !requirements.includes(val)) {
      setRequirements([...requirements, val]);
      setNewRequirement('');
    }
  };

  const handleRemoveRequirement = (idx: number) => {
    setRequirements(requirements.filter((_, i) => i !== idx));
  };

  // Handle benefit add/remove
  const handleAddBenefit = () => {
    const val = newBenefit.trim();
    if (val && !benefits.includes(val)) {
      setBenefits([...benefits, val]);
      setNewBenefit('');
    }
  };

  const handleRemoveBenefit = (idx: number) => {
    setBenefits(benefits.filter((_, i) => i !== idx));
  };

  // Handle QA add/remove
  const handleAddQA = () => {
    const q = newQuestion.trim();
    const a = newAnswer.trim();
    if (q && a) {
      setQaList([...qaList, { question: q, answer: a }]);
      setNewQuestion('');
      setNewAnswer('');
    }
  };

  const handleRemoveQA = (idx: number) => {
    setQaList(qaList.filter((_, i) => i !== idx));
  };

  // Calculations for pricing
  const numPrice = courseType === 'free' ? 0 : Math.max(0, Number(price) || 0);
  const numOldPrice = courseType === 'free' ? 0 : Math.max(0, Number(oldPrice) || 0);
  const discountPercent =
    numOldPrice > numPrice && numOldPrice > 0
      ? Math.round(((numOldPrice - numPrice) / numOldPrice) * 100)
      : 0;
  const estimatedTeacherIncome = Math.round(numPrice * 0.8);

  // Form Submit Validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!title.trim() || title.trim().length < 3) {
      errors.title = 'Tiêu đề khóa học là bắt buộc và tối thiểu 3 ký tự';
    }

    if (!description.trim()) {
      errors.description = 'Vui lòng cung cấp mô tả chi tiết khóa học';
    }

    if (courseType === 'paid' && numPrice <= 0) {
      errors.price = 'Khóa học trả phí phải có mức giá lớn hơn 0 VNĐ';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Vui lòng kiểm tra lại các trường thông tin bắt buộc.');
      return;
    }

    setValidationErrors({});

    const payload: CreateTeacherCourseDto = {
      title: title.trim(),
      description: description.trim(),
      category: selectedCategory || undefined,
      level,
      type: courseType,
      price: numPrice,
      old_price: numOldPrice > 0 ? numOldPrice : undefined,
      image: imageUrl.trim() || undefined,
      intro_url: introUrl.trim() || undefined,
      info: {
        requirements: requirements.filter((r) => r.trim().length > 0),
        benefits: benefits.filter((b) => b.trim().length > 0),
        qa: qaList.filter((q) => q.question.trim().length > 0 && q.answer.trim().length > 0),
      },
    };

    await onSubmit(payload);
  };

  const currentCategoryName =
    categories.find((c) => (c.id || c._id) === selectedCategory)?.name || 'Khác';

  const levelLabels: Record<string, string> = {
    beginner: 'Mới bắt đầu',
    intermediate: 'Trung cấp',
    advanced: 'Nâng cao',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 2-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT COLUMN: FORM FIELDS (8 COLS) ================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Thông tin cơ bản */}
          <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#eceaf3] dark:border-[#352e43] p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#eceaf3] dark:border-[#352e43]">
              <span className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center font-bold text-sm">
                1
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Thông tin cơ bản
                </h2>
                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  Thiết lập nhận diện cốt lõi cho chương trình đào tạo
                </p>
              </div>
            </div>

            {/* Tiêu đề */}
            <div>
              <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                Tiêu đề khóa học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Lập trình React Native từ cơ bản đến nâng cao"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8] transition-all ${
                  validationErrors.title
                    ? 'border-rose-400 dark:border-rose-600'
                    : 'border-[#e2e0ea] dark:border-[#3d364b]'
                }`}
              />
              {validationErrors.title ? (
                <p className="text-xs text-rose-500 mt-1">{validationErrors.title}</p>
              ) : (
                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-1">
                  Tối đa 100 ký tự. Đặt tiêu đề súc tích, phản ánh rõ kết quả đầu ra.
                </p>
              )}
            </div>

            {/* Đường dẫn tĩnh (Slug URL) */}
            <div>
              <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                Đường dẫn tĩnh (Slug URL)
              </label>
              <div className="flex rounded-xl overflow-hidden border border-[#e2e0ea] dark:border-[#3d364b] bg-[#f7f1ff] dark:bg-[#282234] text-xs">
                <span className="px-3.5 py-2.5 text-[#635a72] dark:text-[#a9a0b2] border-r border-[#e2e0ea] dark:border-[#3d364b] select-none flex items-center font-mono">
                  tmdemy.edu.vn/courses/
                </span>
                <input
                  type="text"
                  value={slugPreview}
                  readOnly
                  className="flex-1 px-3 py-2.5 bg-transparent border-0 text-[#1c192c] dark:text-[#f4eeff] font-mono focus:outline-none cursor-default"
                />
              </div>
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-1">
                Slug được backend tạo tự động từ tiêu đề theo chuẩn kebab-case.
              </p>
            </div>

            {/* Mô tả chi tiết */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                  Mô tả khóa học <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                  {description.trim().length} ký tự
                </span>
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả tổng quát về mục tiêu, đối tượng người học, cấu trúc giáo trình..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8] transition-all ${
                  validationErrors.description
                    ? 'border-rose-400 dark:border-rose-600'
                    : 'border-[#e2e0ea] dark:border-[#3d364b]'
                }`}
              />
              {validationErrors.description && (
                <p className="text-xs text-rose-500 mt-1">{validationErrors.description}</p>
              )}
            </div>

            {/* Danh mục & Cấp độ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                  Danh mục khóa học
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={isLoadingCategories}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
                >
                  {isLoadingCategories ? (
                    <option>Đang tải danh mục...</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.id || cat._id} value={cat.id || cat._id}>
                        {cat.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                  Cấp độ chuyên môn
                </label>
                <select
                  value={level}
                  onChange={(e) =>
                    setLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
                >
                  <option value="beginner">Mới bắt đầu (Beginner)</option>
                  <option value="intermediate">Trung cấp (Intermediate)</option>
                  <option value="advanced">Nâng cao (Advanced)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Giá bán & Học phí */}
          <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#eceaf3] dark:border-[#352e43] p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#eceaf3] dark:border-[#352e43]">
              <span className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center font-bold text-sm">
                2
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Giá bán &amp; Học phí
                </h2>
                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  Chính sách định giá và cơ cấu phân chia doanh thu giảng viên
                </p>
              </div>
            </div>

            {/* Loại khóa học */}
            <div>
              <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-2">
                Loại hình khóa học
              </label>
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    courseType === 'paid'
                      ? 'border-[#7240b8] bg-[#f7f1ff] dark:bg-[#282234]'
                      : 'border-[#e2e0ea] dark:border-[#3d364b] hover:bg-slate-50 dark:hover:bg-[#252030]'
                  }`}
                >
                  <input
                    type="radio"
                    name="courseType"
                    checked={courseType === 'paid'}
                    onChange={() => setCourseType('paid')}
                    className="w-4 h-4 text-[#7240b8]"
                  />
                  <div>
                    <span className="block text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      Trả phí (Paid)
                    </span>
                    <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                      Thu học phí từ học viên
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    courseType === 'free'
                      ? 'border-[#7240b8] bg-[#f7f1ff] dark:bg-[#282234]'
                      : 'border-[#e2e0ea] dark:border-[#3d364b] hover:bg-slate-50 dark:hover:bg-[#252030]'
                  }`}
                >
                  <input
                    type="radio"
                    name="courseType"
                    checked={courseType === 'free'}
                    onChange={() => setCourseType('free')}
                    className="w-4 h-4 text-[#7240b8]"
                  />
                  <div>
                    <span className="block text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      Miễn phí (Free)
                    </span>
                    <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                      Chia sẻ cộng đồng 0đ
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Input Giá bán và Giá gốc */}
            {courseType === 'paid' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                      Giá bán ưu đãi (Học viên trả) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="499000"
                        className={`w-full pl-3.5 pr-12 py-2.5 rounded-xl border text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8] ${
                          validationErrors.price
                            ? 'border-rose-400 dark:border-rose-600'
                            : 'border-[#e2e0ea] dark:border-[#3d364b]'
                        }`}
                      />
                      <span className="absolute right-3.5 top-3 text-xs font-bold text-[#635a72] dark:text-[#a9a0b2]">
                        VNĐ
                      </span>
                    </div>
                    {validationErrors.price ? (
                      <p className="text-xs text-rose-500 mt-1">{validationErrors.price}</p>
                    ) : discountPercent > 0 ? (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                        <TrendingDown className="w-3.5 h-3.5" />
                        Tiết kiệm {discountPercent}% so với giá gốc
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                      Giá gốc niêm yết (Gạch chân)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={oldPrice}
                        onChange={(e) => setOldPrice(e.target.value)}
                        placeholder="899000"
                        className="w-full pl-3.5 pr-12 py-2.5 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
                      />
                      <span className="absolute right-3.5 top-3 text-xs font-bold text-[#635a72] dark:text-[#a9a0b2]">
                        VNĐ
                      </span>
                    </div>
                    <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-1">
                      Tạo điểm neo giá kích cầu chuyển đổi học viên.
                    </p>
                  </div>
                </div>

                {/* Callout box tính toán doanh thu giảng viên */}
                <div className="p-4 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] border border-[#eceaf3] dark:border-[#3b334a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-[#635a72] dark:text-[#a9a0b2] block">
                        Doanh thu ước tính nhận (sau chiết khấu sàn 20%):
                      </span>
                      <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                        {estimatedTeacherIncome.toLocaleString('vi-VN')} đ{' '}
                        <span className="text-xs text-[#635a72] dark:text-[#a9a0b2] font-normal">
                          / mỗi học viên
                        </span>
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-white dark:bg-[#1d1926] text-[#7240b8] dark:text-[#a87ffb] text-xs font-bold border border-[#eceaf3] dark:border-[#3d364b]">
                    Tỷ lệ hưởng 80%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Hình ảnh & Video giới thiệu */}
          <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#eceaf3] dark:border-[#352e43] p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#eceaf3] dark:border-[#352e43]">
              <span className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center font-bold text-sm">
                3
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Hình ảnh &amp; Video giới thiệu
                </h2>
                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  Tối ưu ấn tượng thị giác thu hút học viên tiềm năng
                </p>
              </div>
            </div>

            {/* Thumbnail upload and URL */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                Ảnh bìa đại diện khóa học (Tỷ lệ 16:9)
              </label>

              {/* Preview container */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-[#e2e0ea] dark:border-[#3d364b] bg-[#f7f1ff] dark:bg-[#282234]">
                <div className="aspect-video w-full relative">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Xem trước ảnh bìa"
                      className="w-full h-full object-cover"
                      onError={() => {
                        toast.error('Không thể tải ảnh từ URL đã nhập. Vui lòng kiểm tra lại đường dẫn.');
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-[#635a72] dark:text-[#a9a0b2]">
                      <UploadCloud className="w-10 h-10 text-[#7240b8] dark:text-[#a87ffb]" />
                      <p className="text-xs font-medium">Chưa có ảnh đại diện khóa học</p>
                      <p className="text-[11px] text-slate-400">
                        Nhập URL ảnh bên dưới hoặc tải ảnh trực tiếp từ máy tính
                      </p>
                    </div>
                  )}

                  {imageUrl && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-semibold text-white bg-black/50 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                          Tỷ lệ chuẩn 16:9
                        </span>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="p-1.5 rounded-lg bg-white/90 dark:bg-black/90 text-rose-600 hover:bg-rose-100 transition-colors"
                          title="Gỡ ảnh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload & URL Controls */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Hoặc dán URL ảnh đại diện (https://...)"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
                />

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setIsUploading(true);
                      await startUpload(Array.from(files));
                    }
                  }}
                />

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] hover:bg-[#ede5fa] dark:hover:bg-[#352c48] text-[#7240b8] dark:text-[#a87ffb] text-xs font-semibold transition-colors flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang tải ({uploadProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Tải ảnh lên</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Video Intro URL */}
            <div>
              <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                Video giới thiệu khóa học (Intro trailer URL)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Play className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="url"
                    value={introUrl}
                    onChange={(e) => setIntroUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
                  />
                </div>
                {introUrl && (
                  <a
                    href={introUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#ede5fa] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Xem thử</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Yêu cầu & Lợi ích khóa học */}
          <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#eceaf3] dark:border-[#352e43] p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#eceaf3] dark:border-[#352e43]">
              <span className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center font-bold text-sm">
                4
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Yêu cầu &amp; Lợi ích khóa học
                </h2>
                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  Làm rõ đối tượng mục tiêu và chuẩn đầu ra thực tế
                </p>
              </div>
            </div>

            {/* Yêu cầu tiên quyết */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                Yêu cầu tiên quyết (Prerequisites)
              </label>
              <div className="flex flex-wrap gap-2">
                {requirements.map((req, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f7f1ff] dark:bg-[#282234] text-[#1c192c] dark:text-[#f4eeff] text-xs border border-[#eceaf3] dark:border-[#3b334a]"
                  >
                    <Check className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                    <span>{req}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(idx)}
                      className="ml-1 text-slate-400 hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRequirement();
                    }
                  }}
                  placeholder="Nhập yêu cầu mới và nhấn Thêm..."
                  className="flex-1 px-3 py-2 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-1 focus:ring-[#7240b8]"
                />
                <button
                  type="button"
                  onClick={handleAddRequirement}
                  className="px-3 py-2 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] hover:bg-[#ede5fa] text-[#7240b8] dark:text-[#a87ffb] text-xs font-semibold"
                >
                  + Thêm
                </button>
              </div>
            </div>

            {/* Lợi ích / Kỹ năng đạt được */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                Kỹ năng học viên sẽ đạt được sau khóa học (Benefits)
              </label>
              <div className="flex flex-wrap gap-2">
                {benefits.map((ben, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{ben}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(idx)}
                      className="ml-1 text-emerald-500 hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddBenefit();
                    }
                  }}
                  placeholder="Nhập kỹ năng đầu ra mới..."
                  className="flex-1 px-3 py-2 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-1 focus:ring-[#7240b8]"
                />
                <button
                  type="button"
                  onClick={handleAddBenefit}
                  className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
                >
                  + Thêm
                </button>
              </div>
            </div>

            {/* Q&A Câu hỏi thường gặp */}
            <div className="space-y-3 pt-3 border-t border-[#eceaf3] dark:border-[#352e43]">
              <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                Câu hỏi thường gặp (Q&amp;A)
              </label>

              {qaList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#252030] border border-[#eceaf3] dark:border-[#3b334a] text-xs space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                      Q: {item.question}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemoveQA(idx)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[#635a72] dark:text-[#a9a0b2]">A: {item.answer}</p>
                </div>
              ))}

              <div className="space-y-2 p-3 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] border border-[#eceaf3] dark:border-[#3b334a]">
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Câu hỏi thường gặp..."
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e0ea] dark:border-[#3d364b] text-xs bg-white dark:bg-[#1d1926] text-[#1c192c] dark:text-[#f4eeff]"
                />
                <textarea
                  rows={2}
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Câu trả lời giải đáp..."
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e0ea] dark:border-[#3d364b] text-xs bg-white dark:bg-[#1d1926] text-[#1c192c] dark:text-[#f4eeff]"
                />
                <button
                  type="button"
                  onClick={handleAddQA}
                  className="px-3 py-1.5 rounded-lg bg-[#7240b8] text-white text-xs font-semibold hover:bg-[#5e3299] transition-colors"
                >
                  + Thêm câu hỏi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: STICKY REAL-TIME LIVE PREVIEW (4 COLS) ================= */}
        <div className="lg:col-span-4 sticky top-24 space-y-5">
          {/* Card Preview Container */}
          <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#eceaf3] dark:border-[#352e43] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#eceaf3] dark:border-[#352e43]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Xem trước hiển thị (Live Preview)
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] font-semibold">
                Thời gian thực
              </span>
            </div>

            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Mô phỏng hiển thị trên sàn học viên TMdemy:
            </p>

            {/* High-fidelity Course Card */}
            <div className="rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#252030] overflow-hidden shadow-sm group">
              <div className="relative aspect-video w-full bg-[#f7f1ff] dark:bg-[#282234] overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    Ảnh 16:9
                  </div>
                )}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-xs text-[#7240b8] dark:text-[#a87ffb] text-[10px] font-semibold border border-white/20">
                    {currentCategoryName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-xs text-[#635a72] dark:text-[#a9a0b2] text-[10px] font-semibold border border-white/20">
                    {levelLabels[level]}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  <div className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>5.0</span>
                    <span className="text-slate-400 font-normal">(Mới ra mắt)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{levelLabels[level]}</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] line-clamp-2 leading-snug">
                  {title || 'Tiêu đề khóa học của bạn sẽ hiển thị tại đây'}
                </h3>

                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] line-clamp-2">
                  {description || 'Mô tả ngắn gọn về khóa học sẽ xuất hiện tại vị trí này...'}
                </p>

                <div className="pt-2 border-t border-[#eceaf3] dark:border-[#352e43] flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-[#7240b8] dark:text-[#a87ffb]">
                      {courseType === 'free' ? 'Miễn phí' : `${numPrice.toLocaleString('vi-VN')} đ`}
                    </span>
                    {courseType === 'paid' && numOldPrice > numPrice && (
                      <span className="text-xs text-[#635a72] dark:text-[#a9a0b2] line-through">
                        {numOldPrice.toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>
                  {courseType === 'paid' && discountPercent > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
                      -{discountPercent}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mẹo tối ưu */}
          <div className="p-4 rounded-2xl bg-[#f7f1ff] dark:bg-[#282234] border border-[#eceaf3] dark:border-[#3b334a] flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#7240b8] dark:text-[#a87ffb] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#635a72] dark:text-[#a9a0b2] space-y-1">
              <span className="font-bold text-[#1c192c] dark:text-[#f4eeff] block">
                Mẹo tối ưu khóa học TMdemy
              </span>
              <p className="leading-relaxed">
                Tiêu đề rõ ràng và hình thu nhỏ 16:9 sắc nét giúp tăng <strong>65% tỷ lệ học viên</strong> nhấn vào xem chi tiết so với các khóa học thông thường.
              </p>
            </div>
          </div>

          {/* Tiêu chí kiểm duyệt nhanh */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] space-y-2.5">
            <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] block">
              Tiêu chí kiểm duyệt nhanh
            </span>
            <div className="space-y-1.5 text-xs text-[#635a72] dark:text-[#a9a0b2]">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tiêu đề đầy đủ, không viết hoa toàn bộ</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ảnh bìa đúng tỷ lệ 16:9 không vi phạm bản quyền</span>
              </div>
              <div className="flex items-center gap-2">
                {introUrl ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Video xem trước giới thiệu khóa học</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM STICKY ACTION BAR ================= */}
      <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-[#1d1926]/95 backdrop-blur-md rounded-2xl border border-[#eceaf3] dark:border-[#352e43] p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-2.5 max-w-md">
          <Info className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] leading-relaxed">
            {isEdit
              ? 'Cập nhật các trường thông tin cho phép. Trạng thái và tác giả khóa học được giữ nguyên theo chính sách bảo toàn.'
              : 'Khóa học sau khi gửi sẽ mang trạng thái CHỜ PHÊ DUYỆT (PENDING). Ban kiểm duyệt TMdemy sẽ phản hồi trong vòng 24 giờ.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link
            href="/teacher/courses"
            className="px-4 py-2.5 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] hover:bg-slate-50 dark:hover:bg-[#252030] text-xs sm:text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff] transition-colors"
          >
            Hủy bỏ
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="px-6 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#7240b8]/20 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isEdit ? 'Lưu thay đổi' : 'Gửi phê duyệt ngay'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
