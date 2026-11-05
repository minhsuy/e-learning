'use client';

import React, { useState } from 'react';
import {
  X,
  Code2,
  Sparkles,
  Loader2,
  AlertCircle,
  Save,
  RotateCcw,
  BookOpen,
  Eye,
  EyeOff,
  Check,
  Shield,
  Terminal,
} from 'lucide-react';
import {
  AiAssessmentDifficulty,
  AiProgrammingLanguage,
  AiCodingExercisePreviewResponseData,
  AiCodingExercisePersistResponseData,
  CodingExercise,
  CodingTestCase,
} from '@/types/ai-assessment';
import { ApiLessonItem } from '@/types/lesson';
import { aiAssessmentService } from '@/services/ai-assessment.service';
import { codingExerciseService } from '@/services/coding-exercise.service';
import { CodeSnippet } from './code-snippet';
import { VerificationBadge } from './verification-badge';

import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';

interface AiCodingExerciseModalProps {
  courseId?: string;
  lesson: ApiLessonItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (exercise: CodingExercise) => void;
}

type StepMode = 'form' | 'loading' | 'preview';

const LANGUAGE_OPTIONS: Array<{
  id: AiProgrammingLanguage;
  label: string;
  badge: string;
  verifiedSupported: boolean;
}> = [
  { id: 'javascript', label: 'JavaScript (Node.js)', badge: 'E2B Sandbox Ready', verifiedSupported: true },
  { id: 'typescript', label: 'TypeScript', badge: 'E2B Sandbox Ready', verifiedSupported: true },
  { id: 'python', label: 'Python 3', badge: 'FastAPI Spec', verifiedSupported: false },
  { id: 'cpp', label: 'C++ 17', badge: 'FastAPI Spec', verifiedSupported: false },
  { id: 'java', label: 'Java 17', badge: 'FastAPI Spec', verifiedSupported: false },
];

