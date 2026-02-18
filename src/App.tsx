import { useState, useEffect, type ChangeEvent } from 'react';
import './App.css';

// Kakao SDK 타입 선언
declare global {
  interface Window {
    Kakao: any;
  }
}

// ===== 한국 1970-80년대 교복 프롬프트 (30+ 웹 소스 기반) =====
// 출처: 한국민족문화대백과, 국가기록원, 말죽거리잔혹사 고증, YTN 교복 변천사 등

// ===== 배경 풀: 실제 한국 학교 사진 배경 =====
const BACKGROUNDS: Record<string, string[]> = {
  male_uniform: [
    "grey concrete wall school corridor with wooden window frames, 1970s Korea",
    "retro Korean photo studio with plain grey backdrop and fluorescent lights",
    "old Korean school gate with stone pillars and iron fence, overcast sky",
    "narrow Seoul alley with low brick walls and slate rooftops, 1978",
    "school courtyard with dirt ground and white boundary lines",
  ],
  female_uniform: [
    "old Korean school campus with cherry blossom trees in spring",
    "retro Seoul street with old signboards and concrete low-rise buildings, 1970s",
    "Korean photo studio with painted nature backdrop, soft lighting",
    "school garden with wooden bench and small flower bed",
    "classroom window with white curtains and afternoon sunlight",
  ],
  military_training: [
    "dusty school dirt playground with white goalposts, 1970s Korea",
    "military drill ground with Korean flag pole and assembly area",
    "open field training ground with low hills and sparse trees",
    "school yard with students lined up in formation background",
    "rural Korean road with rice paddies visible in distance",
  ],
  graduation: [
    "plain grey backdrop photo studio with professional flash, 1970s Korea",
    "school auditorium stage with wooden podium and Korean flag",
    "school main entrance with carved stone school name plaque",
    "cherry blossom tree lined school path in spring",
  ],
  picnic: [
    "Korean countryside with green rice paddies and distant mountains, 1980s",
    "Gyeongju Bulguksa temple grounds with stone stairs",
    "riverside park with old stone bridge and willow trees",
    "mountain trail with wooden railing and autumn foliage",
    "seaside beach with fishing boats and rocky shoreline",
  ],
  gym_class: [
    "school dirt field with white painted boundary lines for sports",
    "outdoor concrete basketball court with old metal backboard",
    "school athletic meet with colored tents and Korean flags",
    "cinder running track with dusty red-brown surface",
  ],
  classroom: [
    "1970s Korean classroom with dark wooden desks in rows, green chalkboard with Korean writing",
    "classroom with tall windows, white curtains blowing, afternoon golden hour light",
    "study hall with fluorescent tube lights and students at desks with textbooks",
    "classroom back corner with potted plant and handwritten class duty chart on wall",
  ],
  group_photo: [
    "school playground with entire class lined up in neat rows, 1970s Korea",
    "school front gate with engraved school name on stone monument",
    "classroom interior with students standing in front of green chalkboard",
    "school rooftop with Seoul cityscape and large water tank in background",
  ],
};

