import { apiClient } from '@/lib/api/client';
import {
  GetPersonalizedRecommendationsParams,
  GetSimilarCoursesParams,
  RecommendationApiResponse,
  RecommendationHealthResponse,
} from '@/types/recommendation';

/**
 * TMdemy Recommendation Service (REC-10)
 *
 * Client service layer communicating exclusively with the TMdemy Node.js Backend
 * at `/api/recommendations/*` (REC-09). The frontend NEVER communicates directly
 * with the Python recommendation microservice.
 */
export const recommendationService = {
  /**
   * Fetch similar courses related to a target course.
   * GET /api/recommendations/courses/:courseId/similar
   *
   * @param courseId Primary key UUID of the target course
   * @param params Query parameters (top_k / limit, retrieval_depth, diversity)
   * @param options AbortSignal and request options
   */
  async getSimilarCourses(
    courseId: string,
    params?: GetSimilarCoursesParams,
    options?: { signal?: AbortSignal }
  ): Promise<RecommendationApiResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    const topK = params?.top_k ?? params?.limit ?? 6;
    if (topK !== undefined) queryParams.top_k = topK;
    if (params?.retrieval_depth !== undefined) queryParams.retrieval_depth = params.retrieval_depth;
    if (params?.enable_diversity !== undefined) queryParams.enable_diversity = params.enable_diversity;
    if (params?.max_courses_per_category !== undefined) {
      queryParams.max_courses_per_category = params.max_courses_per_category;
    }

    return apiClient.get<RecommendationApiResponse>(
      `/api/recommendations/courses/${encodeURIComponent(courseId)}/similar`,
      {
        params: queryParams,
        signal: options?.signal,
      }
    );
  },

  /**
   * Fetch personalized recommendations tailored to the authenticated learner.
   * GET /api/recommendations/personalized
   *
   * Requires Bearer JWT authentication (automatically injected by apiClient).
   *
   * @param params Query parameters (top_k / limit, exclusion filters, preference overrides)
   * @param options AbortSignal and request options
   */
  async getPersonalizedRecommendations(
    params?: GetPersonalizedRecommendationsParams,
    options?: { signal?: AbortSignal }
  ): Promise<RecommendationApiResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    const topK = params?.top_k ?? params?.limit ?? 8;
    if (topK !== undefined) queryParams.top_k = topK;
    if (params?.retrieval_depth !== undefined) queryParams.retrieval_depth = params.retrieval_depth;
    if (params?.filter_completed !== undefined) queryParams.filter_completed = params.filter_completed;
    if (params?.filter_enrolled !== undefined) queryParams.filter_enrolled = params.filter_enrolled;
    if (params?.enable_diversity !== undefined) queryParams.enable_diversity = params.enable_diversity;
    if (params?.max_courses_per_category !== undefined) {
      queryParams.max_courses_per_category = params.max_courses_per_category;
    }
    if (params?.preferred_level !== undefined) queryParams.preferred_level = params.preferred_level;

    if (params?.preferred_category_names !== undefined) {
      queryParams.preferred_category_names = Array.isArray(params.preferred_category_names)
        ? params.preferred_category_names.filter(Boolean).join(',')
        : params.preferred_category_names;
    }

    if (params?.preferred_topics !== undefined) {
      queryParams.preferred_topics = Array.isArray(params.preferred_topics)
        ? params.preferred_topics.filter(Boolean).join(',')
        : params.preferred_topics;
    }

    return apiClient.get<RecommendationApiResponse>('/api/recommendations/personalized', {
      params: queryParams,
      signal: options?.signal,
    });
  },

  /**
   * Diagnostic probe to verify recommendation infrastructure readiness.
   * GET /api/recommendations/health
   *
   * Optional health probe. Do not call before every user recommendation request.
   */
  async getHealth(options?: { signal?: AbortSignal }): Promise<RecommendationHealthResponse> {
    return apiClient.get<RecommendationHealthResponse>('/api/recommendations/health', {
      skipAuth: true,
      signal: options?.signal,
    });
  },
};

