import { apiClient } from '@/lib/api/client';
import {
  CreateQuestionDto,
  CreateQuestionResponse,
  UpdateQuestionDto,
  UpdateQuestionResponse,
  DeleteQuestionResponse,
} from '@/types/question';

/**
 * TMDEMY — Question Management Service (api/QUESTION_API.md)
 */
export const questionService = {
  /**
   * Tạo một câu hỏi mới trong bài kiểm tra (Trắc nghiệm hoặc Điền từ)
   * POST /api/questions/
   */
  async createQuestion(
    data: CreateQuestionDto,
    options?: { signal?: AbortSignal }
  ): Promise<CreateQuestionResponse> {
    return apiClient.post<CreateQuestionResponse>('/api/questions/', data, {
      signal: options?.signal,
    });
  },

  /**
   * Cập nhật nội dung câu hỏi, danh sách lựa chọn, đáp án đúng hoặc điểm số
   * PUT /api/questions/:questionId
   */
  async updateQuestion(
    questionId: string,
    data: UpdateQuestionDto,
    options?: { signal?: AbortSignal }
  ): Promise<UpdateQuestionResponse> {
    return apiClient.put<UpdateQuestionResponse>(
      `/api/questions/${encodeURIComponent(questionId)}`,
      data,
      { signal: options?.signal }
    );
  },

  /**
   * Xóa câu hỏi khỏi bài kiểm tra
   * DELETE /api/questions/:questionId
   */
  async deleteQuestion(
    questionId: string,
    options?: { signal?: AbortSignal }
  ): Promise<DeleteQuestionResponse> {
    return apiClient.delete<DeleteQuestionResponse>(
      `/api/questions/${encodeURIComponent(questionId)}`,
      { signal: options?.signal }
    );
  },
};
