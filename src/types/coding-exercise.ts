/**
 * TMDEMY — Coding Exercise Management API Contract Types (api/CODING_EXERCISE_API.md)
 */

import {
  CodingExercise,
  CodingTestCase,
  CodingExecutionContract,
  AiAssessmentDifficulty,
  AiProgrammingLanguage,
} from './ai-assessment';

export * from './ai-assessment';

export interface CreateCodingExerciseDto {
  lessonId: string;
  title: string;
  slug?: string;
  description?: string;
  programmingLanguage: AiProgrammingLanguage | string;
  difficulty: AiAssessmentDifficulty;
  starterCode: string;
  referenceSolution?: string;
  executionContract?: CodingExecutionContract;
  timeLimit?: number;
  memoryLimit?: number;
  order?: number;
  testCases?: CodingTestCase[];
}

export interface UpdateCodingExerciseDto {
  title?: string;
  slug?: string;
  description?: string;
  programmingLanguage?: AiProgrammingLanguage | string;
  difficulty?: AiAssessmentDifficulty;
  starterCode?: string;
  referenceSolution?: string;
  executionContract?: CodingExecutionContract;
  timeLimit?: number;
  memoryLimit?: number;
  order?: number;
  testCases?: CodingTestCase[];
}

export interface CodingExerciseResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: CodingExercise;
}

export interface CodingExercisesListResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: CodingExercise[];
}

export interface PublishCodingExerciseResponse {
  success: boolean;
  statusCode?: number;
  message: string;
  data: {
    id: string;
    _id?: string;
    status: 'PUBLISHED';
    publishedRevisionId?: string;
    version?: number;
    verification?: {
      score?: number;
      passRate?: number;
      passedTests?: number;
      totalTests?: number;
    };
  };
}

export interface UnpublishCodingExerciseResponse {
  success: boolean;
  statusCode?: number;
  message: string;
  data: {
    id: string;
    _id?: string;
    status: 'DRAFT';
  };
}

export interface DeleteCodingExerciseResponse {
  success: boolean;
  statusCode?: number;
  message: string;
}

export interface TestCaseExecutionResult {
  testCaseId?: string;
  order?: number;
  weight?: number;
  isHidden?: boolean;
  status: string;
  executionTimeMs?: number;
  actualOutput?: unknown;
  expectedOutput?: unknown;
  stdout?: string;
  errorMessage?: string;
  comparisonReason?: string;
}

export interface RunCodeResultData {
  status: string;
  passedTests: number;
  totalTests: number;
  score: number;
  maxScore: number;
  totalExecutionTimeMs: number;
  results: TestCaseExecutionResult[];
  compilationError?: string;
  infrastructureError?: string;
}

export interface RunCodeResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: RunCodeResultData;
}

export interface CodingSubmissionItem {
  id: string;
  _id?: string;
  exerciseId?: string;
  status: string;
  score: number;
  maxScore: number;
  passedTests: number;
  totalTests: number;
  passRate: number;
  totalExecutionTimeMs: number;
  sourceCode?: string;
  awardedXp?: number;
  createdAt: string;
  updatedAt?: string;
  results?: TestCaseExecutionResult[];
}

export interface SubmitCodeResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: CodingSubmissionItem;
}

export interface CodingSubmissionsListResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: {
    items: CodingSubmissionItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | CodingSubmissionItem[];
}

