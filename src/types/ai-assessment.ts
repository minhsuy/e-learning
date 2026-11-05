/**
 * TMDEMY — AI Assessment Contract Types (api/LESSON_API.md Section 10 & api/STEP_7C_AI_ASSESSMENT_BACKEND_INTEGRATION_REPORT.md)
 */

export type AiAssessmentDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type AiProgrammingLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'cpp'
  | 'java';

export type AiVerificationStatus = 'VERIFIED' | 'FAILED' | 'UNVERIFIED';

/**
 * ------------------------------------------------------------------
 * 1. AI QUIZ TYPES (POST /api/lessons/:id/ai-quiz/generate)
 * ------------------------------------------------------------------
 */

export interface AiQuizGenerateRequest {
  /** Số lượng câu hỏi cần sinh (1–20, mặc định: 5) */
  questionCount?: number;
  /** Độ khó câu hỏi: EASY, MEDIUM, HARD (mặc định: MEDIUM) */
  difficulty?: AiAssessmentDifficulty;
  /** Chỉ dẫn hoặc yêu cầu bổ sung của giảng viên (tối đa 500 ký tự) */
  teacherInstructions?: string;
  /**
   * Nếu true: chỉ sinh bản xem trước kèm explanation mà không ghi vào database.
   * Mặc định: false.
   */
  previewOnly?: boolean;
  /**
   * Bắt buộc true nếu bài học đã có Quiz (và Quiz đó chưa có học viên nộp bài) để xác nhận ghi đè.
   * Mặc định: false.
   */
  confirmOverwrite?: boolean;
  /**
   * ID của mô hình AI muốn sử dụng (ví dụ: gemini-3.5-flash, gemini-3.5-flash-lite)
   */
  model?: string;
}

export interface AiQuizOption {
  id: string; // "A" | "B" | "C" | "D"
  text: string;
  isCorrect: boolean;
}

export interface AiQuizPreviewQuestion {
  question: string;
  type: 'SINGLE_CHOICE' | string;
  difficulty: AiAssessmentDifficulty;
  options: AiQuizOption[];
  correctAnswer: string;
  explanation?: string;
  sourceTimestamp?: string;
}

export interface AiQuizPreviewResponseData {
  title: string;
  description: string;
  language: string;
  difficulty: AiAssessmentDifficulty;
  questions: AiQuizPreviewQuestion[];
  previewOnly: true;
  warning?: string | null;
  metadata?: {
    modelUsed?: string;
    questionCount?: number;
  };
}

export interface AiQuizPersistedQuestionOption {
  id: string;
  title: string;
  questionId: string;
}

export interface AiQuizPersistedQuestion {
  id: string;
  quizId: string;
  title: string;
  answer: string;
  options: AiQuizPersistedQuestionOption[];
}

export interface AiQuizPersistResponseData {
  id: string;
  lessonId: string;
  title: string;
  questions: AiQuizPersistedQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface AiQuizGenerateResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AiQuizPreviewResponseData | AiQuizPersistResponseData;
}

/**
 * ------------------------------------------------------------------
 * 2. AI CODING EXERCISE TYPES (POST /api/lessons/:id/ai-coding-exercise/generate)
 * ------------------------------------------------------------------
 */

export interface AiCodingExerciseGenerateRequest {
  /** Ngôn ngữ lập trình: javascript, typescript, python, cpp, java */
  language?: AiProgrammingLanguage;
  /** Độ khó: EASY, MEDIUM, HARD (mặc định: EASY) */
  difficulty?: AiAssessmentDifficulty;
  /** Chỉ dẫn bổ sung của giảng viên (tối đa 500 ký tự) */
  teacherInstructions?: string;
  /** Nếu true: chỉ xem trước kết quả kèm verification mà không lưu DRAFT vào DB */
  previewOnly?: boolean;
  /** ID của mô hình AI muốn sử dụng */
  model?: string;
}

export interface CodingExecutionContractParameter {
  name: string;
  type: string;
  position?: number;
}

export interface CodingExecutionContract {
  entrypoint?: string;
  functionName?: string;
  parameters: CodingExecutionContractParameter[];
  returnType: string;
}

export interface CodingTestCaseInput {
  name: string;
  value: unknown;
}

export interface CodingTestCase {
  id?: string;
  _id?: string;
  revisionId?: string;
  isPublic: boolean;
  isHidden?: boolean;
  order?: number;
  weight?: number;
  inputs?: CodingTestCaseInput[];
  input?: unknown[];
  expectedOutput: unknown;
  explanation?: string;
}