// ===== Flux.1 최적화 프롬프트 (영어 자연어 스타일) =====
const STYLE_CONFIGS: Record<string, { prompt: string; photomakerStyle: string }> = {
  male_uniform: {
    // Flux는 대화형 영어 프롬프트를 선호
    // "a photo of" 대신 자연스러운 설명
    prompt: "A cinematic photo of a Korean male high school student in authentic 1970s uniform. " +
      "He is wearing a black stand-up collar jacket (Mandarin collar, ipkit style) with metal hook closures fastened to the top, " +
      "white dress shirt visible at the collar, white plastic name tag on left chest pocket. " +
      "Black straight-leg trousers, short neat hair. Standing in a natural pose. " +
      "Shot on vintage 35mm film, Kodak Gold 200, film grain, warm tones, shallow depth of field. " +
      "1970s Korean school atmosphere, photorealistic, highly detailed, masterpiece quality",
    photomakerStyle: "Cinematic",
  },
  female_uniform: {
    prompt: "A cinematic photo of a Korean female high school student in authentic 1970s school uniform. " +
      "She is wearing a white peter pan collar blouse with long sleeves, " +
      "black sleeveless vest or black jumper dress worn over the blouse, " +
      "dark pleated skirt reaching below the knees. White ankle socks and black Mary Jane shoes. " +
      "Neat hairstyle with hair tied back, proper standing posture with hands clasped in front. " +
      "Shot on vintage 35mm film, Kodak Gold 200, soft natural lighting, film grain, warm nostalgic tones. " +
      "1970s Korean school setting, photorealistic, highly detailed, elegant composition, masterpiece",
    photomakerStyle: "Cinematic",
  },
  military_training: {
    prompt: "A photorealistic portrait of a Korean student in 1970s military training uniform (Kyoryunbok). " +
      "Wearing olive green or camouflage pattern long-sleeve shirt with chest pockets and epaulettes, " +
      "matching military-style trousers neatly tucked into polished black combat boots. " +
      "Olive green beret or patrol cap worn at regulation angle. Standing at formal military attention. " +
      "Shot on vintage film camera, gritty texture, dramatic lighting, film grain. " +
      "1970s Korean school military drill atmosphere, serious expression, photorealistic detail, masterpiece",
    photomakerStyle: "Cinematic",
  },
  graduation: {
    prompt: "A formal 1970s Korean high school graduation portrait photograph. " +
      "Subject wearing pristine black school uniform with Mandarin collar buttoned all the way to the top, " +
      "white plastic name tag clearly visible on the left chest. " +
      "Facing directly forward with shoulders squared, perfect posture, neat hair meticulously groomed. " +
      "Professional studio portrait lighting with soft key light and fill, clean grey backdrop. " +
      "Sharp focus on face, formal ID photograph style, vintage photo studio quality. " +
      "Shot on medium format film camera, classic portrait composition, highly detailed, photorealistic",
    photomakerStyle: "Cinematic",
  },
  picnic: {
    prompt: "A candid photo from a 1980s Korean school picnic excursion. " +
      "Subject wearing a casual jacket or cardigan layered over school uniform pieces, " +
      "carrying a weathered canvas backpack and vintage metal canteen strapped across the shoulder. " +
      "Relaxed, natural posture in outdoor setting. " +
      "Beautiful Korean countryside or historical site in background - mountains, temples, or rice paddies. " +
      "Shot on consumer film camera, Kodak Gold, natural sunlight, candid snapshot aesthetic, " +
      "slight motion blur, authentic 1980s nostalgia, warm film tones, photorealistic",
    photomakerStyle: "Cinematic",
  },
  gym_class: {
    prompt: "An action photo from 1970s Korean school physical education class. " +
      "Subject wearing classic white short-sleeve cotton t-shirt and navy blue athletic shorts, " +
      "white canvas sneakers with white crew socks. " +
      "Captured mid-exercise in dynamic athletic pose showing movement and energy. " +
      "Outdoor school sports field with dirt ground, white painted boundary lines visible. " +
      "Natural daylight, high shutter speed freeze-frame, film grain, " +
      "vintage sports photography style, 1970s Korea, photorealistic detail",
    photomakerStyle: "Cinematic",
  },
  classroom: {
    prompt: "An intimate candid photo inside a 1970s Korean classroom. " +
      "Subject sitting at a dark wooden school desk, wearing black school uniform, " +
      "absorbed in writing in a notebook with focused concentration. " +
      "Green chalkboard visible in the soft-focus background with Korean writing, " +
      "fluorescent tube lights creating overhead ambient lighting. " +
      "Dust particles visible in afternoon window light. " +
      "Shot on 35mm film, natural indoor lighting, documentary photography style, " +
      "authentic 1970s classroom atmosphere, photorealistic, detailed textures",
    photomakerStyle: "Cinematic",
  },
  group_photo: {
    prompt: "A formal 1970s Korean class group photograph. " +
      "Subject standing in organized rows alongside classmates, all wearing black school uniforms " +
      "with collars properly buttoned. Formal standing pose with proper posture. " +
      "School playground or building facade in background. " +
      "Shot with vintage camera flash creating classic group photo lighting with subtle shadows. " +
      "Multiple students visible but subject clearly distinguished. " +
      "Classic yearbook photography style, vintage film quality, 1970s Korea, " +
      "sharp focus on faces, photorealistic group portrait",
    photomakerStyle: "Cinematic",
  },
};

// ===== 부정 프롬프트: 일본식 요소 명시 차단 + 얼굴 변경 강력 차단 =====
const NEGATIVE_PROMPT =
  "different face, changed face, different person, face swap, face morph, face replacement, altered facial features, " +
  "gakuran, japanese school uniform, sailor fuku, blazer, necktie, suspenders, " +
  "western school uniform, british uniform, plaid pattern, " +
  "modern clothes, hoodie, sneakers with logos, " +
  "ugly, deformed, blurry, low quality, worst quality, bad quality, jpeg artifacts, " +
  "overexposed, underexposed, oversaturated, " +
  "anime, cartoon, manga style, 3d render, digital painting, illustration, " +
  "plastic surgery face, k-pop idol face, celebrity face, model face, " +
  "nsfw, nudity";

const MASTER_SUFFIX =
  "IMPORTANT: preserve exact original face, maintain all facial features identical to input photo, " +
  "high quality, sharp focus, detailed, professional photography, " +
  "analog film photograph on Kodak Gold 200, natural film grain, " +
  "vintage warm tone, authentic 1970s-1980s South Korea period photo, " +
  "photorealistic style, 8k uhd, masterpiece";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type FeatureMode = 'home' | 'uniform' | 'dance' | 'diploma';

