/**
 * Replicate API 래퍼
 */

import type { ReplicatePrediction, ReplicateCreateInput } from '../types';
import { parseReplicateError, TimeoutError, AuthenticationError } from './errors';
import { Logger } from './logger';

const REPLICATE_API_BASE = 'https://api.replicate.com/v1';
const DEFAULT_TIMEOUT = 30000; // 30초
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1초

/**
 * 지수 백오프로 대기
 */
async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new TimeoutError('Replicate API 요청 시간이 초과되었습니다.');
    }
    throw error;
  }
}

/**
 * Replicate API Client
 */
export class ReplicateClient {
  private apiToken: string;
  private logger: Logger;

  constructor(apiToken: string, logger: Logger) {
    if (!apiToken || typeof apiToken !== 'string' || apiToken.trim().length === 0) {
      throw new AuthenticationError('Replicate API 토큰이 설정되지 않았습니다.');
    }
    this.apiToken = apiToken;
    this.logger = logger;
  }

  /**
   * Replicate API 호출 (리트라이 포함)
   */
  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit,
    retryCount: number = 0
  ): Promise<T> {
    const url = `${REPLICATE_API_BASE}${endpoint}`;

    try {
      const response = await fetchWithTimeout(url, {
        ...options,
        headers: {
          'Authorization': `Token ${this.apiToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // 에러 응답 처리
      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.error || `HTTP ${response.status}`;

        // 리트라이 가능한 상태 코드
        const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
        if (retryableStatusCodes.includes(response.status) && retryCount < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
          this.logger.warn(`Replicate API 에러, ${delay}ms 후 재시도 (${retryCount + 1}/${MAX_RETRIES})`, {
            status: response.status,
            error: errorMessage,
          });
          await wait(delay);
          return this.makeRequest<T>(endpoint, options, retryCount + 1);
        }

        throw parseReplicateError(errorMessage);
      }

      return await response.json();
    } catch (error) {
      // 네트워크 에러 등 리트라이 가능한 경우
      if (retryCount < MAX_RETRIES && !(error instanceof TimeoutError)) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        this.logger.warn(`Replicate API 네트워크 에러, ${delay}ms 후 재시도 (${retryCount + 1}/${MAX_RETRIES})`, {
          error: error instanceof Error ? error.message : String(error),
        });
        await wait(delay);
        return this.makeRequest<T>(endpoint, options, retryCount + 1);
      }

      throw parseReplicateError(error);
    }
  }

  /**
   * Prediction 생성
   */
  async createPrediction(input: ReplicateCreateInput): Promise<ReplicatePrediction> {
    const startTime = Date.now();
    this.logger.logReplicateCall('createPrediction', input.version);

    const prediction = await this.makeRequest<ReplicatePrediction>('/predictions', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    const duration = Date.now() - startTime;
    this.logger.logReplicateResponse(prediction.id, prediction.status, duration);

    return prediction;
  }

  /**
   * Prediction 상태 조회
   */
  async getPrediction(predictionId: string): Promise<ReplicatePrediction> {
    const startTime = Date.now();

    const prediction = await this.makeRequest<ReplicatePrediction>(
      `/predictions/${predictionId}`,
      {
        method: 'GET',
      }
    );

    const duration = Date.now() - startTime;
    this.logger.logReplicateResponse(prediction.id, prediction.status, duration);

    return prediction;
  }

  /**
   * Prediction 취소
   */
  async cancelPrediction(predictionId: string): Promise<ReplicatePrediction> {
    this.logger.info(`Canceling prediction: ${predictionId}`);

    return await this.makeRequest<ReplicatePrediction>(
      `/predictions/${predictionId}/cancel`,
      {
        method: 'POST',
      }
    );
  }
}

/**
 * ReplicateClient 생성 헬퍼
 */
export function createReplicateClient(apiToken: string, logger: Logger): ReplicateClient {
  return new ReplicateClient(apiToken, logger);
}
