// functions/api/status.ts
// 역할: prediction ID로 Replicate 상태를 1회 조회하여 반환
// 클라이언트(브라우저)가 이 엔드포인트를 반복 호출하여 폴링

import type { Env, StatusRequest } from '../types';
import { createLogger } from '../utils/logger';
import { validateStatusRequest } from '../utils/validators';
import { createReplicateClient } from '../utils/replicate';
import { errorToResponse, AuthenticationError } from '../utils/errors';
import { handlePreflight, jsonResponse, getCacheHeaders } from '../utils/cors';

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  return handlePreflight(context.request);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const startTime = Date.now();
  const { request, env } = context;
  const origin = request.headers.get('Origin') || undefined;
  const logger = createLogger(request, '/api/status');

  try {
    logger.logRequestStart('POST', '/api/status');

    // 환경 변수 검증
    if (!env.REPLICATE_API_TOKEN) {
      throw new AuthenticationError('REPLICATE_API_TOKEN이 설정되지 않았습니다.');
    }

    // 요청 본문 파싱
    const requestData = await request.json<StatusRequest>();

    // 입력 검증
    validateStatusRequest(requestData);

    const { predictionId } = requestData;

    logger.info('Prediction 상태 조회', { predictionId });

    // Replicate 클라이언트 생성
    const replicateClient = createReplicateClient(env.REPLICATE_API_TOKEN, logger);

    // Replicate에 상태 1회 조회 (subrequest 1개만 사용)
    const prediction = await replicateClient.getPrediction(predictionId);

    // 완료된 경우: 결과 URL 반환
    if (prediction.status === 'succeeded' && prediction.output) {
      const resultUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;

      const duration = Date.now() - startTime;
      logger.logRequestEnd('POST', '/api/status', 200, duration);

      // 캐싱 헤더 포함
      const cacheHeaders = getCacheHeaders(prediction.status);

      return jsonResponse(
        {
          success: true,
          data: {
            status: 'succeeded',
            resultUrl,
          }
        },
        200,
        origin,
        cacheHeaders
      );
    }

    // 실패한 경우
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      const duration = Date.now() - startTime;
      logger.warn('Prediction 실패 또는 취소', {
        predictionId,
        status: prediction.status,
        error: prediction.error,
        duration,
      });

      // 캐싱 헤더 포함
      const cacheHeaders = getCacheHeaders(prediction.status);

      return jsonResponse(
        {
          success: false,
          data: {
            status: prediction.status,
          },
          error: prediction.error || '변환에 실패했습니다.',
        },
        200,
        origin,
        cacheHeaders
      );
    }

    // 아직 진행 중
    const duration = Date.now() - startTime;
    logger.logRequestEnd('POST', '/api/status', 200, duration);

    // 진행 중인 경우 캐시 안 함
    const cacheHeaders = getCacheHeaders(prediction.status);

    return jsonResponse(
      {
        success: true,
        data: {
          status: prediction.status,
        }
      },
      200,
      origin,
      cacheHeaders
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Status API 에러', error, { duration });

    const errorResponse = errorToResponse(error);
    // CORS 헤더 추가
    const corsHeaders = origin ? { 'Access-Control-Allow-Origin': origin } : {};
    const headers = new Headers(errorResponse.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return new Response(errorResponse.body, {
      status: errorResponse.status,
      headers,
    });
  }
};
