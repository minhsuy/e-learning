'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { recommendationService } from '@/services/recommendation.service';
import { Course, mapApiCourseToCourse } from '@/types/course';
import {
  GetPersonalizedRecommendationsParams,
  GetSimilarCoursesParams,
  RecommendationItem,
} from '@/types/recommendation';

export interface UseSimilarCoursesOptions extends GetSimilarCoursesParams {
  enabled?: boolean;
}

export interface UseSimilarCoursesReturn {
  courses: Course[];
  recommendations: RecommendationItem[];
  strategyUsed: string | null;
  modelsUsed: string[];
  fusionMethod: string | null;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  totalCandidatesRetrieved: number;
  filteredCoursesCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to retrieve similar courses for a target course.
 * GET /api/recommendations/courses/:courseId/similar
 */
export function useSimilarCourses(
  courseId?: string | null,
  options: UseSimilarCoursesOptions = {}
): UseSimilarCoursesReturn {
  const { enabled = true, limit = 6, top_k, retrieval_depth, enable_diversity = true, max_courses_per_category } = options;

  const [courses, setCourses] = useState<Course[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [strategyUsed, setStrategyUsed] = useState<string | null>(null);
  const [modelsUsed, setModelsUsed] = useState<string[]>([]);
  const [fusionMethod, setFusionMethod] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState<boolean>(false);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [totalCandidatesRetrieved, setTotalCandidatesRetrieved] = useState<number>(0);
  const [filteredCoursesCount, setFilteredCoursesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(courseId && enabled));
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(async () => {
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();

    async function loadSimilar() {
      await Promise.resolve();
      if (!isCurrent) return;

      if (!courseId || !enabled) {
        setCourses([]);
        setRecommendations([]);
        setStrategyUsed(null);
        setModelsUsed([]);
        setFusionMethod(null);
        setFallbackUsed(false);
        setFallbackReason(null);
        setTotalCandidatesRetrieved(0);
        setFilteredCoursesCount(0);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await recommendationService.getSimilarCourses(
          courseId,
          {
            top_k: top_k ?? limit,
            retrieval_depth,
            enable_diversity,
            max_courses_per_category,
          },
          { signal: controller.signal }
        );

        if (!isCurrent) return;

        if (response.success && response.data) {
          const rawItems = response.data.recommendations || [];
          // Defensively exclude source course if present
          const filtered = rawItems.filter(
            (rec) =>
              rec.course &&
              rec.course.id !== courseId &&
              rec.course._id !== courseId
          );

          setRecommendations(filtered);
          setStrategyUsed(response.data.strategy_used || null);
          setModelsUsed(response.data.models_used || []);
          setFusionMethod(response.data.fusion_method || null);
          setFallbackUsed(Boolean(response.data.fallback_used));
          setFallbackReason(response.data.fallback_reason ?? null);
          setTotalCandidatesRetrieved(response.data.total_candidates_retrieved ?? 0);
          setFilteredCoursesCount(response.data.filtered_courses_count ?? 0);
          setCourses(filtered.map((item) => mapApiCourseToCourse(item.course)));
        } else {
          setCourses([]);
          setRecommendations([]);
          setStrategyUsed(null);
          setModelsUsed([]);
          setFusionMethod(null);
          setFallbackUsed(false);
          setFallbackReason(null);
          setTotalCandidatesRetrieved(0);
          setFilteredCoursesCount(0);
        }
      } catch (err: unknown) {
        if (!isCurrent) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        const message =
          err instanceof Error
            ? err.message
            : 'Không thể tải danh sách khóa học tương tự. Vui lòng thử lại sau.';
        setError(message);
        setCourses([]);
        setRecommendations([]);
        setStrategyUsed(null);
        setModelsUsed([]);
        setFusionMethod(null);
        setFallbackUsed(false);
        setFallbackReason(null);
        setTotalCandidatesRetrieved(0);
        setFilteredCoursesCount(0);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadSimilar();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [
    courseId,
    enabled,
    limit,
    top_k,
    retrieval_depth,
    enable_diversity,
    max_courses_per_category,
    reloadKey,
  ]);

  return {
    courses,
    recommendations,
    strategyUsed,
    modelsUsed,
    fusionMethod,
    fallbackUsed,
    fallbackReason,
    totalCandidatesRetrieved,
    filteredCoursesCount,
    isLoading,
    error,
    refetch,
  };
}

export interface UsePersonalizedRecommendationsOptions extends GetPersonalizedRecommendationsParams {
  enabled?: boolean;
}

export interface UsePersonalizedRecommendationsReturn {
  courses: Course[];
  recommendations: RecommendationItem[];
  strategyUsed: string | null;
  modelsUsed: string[];
  fusionMethod: string | null;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  totalCandidatesRetrieved: number;
  filteredCoursesCount: number;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook to retrieve personalized recommendations for the authenticated learner.
 * GET /api/recommendations/personalized
 *
 * Automatically guards against firing unauthorized requests when unauthenticated.
 */
export function usePersonalizedRecommendations(
  options: UsePersonalizedRecommendationsOptions = {}
): UsePersonalizedRecommendationsReturn {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    enabled = true,
    limit = 8,
    top_k,
    retrieval_depth,
    filter_completed = true,
    filter_enrolled = true,
    enable_diversity = true,
    max_courses_per_category,
    preferred_level,
    preferred_category_names,
    preferred_topics,
  } = options;

  const serializedCategories = Array.isArray(preferred_category_names)
    ? preferred_category_names.filter(Boolean).join(',')
    : preferred_category_names;

  const serializedTopics = Array.isArray(preferred_topics)
    ? preferred_topics.filter(Boolean).join(',')
    : preferred_topics;

  const [courses, setCourses] = useState<Course[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [strategyUsed, setStrategyUsed] = useState<string | null>(null);
  const [modelsUsed, setModelsUsed] = useState<string[]>([]);
  const [fusionMethod, setFusionMethod] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState<boolean>(false);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [totalCandidatesRetrieved, setTotalCandidatesRetrieved] = useState<number>(0);
  const [filteredCoursesCount, setFilteredCoursesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(async () => {
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();

    async function loadPersonalized() {
      await Promise.resolve();
      if (!isCurrent) return;

      // If auth state is still resolving or hook is disabled, wait
      if (authLoading || !enabled) {
        if (!enabled) {
          setIsLoading(false);
        }
        return;
      }

      // Do NOT issue protected request if user is unauthenticated
      if (!isAuthenticated || !user) {
        setCourses([]);
        setRecommendations([]);
        setStrategyUsed(null);
        setModelsUsed([]);
        setFusionMethod(null);
        setFallbackUsed(false);
        setFallbackReason(null);
        setTotalCandidatesRetrieved(0);
        setFilteredCoursesCount(0);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await recommendationService.getPersonalizedRecommendations(
          {
            top_k: top_k ?? limit,
            retrieval_depth,
            filter_completed,
            filter_enrolled,
            enable_diversity,
            max_courses_per_category,
            preferred_level,
            preferred_category_names: serializedCategories,
            preferred_topics: serializedTopics,
          },
          { signal: controller.signal }
        );

        if (!isCurrent) return;

        if (response.success && response.data) {
          const rawItems = response.data.recommendations || [];
          setRecommendations(rawItems);
          setStrategyUsed(response.data.strategy_used || null);
          setModelsUsed(response.data.models_used || []);
          setFusionMethod(response.data.fusion_method || null);
          setFallbackUsed(Boolean(response.data.fallback_used));
          setFallbackReason(response.data.fallback_reason ?? null);
          setTotalCandidatesRetrieved(response.data.total_candidates_retrieved ?? 0);
          setFilteredCoursesCount(response.data.filtered_courses_count ?? 0);
          setCourses(rawItems.map((item) => mapApiCourseToCourse(item.course)));
        } else {
          setCourses([]);
          setRecommendations([]);
          setStrategyUsed(null);
          setModelsUsed([]);
          setFusionMethod(null);
          setFallbackUsed(false);
          setFallbackReason(null);
          setTotalCandidatesRetrieved(0);
          setFilteredCoursesCount(0);
        }
      } catch (err: unknown) {
        if (!isCurrent) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        const message =
          err instanceof Error
            ? err.message
            : 'Không thể tải đề xuất cá nhân hóa. Vui lòng thử lại sau.';
        setError(message);
        setCourses([]);
        setRecommendations([]);
        setStrategyUsed(null);
        setModelsUsed([]);
        setFusionMethod(null);
        setFallbackUsed(false);
        setFallbackReason(null);
        setTotalCandidatesRetrieved(0);
        setFilteredCoursesCount(0);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadPersonalized();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [
    authLoading,
    enabled,
    isAuthenticated,
    user,
    limit,
    top_k,
    retrieval_depth,
    filter_completed,
    filter_enrolled,
    enable_diversity,
    max_courses_per_category,
    preferred_level,
    serializedCategories,
    serializedTopics,
    reloadKey,
  ]);

  return {
    courses,
    recommendations,
    strategyUsed,
    modelsUsed,
    fusionMethod,
    fallbackUsed,
    fallbackReason,
    totalCandidatesRetrieved,
    filteredCoursesCount,
    isLoading: authLoading ? false : isLoading,
    error,
    isAuthenticated: Boolean(isAuthenticated && user),
    refetch,
  };
}
