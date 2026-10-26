/**
 * Rating & Review API Contract Types (api/RATING_API.md)
 */
export interface ApiRatingUser {
  id?: string;
  _id?: string;
  username: string;
  avatar?: string;
}

export interface ApiRatingItem {
  id?: string;
  _id?: string;
  rate: number;
  content: string;
  createdAt: string;
  user?: ApiRatingUser;
}

export interface GetCourseRatingsResponse {
  success: boolean;
  message?: string;
  data: {
    averageRating: number;
    totalRatings: number;
    ratings: ApiRatingItem[];
  };
}

export interface CreateRatingPayload {
  courseId: string;
  rate: number;
  content: string;
}

export interface CreateRatingResponse {
  success: boolean;
  message?: string;
  data: {
    id?: string;
    _id?: string;
    courseId: string;
    userId: string;
    rate: number;
    content: string;
    status: string;
    createdAt: string;
  };
}
