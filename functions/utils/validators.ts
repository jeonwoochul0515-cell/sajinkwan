/**
 * 입력 검증 유틸리티
 */

import { ValidationError } from './errors';

// 상수
const MAX_BASE64_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PROMPT_LENGTH = 2000;

/**
 * Base64 문자열 검증
 */
export function validateBase64Image(base64: string): void {
  if (!base64 || typeof base64 !== 'string') {
    throw new ValidationError('이미지 데이터가 필요합니다.', 'MISSING_IMAGE');
  }

  // Base64 형식 확인
  const base64Pattern = /^data:image\/(jpeg|png|webp);base64,/;
  if (!base64Pattern.test(base64)) {
    throw new ValidationError(
      '지원하지 않는 이미지 형식입니다. JPEG, PNG, WebP만 지원합니다.',
      'INVALID_IMAGE_FORMAT'
    );
  }

  // 크기 확인 (Base64는 원본의 약 1.37배)
  const sizeInBytes = (base64.length * 3) / 4;
  if (sizeInBytes > MAX_BASE64_SIZE) {
    throw new ValidationError(
      `이미지 크기가 너무 큽니다. 최대 ${MAX_BASE64_SIZE / 1024 / 1024}MB까지 업로드할 수 있습니다.`,
      'IMAGE_TOO_LARGE'
    );
  }
}

/**
 * URL 검증
 */
export function validateUrl(url: string, allowedDomains?: string[]): void {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('URL이 필요합니다.', 'MISSING_URL');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new ValidationError('유효하지 않은 URL입니다.', 'INVALID_URL');
  }

  // HTTPS만 허용
  if (parsedUrl.protocol !== 'https:') {
    throw new ValidationError('HTTPS URL만 허용됩니다.', 'INVALID_URL_PROTOCOL');
  }

  // 허용된 도메인 확인
  if (allowedDomains && allowedDomains.length > 0) {
    const hostname = parsedUrl.hostname;
    const isAllowed = allowedDomains.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      throw new ValidationError(
        `허용되지 않은 도메인입니다. 허용된 도메인: ${allowedDomains.join(', ')}`,
        'DOMAIN_NOT_ALLOWED'
      );
    }
  }
}

/**
 * 프롬프트 검증
 */
export function validatePrompt(prompt: string, fieldName: string = '프롬프트'): void {
  if (!prompt || typeof prompt !== 'string') {
    throw new ValidationError(`${fieldName}가 필요합니다.`, 'MISSING_PROMPT');
  }

  if (prompt.trim().length === 0) {
    throw new ValidationError(`${fieldName}를 입력해주세요.`, 'EMPTY_PROMPT');
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new ValidationError(
      `${fieldName}가 너무 깁니다. 최대 ${MAX_PROMPT_LENGTH}자까지 입력할 수 있습니다.`,
      'PROMPT_TOO_LONG'
    );
  }
}

/**
 * 필수 필드 검증
 */
export function validateRequired<T>(value: T, fieldName: string): void {
  if (value === undefined || value === null) {
    throw new ValidationError(`${fieldName}가 필요합니다.`, 'MISSING_FIELD');
  }
}

/**
 * 문자열 sanitization (XSS 방지)
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/[<>]/g, '') // HTML 태그 제거
    .trim();
}

/**
 * GenerateRequest 검증
 */
export function validateGenerateRequest(data: any): void {
  validateRequired(data, '요청 데이터');
  validateBase64Image(data.base64Image);
  validatePrompt(data.promptText, '프롬프트');
  validatePrompt(data.negativePrompt, '네거티브 프롬프트');
  validateRequired(data.styleName, '스타일 이름');

  // Sanitize
  if (typeof data.promptText === 'string') {
    data.promptText = sanitizeString(data.promptText);
  }
  if (typeof data.negativePrompt === 'string') {
    data.negativePrompt = sanitizeString(data.negativePrompt);
  }
  if (typeof data.styleName === 'string') {
    data.styleName = sanitizeString(data.styleName);
  }
}

/**
 * AnimateRequest 검증
 */
export function validateAnimateRequest(data: any): void {
  validateRequired(data, '요청 데이터');

  // Replicate, Cloudflare 도메인 허용
  const allowedDomains = ['replicate.delivery', 'replicate.com'];
  validateUrl(data.imageUrl, allowedDomains);

  // motionVideoUrl은 선택적
  if (data.motionVideoUrl) {
    validateUrl(data.motionVideoUrl, allowedDomains);
  }
}

/**
 * StatusRequest 검증
 */
export function validateStatusRequest(data: any): void {
  validateRequired(data, '요청 데이터');
  validateRequired(data.predictionId, 'Prediction ID');

  if (typeof data.predictionId !== 'string' || data.predictionId.trim().length === 0) {
    throw new ValidationError('유효하지 않은 Prediction ID입니다.', 'INVALID_PREDICTION_ID');
  }
}
