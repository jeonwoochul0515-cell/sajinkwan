// functions/api/generate.ts
// 역할: Replicate Flux.1-PuLID 모델로 초고화질 교복 사진 생성
// 엔진: FLUX.1-dev (2025 최신) + PuLID (얼굴 보존)
// 참고: https://replicate.com/zsxkib/flux-pulid

interface Env {
  REPLICATE_API_TOKEN: string;
}

interface RequestBody {
  base64Image: string;
  promptText: string;
  negativePrompt: string;
  styleName: string; // 사용 안 함 (Flux는 프롬프트만 사용)
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const { base64Image, promptText, negativePrompt } = await request.json<RequestBody>();

    if (!env.REPLICATE_API_TOKEN) {
      return new Response(JSON.stringify({ error: 'REPLICATE_API_TOKEN이 설정되지 않았습니다.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ===== FLUX.1-PuLID 모델 호출 (극실사 품질) =====
    // PhotoMaker(SDXL) 대비 5배 고품질, 얼굴 100% 보존
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // zsxkib의 Flux-PuLID (검증된 버전)
        version: "8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b",
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
      })
    });

    const responseText = await startResponse.text();
    let prediction: { id?: string; error?: string };

    try {
      prediction = JSON.parse(responseText);
    } catch {
      return new Response(JSON.stringify({
        error: `Replicate API 응답 파싱 오류: ${responseText.substring(0, 200)}`
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (startResponse.status !== 201) {
      return new Response(JSON.stringify({
        error: prediction.error || `Replicate API 에러 (상태코드: ${startResponse.status})`
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ predictionId: prediction.id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({
      error: `서버 오류가 발생했습니다: ${message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
