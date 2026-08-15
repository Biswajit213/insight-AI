export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  DATASET_NOT_FOUND = 'DATASET_NOT_FOUND',
  DATASET_PROCESSING_FAILED = 'DATASET_PROCESSING_FAILED',
  CONVERSATION_NOT_FOUND = 'CONVERSATION_NOT_FOUND',
  REPORT_NOT_FOUND = 'REPORT_NOT_FOUND',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, statusCode: number = 500, code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: Record<string, unknown>) {
    super(message, 400, ErrorCode.BAD_REQUEST, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access token', details?: Record<string, unknown>) {
    super(message, 401, ErrorCode.UNAUTHORIZED, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied to resource', details?: Record<string, unknown>) {
    super(message, 403, ErrorCode.FORBIDDEN, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Requested resource not found', code: ErrorCode = ErrorCode.NOT_FOUND) {
    super(message, 404, code);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later.') {
    super(message, 429, ErrorCode.RATE_LIMIT_EXCEEDED);
  }
}
