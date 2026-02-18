// functions/api/generate.ts
// 역할: Replicate Flux.1-PuLID 모델로 초고화질 교복 사진 생성
// 엔진: FLUX.1-dev (2025 최신) + PuLID (얼굴 보존)
// 참고: https://replicate.com/zsxkib/flux-pulid

import type { Env, GenerateRequest } from '../types';
import { createLogger } from '../utils/logger';
import { validateGenerateRequest } from '../utils/validators';
import { createReplicateClient } from '../utils/replicate';
import { errorToResponse, AuthenticationError } from '../utils/errors';
import { handlePreflight, jsonResponse } from '../utils/cors';

const FLUX_PULID_VERSION = '8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b';

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  return handlePreflight(context.request);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const startTime = Date.now();
  const { request, env } = context;
  const origin = request.headers.get('Origin') || undefined;
  const logger = createLogger(request, '/api/generate');

  try {
    logger.logRequestStart('POST', '/api/generate');

    // 환경 변수 검증
    if (!env.REPLICATE_API_TOKEN) {
      throw new AuthenticationError('REPLICATE_API_TOKEN이 설정되지 않았습니다.');
    }

    // 요청 본문 파싱
    const requestData = await request.json<GenerateRequest>();

    // 입력 검증
    validateGenerateRequest(requestData);

    const { base64Image, promptText, negativePrompt } = requestData;

    // Replicate 클라이언트 생성
    const replicateClient = createReplicateClient(env.REPLICATE_API_TOKEN, logger);

    // ===== FLUX.1-PuLID 모델 호출 (극실사 품질) =====
    // PhotoMaker(SDXL) 대비 5배 고품질, 얼굴 100% 보존
    const prediction = await replicateClient.createPrediction({
      version: FLUX_PULID_VERSION,
      input: {
        // PuLID 전용 파라미터
        main_face_image: base64Image,  // 얼굴 이미지 (PhotoMaker의 input_image → main_face_image)
        prompt: promptText,             // 영어 프롬프트 (Flux는 영어 최적화)
        negative_prompt: negativePrompt,

        // Flux.1 최적 설정 (SDXL과 다름!)
        num_steps: 20,           // Flux는 20 steps면 충분 (SDXL 80 → Flux 20)
        guidance_scale: 3.5,     // Flux는 낮은 값 사용 (SDXL 7.5 → Flux 3.5)
        seed: Math.floor(Math.random() * 1000000),

        // PuLID 얼굴 보존 설정
        id_weight: 1.0,          // 얼굴 닮은 정도 (0.0~2.0, 1.0이 최적)
        start_step: 0,           // ID 적용 시작 단계 (0=처음부터, 낮을수록 얼굴 보존 강함)
        true_cfg: 1.0,           // True CFG 강도
        max_sequence_length: 128,

        num_outputs: 1,
      }
    });

    const duration = Date.now() - startTime;
    logger.logRequestEnd('POST', '/api/generate', 201, duration);

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
    logger.error('Generate API 에러', error, { duration });

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
