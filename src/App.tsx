import { useState, type ChangeEvent } from 'react';
import './App.css';

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

// ===== 실제 한국 1970-80년대 교복 묘사 (일본식 요소 완전 제거) =====
const STYLE_CONFIGS: Record<string, { prompt: string; photomakerStyle: string }> = {
  male_uniform: {
    // 한국 남학생 교복: 검정 차이나칼라 (입깃), 1969-1983 전국 통일 교복
    // 출처: 한국민족문화대백과 "차이나칼라 교복", 말죽거리잔혹사 고증
    prompt: "a 17 year old Korean male student img wearing authentic 1970s Korean high school uniform, " +
      "black stiff stand-up collar jacket (china collar, ipkit 입깃), five silver or brass hook closures down the front instead of buttons, " +
      "collar buttoned all the way to the top in strict school rule, white cotton dress shirt visible at collar edge, " +
      "rectangular white plastic name tag pinned on left chest pocket with student name and class number in Korean, " +
      "black straight-leg trousers with sharp front crease, " +
      "17 year old youthful face, slim teenage boy physique, short military-style buzz cut hair (kkakka meori 까까머리), " +
      "serious disciplined expression, standing upright posture",
    photomakerStyle: "Photographic (Default)",
  },
  female_uniform: {
    // 한국 여학생 교복: 흰 블라우스 + 검정 조끼/점퍼스커트
    // 출처: YTN 교복 변천사, 1970년대 여학교 사진 자료
    prompt: "a 17 year old Korean female student img wearing authentic 1970s Korean girl high school uniform, " +
      "crisp white round peter pan collar blouse with long sleeves, " +
      "black sleeveless vest or black knee-length jumper dress (jumper skirt) worn over the blouse, " +
      "dark navy or black pleated wool skirt reaching below the knee (modest length), " +
      "white ankle socks and simple black flat Mary Jane shoes, " +
      "17 year old youthful face, slim teenage girl physique, " +
      "hair in two neat braids with ribbons or short bob cut with simple black hair pins, " +
      "gentle modest expression, proper posture with hands clasped in front",
    photomakerStyle: "Photographic (Default)",
  },
  military_training: {
    // 교련복: 학도호국단 후신, 1969년 신설, 얼룩무늬
    // 출처: 한국민족문화대백과 "교련복", 1968 청와대 습격 사건 이후 도입
    prompt: "a 17 year old Korean student img wearing authentic 1970s Korean military training uniform (Kyoryunbok 교련복), " +
      "olive khaki or black-white camouflage pattern long-sleeve shirt with patch pockets on both chest, " +
      "matching camouflage or olive trousers tucked into black combat boots or tied at ankles, " +
      "olive green beret cap or camouflage patrol cap worn straight, " +
      "standing at attention military posture with arms straight at sides, " +
      "17 year old youthful face, slim fit teenage athletic physique, short buzz cut hair, " +
      "serious disciplined military-style expression",
    photomakerStyle: "Photographic (Default)",
  },
  graduation: {
    // 졸업 증명사진: 정면 응시, 검정 교복, 1970년대 스튜디오
    prompt: "a 17 year old Korean student img in formal 1970s graduation ID photo, " +
      "wearing perfectly pressed black school uniform with china collar buttoned to top, " +
      "white name tag clearly visible on chest, " +
      "facing directly forward at camera with neutral serious expression, shoulders square, " +
      "17 year old youthful face, slim teenage build, neatly combed short hair for boys or neat braids for girls, " +
      "professional studio portrait lighting with slight shadow on one side, " +
      "formal stiff posture like official ID photograph",
    photomakerStyle: "Photographic (Default)",
  },
  picnic: {
    // 소풍: 1970-80년대 경주/설악산/공주 등, 김밥 도시락
    // 출처: 국가기록원 "소풍", 1970년대 학교 앨범 자료
    prompt: "a 17 year old Korean student img on school picnic excursion in 1980s Korea, " +
      "wearing casual comfortable clothes layered over parts of school uniform, light jacket or cardigan, " +
      "carrying an old canvas backpack and metal canteen with strap over shoulder, " +
      "walking or sitting in relaxed posture with classmates in background blur, " +
      "17 year old youthful energetic face with happy smile, slim active teenage physique, " +
      "casual messy windblown hair, candid snapshot feel not posed",
    photomakerStyle: "Photographic (Default)",
  },
  gym_class: {
    // 체육 시간: 흰 티셔츠 + 남색 짧은 반바지, 1970년대
    prompt: "a 17 year old Korean student img in 1970s school gym class (체육 시간), " +
      "wearing plain white short-sleeve cotton t-shirt and navy blue short athletic shorts (bloomer style for girls before 1990s), " +
      "white sneakers with no brand logos, white crew socks, " +
      "mid-action doing jumping jacks or running or stretching exercise, " +
      "17 year old youthful athletic face, slim fit teenage active physique, " +
      "hair tied back for girls or short for boys, energetic expression, outdoor lighting",
    photomakerStyle: "Photographic (Default)",
  },
  classroom: {
    // 교실 일상: 나무 책상, 녹색 칠판, 형광등, 1970년대
    prompt: "a 17 year old Korean student img sitting at dark wooden school desk in 1970s classroom, " +
      "wearing black school uniform, hunched over open textbook and notebook writing with pencil, " +
      "wooden desk with carved graffiti and scratches, green chalkboard with Korean writing visible in background, " +
      "fluorescent tube lights overhead creating harsh shadows, " +
      "17 year old youthful studious face, slim teenage build, " +
      "hair slightly messy from long study hours, tired but focused expression, candid moment not posed",
    photomakerStyle: "Photographic (Default)",
  },
  group_photo: {
    // 단체 사진: 운동장 정렬, 교복, 1970년대 반 사진
    // 출처: 수학여행 단체 사진, 졸업 앨범 자료
    prompt: "a 17 year old Korean student img posing in class group photo formation 1970s style, " +
      "wearing neat black school uniform with collar buttoned properly, " +
      "standing in organized rows with classmates blurred in background, " +
      "arms crossed in front of chest or hands clasped behind back in formal pose, " +
      "17 year old youthful face with slight awkward smile, slim teenage build, neatly combed hair, " +
      "stiff formal posture, taken with vintage camera flash creating slight overexposure",
    photomakerStyle: "Photographic (Default)",
  },
};

// ===== 부정 프롬프트: 일본식 요소 명시 차단 =====
const NEGATIVE_PROMPT =
  "gakuran, japanese school uniform, sailor fuku, blazer, necktie, suspenders, " +
  "western school uniform, british uniform, plaid pattern, " +
  "modern clothes, hoodie, sneakers with logos, " +
  "different face, face swap, ugly, deformed, blurry, low quality, " +
  "anime, cartoon, manga style, 3d render, digital painting, " +
  "plastic surgery face, k-pop idol face, mature adult body, overweight, muscular bodybuilder, " +
  "wrinkles, aged skin, grey hair";

const MASTER_SUFFIX =
  "analog film photograph shot on Kodak Gold 200 or Fuji Superia 400, " +
  "natural film grain and slight color shift, vintage faded warm tone with slight yellow cast, " +
  "1970s 1980s South Korea authentic period photo, " +
  "photorealistic documentary style, " +
  "NOT japanese NOT anime";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [styleOption, setStyleOption] = useState('auto');
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

      const { predictionId } = await response.json();

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
