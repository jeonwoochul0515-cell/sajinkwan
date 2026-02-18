// functions/api/checkout.ts
// 역할: Polar.sh 결제 세션 생성

import type { Env } from '../types';
import { handlePreflight, jsonResponse } from '../utils/cors';
import { errorToResponse, AuthenticationError, AppError } from '../utils/errors';

const POLAR_API_BASE = 'https://api.polar.sh';
const PRODUCT_ID = 'c939d463-1bb1-44bc-9e9b-1b78aa764aed';

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

    // 결제 완료 후 돌아올 URL (checkout_id 포함)
    const appOrigin = origin?.includes('localhost') || origin?.includes('127.0.0.1')
      ? (origin || 'http://localhost:8788')
      : 'https://sajinkwan.pages.dev';
    const successUrl = `${appOrigin}/?checkout_id={CHECKOUT_ID}`;

    // Polar 체크아웃 세션 생성
    const response = await fetch(`${POLAR_API_BASE}/v1/checkouts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: PRODUCT_ID,
        success_url: successUrl,
      }),
    });

    if (!response.ok) {
      const err: any = await response.json().catch(() => ({}));
      throw new AppError(err.detail || `Polar API 오류 (${response.status})`, response.status);
    }

    const checkout: any = await response.json();

    return jsonResponse({
      success: true,
      data: {
        checkoutId: checkout.id,
        checkoutUrl: checkout.url,
      },
    }, 200, origin);

  } catch (error) {
    const errorResponse = errorToResponse(error);
    const headers = new Headers(errorResponse.headers);
    if (origin) headers.set('Access-Control-Allow-Origin', origin);
    return new Response(errorResponse.body, { status: errorResponse.status, headers });
  }
};
