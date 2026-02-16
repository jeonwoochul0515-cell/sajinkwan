import { useState, type ChangeEvent } from 'react';
import './App.css';

// ===== 배경 풀: 각 스타일별 3~5개 랜덤 배경 =====
const BACKGROUNDS: Record<string, string[]> = {
  male_uniform: [
    "old Korean school corridor with grey concrete walls and wooden doors",
    "narrow Korean alley with low brick walls and slate rooftops in 1970s",
    "retro Korean photo studio with grey canvas backdrop and wooden stool",
    "old Korean classroom with wooden desks and green chalkboard",
    "school gate with concrete pillars and iron fence",
  ],
  female_uniform: [
    "old Korean school campus with cherry blossom trees",
    "retro Korean street with old signboards and concrete buildings",
    "Korean photo studio with painted flower backdrop, 1970s style",
    "school garden with wooden bench and brick flower bed",
    "old Korean classroom window with sunlight streaming in",
  ],
  military_training: [
    "dusty school dirt playground with goalposts",
    "open field drill ground with Korean school building behind",
    "school yard with Korean flag pole and assembly area",
    "rural Korean road with rice paddies in the distance",
    "military training field with low hills and autumn trees",
  ],
  graduation: [
    "retro Korean photo studio with plain grey backdrop",
    "school auditorium with wooden podium and Korean flag",
    "school entrance with stone school name sign",
    "cherry blossom lined school road",
  ],
  picnic: [
    "Korean countryside with rice paddies and mountains",
    "old Korean amusement park with retro rides",
    "riverside picnic area with stone bridge",
    "mountain hiking trail with wooden railing",
    "seaside with old fishing boats and rocky shore",
  ],
  gym_class: [
    "school dirt playground with white line markings",
    "outdoor basketball court with old backboard",
    "school field day with colored tents and flags",
    "running track with dusty ground",
  ],
  classroom: [
    "old Korean classroom with wooden desks and green chalkboard, chalk writings on board",
    "classroom with open windows, curtains blowing, afternoon sunlight",
    "study hall with fluorescent lights and rows of desks with books",
    "classroom corner with potted plant and class schedule on wall",
  ],
  group_photo: [
    "school playground with students lined up in rows",
    "school front gate with the school name carved in stone",
    "classroom in front of chalkboard with date written",
    "school rooftop with cityscape and water tank behind",
  ],
};

// ===== 스타일 정의 =====
const STYLE_CONFIGS: Record<string, { prompt: string; photomakerStyle: string }> = {
  male_uniform: {
    prompt: "a 17 year old asian boy img wearing 1970s Korean black school uniform, black stand-up collar tunic with brass buttons, mandarin collar, white shirt underneath, white name tag on chest, slim teenage build, short buzz cut hair",
    photomakerStyle: "Photographic (Default)",
  },
  female_uniform: {
    prompt: "a 17 year old asian girl img wearing 1970s Korean girl school uniform, white round-collar blouse with black jumper skirt below the knee, slim teenage build, hair in two braids or short bob with hair pin",
    photomakerStyle: "Photographic (Default)",
  },
  military_training: {
    prompt: "a 17 year old asian student img wearing 1970s Korean military training uniform Kyoryunbok, olive khaki uniform jacket and trousers, olive military cap on head, slim teenage build, standing at attention",
    photomakerStyle: "Photographic (Default)",
  },
  graduation: {
    prompt: "a 17 year old asian student img in 1970s Korean graduation photo, wearing black school uniform, serious formal pose facing camera, slim teenage build, studio portrait with flash photography",
    photomakerStyle: "Photographic (Default)",
  },
  picnic: {
    prompt: "a 17 year old asian student img on school picnic trip in 1980s Korea, wearing casual clothes over school uniform, carrying a canteen and backpack, slim teenage build, candid outdoor photo",
    photomakerStyle: "Photographic (Default)",
  },
  gym_class: {
    prompt: "a 17 year old asian student img in 1970s Korean gym class, wearing white t-shirt and navy blue short shorts, slim teenage athletic build, doing exercise or running",
    photomakerStyle: "Photographic (Default)",
  },
  classroom: {
    prompt: "a 17 year old asian student img sitting at a wooden desk in 1970s Korean classroom, wearing black school uniform, studying with textbooks, slim teenage build, candid school life photo",
    photomakerStyle: "Photographic (Default)",
  },
  group_photo: {
    prompt: "a 17 year old asian student img posing for class group photo in 1970s Korea, wearing black school uniform, arms crossed or hands behind back, slim teenage build, formal school photo",
    photomakerStyle: "Photographic (Default)",
  },
};

const NEGATIVE_PROMPT = "western blazer, british school uniform, hogwarts, modern clothes, different face, ugly, deformed, blurry, low quality, anime, cartoon, 3d render, digital look, plastic surgery face, mature adult body, overweight, muscular, wrinkles, aged skin";

