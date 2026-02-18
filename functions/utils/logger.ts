/**
 * 구조화된 로깅 시스템
 */

import type { LogLevel, LogContext } from '../types';

/**
 * 요청 ID 생성
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 로그 메시지 포맷팅
 */
function formatLogMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}]${context?.requestId ? ` [${context.requestId}]` : ''} ${message}${contextStr}`;
}

/**
 * 로거 클래스
 */
export class Logger {
  private requestId?: string;
  private endpoint?: string;

  constructor(requestId?: string, endpoint?: string) {
    this.requestId = requestId;
    this.endpoint = endpoint;
  }

  private log(level: LogLevel, message: string, additionalContext?: LogContext) {
    const context: LogContext = {
      requestId: this.requestId,
      endpoint: this.endpoint,
      ...additionalContext,
    };

    const formattedMessage = formatLogMessage(level, message, context);

    switch (level) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'info':
      default:
        console.log(formattedMessage);
        break;
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext: LogContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };
    this.log('error', message, errorContext);
  }

  /**
   * API 요청 시작 로그
   */
  logRequestStart(method: string, url: string) {
    this.info(`Request started: ${method} ${url}`);
  }

  /**
   * API 요청 완료 로그
   */
  logRequestEnd(method: string, url: string, statusCode: number, duration: number) {
    this.info(`Request completed: ${method} ${url}`, {
      statusCode,
      duration,
      durationMs: `${duration}ms`,
    });
  }

  /**
   * Replicate API 호출 로그
   */
  logReplicateCall(action: string, modelVersion: string) {
    this.info(`Replicate API call: ${action}`, { modelVersion });
  }

  /**
   * Replicate API 응답 로그
   */
  logReplicateResponse(predictionId: string, status: string, duration: number) {
    this.info(`Replicate API response`, {
      predictionId,
      status,
      duration,
      durationMs: `${duration}ms`,
    });
  }
}

/**
 * 싱글톤 로거 (요청 컨텍스트 없음)
 */
export const logger = new Logger();

/**
 * 요청별 로거 생성
 */
export function createLogger(request: Request, endpoint?: string): Logger {
  const requestId = generateRequestId();
  return new Logger(requestId, endpoint || new URL(request.url).pathname);
}
