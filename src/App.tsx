import { useState, useEffect, type ChangeEvent } from 'react';
import './App.css';

declare global {
  interface Window { Kakao: any; }
}

// ===== 배경 풀 =====
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

// ===== 스타일 설정 =====
const STYLE_CONFIGS: Record<string, { prompt: string; photomakerStyle: string }> = {
  male_uniform: {
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

// ===== 사운드 유틸리티 =====
let _audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
  } catch { return null; }
}

function playSound(type: 'shutter' | 'click' | 'advance' | 'success') {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    if (type === 'shutter') {
      const n = ~~(ctx.sampleRate * 0.15);
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.012));
      const src = ctx.createBufferSource(); src.buffer = buf;
      const g = ctx.createGain(); g.gain.value = 0.55;
      src.connect(g); g.connect(ctx.destination); src.start();

      const t2 = ctx.currentTime + 0.09;
      const n2 = ~~(ctx.sampleRate * 0.05);
      const buf2 = ctx.createBuffer(1, n2, ctx.sampleRate);
      const d2 = buf2.getChannelData(0);
      for (let i = 0; i < n2; i++) d2[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.005));
      const src2 = ctx.createBufferSource(); src2.buffer = buf2;
      const g2 = ctx.createGain(); g2.gain.value = 0.35;
      src2.connect(g2); g2.connect(ctx.destination); src2.start(t2);

    } else if (type === 'click') {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.05);

    } else if (type === 'advance') {
      for (let i = 0; i < 7; i++) {
        const t = ctx.currentTime + i * 0.048;
        const n = ~~(ctx.sampleRate * 0.028);
        const buf = ctx.createBuffer(1, n, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let j = 0; j < n; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ctx.sampleRate * 0.007));
        const src = ctx.createBufferSource(); src.buffer = buf;
        const g = ctx.createGain(); g.gain.setValueAtTime(Math.max(0.04, 0.22 - i * 0.025), t);
        src.connect(g); g.connect(ctx.destination); src.start(t);
      }

    } else if (type === 'success') {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const t = ctx.currentTime + i * 0.13;
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.45);
      });
    }
  } catch { /* ignore */ }
}

// ===== 아카이브 더미 데이터 =====
const ARCHIVE_ITEMS = [
  { id: 1, imageUrl: 'https://picsum.photos/seed/sajin01/400/500', year: '1978', title: '봄 소풍의 기억', location: '경주 불국사', tag: '소풍', rotate: '-1.5deg' },
  { id: 2, imageUrl: 'https://picsum.photos/seed/sajin02/400/500', year: '1982', title: '졸업 기념사진', location: '서울 ○○고등학교', tag: '졸업', rotate: '1.2deg' },
  { id: 3, imageUrl: 'https://picsum.photos/seed/sajin03/400/500', year: '1975', title: '교련 훈련 중', location: '학교 운동장', tag: '교련복', rotate: '-0.8deg' },
  { id: 4, imageUrl: 'https://picsum.photos/seed/sajin04/400/500', year: '1980', title: '가을 단풍 소풍', location: '설악산', tag: '소풍', rotate: '2deg' },
  { id: 5, imageUrl: 'https://picsum.photos/seed/sajin05/400/500', year: '1977', title: '교실의 오후', location: '3학년 2반', tag: '교실', rotate: '-1.2deg' },
  { id: 6, imageUrl: 'https://picsum.photos/seed/sajin06/400/500', year: '1984', title: '가을 체육 대회', location: '학교 운동장', tag: '체육', rotate: '0.7deg' },
  { id: 7, imageUrl: 'https://picsum.photos/seed/sajin07/400/500', year: '1979', title: '단체 기념사진', location: '학교 정문 앞', tag: '단체', rotate: '-2deg' },
  { id: 8, imageUrl: 'https://picsum.photos/seed/sajin08/400/500', year: '1983', title: '교정 벚꽃 아래', location: '○○여고', tag: '교복', rotate: '1.5deg' },
];

