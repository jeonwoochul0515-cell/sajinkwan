// functions/api/generate.ts

// Replicate API 요청을 위한 타입 정의
interface ReplicateRequest {
  version: string;
  input: {
    input_image: string;
    prompt: string;
    num_steps: number;
    style_strength_ratio: number;
  };
}

// Replicate API 응답을 위한 타입 정의
interface ReplicateResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  version: string;
  input: ReplicateRequest['input'];
  output?: string[] | null;
  error?: string | null;
  logs?: string | null;
  metrics?: {
    predict_time?: number;
  };
  urls: {
    get: string;
    cancel: string;
  };
}

// Cloudflare 환경 변수에 대한 타입 정의
interface Env {
  REPLICATE_API_TOKEN: string;
}

// 요청 본문에 대한 타입 정의
interface RequestBody {
    base64Image: string;
    promptText: string;
}

// 잠시 대기하는 함수 (폴링에 사용)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const { base64Image, promptText } = await request.json<RequestBody>();

    // API 토큰이 설정되지 않았으면 에러 반환
    if (!env.REPLICATE_API_TOKEN) {
      return new Response(JSON.stringify({ error: 'REPLICATE_API_TOKEN is not set' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Replicate에 예측 시작 요청 보내기
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4", // PhotoMaker 모델 버전
        input: {
          input_image: base64Image,
          prompt: promptText + ", person img, realistic, 8k, film grain, old photo texture",
          num_steps: 30,
          style_strength_ratio: 35
        }
      })
    });

    let prediction: ReplicateResponse = await startResponse.json();
    if (startResponse.status !== 201) {
      return new Response(JSON.stringify({ error: prediction.error || `Replicate API error (${startResponse.status})` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. 결과가 나올 때까지 폴링 (일정 간격으로 확인)
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
      await sleep(1000); // 1초 대기
      const getResponse = await fetch(prediction.urls.get, {
        headers: {
          "Authorization": `Token ${env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        }
      });
      prediction = await getResponse.json();
      if (getResponse.status !== 200) {
        return new Response(JSON.stringify({ error: prediction.error }), { status: 500 });
      }
    }

    // 3. 최종 결과를 프론트엔드로 반환
    if (prediction.status === 'succeeded' && prediction.output) {
      return new Response(JSON.stringify({ resultUrl: prediction.output[0] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Prediction failed or was canceled.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
