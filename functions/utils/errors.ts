/**
 * 커스텀 에러 클래스 및 에러 처리 유틸리티
 */

export class AppError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errorCode: string = 'VALIDATION_ERROR') {
    super(message, 400, errorCode);
  }
}

export class ReplicateAPIError extends AppError {
  originalError?: any;

  constructor(
    message: string,
    originalError?: any,
    errorCode: string = 'REPLICATE_API_ERROR'
  ) {
    super(message, 502, errorCode);
    this.originalError = originalError;
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = '요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요.') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = '요청 시간이 초과되었습니다.') {
    super(message, 504, 'TIMEOUT_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = '인증에 실패했습니다.') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * 에러를 JSON 응답으로 변환
 */
export function errorToResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        errorCode: error.errorCode,
      }),
      {
        status: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // 알 수 없는 에러
  console.error('Unknown error:', error);
  return new Response(
    JSON.stringify({
      success: false,
      error: '서버 오류가 발생했습니다.',
      errorCode: 'INTERNAL_ERROR',
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Replicate API 에러 파싱
 */
export function parseReplicateError(error: any): ReplicateAPIError {
  let message = 'Replicate API 요청에 실패했습니다.';

  if (error?.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  // 특정 에러 패턴 감지
  if (message.includes('rate limit') || message.includes('429')) {
    throw new RateLimitError();
  }

  if (message.includes('timeout') || message.includes('timed out')) {
    throw new TimeoutError();
  }

  if (message.includes('unauthorized') || message.includes('401')) {
    throw new AuthenticationError('Replicate API 인증에 실패했습니다.');
  }

  return new ReplicateAPIError(message, error);
}
