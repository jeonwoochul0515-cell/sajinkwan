// functions/api/generate.ts
// 역할: Replicate에 예측 시작만 요청하고, prediction ID를 반환

interface Env {
  REPLICATE_API_TOKEN: string;
}

interface RequestBody {
  base64Image: string;
  promptText: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const { base64Image, promptText } = await request.json<RequestBody>();

    if (!env.REPLICATE_API_TOKEN) {
      return new Response(JSON.stringify({ error: 'REPLICATE_API_TOKEN is not set' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Replicate에 예측 시작 요청 (폴링 없이 바로 반환)
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789",
        input: {
          image: base64Image,
          prompt: promptText,
          negative_prompt: "different face, changed face, ugly face, distorted face, deformed face, face swap, western blazer, british school uniform, hogwarts, necktie with suit, plaid skirt, preppy style, japanese sailor fuku, modern school uniform, mobile phone, smartphone, modern cars, neon lights, anime style, cartoon, sketch, 3d render, blurry, low quality, deformed features, bad anatomy, disfigured",
          num_inference_steps: 30,
          guidance_scale: 5,
          ip_adapter_scale: 0.95,
          controlnet_conditioning_scale: 0.95,
          enhance_nonface_region: true,
          output_format: "png",
          output_quality: 90,
          disable_safety_checker: true,
        }
      })
    });

    const responseText = await startResponse.text();
    let prediction: { id?: string; error?: string };
    try {
      prediction = JSON.parse(responseText);
    } catch {
      return new Response(JSON.stringify({ error: `Replicate API 응답 오류: ${responseText.substring(0, 200)}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (startResponse.status !== 201) {
      return new Response(JSON.stringify({ error: prediction.error || `Replicate API 에러 (상태코드: ${startResponse.status})` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // prediction ID만 반환 → 클라이언트가 /api/status로 폴링
    return new Response(JSON.stringify({ predictionId: prediction.id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: `서버 오류가 발생했습니다: ${message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
