// functions/api/status.ts
// 역할: prediction ID로 Replicate 상태를 1회 조회하여 반환
// 클라이언트(브라우저)가 이 엔드포인트를 반복 호출하여 폴링

interface Env {
  REPLICATE_API_TOKEN: string;
}

interface StatusRequestBody {
  predictionId: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const { predictionId } = await request.json<StatusRequestBody>();

    if (!env.REPLICATE_API_TOKEN) {
      return new Response(JSON.stringify({ error: 'REPLICATE_API_TOKEN is not set' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!predictionId) {
      return new Response(JSON.stringify({ error: 'predictionId가 필요합니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Replicate에 상태 1회 조회 (subrequest 1개만 사용)
    const getResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        "Authorization": `Token ${env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      }
    });

    const prediction = await getResponse.json<{
      status: string;
      output?: string[] | null;
      error?: string | null;
    }>();

    if (getResponse.status !== 200) {
      return new Response(JSON.stringify({ error: prediction.error || `상태 조회 실패 (${getResponse.status})` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 완료된 경우: 결과 URL 반환
    if (prediction.status === 'succeeded' && prediction.output) {
      const resultUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      return new Response(JSON.stringify({ status: 'succeeded', resultUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 실패한 경우
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      return new Response(JSON.stringify({ status: prediction.status, error: prediction.error || '변환에 실패했습니다.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 아직 진행 중
    return new Response(JSON.stringify({ status: prediction.status }), {
      status: 200,
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
