// functions/api/generate.ts
// 역할: Replicate PhotoMaker 모델에 예측 시작 요청, prediction ID 반환

interface Env {
  REPLICATE_API_TOKEN: string;
}

interface RequestBody {
  base64Image: string;
  promptText: string;
  negativePrompt: string;
  styleName: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const { base64Image, promptText, negativePrompt, styleName } = await request.json<RequestBody>();

    if (!env.REPLICATE_API_TOKEN) {
      return new Response(JSON.stringify({ error: 'REPLICATE_API_TOKEN is not set' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // PhotoMaker 모델 호출 (InstantID 대비 4.5배 저렴, 4배 빠름)
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        input: {
          input_image: base64Image,
          prompt: promptText,
          negative_prompt: negativePrompt,
          style_name: styleName,
          num_steps: 30,
          guidance_scale: 6,
          style_strength_ratio: 35,
          num_outputs: 1,
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
