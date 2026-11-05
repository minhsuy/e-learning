import { ApiCourseItem } from './course';

/**
 * TMDEMY — RECOMMENDATION TYPES (REC-10)
 *
 * Strict TypeScript contracts for Recommendation Service integration.
 * Derived from REC-09 Backend API specification (api/rec09_recommendation_api.md).
 */

export type RecommendationMode = 'item_to_item' | 'personalized';

export interface RecommendationScoreBreakdown {
  bm25_rank?: number | null;
  e5_rank?: number | null;
  bm25_score?: number | null;
  e5_score?: number | null;
  rrf_score: number;
  normalized_hybrid_score: number;
  personalization_score?: number | null;
  final_score: number;
}

export interface RecommendationItem {
  course: ApiCourseItem;
  rank: number;
  score: number;
  explanation: string;
  score_breakdown?: RecommendationScoreBreakdown;
}

export interface RecommendationData {
  mode: RecommendationMode | string;
  strategy_used: string;
  models_used: string[];
  fusion_method: string;
  fallback_used: boolean;
  fallback_reason?: string | null;
  total_candidates_retrieved: number;
  filtered_courses_count: number;
  recommendations: RecommendationItem[];
}

export interface RecommendationApiResponse {
  success: boolean;
  statusCode: number;
  data: RecommendationData;
  message?: string;
}

export interface RecommendationHealthData {
  status: string;
  service: string;
  ready: boolean;
  catalog_course_count?: number;
}

export interface RecommendationHealthResponse {
  success: boolean;
  statusCode: number;
  data: RecommendationHealthData;
  message?: string;
}

export interface GetSimilarCoursesParams {
  /** Target count of recommendations (1..50). Default: 6 */
  limit?: number;
  /** Explicit top_k parameter matching backend contract (1..50) */
  top_k?: number;
  /** Candidate pool retrieval depth per model (10..200). Default: 50 */
  retrieval_depth?: number;
  /** Enforce category diversification across recommendations */
  enable_diversity?: boolean;
  /** Maximum courses permitted from a single category (1..10). Default: 3 */
  max_courses_per_category?: number;
}

export interface GetPersonalizedRecommendationsParams {
  /** Target count of recommendations (1..50). Default: 8 */
  limit?: number;
  /** Explicit top_k parameter matching backend contract (1..50) */
  top_k?: number;
  /** Candidate pool retrieval depth per model (10..200). Default: 50 */
  retrieval_depth?: number;
  /** Exclude courses the learner has already completed */
  filter_completed?: boolean;
  /** Exclude courses the learner is currently enrolled in */
  filter_enrolled?: boolean;
  /** Enforce category diversification across recommendations */
  enable_diversity?: boolean;
  /** Maximum courses permitted from a single category (1..10). Default: 3 */
  max_courses_per_category?: number;
  /** Optional target difficulty filter override */
  preferred_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  /** Optional category affinity boost (comma-separated or string array) */
  preferred_category_names?: string | string[];
  /** Optional keyword affinity boost (comma-separated or string array) */
  preferred_topics?: string | string[];
}