const MASTER_SUFFIX = "analog film photograph, Kodak Gold 200, natural film grain, vintage warm tone, 1970s 1980s South Korea, photorealistic";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [styleOption, setStyleOption] = useState('male_uniform');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultUrl(null);
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

      // 스타일 설정 가져오기
      const config = STYLE_CONFIGS[styleOption];
      // 랜덤 배경 선택
      const bg = pickRandom(BACKGROUNDS[styleOption]);
      // 최종 프롬프트 조합: 스타일 + 배경 + 마스터
      const promptText = `${config.prompt}, background: ${bg}, ${MASTER_SUFFIX}`;

      setLoadingMsg('사진관 아저씨가 필름을 꺼내고 있습니다...');
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

      const { predictionId } = await response.json();

      const statusMessages = [
        '암실에서 현상액을 준비하고 있습니다...',
        '필름에 빛을 쬐고 있습니다...',
        '인화지에 상이 떠오르고 있습니다...',
        '색감을 보정하고 있습니다...',
        '거의 다 됐습니다, 조금만 기다려주세요...',
      ];
      let pollCount = 0;

      while (true) {
        await new Promise(r => setTimeout(r, 2000));
        setLoadingMsg(statusMessages[Math.min(pollCount, statusMessages.length - 1)]);
        pollCount++;

        const statusRes = await fetch('/api/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ predictionId }),
        });

        const statusData = await statusRes.json();

        if (statusData.status === 'succeeded') {
          setResultUrl(statusData.resultUrl);
          break;
        } else if (statusData.status === 'failed' || statusData.status === 'canceled') {
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

  return (
    <>
      {/* 필름 그레인 오버레이 */}
      <div className="film-grain"></div>

      {/* 커피 얼룩 장식 */}
      <div className="coffee-stain" style={{ top: -40, left: -40, opacity: 0.4 }}></div>
      <div className="coffee-stain" style={{ bottom: 160, right: -80, opacity: 0.3, transform: 'scale(1.5)' }}></div>

      <div className="container">
        {/* ===== 헤더 ===== */}
        <header className="header">
          <h1>Sajinkwan</h1>
          <p className="subtitle">Memory Photo Studio</p>
          <div className="since">
            <span className="line"></span>
            <span>since 1994</span>
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
                <option value="male_uniform">남학생 교복 (검정 학란)</option>
                <option value="female_uniform">여학생 교복 (점퍼스커트)</option>
                <option value="military_training">교련복 (카키색)</option>
                <option value="graduation">졸업사진 (증명 스타일)</option>
                <option value="picnic">소풍 사진 (야외)</option>
                <option value="gym_class">체육 시간 (운동장)</option>
                <option value="classroom">교실 사진 (수업 중)</option>
                <option value="group_photo">단체 사진 (반 사진)</option>
              </select>

              <button
                onClick={handleGenerate}
                disabled={isLoading || !selectedFile}
                className="generate-btn"
              >
                {isLoading ? "현상 중..." : "과거로 돌아가기"}
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
                    <img src={resultUrl} alt="변환된 사진" style={{ filter: 'sepia(0.15) brightness(0.95)' }} />
                    <div className="overlay"></div>
                    <div className="roll-tag">Developed</div>
                  </div>
                  <div className="sprocket-col">
                    {[...Array(5)].map((_, i) => <div key={i} className="sprocket"></div>)}
                  </div>
                </div>
              </div>
              <div className="result-actions">
                <a href={resultUrl} download="sajinkwan-result.png" className="download-btn">
                  Download
                </a>
              </div>
            </>
          )}

          {!isLoading && !resultUrl && !error && (
            <div className="empty-box">
              <p>아직 현상된 사진이 없습니다.<br />위에서 사진을 올리고 변환해주세요.</p>
            </div>
          )}
        </section>

        {/* ===== 인용문 ===== */}
        <section className="quote-section">
          <div className="quote-box">
            <p>Every negative holds a memory.<br />Here, we keep them from fading into the ether.</p>
            <div className="quote-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </section>
      </div>

      {/* ===== 하단 네비게이션 ===== */}
      <nav className="bottom-nav">
        <div className="nav-inner">
          <button className="nav-btn active">
            <span className="material-symbols-outlined">photo_camera</span>
            <span>Capture</span>
          </button>
          <button className="nav-btn">
            <span className="material-symbols-outlined">folder_open</span>
            <span>Vault</span>
          </button>
          <div className="nav-center">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
          <button className="nav-btn">
            <span className="material-symbols-outlined">auto_stories</span>
            <span>Logbook</span>
          </button>
          <button className="nav-btn">
            <span className="material-symbols-outlined">settings_accessibility</span>
            <span>Atelier</span>
          </button>
        </div>
        <div className="nav-home-indicator"></div>
      </nav>
    </>
  );
}

export default App;
