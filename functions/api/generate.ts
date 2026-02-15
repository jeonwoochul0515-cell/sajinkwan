// functions/api/generate.ts

// Replicate API 응답을 위한 타입 정의
interface ReplicateResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[] | null;
  error?: string | null;
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

    // 1. Replicate에 예측 시작 요청 보내기 (InstantID - 얼굴 보존 특화 모델)
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789", // InstantID 최신 버전
        input: {
          image: base64Image,
          prompt: promptText,
          negative_prompt: "western blazer, british school uniform, hogwarts, necktie, plaid skirt, preppy style, sailor uniform, japanese sailor fuku, modern school uniform, mobile phone, smartphone, modern cars, neon lights, makeup, plastic surgery face, anime style, cartoon, sketch, 3d render, blurry, low quality, distorted face, changed face, different person, deformed features, bad anatomy, disfigured, digital look, overly smooth skin, airbrushed",
          num_inference_steps: 30,
          guidance_scale: 5,
          ip_adapter_scale: 0.8,               // 얼굴 디테일 보존 강도 (높을수록 원본 얼굴 유지)
          controlnet_conditioning_scale: 0.8,   // 얼굴 구조 보존 강도 (높을수록 원본 얼굴 유지)
          enhance_nonface_region: true,          // 얼굴 외 영역(배경/옷)만 강화
          output_format: "png",
          output_quality: 90,
          disable_safety_checker: true,
        }
      })
    });

    const responseText = await startResponse.text();
    let prediction: ReplicateResponse;
    try {
      prediction = JSON.parse(responseText);
    } catch {
      console.error('Replicate API 응답 파싱 실패:', responseText);
      return new Response(JSON.stringify({ error: `Replicate API 응답 오류: ${responseText.substring(0, 200)}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (startResponse.status !== 201) {
      console.error('Replicate API 에러:', prediction.error, 'Status:', startResponse.status);
      return new Response(JSON.stringify({ error: prediction.error || `Replicate API 에러 (상태코드: ${startResponse.status})` }), {
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
        return new Response(JSON.stringify({ error: prediction.error || `Polling error (${getResponse.status})` }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 3. 최종 결과를 프론트엔드로 반환
    if (prediction.status === 'succeeded' && prediction.output) {
      const resultUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      return new Response(JSON.stringify({ resultUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: prediction.error || 'Prediction failed or was canceled.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Generate API error:', message, error);
    return new Response(JSON.stringify({ error: `서버 오류가 발생했습니다: ${message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
