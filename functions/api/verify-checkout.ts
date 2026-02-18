// functions/api/verify-checkout.ts
// 역할: Polar.sh 결제 완료 여부 확인

import type { Env } from '../types';
import { handlePreflight, jsonResponse } from '../utils/cors';
import { errorToResponse, AuthenticationError, ValidationError, AppError } from '../utils/errors';

const POLAR_API_BASE = 'https://api.polar.sh';

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  return handlePreflight(context.request);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || undefined;

  try {
    if (!env.POLAR_ACCESS_TOKEN) {
      throw new AuthenticationError('POLAR_ACCESS_TOKEN이 설정되지 않았습니다.');
    }

    const body = await request.json<{ checkoutId: string }>();
    if (!body.checkoutId?.trim()) {
      throw new ValidationError('checkoutId가 필요합니다.');
    }

    // Polar 체크아웃 상태 조회
    const response = await fetch(`${POLAR_API_BASE}/v1/checkouts/${body.checkoutId}`, {
      headers: {
        'Authorization': `Bearer ${env.POLAR_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      const err: any = await response.json().catch(() => ({}));
      throw new AppError(err.detail || `Polar API 오류 (${response.status})`, response.status);
    }

    const checkout: any = await response.json();

    return jsonResponse({
      success: true,
      data: {
        status: checkout.status,
        succeeded: checkout.status === 'succeeded',
      },
    }, 200, origin);

  } catch (error) {
    const errorResponse = errorToResponse(error);
    const headers = new Headers(errorResponse.headers);
    if (origin) headers.set('Access-Control-Allow-Origin', origin);
    return new Response(errorResponse.body, { status: errorResponse.status, headers });
  }
};
