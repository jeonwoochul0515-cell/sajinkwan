/**
 * CORS 헤더 유틸리티
 */

/**
 * CORS 헤더 생성
 */
export function getCorsHeaders(origin?: string): HeadersInit {
  // 개발 환경에서는 모든 origin 허용, 프로덕션에서는 특정 origin만 허용
  const isDevelopment = origin?.includes('localhost') || origin?.includes('127.0.0.1');

  // 허용할 origin 목록 (프로덕션)
  const allowedOrigins = [
    'https://sajinkwan.pages.dev', // Cloudflare Pages 도메인
    // 커스텀 도메인 추가 가능
  ];

  let allowOrigin = 'null';

  if (isDevelopment) {
    // 개발 환경: 요청된 origin 허용
    allowOrigin = origin || '*';
  } else if (origin && allowedOrigins.includes(origin)) {
    // 프로덕션: 허용 목록에 있는 origin만 허용
    allowOrigin = origin;
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24시간
  };
}

/**
 * Preflight 요청 처리
 */
export function handlePreflight(request: Request): Response {
  const origin = request.headers.get('Origin');
  const headers = getCorsHeaders(origin || undefined);

  return new Response(null, {
    status: 204,
    headers,
  });
}

/**
 * CORS 헤더를 포함한 JSON 응답 생성
 */
export function jsonResponse(
  data: any,
  status: number = 200,
  origin?: string,
  additionalHeaders?: HeadersInit
): Response {
  const corsHeaders = getCorsHeaders(origin);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...corsHeaders,
    ...additionalHeaders,
  };

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

/**
 * 캐싱 헤더 생성
 */
export function getCacheHeaders(status: string): HeadersInit {
  // 완료된 prediction은 캐시 가능
  if (status === 'succeeded' || status === 'failed' || status === 'canceled') {
    return {
      'Cache-Control': 'public, max-age=3600', // 1시간 캐시
    };
  }

  // 진행 중인 prediction은 캐시 안 함
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };
}