function App() {
  // 앱 전체 상태
  const [currentMode, setCurrentMode] = useState<FeatureMode>('home');

  // 공통 상태
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [styleOption, setStyleOption] = useState('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [premiumResultUrl, setPremiumResultUrl] = useState<string | null>(null); // 고화질 원본
  const [error, setError] = useState<string | null>(null);

  // 결제 팝업 상태
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false); // 결제 여부

  // Viggle 애니메이션 상태
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationUrl, setAnimationUrl] = useState<string | null>(null);

  // 졸업장 생성 상태
  const [diplomaName, setDiplomaName] = useState('');
  const [diplomaSchool, setDiplomaSchool] = useState('청춘고등학교');
  const [diplomaYear, setDiplomaYear] = useState('1978');
  const [diplomaUrl, setDiplomaUrl] = useState<string | null>(null);

  // Kakao SDK 초기화
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      // TODO: 실제 앱 키로 교체 필요 (https://developers.kakao.com/)
      window.Kakao.init('YOUR_KAKAO_APP_KEY');
      console.log('Kakao SDK initialized:', window.Kakao.isInitialized());
    }
  }, []);

  // 워터마크 및 화질 저하 함수
  const applyWatermarkAndBlur = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0);

        // 블러 효과 적용
        ctx.filter = 'blur(3px)';
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';

        // 워터마크 추가
        const fontSize = Math.max(img.width / 15, 40);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 중앙에 큰 워터마크
        const text = '청춘사진관';
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.strokeText(text, centerX, centerY);
        ctx.fillText(text, centerX, centerY);

        // 대각선으로 여러 개 추가 (우회 방지)
        ctx.font = `bold ${fontSize * 0.6}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';

        for (let y = 0; y < canvas.height; y += fontSize * 3) {
          for (let x = 0; x < canvas.width; x += fontSize * 5) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-Math.PI / 6);
            ctx.fillText('청춘사진관', 0, 0);
            ctx.restore();
          }
        }

        // Canvas를 Blob으로 변환
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg', 0.7); // 화질도 70%로 저하
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = imageUrl;
    });
  };

  // 카카오톡 공유 함수
  const shareToKakao = () => {
    if (!window.Kakao) {
      alert('카카오톡 공유 기능을 불러올 수 없습니다.');
      return;
    }

    const currentUrl = window.location.href.split('?')[0];

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '17살로 돌아간 나 😎',
        description: '청춘사진관에서 1970-80년대 교복 입어봤어요!',
        imageUrl: premiumResultUrl || 'https://via.placeholder.com/800x600',
        link: {
          mobileWebUrl: currentUrl,
          webUrl: currentUrl,
        },
      },
      buttons: [
        {
          title: '나도 젊어지기',
          link: {
            mobileWebUrl: currentUrl,
            webUrl: currentUrl,
          },
        },
      ],
    });
  };

  // Viggle 애니메이션 생성 함수
  const handleAnimate = async () => {
    if (!premiumResultUrl && !resultUrl) {
      alert('먼저 사진을 변환해주세요!');
      return;
    }

    setIsAnimating(true);
    setError(null);

    try {
      // 애니메이션 생성 요청
      const response = await fetch('/api/viggle-animate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: premiumResultUrl || resultUrl, // 원본 또는 워터마크 버전
        }),
      });

      if (!response.ok) {
        let errorMessage = '애니메이션 생성에 실패했습니다.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `서버 응답 오류 (상태코드: ${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const { data: { predictionId } } = await response.json();

      // 폴링으로 결과 대기 (최대 5분)
      const statusMessages = [
        '🎭 포즈 분석 중...',
        '💃 춤 동작 매핑 중...',
        '🎬 영상 렌더링 중...',
        '✨ 마법을 거는 중...',
        '🎨 최종 마무리 중...',
      ];
      let pollCount = 0;

      while (true) {
        await new Promise(r => setTimeout(r, 3000)); // 3초마다 체크
        setLoadingMsg(statusMessages[Math.min(pollCount, statusMessages.length - 1)]);
        pollCount++;

        const statusRes = await fetch('/api/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ predictionId }),
        });

        const statusData = await statusRes.json();
        const statusPayload = statusData.data;

        if (statusPayload?.status === 'succeeded') {
          setAnimationUrl(statusPayload.resultUrl);
          setLoadingMsg('🎉 완성!');
          break;
        } else if (statusPayload?.status === 'failed' || statusPayload?.status === 'canceled') {
          throw new Error(statusData.error || '애니메이션 생성에 실패했습니다.');
        } else if (statusData.error) {
          throw new Error(statusData.error);
        }

        if (pollCount > 100) { // 5분 타임아웃
          throw new Error('애니메이션 생성 시간이 너무 오래 걸립니다. 다시 시도해주세요.');
        }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || '애니메이션 생성 중 에러가 발생했습니다.');
    } finally {
      setIsAnimating(false);
    }
  };

  // 졸업장 생성 함수
  const generateDiploma = () => {
    if (!diplomaName.trim()) {
      alert('이름을 입력해주세요!');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      alert('Canvas를 사용할 수 없습니다.');
      return;
    }

    // A4 비율 (1654 x 2339)
    canvas.width = 1200;
    canvas.height = 1697;

    // 배경 (빈티지 종이색)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f4f1e8');
    gradient.addColorStop(1, '#e8e3d3');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 종이 질감 효과
    ctx.fillStyle = 'rgba(210, 180, 140, 0.05)';
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 3;
      ctx.fillRect(x, y, size, size);
    }

    // 태두리 (이중선)
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 12;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

    // 상단 장식선
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 180);
    ctx.lineTo(canvas.width - 150, 180);
    ctx.stroke();

    // 제목: 졸업증서
    ctx.fillStyle = '#2C1810';
    ctx.font = 'bold 80px serif';
    ctx.textAlign = 'center';
    ctx.fillText('졸 업 증 서', canvas.width / 2, 250);

    // 구분선
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(300, 280);
    ctx.lineTo(canvas.width - 300, 280);
    ctx.stroke();

    // 본문 시작 Y 위치
    let currentY = 400;

    // 이름
    ctx.font = 'bold 70px serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(`성명: ${diplomaName}`, canvas.width / 2, currentY);
    currentY += 120;

    // 생년월일 (랜덤)
    const birthYear = parseInt(diplomaYear) - 18;
    const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    ctx.font = '45px serif';
    ctx.fillText(`생년월일: ${birthYear}년 ${birthMonth}월 ${birthDay}일`, canvas.width / 2, currentY);
    currentY += 150;

    // 졸업 내용
    ctx.font = '50px serif';
    ctx.textAlign = 'left';
    const leftMargin = 200;

    ctx.fillText('위 사람은 본교 소정의 과정을', leftMargin, currentY);
    currentY += 70;
    ctx.fillText('모두 이수하였으므로 이 증서를', leftMargin, currentY);
    currentY += 70;
    ctx.fillText('수여합니다', leftMargin, currentY);
    currentY += 150;

    // 날짜
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${diplomaYear}년 2월 28일`, canvas.width / 2, currentY);
    currentY += 120;

    // 학교명
    ctx.font = 'bold 65px serif';
    ctx.fillText(diplomaSchool, canvas.width / 2, currentY);
    currentY += 100;

    // 교장 표시
    ctx.font = '50px serif';
    ctx.fillText('교장', canvas.width / 2 + 200, currentY);

    // 도장 (빨간 원)
    ctx.fillStyle = 'rgba(220, 20, 60, 0.7)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2 + 280, currentY - 25, 55, 0, Math.PI * 2);
    ctx.fill();

    // 도장 안 글씨
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 18px serif';
    ctx.fillText('교장', canvas.width / 2 + 280, currentY - 20);

    // 하단 장식
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, canvas.height - 150);
    ctx.lineTo(canvas.width - 150, canvas.height - 150);
    ctx.stroke();

    // 하단 문구
    ctx.font = '28px serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('- 청춘사진관 명예 졸업장 -', canvas.width / 2, canvas.height - 100);

    // Canvas를 이미지로 변환
    const dataUrl = canvas.toDataURL('image/png');
    setDiplomaUrl(dataUrl);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultUrl(null);
      setAnimationUrl(null); // 새 사진 선택 시 애니메이션 리셋
      setError(null);
    }
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleGenerate = async () => {
    if (!selectedFile) {
      alert("학생, 사진도 안 올리고 변환하려니?");
      return;
    }

    setIsLoading(true);
    setResultUrl(null);
    setError(null);

    try {
      const base64Image = await toBase64(selectedFile);

      // 스타일 자동 선택 로직
      let finalStyle = styleOption;
      if (styleOption === 'auto') {
        // TODO: 성별 자동 감지 구현 예정
        // 현재는 랜덤으로 남/녀 교복 선택
        const maleStyles = ['male_uniform', 'military_training', 'graduation', 'picnic', 'gym_class', 'classroom', 'group_photo'];
        const femaleStyles = ['female_uniform', 'graduation', 'picnic', 'gym_class', 'classroom', 'group_photo'];
        const allStyles = Math.random() > 0.5 ? maleStyles : femaleStyles;
        finalStyle = pickRandom(allStyles);
      }

      // 스타일 설정 가져오기
      const config = STYLE_CONFIGS[finalStyle];
      // 랜덤 배경 선택
      const bg = pickRandom(BACKGROUNDS[finalStyle]);
      // 최종 프롬프트 조합
      const promptText = `${config.prompt}, background: ${bg}, ${MASTER_SUFFIX}`;

      setLoadingMsg('17살 학생으로 타임머신 탑승 중...');
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image,
          promptText,
          negativePrompt: NEGATIVE_PROMPT,
          styleName: config.photomakerStyle,
        }),
      });

      if (!response.ok) {
        let errorMessage = '알 수 없는 에러가 발생했습니다.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `서버 응답 오류 (상태코드: ${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const { data: { predictionId } } = await response.json();

      const statusMessages = [
        '1970년대로 시간 여행 중...',
        '교복을 입히고 있습니다...',
        '필름 카메라로 촬영 중...',
        '현상액에 담그는 중...',
        '거의 완성됐습니다...',
      ];
      let pollCount = 0;

      while (true) {
        await new Promise(r => setTimeout(r, 1500));
        setLoadingMsg(statusMessages[Math.min(pollCount, statusMessages.length - 1)]);
        pollCount++;

        const statusRes = await fetch('/api/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ predictionId }),
        });

        const statusData = await statusRes.json();
        const statusPayload = statusData.data;

        if (statusPayload?.status === 'succeeded') {
          // 원본 URL 저장 (프리미엄용)
          setPremiumResultUrl(statusPayload.resultUrl);

          // 워터마크 + 블러 적용 (무료용)
          setLoadingMsg('워터마크 추가 중...');
          try {
            const watermarkedUrl = await applyWatermarkAndBlur(statusPayload.resultUrl);
            setResultUrl(watermarkedUrl);
          } catch (err) {
            console.error('워터마크 추가 실패:', err);
            // 실패 시 원본 표시
            setResultUrl(statusPayload.resultUrl);
          }
          break;
        } else if (statusPayload?.status === 'failed' || statusPayload?.status === 'canceled') {
          throw new Error(statusData.error || '변환에 실패했습니다.');
        } else if (statusData.error) {
          throw new Error(statusData.error);
        }

        if (pollCount > 60) {
          throw new Error('변환 시간이 너무 오래 걸립니다. 다시 시도해주세요.');
        }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || '변환 중 에러가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 홈 화면 렌더링
  const renderHomeScreen = () => (
    <div className="container">
      <header className="header">
        <h1>청춘사진관</h1>
        <p className="subtitle">그때 그 시절</p>
        <div className="since">
          <span className="line"></span>
          <span>1970s - 1980s</span>
          <span className="line"></span>
        </div>
      </header>

      <section style={{ padding: '40px 20px' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          {/* 버튼 1: 교복 입어보기 (메인 기능) */}
          <button
            onClick={() => setCurrentMode('uniform')}
            className="feature-card"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '16px',
              padding: '40px 24px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '28px',
              fontWeight: 'bold',
              textAlign: 'left',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              position: 'relative' as const,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            }}
          >
            {/* 인기 뱃지 */}
            <div style={{
              position: 'absolute' as const,
              top: '16px',
              right: '16px',
              background: '#FFD700',
              color: '#333',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              🔥 인기
            </div>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📸</div>
            <div>교복 입어보기</div>
            <div style={{ fontSize: '16px', opacity: 0.9, fontWeight: 'normal', marginTop: '12px' }}>
              1970-80년대 교복으로 타임머신 탑승<br/>
              <span style={{ fontSize: '14px', opacity: 0.8 }}>✨ 사진을 살아 움직이게 만들 수도 있어요!</span>
            </div>
          </button>

          {/* 버튼 2: 명예 졸업장 만들기 */}
          <button
            onClick={() => setCurrentMode('diploma')}
            className="feature-card"
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
              borderRadius: '16px',
              padding: '32px 24px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '24px',
              fontWeight: 'bold',
              textAlign: 'left',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎓</div>
            <div>명예 졸업장 만들기</div>
            <div style={{ fontSize: '14px', opacity: 0.9, fontWeight: 'normal', marginTop: '8px' }}>
              1970년대 스타일 졸업 증명서 발급
            </div>
          </button>
        </div>
      </section>

      <section className="quote-section">
        <div className="quote-box">
          <p>그때 그 시절로 돌아가는 가장 빠른 방법<br />청춘사진관에서 만나보세요</p>
          <div className="quote-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </section>
    </div>
  );

  // 기존 교복 입어보기 화면
  const renderUniformScreen = () => (
    <div className="container">
      {/* ===== 헤더 + 뒤로가기 ===== */}
      <header className="header">
        <button
          onClick={() => setCurrentMode('home')}
          style={{
            position: 'absolute' as const,
            left: '20px',
            top: '20px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ← 홈으로
        </button>
        <h1>교복 입어보기</h1>
        <p className="subtitle">1970-80s Korean School Uniform</p>
        <div className="since">
          <span className="line"></span>
          <span>Time Machine</span>
          <span className="line"></span>
        </div>
      </header>

      {/* ===== 히어로: 결과 또는 미리보기를 필름 스트립으로 ===== */}
      <section>
        <div className="film-strip">
          <div className="sprocket-col">
            {[...Array(5)].map((_, i) => <div key={i} className="sprocket"></div>)}
          </div>
          <div className="film-image-area">
            {resultUrl ? (
              <img src={resultUrl} alt="변환된 사진" style={{ filter: 'grayscale(0) sepia(0.2) brightness(0.95)' }} />
            ) : previewUrl ? (
              <img src={previewUrl} alt="미리보기" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 64 }}>photo_camera</span>
              </div>
            )}
            <div className="overlay"></div>
            <div className="roll-tag">
              {resultUrl ? 'Developed' : previewUrl ? 'Ready' : 'Roll #---'}
            </div>
          </div>
          <div className="sprocket-col">
            {[...Array(5)].map((_, i) => <div key={i} className="sprocket"></div>)}
          </div>
        </div>
        <div className="film-quote">
          {resultUrl
            ? '"그 시절, 그대로의 당신"'
            : '"Moments in the darkroom"'}
        </div>
      </section>

      {/* ===== 업로드 & 설정 섹션 ===== */}
      <section className="upload-section">
        <div className="section-title">
          <span className="material-symbols-outlined">photo_camera</span>
          <h2>Capture</h2>
        </div>

        {/* 사진 업로드 카드 */}
        <div className="index-card" style={{ marginTop: 32 }}>
          <div className="tab"><span>UPLOAD</span></div>
          <div className="card-body">
            <div className="file-input-wrapper">
              <span className="material-symbols-outlined">add_photo_alternate</span>
              <p>사진을 여기에 올려주세요</p>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </div>

            {previewUrl && (
              <div className="preview-polaroid">
                <img src={previewUrl} alt="미리보기" />
                <div className="caption">Original</div>
              </div>
            )}
          </div>
        </div>

        {/* 스타일 선택 카드 */}
        <div className="index-card" style={{ marginTop: 40 }}>
          <div className="tab" style={{ left: 48 }}><span>STYLE</span></div>
          <div className="card-body">
            <select
              value={styleOption}
              onChange={(e) => setStyleOption(e.target.value)}
              className="style-select"
            >
              <option value="auto">🎲 AI 자동 선택 (추천)</option>
              <option value="male_uniform">남학생 교복</option>
              <option value="female_uniform">여학생 교복</option>
              <option value="military_training">교련복</option>
              <option value="graduation">졸업사진</option>
              <option value="picnic">소풍</option>
              <option value="gym_class">체육 시간</option>
              <option value="classroom">교실</option>
              <option value="group_photo">단체 사진</option>
            </select>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !selectedFile}
              className="generate-btn"
            >
              {isLoading ? "타임머신 가동 중..." : "📸 17살로 돌아가기"}
            </button>
          </div>
        </div>
      </section>

      {/* ===== 결과 섹션 ===== */}
      <section className="result-section">
        <div className="section-title">
          <span className="material-symbols-outlined">inventory_2</span>
          <h2>Darkroom</h2>
        </div>

        {isLoading && (
          <div className="loading-box">
            <p>{loadingMsg || '사진을 변환하고 있습니다...'}</p>
            <div className="loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        {error && (
          <div className="error-box">
            <p>{error}</p>
          </div>
        )}

        {resultUrl && (
          <>
            <div className="result-film">
              <div className="film-strip">
                <div className="sprocket-col">
                  {[...Array(5)].map((_, i) => <div key={i} className="sprocket"></div>)}
                </div>
                <div className="film-image-area">
                  <img
                    src={isPremiumUser && premiumResultUrl ? premiumResultUrl : resultUrl}
                    alt="변환된 사진"
                    style={{ filter: 'sepia(0.15) brightness(0.95)' }}
                  />
                  <div className="overlay"></div>
                  <div className="roll-tag">{isPremiumUser ? 'Premium ✨' : 'Free'}</div>
                </div>
                <div className="sprocket-col">
                  {[...Array(5)].map((_, i) => <div key={i} className="sprocket"></div>)}
                </div>
              </div>
            </div>
            <div className="result-actions" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
              {/* Step 2: 살아 움직이게 만들기 버튼 (가장 크게!) */}
              {!animationUrl && (
                <div>
                  <button
                    onClick={handleAnimate}
                    disabled={isAnimating}
                    style={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '24px 32px',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      cursor: isAnimating ? 'not-allowed' : 'pointer',
                      borderRadius: '12px',
                      boxShadow: '0 8px 20px rgba(240, 147, 251, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      opacity: isAnimating ? 0.7 : 1,
                      width: '100%',
                    }}
                  >
                    <span style={{ fontSize: '32px' }}>🎬</span>
                    {isAnimating ? loadingMsg || '마법을 거는 중...' : '살아 움직이게 만들기'}
                  </button>
                  {!isAnimating && (
                    <p style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.6)',
                      textAlign: 'center',
                      marginTop: '8px',
                    }}>
                      ✨ AI가 사진에 생명을 불어넣습니다 (약 2-5분 소요)
                    </p>
                  )}
                  {isAnimating && (
                    <div style={{
                      marginTop: '16px',
                      textAlign: 'center',
                      padding: '16px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}>
                      <div className="loading-dots" style={{ marginBottom: '8px' }}>
                        <span></span><span></span><span></span>
                      </div>
                      <p style={{ color: 'white', fontSize: '14px' }}>
                        {loadingMsg || '처리 중...'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 애니메이션 결과 표시 */}
              {animationUrl && (
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                }}>
                  <video
                    src={animationUrl}
                    controls
                    autoPlay
                    loop
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                    }}
                  />
                  <p style={{ color: 'white', marginBottom: '12px' }}>✨ 생명을 얻었습니다!</p>
                </div>
              )}

              {/* 카카오톡 공유 버튼 */}
              <button
                onClick={shareToKakao}
                style={{
                  background: '#FEE500',
                  color: '#000000',
                  border: 'none',
                  padding: '20px 32px',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '28px' }}>💬</span>
                카카오톡으로 자랑하기
              </button>

              {/* 저장 버튼 */}
              <button
                onClick={() => setShowPaymentPopup(true)}
                className="download-btn"
                style={{
                  background: '#f5576c',
                  border: 'none',
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  color: 'white',
                }}
              >
                💾 저장하기
              </button>
            </div>
          </>
        )}

        {!isLoading && !resultUrl && !error && (
          <div className="empty-box">
            <p>아직 현상된 사진이 없습니다.<br />위에서 사진을 올리고 변환해주세요.</p>
          </div>
        )}
      </section>
    </div>
  );

  // 춤추는 짤 만들기 화면 (TODO: 구현 예정)
  const renderDanceScreen = () => (
    <div className="container">
      <header className="header">
        <button
          onClick={() => setCurrentMode('home')}
          style={{
            position: 'absolute' as const,
            left: '20px',
            top: '20px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ← 홈으로
        </button>
        <h1>춤추는 짤 만들기 👑</h1>
        <p className="subtitle">Coming Soon</p>
      </header>
      <section style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)' }}>
          곧 출시됩니다!<br />내 얼굴로 춤추는 영상을 만들어보세요.
        </p>
      </section>
    </div>
  );

  // 명예 졸업장 만들기 화면
  const renderDiplomaScreen = () => (
    <div className="container">
      <header className="header">
        <button
          onClick={() => {
            setCurrentMode('home');
            setDiplomaUrl(null);
          }}
          style={{
            position: 'absolute' as const,
            left: '20px',
            top: '20px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ← 홈으로
        </button>
        <h1>명예 졸업장 만들기</h1>
        <p className="subtitle">1970s Graduation Certificate</p>
        <div className="since">
          <span className="line"></span>
          <span>Honorary Diploma</span>
          <span className="line"></span>
        </div>
      </header>

      {/* 입력 폼 */}
      {!diplomaUrl && (
        <section className="upload-section">
          <div className="section-title">
            <span className="material-symbols-outlined">school</span>
            <h2>정보 입력</h2>
          </div>

          <div className="index-card" style={{ marginTop: 32 }}>
            <div className="tab"><span>INFO</span></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 이름 입력 */}
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '16px' }}>
                    성명 (이름) *
                  </label>
                  <input
                    type="text"
                    value={diplomaName}
                    onChange={(e) => setDiplomaName(e.target.value)}
                    placeholder="홍길동"
                    maxLength={10}
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '20px',
                      borderRadius: '8px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}
                  />
                </div>

                {/* 학교명 입력 */}
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '16px' }}>
                    학교명
                  </label>
                  <input
                    type="text"
                    value={diplomaSchool}
                    onChange={(e) => setDiplomaSchool(e.target.value)}
                    placeholder="청춘고등학교"
                    maxLength={15}
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '18px',
                      borderRadius: '8px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      textAlign: 'center',
                    }}
                  />
                </div>

                {/* 졸업 연도 */}
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '16px' }}>
                    졸업 연도
                  </label>
                  <select
                    value={diplomaYear}
                    onChange={(e) => setDiplomaYear(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '18px',
                      borderRadius: '8px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      textAlign: 'center',
                    }}
                  >
                    {Array.from({ length: 21 }, (_, i) => 1970 + i).map(year => (
                      <option key={year} value={year} style={{ background: '#333' }}>
                        {year}년
                      </option>
                    ))}
                  </select>
                </div>

                {/* 생성 버튼 */}
                <button
                  onClick={generateDiploma}
                  disabled={!diplomaName.trim()}
                  className="generate-btn"
                  style={{
                    opacity: diplomaName.trim() ? 1 : 0.5,
                    cursor: diplomaName.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  🎓 졸업장 발급받기
                </button>
              </div>
            </div>
          </div>

          {/* 안내 문구 */}
          <section className="quote-section" style={{ marginTop: '40px' }}>
            <div className="quote-box">
              <p>1970-80년대 스타일의 빈티지 졸업장<br />추억을 되살려보세요</p>
              <div className="quote-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </section>
        </section>
      )}

      {/* 결과 표시 */}
      {diplomaUrl && (
        <section className="result-section">
          <div className="section-title">
            <span className="material-symbols-outlined">workspace_premium</span>
            <h2>발급 완료</h2>
          </div>

          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              display: 'inline-block',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <img
                src={diplomaUrl}
                alt="졸업장"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                }}
              />
            </div>

            <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 카카오톡 공유 */}
              <button
                onClick={() => {
                  // 졸업장은 캔버스에서 생성된 blob URL이라 카카오 서버가 접근 불가
                  // 앱 링크만 공유하고 이미지는 저장 후 직접 첨부하도록 안내
                  if (window.Kakao) {
                    const currentUrl = window.location.href.split('?')[0];
                    window.Kakao.Share.sendDefault({
                      objectType: 'feed',
                      content: {
                        title: '명예 졸업장 받았어요! 🎓',
                        description: `${diplomaSchool} ${diplomaYear}년 졸업 - ${diplomaName} | 청춘사진관에서 만들기`,
                        imageUrl: 'https://via.placeholder.com/800x600/8B4513/FFFFFF?text=%EC%B2%AD%EC%B6%98%EC%82%AC%EC%A7%84%EA%B4%80',
                        link: {
                          mobileWebUrl: currentUrl,
                          webUrl: currentUrl,
                        },
                      },
                      buttons: [{
                        title: '나도 졸업장 만들기',
                        link: {
                          mobileWebUrl: currentUrl,
                          webUrl: currentUrl,
                        },
                      }],
                    });
                  } else {
                    alert('졸업장 이미지를 저장한 뒤, 카카오톡 앱에서 직접 공유해주세요.');
                  }
                }}
                style={{
                  background: '#FEE500',
                  color: '#000000',
                  border: 'none',
                  padding: '20px 32px',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                💬 카카오톡으로 자랑하기
              </button>

              {/* 다운로드 버튼 */}
              <a
                href={diplomaUrl}
                download={`졸업장_${diplomaName}_${diplomaYear}.png`}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  display: 'block',
                  textAlign: 'center',
                }}
              >
                💾 다운로드
              </a>

              {/* 다시 만들기 버튼 */}
              <button
                onClick={() => {
                  setDiplomaUrl(null);
                  setDiplomaName('');
                }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '12px 32px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                }}
              >
                🔄 다시 만들기
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );

  // 결제 팝업
  const renderPaymentPopup = () => {
    if (!showPaymentPopup) return null;

    return (
      <div style={{
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#333' }}>
            💎 고화질 저장
          </h2>
          <p style={{ fontSize: '16px', marginBottom: '24px', color: '#666', lineHeight: 1.6 }}>
            선명한 원본을 저장하고<br />워터마크를 없애시겠습니까?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => {
                setShowPaymentPopup(false);
                setIsPremiumUser(true);
                // TODO: 실제 결제 연동
                alert('결제 기능은 곧 출시됩니다!\n지금은 무료로 고화질 버전을 저장합니다.');
                // 프리미엄 원본 저장
                if (premiumResultUrl) {
                  const a = document.createElement('a');
                  a.href = premiumResultUrl;
                  a.download = 'cheonchun-photo-premium.png';
                  a.click();
                }
              }}
              style={{
                background: '#f5576c',
                color: 'white',
                border: 'none',
                padding: '16px',
                fontSize: '18px',
                fontWeight: 'bold',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              네 (1,100원 결제)
            </button>
            <button
              onClick={() => {
                setShowPaymentPopup(false);
                // 워터마크 버전 저장
                if (resultUrl) {
                  const a = document.createElement('a');
                  a.href = resultUrl;
                  a.download = 'cheonchun-photo-watermark.png';
                  a.click();
                }
              }}
              style={{
                background: '#ccc',
                color: '#666',
                border: 'none',
                padding: '16px',
                fontSize: '16px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              아니오 (흐리게 저장)
            </button>
          </div>

          <button
            onClick={() => setShowPaymentPopup(false)}
            style={{
              marginTop: '16px',
              background: 'transparent',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            취소
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 필름 그레인 오버레이 */}
      <div className="film-grain"></div>

      {/* 커피 얼룩 장식 */}
      <div className="coffee-stain" style={{ top: -40, left: -40, opacity: 0.4 }}></div>
      <div className="coffee-stain" style={{ bottom: 160, right: -80, opacity: 0.3, transform: 'scale(1.5)' }}></div>

      {/* 화면 전환 */}
      {currentMode === 'home' && renderHomeScreen()}
      {currentMode === 'uniform' && renderUniformScreen()}
      {currentMode === 'dance' && renderDanceScreen()}
      {currentMode === 'diploma' && renderDiplomaScreen()}

      {/* 결제 팝업 */}
      {renderPaymentPopup()}
    </>
  );
}

export default App;