type FeatureMode = 'home' | 'uniform' | 'dance';

function App() {
  const [currentMode, setCurrentMode] = useState<FeatureMode>('home');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [styleOption, setStyleOption] = useState('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationUrl, setAnimationUrl] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init('9c78946200f5be3c591f823f2d5703fc');
    }
  }, []);

  // 결제 완료 후 복귀 시 checkout_id 확인 → 자동 생성 시작
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutId = params.get('checkout_id');
    if (!checkoutId) return;

    window.history.replaceState({}, '', window.location.pathname);
    setIsCheckingPayment(true);
    setCurrentMode('uniform');

    fetch('/api/verify-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkoutId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.data?.succeeded) {
          const raw = localStorage.getItem('pendingGenerateData');
          localStorage.removeItem('pendingGenerateData');
          if (!raw) {
            setCheckoutError('결제는 완료됐지만 생성 데이터를 찾을 수 없습니다. 다시 시도해주세요.');
            return;
          }
          const { base64Image, styleOption: savedStyle } = JSON.parse(raw);
          playSound('success');
          executeGenerate(base64Image, savedStyle);
        } else {
          localStorage.removeItem('pendingGenerateData');
          setCheckoutError('결제가 완료되지 않았습니다. 다시 시도해주세요.');
        }
      })
      .catch(() => {
        localStorage.removeItem('pendingGenerateData');
        setCheckoutError('결제 확인 중 오류가 발생했습니다.');
      })
      .finally(() => setIsCheckingPayment(false));
  }, []);

  const sound = (type: Parameters<typeof playSound>[0]) => {
    if (soundOn) playSound(type);
  };

  const navigate = (mode: FeatureMode) => {
    sound('click');
    setCurrentMode(mode);
  };

  // 이미지 압축 (localStorage 저장용, 최대 1024px)
  const compressImage = (file: File, maxPx = 1024): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        let { width: w, height: h } = img;
        if (w > maxPx || h > maxPx) {
          if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
          else { w = Math.round(w * maxPx / h); h = maxPx; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = reject;
      img.src = objUrl;
    });

  // 카카오 공유
  const shareToKakao = () => {
    if (!window.Kakao) { alert('카카오톡 공유 기능을 불러올 수 없습니다.'); return; }
    const currentUrl = window.location.href.split('?')[0];
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '17살로 돌아간 나',
        description: '청춘사진관에서 1970-80년대 교복 입어봤어요!',
        imageUrl: resultUrl || 'https://via.placeholder.com/800x600',
        link: { mobileWebUrl: currentUrl, webUrl: currentUrl },
      },
      buttons: [{ title: '나도 젊어지기', link: { mobileWebUrl: currentUrl, webUrl: currentUrl } }],
    });
  };

  // 애니메이션 생성
  const handleAnimate = async () => {
    if (!resultUrl) { alert('먼저 사진을 변환해주세요!'); return; }
    sound('click');
    setIsAnimating(true);
    setError(null);
    try {
      const response = await fetch('/api/viggle-animate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: resultUrl }),
      });
      if (!response.ok) {
        let msg = '애니메이션 생성에 실패했습니다.';
        try { const d = await response.json(); msg = d.error || msg; } catch { msg = `서버 응답 오류 (상태코드: ${response.status})`; }
        throw new Error(msg);
      }
      const { data: { predictionId } } = await response.json();
      const statusMsgs = ['포즈 분석 중...', '춤 동작 매핑 중...', '영상 렌더링 중...', '마법을 거는 중...', '최종 마무리 중...'];
      let pollCount = 0;
      while (true) {
        await new Promise(r => setTimeout(r, 3000));
        setLoadingMsg(statusMsgs[Math.min(pollCount, statusMsgs.length - 1)]);
        pollCount++;
        const sr = await fetch('/api/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ predictionId }) });
        const sd = await sr.json();
        const sp = sd.data;
        if (sp?.status === 'succeeded') { setAnimationUrl(sp.resultUrl); sound('success'); break; }
        else if (sp?.status === 'failed' || sp?.status === 'canceled') throw new Error(sd.error || '애니메이션 생성에 실패했습니다.');
        else if (sd.error) throw new Error(sd.error);
        if (pollCount > 100) throw new Error('변환 시간이 초과됐습니다.');
      }
    } catch (err: any) {
      setError(err.message || '애니메이션 생성 중 에러가 발생했습니다.');
    } finally {
      setIsAnimating(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      sound('click');
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultUrl(null);
      setAnimationUrl(null);
      setError(null);
    }
  };

  // 생성 버튼 클릭 → 이미지 압축 후 결제 팝업
  const handleGenerate = async () => {
    if (!selectedFile) { alert('사진을 먼저 올려주세요!'); return; }
    sound('click');
    try {
      const compressed = await compressImage(selectedFile);
      let finalStyle = styleOption;
      if (styleOption === 'auto') {
        const maleStyles = ['male_uniform', 'military_training', 'graduation', 'picnic', 'gym_class', 'classroom', 'group_photo'];
        const femaleStyles = ['female_uniform', 'graduation', 'picnic', 'gym_class', 'classroom', 'group_photo'];
        finalStyle = pickRandom(Math.random() > 0.5 ? maleStyles : femaleStyles);
      }
      localStorage.setItem('pendingGenerateData', JSON.stringify({ base64Image: compressed, styleOption: finalStyle }));
      setShowPaymentPopup(true);
    } catch {
      alert('이미지 처리 중 오류가 발생했습니다.');
    }
  };

  // 실제 AI 생성 (결제 완료 후 호출)
  const executeGenerate = async (base64Image: string, finalStyle: string) => {
    setIsLoading(true);
    setResultUrl(null);
    setError(null);
    playSound('shutter');
    try {
      const config = STYLE_CONFIGS[finalStyle];
      const bg = pickRandom(BACKGROUNDS[finalStyle]);
      const promptText = `${config.prompt}, background: ${bg}, ${MASTER_SUFFIX}`;
      setLoadingMsg('타임머신 가동 중...');
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image, promptText, negativePrompt: NEGATIVE_PROMPT, styleName: config.photomakerStyle }),
      });
      if (!response.ok) {
        let msg = '알 수 없는 에러가 발생했습니다.';
        try { const d = await response.json(); msg = d.error || msg; } catch { msg = `서버 응답 오류 (상태코드: ${response.status})`; }
        throw new Error(msg);
      }
      const { data: { predictionId } } = await response.json();
      const statusMsgs = ['1970년대로 시간 여행 중...', '교복을 입히고 있습니다...', '필름 카메라로 촬영 중...', '현상액에 담그는 중...', '거의 완성됐습니다...'];
      let pollCount = 0;
      while (true) {
        await new Promise(r => setTimeout(r, 1500));
        setLoadingMsg(statusMsgs[Math.min(pollCount, statusMsgs.length - 1)]);
        pollCount++;
        const sr = await fetch('/api/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ predictionId }) });
        const sd = await sr.json();
        const sp = sd.data;
        if (sp?.status === 'succeeded') {
          setResultUrl(sp.resultUrl);
          playSound('advance');
          setTimeout(() => playSound('success'), 400);
          break;
        } else if (sp?.status === 'failed' || sp?.status === 'canceled') {
          throw new Error(sd.error || '변환에 실패했습니다.');
        } else if (sd.error) {
          throw new Error(sd.error);
        }
        if (pollCount > 60) throw new Error('변환 시간이 너무 오래 걸립니다. 다시 시도해주세요.');
      }
    } catch (err: any) {
      setError(err.message || '변환 중 에러가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Polar 결제 시작
  const handleCheckout = async () => {
    setIsCreatingCheckout(true);
    setCheckoutError(null);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.data?.checkoutUrl) {
        throw new Error(data.error || '결제 페이지를 열 수 없습니다.');
      }
      setShowPaymentPopup(false);
      window.location.href = data.data.checkoutUrl;
    } catch (err: any) {
      setCheckoutError(err.message || '결제 중 오류가 발생했습니다.');
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  // ===== 홈 화면 =====
  const renderHomeScreen = () => (
    <div className="v-screen">
      <div className="ios-spacer" />

      <header className="v-header">
        <h1 className="v-title">청춘사진관</h1>
        <p className="v-subtitle">Memory Photo Studio</p>
        <div className="v-divider">
          <span className="v-line" />
          <span className="v-est">Est. 1994</span>
          <span className="v-line" />
        </div>
      </header>

      {/* 히어로 폴라로이드 */}
      <section className="hero-section">
        <div className="polaroid-hero">
          <div className="polaroid-img-area">
            {resultUrl ? (
              <img src={resultUrl} alt="Your Memory" className="polaroid-img" />
            ) : (
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl9NmN2yWXRoyELfY9SFkDYqoW6VOhCgq-wHnbEi7vlD8597480mMWHfQNlYCLRa4P-NYgyoiC8OnWk6YFVlZNSSBuzSGl7kqhPtH-iqIHzxa46ZgQbHMB-hUsHSXoZOJxr4LgsxTsdgtG8YIQeCVGdY7TXVz-vEoi6NVYwWfsy_BxseuyyFVJ-5UfzlF4dzr9SnHqgLeCMbemj-F437ZEXlK8S3adttvSDai7R-6MhIGnXIv7r0-ez7Iqjc6vOHjE8qGy_u9OELvL"
                alt="Featured Memory"
                className="polaroid-img"
              />
            )}
            <div className="polaroid-overlay" />
          </div>
          <div className="polaroid-caption">
            <span className="polaroid-label">Featured Memory</span>
            <p className="polaroid-note">"그때 그 시절로 떠나볼까요"</p>
          </div>
          <div className="v-stamp">
            <div className="v-stamp-inner">
              <span>Verified</span>
              <span>Archive</span>
              <span>1994</span>
            </div>
          </div>
        </div>
      </section>

      {/* 메인 CTA */}
      <section className="cta-section">
        <div className="cta-header">
          <div>
            <h2 className="cta-title">Memory Lane</h2>
            <p className="cta-sub">1970-80년대로 떠나는 타임머신</p>
          </div>
          <button className="view-all-btn" onClick={() => navigate('uniform')}>시작 →</button>
        </div>
        <button className="main-cta-card" onClick={() => navigate('uniform')}>
          <div className="cta-polaroid">
            <div className="cta-img-area">
              <span className="material-symbols-outlined cta-icon">photo_camera</span>
            </div>
          </div>
          <div className="cta-text">
            <span className="cta-badge">🔥 인기</span>
            <p>교복 입어보기</p>
            <p className="cta-desc">Flux.1 AI가 당신을 17살로 되돌려 드립니다</p>
          </div>
        </button>
      </section>

      {/* 이용 방법 */}
      <section className="how-section">
        <div className="how-title">이용 방법</div>
        <div className="how-steps">
          <div className="how-step">
            <span className="how-icon">📸</span>
            <p className="how-label">사진 올리기</p>
            <p className="how-desc">얼굴이 잘 보이는 사진</p>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <span className="how-icon">💳</span>
            <p className="how-label">결제하기</p>
            <p className="how-desc">단 ₩1,900</p>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <span className="how-icon">✨</span>
            <p className="how-label">완성!</p>
            <p className="how-desc">고화질 바로 저장</p>
          </div>
        </div>
      </section>

      {/* 아카이브 노트 */}
      <section className="archive-note">
        <div className="archive-note-inner">
          <span className="archive-note-label">A Note from the Studio</span>
          <p className="archive-note-text">
            "모든 사진은 과거로부터 전해오는 속삭임입니다.<br />
            청춘사진관에서 그 시절로 돌아가보세요."
          </p>
          <div className="archive-divider" />
        </div>
      </section>

      <nav className="bottom-nav">
        <div className="nav-inner">
          <button className="nav-item active">
            <span className="material-symbols-outlined">camera_enhance</span>
            <span>Studio</span>
          </button>
          <button className="nav-item" onClick={() => navigate('dance')}>
            <span className="material-symbols-outlined">auto_stories</span>
            <span>Archives</span>
          </button>
          <div className="nav-center-wrap">
            <button className="nav-center-btn" onClick={() => navigate('uniform')}>
              <span className="material-symbols-outlined">add_a_photo</span>
            </button>
          </div>
          <button className="nav-item" onClick={() => navigate('dance')}>
            <span className="material-symbols-outlined">history_edu</span>
            <span>Journal</span>
          </button>
          <button className="nav-item">
            <span className="material-symbols-outlined">person_outline</span>
            <span>Profile</span>
          </button>
        </div>
        <div className="home-indicator" />
      </nav>
    </div>
  );

  // ===== 교복 화면 =====
  const renderUniformScreen = () => (
    <div className="sub-screen">
      <header className="sub-header">
        <button className="back-btn" onClick={() => navigate('home')}>← 홈으로</button>
        <h1 className="v-title" style={{ fontSize: '1.6rem' }}>교복 입어보기</h1>
        <p className="v-subtitle">1970-80s Korean School Uniform</p>
        <div className="v-divider">
          <span className="v-line" />
          <span className="v-est">Time Machine</span>
          <span className="v-line" />
        </div>
      </header>

      {/* 필름 스트립 히어로 */}
      <section style={{ marginTop: 24 }}>
        <div className="film-strip">
          <div className="sprocket-col">
            {[...Array(5)].map((_, i) => <div key={i} className="sprocket" />)}
          </div>
          <div className="film-image-area">
            {resultUrl ? (
              <img src={resultUrl} alt="변환된 사진" style={{ filter: 'sepia(0.2) brightness(0.95)' }} />
            ) : previewUrl ? (
              <img src={previewUrl} alt="미리보기" />
            ) : (
              <div className="film-empty">
                <span className="material-symbols-outlined" style={{ fontSize: 56 }}>photo_camera</span>
              </div>
            )}
            <div className="overlay" />
            <div className="roll-tag">
              {resultUrl ? '✨ Premium' : previewUrl ? 'Ready' : 'Roll #---'}
            </div>
          </div>
          <div className="sprocket-col">
            {[...Array(5)].map((_, i) => <div key={i} className="sprocket" />)}
          </div>
        </div>
        <p className="film-quote">
          {resultUrl ? '"그 시절, 그대로의 당신"' : '"Moments in the darkroom"'}
        </p>
      </section>

      {/* 업로드 카드 */}
      <section className="v-section">
        <div className="v-section-label">
          <span className="material-symbols-outlined">photo_camera</span>
          <h2>Capture</h2>
        </div>
        <div className="v-card">
          <div className="v-card-tab"><span>Upload</span></div>
          <div className="v-card-body">
            <div className="file-drop">
              <span className="material-symbols-outlined">add_photo_alternate</span>
              <p>사진을 여기에 올려주세요</p>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </div>
            {previewUrl && (
              <div className="preview-polaroid">
                <img src={previewUrl} alt="미리보기" />
                <p className="preview-caption">Original</p>
              </div>
            )}
          </div>
        </div>

        {/* 스타일 카드 */}
        <div className="v-card">
          <div className="v-card-tab" style={{ left: 40 }}><span>Style</span></div>
          <div className="v-card-body">
            <select
              value={styleOption}
              onChange={(e) => setStyleOption(e.target.value)}
              className="v-select"
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

            <div className="price-badge">💳 ₩1,900 · 결제 후 즉시 생성</div>

            <button
              onClick={handleGenerate}
              disabled={!selectedFile}
              className="gen-btn"
            >
              📸 결제하고 17살로 돌아가기
            </button>
          </div>
        </div>
      </section>

      {/* 현상실 (결과) */}
      <section className="v-section">
        <div className="v-section-label">
          <span className="material-symbols-outlined">inventory_2</span>
          <h2>Darkroom</h2>
        </div>

        {isCheckingPayment && (
          <div className="loading-box">
            <p>결제 확인 중...</p>
            <div className="loading-dots"><span /><span /><span /></div>
          </div>
        )}

        {checkoutError && !isCheckingPayment && (
          <div className="error-box"><p>{checkoutError}</p></div>
        )}

        {isLoading && (
          <div className="loading-box">
            <p>{loadingMsg || '사진을 현상하고 있습니다...'}</p>
            <div className="loading-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        {error && <div className="error-box"><p>{error}</p></div>}

        {resultUrl && !isLoading && (
          <>
            <div className="film-strip">
              <div className="sprocket-col">
                {[...Array(5)].map((_, i) => <div key={i} className="sprocket" />)}
              </div>
              <div className="film-image-area">
                <img
                  src={resultUrl}
                  alt="변환된 사진"
                  style={{ filter: 'sepia(0.15) brightness(0.95)' }}
                />
                <div className="overlay" />
                <div className="roll-tag">✨ Premium</div>
              </div>
              <div className="sprocket-col">
                {[...Array(5)].map((_, i) => <div key={i} className="sprocket" />)}
              </div>
            </div>

            <div className="result-actions">
              {!animationUrl && (
                <button
                  onClick={handleAnimate}
                  disabled={isAnimating}
                  className="action-btn animate"
                  style={{ opacity: isAnimating ? 0.75 : 1 }}
                >
                  <span style={{ fontSize: 28 }}>🎬</span>
                  {isAnimating ? loadingMsg || '마법을 거는 중...' : '살아 움직이게 만들기'}
                </button>
              )}
              {isAnimating && (
                <div className="loading-box">
                  <div className="loading-dots"><span /><span /><span /></div>
                  <p style={{ marginTop: 12 }}>{loadingMsg || '처리 중...'}</p>
                </div>
              )}

              {animationUrl && (
                <div className="animation-result">
                  <video src={animationUrl} controls autoPlay loop />
                  <p>✨ 생명을 얻었습니다!</p>
                </div>
              )}

              <button onClick={shareToKakao} className="action-btn kakao">
                <span style={{ fontSize: 22 }}>💬</span>
                카카오톡으로 자랑하기
              </button>

              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = resultUrl;
                  a.download = 'sajinkwan-premium.png';
                  a.click();
                }}
                className="action-btn save"
              >
                <span style={{ fontSize: 20 }}>💾</span>
                저장하기
              </button>
            </div>
          </>
        )}

        {!isLoading && !isCheckingPayment && !resultUrl && !error && !checkoutError && (
          <div className="empty-box">
            <p>위에서 사진을 올리고<br />결제 후 변환해보세요.</p>
          </div>
        )}
      </section>

      <nav className="bottom-nav">
        <div className="nav-inner">
          <button className="nav-item" onClick={() => navigate('home')}>
            <span className="material-symbols-outlined">camera_enhance</span>
            <span>Studio</span>
          </button>
          <button className="nav-item" onClick={() => navigate('dance')}>
            <span className="material-symbols-outlined">auto_stories</span>
            <span>Archives</span>
          </button>
          <div className="nav-center-wrap">
            <button className="nav-center-btn active" style={{ background: '#a04c10' }}>
              <span className="material-symbols-outlined">add_a_photo</span>
            </button>
          </div>
          <button className="nav-item">
            <span className="material-symbols-outlined">history_edu</span>
            <span>Journal</span>
          </button>
          <button className="nav-item">
            <span className="material-symbols-outlined">person_outline</span>
            <span>Profile</span>
          </button>
        </div>
        <div className="home-indicator" />
      </nav>
    </div>
  );

  // ===== 아카이브 화면 =====
  const renderDanceScreen = () => (
    <div className="sub-screen">
      <header className="sub-header">
        <button className="back-btn" onClick={() => navigate('home')}>← 홈으로</button>
        <h1 className="v-title" style={{ fontSize: '1.6rem' }}>추억 아카이브</h1>
        <p className="v-subtitle">Memory Archives · 1970–1984</p>
        <div className="v-divider">
          <span className="v-line" />
          <span className="v-est">그 시절 그대로</span>
          <span className="v-line" />
        </div>
      </header>

      <div className="archive-intro">
        <p>청춘사진관을 거쳐간 추억들입니다.<br />당신의 사진도 이 아카이브에 남겨보세요.</p>
      </div>

      <div className="archive-grid">
        {ARCHIVE_ITEMS.map((item) => (
          <div
            key={item.id}
            className="archive-card"
            style={{ '--rotate': item.rotate } as React.CSSProperties}
          >
            <div className="archive-card-img-wrap">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="archive-card-img"
                loading="lazy"
              />
              <div className="archive-card-overlay" />
              <span className="archive-year-stamp">{item.year}</span>
            </div>
            <div className="archive-card-body">
              <span className="archive-tag">{item.tag}</span>
              <p className="archive-title">{item.title}</p>
              <p className="archive-location">
                <span className="material-symbols-outlined" style={{ fontSize: 11 }}>location_on</span>
                {item.location}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="archive-footer-note">
        <span>· Images are illustrative · </span>
      </div>

      <nav className="bottom-nav">
        <div className="nav-inner">
          <button className="nav-item" onClick={() => navigate('home')}>
            <span className="material-symbols-outlined">camera_enhance</span>
            <span>Studio</span>
          </button>
          <button className="nav-item active">
            <span className="material-symbols-outlined">auto_stories</span>
            <span>Archives</span>
          </button>
          <div className="nav-center-wrap">
            <button className="nav-center-btn" onClick={() => navigate('uniform')}>
              <span className="material-symbols-outlined">add_a_photo</span>
            </button>
          </div>
          <button className="nav-item">
            <span className="material-symbols-outlined">history_edu</span>
            <span>Journal</span>
          </button>
          <button className="nav-item">
            <span className="material-symbols-outlined">person_outline</span>
            <span>Profile</span>
          </button>
        </div>
        <div className="home-indicator" />
      </nav>
    </div>
  );

  // ===== 결제 팝업 =====
  const renderPaymentPopup = () => {
    if (!showPaymentPopup) return null;
    return (
      <div className="popup-overlay" onClick={() => { if (!isCreatingCheckout) setShowPaymentPopup(false); }}>
        <div className="popup-card" onClick={(e) => e.stopPropagation()}>
          <div className="popup-icon">📸</div>
          <h2>결제 후 바로 생성!</h2>
          <p>결제가 완료되면 AI가 즉시<br />1970년대 사진을 만들어드립니다.</p>
          <div className="popup-price">₩1,900</div>
          {checkoutError && <p className="popup-error">{checkoutError}</p>}
          <div className="popup-btns">
            <button
              className="popup-btn-primary"
              disabled={isCreatingCheckout}
              onClick={handleCheckout}
            >
              {isCreatingCheckout ? '결제 페이지 이동 중...' : '결제하고 생성하기'}
            </button>
          </div>
          <button
            className="popup-btn-cancel"
            disabled={isCreatingCheckout}
            onClick={() => setShowPaymentPopup(false)}
          >
            취소
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="app-root">
      <button className="sound-toggle" onClick={() => setSoundOn(!soundOn)}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          {soundOn ? 'volume_up' : 'volume_off'}
        </span>
        {soundOn ? 'ON' : 'OFF'}
      </button>

      {currentMode === 'home' && renderHomeScreen()}
      {currentMode === 'uniform' && renderUniformScreen()}
      {currentMode === 'dance' && renderDanceScreen()}
      {renderPaymentPopup()}
    </div>
  );
}

export default App;
