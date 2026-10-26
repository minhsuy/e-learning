import { apiClient } from '@/lib/api/client';
import {
  ApiCertificate,
  CreateCertificatePayload,
  CreateCertificateResponse,
  GetMyCertificatesResponse,
  GetCertificateByCourseResponse,
  VerifyCertificateResponse,
  CertificateEligibilityResult,
} from '@/types/certificate';
import { AppApiError } from '@/types/api';

const STORAGE_KEY_PREFIX = 'tmdemy_issued_certificates';

/**
 * TMDEMY — Certificate Service
 *
 * Source of Truth: api/CERTIFICATE_API.md
 *
 * Backend Endpoints:
 * - POST /api/certificates           : Yêu cầu cấp chứng chỉ (Bearer JWT required)
 * - GET  /api/certificates/my        : Lấy danh sách chứng chỉ của học viên hiện tại (Bearer JWT required)
 * - GET  /api/certificates/course/:courseId : Lấy chứng chỉ theo khóa học (Bearer JWT required)
 * - GET  /api/certificates/verify/:code : Xác thực công khai mã chứng chỉ (Public, No JWT)
 */
export const certificateService = {
  /**
   * 1. Học viên yêu cầu cấp chứng chỉ sau khi hoàn thành khóa học
   * POST /api/certificates
   */
  async createCertificate(
    payload: CreateCertificatePayload,
    options?: { signal?: AbortSignal }
  ): Promise<CreateCertificateResponse> {
    const response = await apiClient.post<CreateCertificateResponse>(
      '/api/certificates',
      payload,
      { signal: options?.signal }
    );
    return response;
  },

  /**
   * 2. Lấy danh sách toàn bộ chứng chỉ đã đạt được của học viên hiện tại
   * GET /api/certificates/my
   */
  async getMyCertificates(
    options?: { signal?: AbortSignal }
  ): Promise<GetMyCertificatesResponse> {
    const response = await apiClient.get<GetMyCertificatesResponse>(
      '/api/certificates/my',
      { signal: options?.signal }
    );
    return response;
  },

  /**
   * 3. Kiểm tra và lấy chứng chỉ của học viên đối với một khóa học cụ thể
   * GET /api/certificates/course/:courseId
   * @returns ApiCertificate nếu đã có chứng chỉ, hoặc null nếu chưa có (404)
   */
  async getCertificateByCourse(
    courseId: string,
    options?: { signal?: AbortSignal }
  ): Promise<ApiCertificate | null> {
    try {
      const response = await apiClient.get<GetCertificateByCourseResponse>(
        `/api/certificates/course/${encodeURIComponent(courseId)}`,
        { signal: options?.signal }
      );
      return response?.data || null;
    } catch (err: unknown) {
      if (err instanceof AppApiError && err.statusCode === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * 4. Public Certificate Verification Endpoint
   * GET /api/certificates/verify/:code
   * Không yêu cầu JWT token (Public).
   */
  async verifyCertificate(
    code: string,
    options?: { signal?: AbortSignal }
  ): Promise<VerifyCertificateResponse> {
    const response = await apiClient.get<VerifyCertificateResponse>(
      `/api/certificates/verify/${encodeURIComponent(code)}`,
      {
        signal: options?.signal,
        skipAuth: true,
      }
    );
    return response;
  },

  /**
   * Dọn sạch cache cũ trong localStorage để bảo đảm an toàn dữ liệu và tránh rò rỉ giữa các tài khoản
   */
  clearStoredCertificates(userId?: string): void {
    if (typeof window === 'undefined') return;
    try {
      if (userId) {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}_${userId}`);
      }
      // Dọn mọi key cache cũ
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // Ignore errors in restricted storage environments
    }
  },

  /**
   * Tính toán sơ bộ điều kiện cấp chứng chỉ phía Frontend dựa trên 5 tiêu chí từ api/CERTIFICATE_API.md
   * Lưu ý: Thẩm quyền thẩm định cuối cùng và tính điểm grade luôn thuộc về Backend khi gửi POST /api/certificates.
   */
  calculateEligibility(params: {
    isEnrolled: boolean;
    progressPercent: number;
    isAlreadyIssued: boolean;
    quizStats?: { submittedCount: number; totalCount: number };
    enrollmentStatus?: string;
  }): CertificateEligibilityResult {
    const {
      isEnrolled,
      progressPercent,
      isAlreadyIssued,
      quizStats,
      enrollmentStatus,
    } = params;

    const progressPassed = progressPercent >= 70;

    let submittedCount = 0;
    let totalCount = 0;
    let quizPercentage = 0;
    let quizPassed = false;
    let evaluationMode: 'EXACT' | 'ESTIMATED_PENDING_BACKEND' = 'ESTIMATED_PENDING_BACKEND';
    let statusMessage = '';

    if (quizStats && quizStats.totalCount > 0) {
      evaluationMode = 'EXACT';
      submittedCount = quizStats.submittedCount;
      totalCount = quizStats.totalCount;
      quizPercentage = Math.round((submittedCount / totalCount) * 100);
      quizPassed = quizPercentage >= 60;
      statusMessage = `Đã nộp ${submittedCount}/${totalCount} bài kiểm tra (${quizPercentage}%)`;
    } else if (enrollmentStatus === 'COMPLETED' || progressPercent === 100) {
      evaluationMode = 'ESTIMATED_PENDING_BACKEND';
      submittedCount = 0;
      totalCount = 0;
      quizPercentage = 100;
      quizPassed = true;
      statusMessage = 'Đã hoàn thành khóa học (Thẩm định bài kiểm tra chính thức bởi máy chủ khi gửi)';
    } else if (progressPercent >= 70) {
      evaluationMode = 'ESTIMATED_PENDING_BACKEND';
      submittedCount = 0;
      totalCount = 0;
      quizPercentage = progressPercent;
      quizPassed = true;
      statusMessage = 'Tiến độ bài học đã đạt (Tỷ lệ bài kiểm tra sẽ được máy chủ kiểm tra tự động)';
    } else {
      evaluationMode = 'ESTIMATED_PENDING_BACKEND';
      submittedCount = 0;
      totalCount = 0;
      quizPercentage = 0;
      quizPassed = false;
      statusMessage = 'Chưa đạt tiến độ tối thiểu để thẩm định bài kiểm tra';
    }

    const finalScore = Math.round((progressPercent + quizPercentage) / 2);
    const finalGradePassed = finalScore >= 50;

    const missingRequirements: string[] = [];
    if (!isEnrolled) {
      missingRequirements.push('Bạn chưa ghi danh vào khóa học này.');
    }
    if (isAlreadyIssued) {
      missingRequirements.push('Khóa học này đã được cấp chứng chỉ trước đó.');
    }
    if (!progressPassed) {
      missingRequirements.push(
        `Tiến độ học tập hiện tại (${progressPercent}%) chưa đạt mức tối thiểu 70%.`
      );
    }
    if (evaluationMode === 'EXACT' && !quizPassed) {
      missingRequirements.push(
        `Tỷ lệ nộp bài kiểm tra (${quizPercentage}%) chưa đạt mức tối thiểu 60%.`
      );
    }
    if (!finalGradePassed) {
      missingRequirements.push(
        `Điểm tổng kết (${finalScore}) chưa đạt mức tối thiểu 50 điểm.`
      );
    }

    const isEligible =
      isEnrolled &&
      !isAlreadyIssued &&
      progressPassed &&
      quizPassed &&
      finalGradePassed;

    return {
      isEligible,
      isCalculatedByFrontend: true as const,
      isPreliminary: evaluationMode === 'ESTIMATED_PENDING_BACKEND',
      criteria: {
        enrollment: {
          passed: isEnrolled,
          label: 'Ghi danh khóa học',
          description: isEnrolled
            ? 'Đã ghi danh hợp lệ'
            : 'Chưa có bản ghi ghi danh',
        },
        progress: {
          passed: progressPassed,
          currentPercent: progressPercent,
          requiredPercent: 70,
          label: 'Tiến độ học tập tối thiểu 70%',
        },
        quizCompletion: {
          passed: quizPassed,
          submittedCount,
          totalCount,
          percentage: quizPercentage,
          requiredPercentage: 60,
          label: 'Tỷ lệ nộp bài kiểm tra tối thiểu 60%',
          evaluationMode,
          statusMessage,
        },
        finalGrade: {
          passed: finalGradePassed,
          score: finalScore,
          requiredScore: 50,
          label: 'Điểm tổng kết tốt nghiệp tối thiểu 50',
        },
      },
      missingRequirements,
    };
  },
};
