// functions/api/viggle-animate.ts
// 역할: Replicate Moore-AnimateAnyone 모델로 이미지를 애니메이션으로 변환
// 참고: https://replicate.com/zsxkib/moore-animateanyone

interface Env {
  REPLICATE_API_TOKEN: string;
}

interface RequestBody {
  imageUrl: string;
  motionVideoUrl?: string; // 춤 동작 참조 영상 URL (선택)
}

// 기본 춤 동작 영상 URL들 (public 영상 사용)
const DEFAULT_DANCE_VIDEOS = [
  "https://replicate.delivery/pbxt/KJOGcSzN0r5aGWbgTBssMBQWY1NtfNpBMXVhBFGBqc85r3K/input_video.mp4",
  "https://replicate.delivery/pbxt/KJDdA2f0iP7a3LQWR4GQMbY4LlTfLEy2QVyuJMWHp9Q8mBiB/pose_video.mp4",
];

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const { imageUrl, motionVideoUrl } = await request.json<RequestBody>();

    if (!env.REPLICATE_API_TOKEN) {
      return new Response(JSON.stringify({ error: 'REPLICATE_API_TOKEN이 설정되지 않았습니다.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'imageUrl이 필요합니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 랜덤 기본 춤 동작 선택 또는 사용자 제공 영상 사용
    const motionVideo = motionVideoUrl || DEFAULT_DANCE_VIDEOS[Math.floor(Math.random() * DEFAULT_DANCE_VIDEOS.length)];

    // Moore-AnimateAnyone 모델 호출
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "8186f4c0e82888b14a8e045c47e59e30479da9e4b29979ae9b9b5901ecf42571",
        input: {
          reference_image: imageUrl,
          motion_video: motionVideo,
          seed: Math.floor(Math.random() * 1000000),
          steps: 25, // 품질과 속도 균형
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
