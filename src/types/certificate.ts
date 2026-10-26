/**
 * TMDEMY — Certificate Domain Types
 * Strictly aligned with api/CERTIFICATE_API.md
 */

export interface ApiCertificateCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  author?: {
    name: string;
  };
}

export interface ApiCertificate {
  id: string;
  _id?: string;
  code: string;
  userId: string;
  courseId: string;
  certificateUrl: string;
  grade: number;
  createdAt: string;
  updatedAt: string;
  course?: ApiCertificateCourse;
}

export interface CreateCertificatePayload {
  courseId: string;
}

export interface CreateCertificateResponse {
  success: boolean;
  message: string;
  data: ApiCertificate;
}

export interface GetMyCertificatesResponse {
  success: boolean;
  message: string;
  data: ApiCertificate[];
}

export interface GetCertificateByCourseResponse {
  success: boolean;
  message: string;
  data: ApiCertificate;
}

export interface ApiCertificatePublicVerification {
  code: string;
  certificateUrl: string;
  grade: number;
  issueDate: string;
  student: {
    name: string;
    avatar?: string;
  };
  course: {
    title: string;
    slug: string;
    thumbnail?: string;
    author?: {
      name: string;
    };
  };
}

export interface VerifyCertificateResponse {
  success: boolean;
  message: string;
  data: ApiCertificatePublicVerification;
}

export type CertificateStatus =
  | 'NOT_ELIGIBLE' // Chưa đủ điều kiện tốt nghiệp (< 70%)
  | 'ELIGIBLE' // Đủ điều kiện sơ bộ, sẵn sàng gửi yêu cầu thẩm định
  | 'REQUESTING' // Đang gửi yêu cầu (pending submission)
  | 'ISSUED' // Đã được cấp chứng chỉ chính thức
  | 'REJECTED'; // Bị từ chối bởi backend validation

export interface CertificateEligibilityCriteria {
  enrollment: {
    passed: boolean;
    label: string;
    description: string;
  };
  progress: {
    passed: boolean;
    currentPercent: number;
    requiredPercent: number; // 70%
    label: string;
  };
  quizCompletion: {
    passed: boolean;
    submittedCount: number;
    totalCount: number;
    percentage: number;
    requiredPercentage: number; // 60%
    label: string;
    evaluationMode: 'EXACT' | 'ESTIMATED_PENDING_BACKEND';
    statusMessage?: string;
  };
  finalGrade: {
    passed: boolean;
    score: number;
    requiredScore: number; // 50%
    label: string;
  };
}

export interface CertificateEligibilityResult {
  isEligible: boolean;
  isCalculatedByFrontend: true;
  isPreliminary: boolean; // true nếu tiêu chí quiz cần backend thẩm định lúc gửi
  criteria: CertificateEligibilityCriteria;
  missingRequirements: string[];
}