export function AiCodingExerciseModal({
  courseId,
  lesson,
  isOpen,
  onClose,
  onSuccess,
}: AiCodingExerciseModalProps) {
  if (!isOpen) return null;

  return (
    <AiCodingExerciseContent
      courseId={courseId}
      lesson={lesson}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

interface AiCodingExerciseContentProps {
  courseId?: string;
  lesson: ApiLessonItem;
  onClose: () => void;
  onSuccess: (exercise: CodingExercise) => void;
}

function AiCodingExerciseContent({
  lesson,
  onClose,
  onSuccess,
}: AiCodingExerciseContentProps) {
  const lessonId = lesson.id || (lesson as { _id?: string })._id || '';

  // Form states

  const [language, setLanguage] = useState<AiProgrammingLanguage>('javascript');
  const [difficulty, setDifficulty] = useState<AiAssessmentDifficulty>('EASY');
  const [teacherInstructions, setTeacherInstructions] = useState<string>('');

  // Workflow states
  const [step, setStep] = useState<StepMode>('form');
  const [loadingMessage, setLoadingMessage] = useState<string>(
    'Đang phân tích bài học và sinh bài tập lập trình...'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview & Persist Data
  const [previewData, setPreviewData] = useState<AiCodingExercisePreviewResponseData | null>(null);
  const [activeTab, setActiveTab] = useState<'public' | 'hidden'>('public');
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async (previewOnly: boolean) => {
    setErrorMessage(null);
    setStep('loading');
    setLoadingMessage(
      previewOnly
        ? 'AI đang tạo bài tập và chạy nghiệm thu lời giải mẫu qua Sandbox E2B...'
        : 'AI đang tạo bài tập, xác thực qua Sandbox E2B và lưu DRAFT vào cơ sở dữ liệu...'
    );

    try {
      const response = await aiAssessmentService.generateAiCodingExercise(lessonId, {
        language,
        difficulty,
        teacherInstructions: teacherInstructions.trim() || undefined,
        previewOnly,

      });

      if (!response.success && !response.data) {
        throw new Error(response.message || 'Không nhận được dữ liệu bài tập từ AI');
      }

      if (previewOnly) {
        const preview = response.data as AiCodingExercisePreviewResponseData;
        setPreviewData(preview);
        setStep('preview');
        toast.success('Đã sinh bản xem trước bài tập lập trình AI thành công!');
      } else {
        const persisted = response.data as AiCodingExercisePersistResponseData;
        toast.success('Đã sinh và lưu bài tập Coding Exercise AI dạng DRAFT thành công!');
        onSuccess(persisted);
        onClose();
      }
    } catch (err: unknown) {
      setStep('form');
      if (err instanceof AppApiError) {
        if (err.statusCode === 400) {
          setErrorMessage(
            'Bài học chưa có nội dung phụ đề/transcript (độ dài tối thiểu 50 ký tự). Vui lòng thêm phụ đề bài học trước.'
          );
        } else if (err.statusCode === 403) {
          setErrorMessage('Bạn không có quyền giảng viên hoặc không phải chủ sở hữu khóa học này.');
        } else if (err.statusCode === 502 || err.statusCode === 504) {
          setErrorMessage(
            'Dịch vụ AI hoặc Sandbox E2B đang bận hoặc phản hồi quá thời gian quy định (Timeout). Vui lòng thử lại.'
          );
        } else {
          setErrorMessage(err.message || 'Đã có lỗi xảy ra khi tạo bài tập Coding với AI.');
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ AI. Vui lòng thử lại.');
      }
    }
  };

  /**
   * Saves the previewed coding exercise as a persistent DRAFT in the database.
   * Uses Phase 6 exact preview persistence via single-use preview token or atomic save-approved API.
   */
  const handleSaveDraft = async () => {
    if (!previewData) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      let savedExercise: CodingExercise | null = null;

      try {
        const approvedRes = await aiAssessmentService.saveApprovedCodingExercise(lessonId, {
          previewToken: previewData.previewToken,
          title: previewData.title,
          description: previewData.description,
          programmingLanguage: previewData.language,
          difficulty: previewData.difficulty,
          starterCode: previewData.starterCode,
          referenceSolution: previewData.referenceSolution,
          executionContract: previewData.executionContract,
          testCases: previewData.testCases,
          verification: previewData.verification,
          confirmOverwrite: true,
        });

        if (approvedRes && approvedRes.data) {
          savedExercise = approvedRes.data;
        }
      } catch {
        // Fallback to standard codingExerciseService.createExercise if token endpoint not available
        const res = await codingExerciseService.createExercise({
          lessonId,
          title: previewData.title,
          slug: previewData.slug,
          description: previewData.description,
          programmingLanguage: previewData.language,
          difficulty: previewData.difficulty,
          starterCode: previewData.starterCode,
          referenceSolution: previewData.referenceSolution,
          executionContract: previewData.executionContract,
          testCases: previewData.testCases,
        });

        if (res.data) {
          savedExercise = {
            ...res.data,
            verification: previewData.verification,
          };
        }
      }

      if (savedExercise) {
        toast.success('Đã lưu bài tập lập trình dạng DRAFT thành công!');
        onSuccess(savedExercise);
        onClose();
      } else {
        throw new Error('Không thể lưu bài tập dạng DRAFT.');
      }
    } catch (saveErr: unknown) {
      if (saveErr instanceof AppApiError) {
        setErrorMessage(saveErr.message);
      } else if (saveErr instanceof Error) {
        setErrorMessage(saveErr.message);
      } else {
        setErrorMessage('Không thể lưu bài tập dạng DRAFT. Vui lòng thử lại.');
      }
    } finally {
      setIsSaving(false);
    }
  };


  const testCases: CodingTestCase[] = previewData?.testCases || [];
  const publicTestCases = testCases.filter((tc) => tc.isPublic || !tc.isHidden);
  const hiddenTestCases = testCases.filter((tc) => !tc.isPublic || tc.isHidden);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-coding-modal-title"
    >
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#eceaf3] dark:border-[#352e43] bg-[#f7f1ff]/50 dark:bg-[#252030]/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-[#7240b8] to-[#3b82f6] text-white flex items-center justify-center shadow-xs">
              <Code2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2
                id="ai-coding-modal-title"
                className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-2"
              >
                <span>Sinh Bài tập Lập trình bằng AI</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  E2B Sandbox Verified
                </span>
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] truncate max-w-md sm:max-w-lg">
                Bài học: <span className="font-semibold text-slate-700 dark:text-slate-200">{lesson.title}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={step === 'loading' || isSaving}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Global Error Alert */}
          {errorMessage && (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Lỗi xử lý yêu cầu:</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* STEP 1: FORM */}
          {step === 'form' && (
            <div className="space-y-5">







              {/* Programming Language Selection */}
              <div>
                <label className="block text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                  Ngôn ngữ lập trình
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {LANGUAGE_OPTIONS.map((opt) => {
                    const isSelected = language === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLanguage(opt.id)}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          isSelected
                            ? 'border-[#7240b8] bg-[#f7f1ff]/80 dark:bg-[#282234] ring-2 ring-[#7240b8] shadow-xs'
                            : 'border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#252030] hover:bg-slate-50 dark:hover:bg-[#2d263a]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff]">
                            {opt.label}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              opt.verifiedSupported
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Selection */}
              <div>
                <label className="block text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                  Độ khó bài tập
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'EASY', label: 'Dễ (EASY)', desc: 'Thuật toán cơ bản, thao tác chuỗi/mảng' },
                    { id: 'MEDIUM', label: 'Trung bình (MEDIUM)', desc: 'Xử lý logic đa điều kiện, tối ưu thời gian' },
                    { id: 'HARD', label: 'Khó (HARD)', desc: 'Cấu trúc dữ liệu & thuật toán nâng cao' },
                  ].map((lvl) => {
                    const isSelected = difficulty === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setDifficulty(lvl.id as AiAssessmentDifficulty)}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          isSelected
                            ? 'border-[#7240b8] bg-[#f7f1ff]/80 dark:bg-[#282234] ring-2 ring-[#7240b8] shadow-xs'
                            : 'border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#252030] hover:bg-slate-50 dark:hover:bg-[#2d263a]'
                        }`}
                      >
                        <div className="font-bold text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff]">
                          {lvl.label}
                        </div>
                        <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-0.5 leading-snug">
                          {lvl.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Teacher Instructions */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                    Chỉ dẫn bài tập cho AI (Tùy chọn)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {teacherInstructions.length}/500 ký tự
                  </span>
                </div>
                <textarea
                  value={teacherInstructions}
                  maxLength={500}
                  onChange={(e) => setTeacherInstructions(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Tạo bài tập về tìm phần tử lớn thứ hai trong mảng, xử lý trường hợp mảng ít hơn 2 phần tử..."
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#252030] text-[#1c192c] dark:text-[#f4eeff] placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]"
                />
  
              </div>

              {/* Notice */}
              <div className="p-3.5 rounded-xl bg-violet-50/60 dark:bg-[#252030] border border-violet-200 dark:border-violet-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-[#7240b8] dark:text-[#a87ffb]">
                  <Sparkles className="w-4 h-4" />
                  <span>Quy trình tự động hóa AI Assessment</span>
                </div>
                <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] leading-relaxed">
                  Khi khởi tạo, backend sẽ gọi AI Service để sinh toàn bộ Hợp đồng thực thi (Execution Contract), Starter Code, Lời giải mẫu (Reference Solution), cùng bộ Test Cases (Công khai & Ẩn). Lời giải mẫu sẽ được tự động chạy trong Sandbox E2B cô lập để đảm bảo chất lượng bài tập trước khi Giảng viên duyệt.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: LOADING */}
          {step === 'loading' && (
            <div className="py-12 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900/50 animate-ping opacity-40" />
                <div className="w-16 h-16 rounded-full border-4 border-t-[#3b82f6] border-r-[#7240b8] border-b-transparent border-l-transparent animate-spin flex items-center justify-center bg-blue-50 dark:bg-[#282234]">
                  <Code2 className="w-7 h-7 text-[#7240b8] dark:text-[#a87ffb]" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Đang khởi tạo bài tập Coding với AI
                </h3>
                <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] max-w-md mx-auto">
                  {loadingMessage}
                </p>
                <p className="text-[11px] text-slate-400 pt-2 italic">
                  Đang thực thi reference solution trong isolated sandbox E2B microVM...
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & REVIEW */}
          {step === 'preview' && previewData && (
            <div className="space-y-5">
              {/* Exercise Meta Banner */}
              <div className="p-4 rounded-xl border border-violet-200 dark:border-violet-800/60 bg-violet-50/70 dark:bg-violet-950/40 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#7240b8] dark:text-[#a87ffb]">
                      Bài tập lập trình AI
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {previewData.language}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {previewData.difficulty}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      DRAFT
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff] mt-1">
                    {previewData.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#252030] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cấu hình lại</span>
                </button>
              </div>

              {/* E2B Verification Status UI */}
              <VerificationBadge verification={previewData.verification} />

              {/* Problem Description */}
              <div className="p-4 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#252030] space-y-2">
                <h4 className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#7240b8]" />
                  <span>Đề bài & Yêu cầu</span>
                </h4>
                <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {previewData.description || 'Không có mô tả chi tiết'}
                </div>
              </div>

              {/* Execution Contract Info */}
              {previewData.executionContract && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#201a2c] text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-sans font-bold text-slate-500">
                    <span>HỢP ĐỒNG THỰC THI (EXECUTION CONTRACT)</span>
                    <span className="text-[#7240b8] dark:text-[#a87ffb]">Entrypoint</span>
                  </div>
                  <div className="text-[#1c192c] dark:text-[#f4eeff]">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      {previewData.executionContract.entrypoint || previewData.executionContract.functionName || 'run'}
                    </span>
                    (
                    {previewData.executionContract.parameters
                      ?.map((p) => `${p.name}: ${p.type}`)
                      .join(', ')}
                    ):{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {previewData.executionContract.returnType || 'any'}
                    </span>
                  </div>
                </div>
              )}

              {/* Starter Code vs Reference Solution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Starter Code */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#7240b8]" />
                      <span>Mã khởi đầu (Starter Code)</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Hiển thị cho học viên</span>
                  </div>
                  <CodeSnippet
                    code={previewData.starterCode}
                    language={previewData.language}
                    title="STARTER CODE"
                    maxHeight="240px"
                  />
    
                </div>

                {/* Reference Solution */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Lời giải mẫu (Reference Solution)</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Chỉ GV / Admin thấy
                    </span>
                  </div>
                  <CodeSnippet
                    code={previewData.referenceSolution || '// Không có mã giải mẫu'}
                    language={previewData.language}
                    title="REFERENCE SOLUTION"
                    maxHeight="240px"
                  />
    
                </div>
              </div>

              {/* Test Cases Tabs */}
              <div className="rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#252030] overflow-hidden">
                <div className="flex items-center border-b border-[#eceaf3] dark:border-[#352e43] bg-[#f7f1ff]/50 dark:bg-[#201a2c]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('public')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
                      activeTab === 'public'
                        ? 'border-[#7240b8] text-[#7240b8] dark:text-[#a87ffb] bg-white dark:bg-[#252030]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Test Cases Công Khai ({publicTestCases.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('hidden')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
                      activeTab === 'hidden'
                        ? 'border-[#7240b8] text-[#7240b8] dark:text-[#a87ffb] bg-white dark:bg-[#252030]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Test Cases Bí Mật ({hiddenTestCases.length})</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Anti-cheat
                    </span>
                  </button>
                </div>

                <div className="p-4 space-y-3 max-h-72 overflow-auto">
                  {(activeTab === 'public' ? publicTestCases : hiddenTestCases).map((tc, idx) => {
                    const inputFormatted = tc.inputs
                      ? tc.inputs.map((i) => `${i.name} = ${JSON.stringify(i.value)}`).join(', ')
                      : JSON.stringify(tc.input);

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-[#eceaf3] dark:border-[#352e43] bg-slate-50/60 dark:bg-[#1d1926] text-xs font-mono space-y-1"
                      >
                        <div className="flex items-center justify-between font-sans">
                          <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                            Test #{idx + 1}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Trọng số: {tc.weight || 50}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Input: </span>
                          <span className="text-[#1c192c] dark:text-[#f4eeff]">{inputFormatted}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Output kỳ vọng: </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {JSON.stringify(tc.expectedOutput)}
                          </span>
                        </div>
                        {tc.explanation && (
                          <div className="text-[11px] font-sans text-slate-500 pt-0.5">
                            Giải thích: {tc.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#eceaf3] dark:border-[#352e43] bg-[#fdf8ff] dark:bg-[#201a2c] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={step === 'loading' || isSaving}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {step === 'form' && (
              <>
                <button
                  type="button"
                  onClick={() => handleGenerate(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-300 dark:border-violet-700 bg-white dark:bg-[#252030] text-[#7240b8] dark:text-[#a87ffb] text-xs font-bold hover:bg-violet-50 transition-colors shadow-xs"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Xem trước (Preview)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerate(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-[#7240b8] to-[#3b82f6] text-white text-xs font-bold shadow-md shadow-violet-500/20 transition-all hover:opacity-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Sinh & Lưu DRAFT trực tiếp</span>
                </button>
              </>
            )}

            {step === 'preview' && (
              <>
                <button
                  type="button"
                  onClick={() => handleGenerate(true)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#252030] text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Sinh lại bài khác</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-bold shadow-md shadow-violet-500/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu DRAFT...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu bài tập dạng DRAFT</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
