/**
 * TMDEMY — Question API Contract Types (api/QUESTION_API.md)
 */

import { ApiQuizQuestion } from './quiz';

export interface CreateQuestionDto {
  quiz: string;
  type: 'multiple_choice' | 'fill_in_blank';
  title: string;
  options?: string[];
  answer: string;
  points?: number;
}

export interface CreateQuestionResponse {
  success: boolean;
  message: string;
  data: ApiQuizQuestion;
}

export interface UpdateQuestionDto {
  title?: string;
  type?: 'multiple_choice' | 'fill_in_blank';
  options?: string[];
  answer?: string;
  points?: number;
}

export interface UpdateQuestionResponse {
  success: boolean;
  message?: string;
  data: ApiQuizQuestion;
}

export interface DeleteQuestionResponse {
  success: boolean;
  message: string;
}
