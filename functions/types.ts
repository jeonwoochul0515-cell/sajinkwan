/**
 * 공통 타입 정의
 */

// 환경 변수 타입
export interface Env {
  REPLICATE_API_TOKEN: string;
}

// API 요청 타입
export interface GenerateRequest {
  base64Image: string;
  promptText: string;
  negativePrompt: string;
  styleName: string;
}

export interface AnimateRequest {
  imageUrl: string;
  motionVideoUrl?: string;
}

export interface StatusRequest {
  predictionId: string;
}

// API 응답 타입
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export interface GenerateResponse {
  predictionId: string;
  status: string;
}

export interface AnimateResponse {
  predictionId: string;
  status: string;
}

export interface StatusResponse {
  id: string;
  status: ReplicateStatus;
  output?: string | string[] | null;
  error?: string | null;
}

// Replicate API 타입
export type ReplicateStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';

export interface ReplicatePrediction {
  id: string;
  status: ReplicateStatus;
  output?: string | string[] | null;
  error?: string | null;
  logs?: string;
  metrics?: {
    predict_time?: number;
  };
}

export interface ReplicateCreateInput {
  version: string;
  input: Record<string, any>;
}

// 로깅 타입
export interface LogContext {
  requestId?: string;
  endpoint?: string;
  duration?: number;
  [key: string]: any;
}

export type LogLevel = 'info' | 'warn' | 'error';
