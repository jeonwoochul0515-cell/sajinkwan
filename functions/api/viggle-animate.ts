// functions/api/viggle-animate.ts
// 역할: Replicate Moore-AnimateAnyone 모델로 이미지를 애니메이션으로 변환
// 참고: https://replicate.com/zsxkib/moore-animateanyone

import type { Env, AnimateRequest } from '../types';
import { createLogger } from '../utils/logger';
import { validateAnimateRequest } from '../utils/validators';
import { createReplicateClient } from '../utils/replicate';
import { errorToResponse, AuthenticationError } from '../utils/errors';
import { handlePreflight, jsonResponse } from '../utils/cors';

const MOORE_ANIMATEANYONE_VERSION = '8186f4c0e82888b14a8e045c47e59e30479da9e4b29979ae9b9b5901ecf42571';

// 기본 춤 동작 영상 URL들 (public 영상 사용)
const DEFAULT_DANCE_VIDEOS = [
  "https://replicate.delivery/pbxt/KJOGcSzN0r5aGWbgTBssMBQWY1NtfNpBMXVhBFGBqc85r3K/input_video.mp4",
  "https://replicate.delivery/pbxt/KJDdA2f0iP7a3LQWR4GQMbY4LlTfLEy2QVyuJMWHp9Q8mBiB/pose_video.mp4",
];

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  return handlePreflight(context.request);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const startTime = Date.now();
  const { request, env } = context;
  const origin = request.headers.get('Origin') || undefined;
  const logger = createLogger(request, '/api/viggle-animate');

  try {
    logger.logRequestStart('POST', '/api/viggle-animate');

    // 환경 변수 검증
    if (!env.REPLICATE_API_TOKEN) {
      throw new AuthenticationError('REPLICATE_API_TOKEN이 설정되지 않았습니다.');
    }

    // 요청 본문 파싱
    const requestData = await request.json<AnimateRequest>();

    // 입력 검증
    validateAnimateRequest(requestData);

    const { imageUrl, motionVideoUrl } = requestData;

    // 랜덤 기본 춤 동작 선택 또는 사용자 제공 영상 사용
    const motionVideo = motionVideoUrl || DEFAULT_DANCE_VIDEOS[Math.floor(Math.random() * DEFAULT_DANCE_VIDEOS.length)];

    logger.info('Animation 생성 시작', {
      imageUrl: imageUrl.substring(0, 100),
      motionVideo: motionVideo.substring(0, 100),
    });

    // Replicate 클라이언트 생성
    const replicateClient = createReplicateClient(env.REPLICATE_API_TOKEN, logger);

    // Moore-AnimateAnyone 모델 호출
    const prediction = await replicateClient.createPrediction({
      version: MOORE_ANIMATEANYONE_VERSION,
      input: {
        reference_image: imageUrl,
        motion_video: motionVideo,
        seed: Math.floor(Math.random() * 1000000),
        steps: 25, // 품질과 속도 균형
      }
    });

    const duration = Date.now() - startTime;
    logger.logRequestEnd('POST', '/api/viggle-animate', 201, duration);

    return jsonResponse(
      {
        success: true,
        data: {
          predictionId: prediction.id,
          status: prediction.status,
        }
      },
      201,
      origin
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Viggle Animate API 에러', error, { duration });

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
