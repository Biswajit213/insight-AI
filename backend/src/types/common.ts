import { PaginatedMeta } from '../utils/pagination';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginatedMeta;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