export interface AiCodingVerificationDetail {
  testCaseId?: string;
  passed?: boolean;
  input?: unknown;
  expectedOutput?: unknown;
  actualOutput?: unknown;
  errorMessage?: string;
  error?: string;
}

export interface AiCodingExerciseVerification {
  status: AiVerificationStatus;
  verifiedAt?: string;
  testPassRate?: number;
  passedCount?: number;
  totalCount?: number;
  score?: number;
  passedTests?: number;
  totalTests?: number;
  details?: AiCodingVerificationDetail[];
}

export interface CodingExerciseRevision {
  id?: string;
  _id?: string;
  exerciseId?: string;
  version: number;
  isPublished: boolean;
  language: string;
  programmingLanguage?: string;
  difficulty: AiAssessmentDifficulty;
  starterCode: string;
  referenceSolution?: string | null;
  executionContract?: CodingExecutionContract;
  timeLimit?: number;
  memoryLimit?: number;
  testCases?: CodingTestCase[];
  testCasesCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CodingExercise {
  id: string;
  _id?: string;
  lessonId: string;
  courseId?: string;
  title: string;
  slug: string;
  description?: string;
  difficulty: AiAssessmentDifficulty;
  programmingLanguage?: string;
  language?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  source?: 'AI' | 'MANUAL';
  currentRevision?: CodingExerciseRevision;
  activeRevision?: CodingExerciseRevision;
  revisions?: CodingExerciseRevision[];
  starterCode?: string;
  testCases?: CodingTestCase[];
  verification?: AiCodingExerciseVerification;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AiCodingExercisePreviewResponseData {
  title: string;
  slug?: string;
  description?: string;
  language: AiProgrammingLanguage;
  difficulty: AiAssessmentDifficulty;
  starterCode: string;
  referenceSolution?: string;
  executionContract: CodingExecutionContract;
  testCases: CodingTestCase[];
  verification?: AiCodingExerciseVerification;
  previewOnly: true;
  previewToken?: string;
}

export interface AiCodingExercisePersistResponseData extends CodingExercise {
  verification?: AiCodingExerciseVerification;
}

export interface AiCodingExerciseGenerateResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AiCodingExercisePersistResponseData | AiCodingExercisePreviewResponseData;
}

/**
 * ------------------------------------------------------------------
 * 3. ATOMIC EXACT PREVIEW SAVE TYPES (Phase 4 & Phase 6)
 * ------------------------------------------------------------------
 */

export interface SaveApprovedAiQuizQuestion {
  question: string;
  type?: string;
  difficulty?: AiAssessmentDifficulty;
  options: {
    id: string; // "A" | "B" | "C" | "D"
    text: string;
    isCorrect: boolean;
  }[];
  correctAnswer: string;
  explanation?: string;
  sourceTimestamp?: string;
}

export interface SaveApprovedAiQuizRequest {
  title?: string;
  difficulty?: AiAssessmentDifficulty;
  confirmOverwrite?: boolean;
  questions: SaveApprovedAiQuizQuestion[];
}

export interface SaveApprovedAiQuizResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AiQuizPersistResponseData;
}

export interface SaveApprovedAiCodingExerciseRequest {
  previewToken?: string;
  title?: string;
  description?: string;
  programmingLanguage?: AiProgrammingLanguage;
  difficulty?: AiAssessmentDifficulty;
  starterCode?: string;
  referenceSolution?: string;
  executionContract?: CodingExecutionContract;
  testCases?: CodingTestCase[];
  verification?: AiCodingExerciseVerification;
  confirmOverwrite?: boolean;
}

export interface SaveApprovedAiCodingExerciseResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: CodingExercise;
}

/**
 * ------------------------------------------------------------------
 * 4. MULTI-MODEL AI REGISTRY CONTRACTS (STEP 7G - PHASE 3)
 * ------------------------------------------------------------------
 */

export interface AiModelDescriptor {
  id: string;
  displayName: string;
  provider: 'gemini' | string;
  supportsSummary: boolean;
  supportsQuiz: boolean;
  supportsCoding: boolean;
  isDefault: boolean;
  description?: string;
}

export interface AiModelsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    models: AiModelDescriptor[];
  };
}

export interface ReverifyCodingExerciseResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    exerciseId: string;
    revisionId: string;
    version: number;
    status: AiVerificationStatus;
    score: number;
    passRate: number;
    passedTests: number;
    totalTests: number;
    executionTimeMs?: number;
    diagnostics?: string;
    details?: AiCodingVerificationDetail[];
  };
}


