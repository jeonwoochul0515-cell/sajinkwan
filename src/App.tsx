import { useState, type ChangeEvent } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [styleOption, setStyleOption] = useState('male_uniform'); // 기본값: 남학생 교복
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. 사진을 선택했을 때 미리보기 보여주는 함수
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultUrl(null); // 새 사진 올리면 기존 결과와 에러 지우기
      setError(null);
    }
  };

  // Base64 인코딩을 위한 유틸리티 함수
  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  // 2. '변환하기' 버튼 눌렀을 때 실행되는 함수 (수정됨)
  const handleGenerate = async () => {
    if (!selectedFile) {
      alert("학생, 사진도 안 올리고 변환하려니?");
      return;
    }

    setIsLoading(true);
    setResultUrl(null);
    setError(null);

    try {
      // 이미지를 base64로 변환
      const base64Image = await toBase64(selectedFile);

      // 마스터 프롬프트: 영화 클래식/친구/말죽거리잔혹사 기반
      // 얼굴은 절대 변경하지 않음 (same face 강조)
      const MASTER_PROMPT =
        "analog film photograph, shot on Kodak Gold 200, " +
        "natural film grain, vintage color grading, soft warm tone, " +
        "1970s 1980s South Korea, " +
        "preserve original face exactly, same face, identical face, do not change face";

      // 스타일별 프롬프트 (영화 3편 기반)
      let specificPrompt = "";
      if (styleOption === 'male_uniform') {
        // 남학생 교복: 영화 친구/말죽거리잔혹사 스타일
        // 검정 입학(학란) + 금속 단추 + 하얀 와이셔츠 + 명찰
        specificPrompt =
          "a male student wearing black Korean Hankbok school uniform, " +
          "black stand-up collar tunic with 5 brass metal buttons in a row, " +
          "stiff mandarin collar buttoned to the top, white dress shirt visible at collar, " +
          "white rectangular plastic name tag on left chest, " +
          "short buzz cut hair or crew cut, " +
          "background: old Korean school corridor with grey concrete walls and wooden doors, " +
          "or old narrow Korean alley with low brick walls and slate rooftops, " +
          "studio portrait with flash";
      } else if (styleOption === 'female_uniform') {
        // 여학생 교복: 영화 클래식 스타일
        // 검정 세일러 아닌 한국식 = 하얀 블라우스 + 검정 조끼/점퍼스커트
        specificPrompt =
          "a female student wearing 1970s Korean girl school uniform, " +
          "white round-collar blouse with black jumper skirt below the knee, " +
          "or white blouse with dark navy vest and black pleated skirt, " +
          "white socks and black flat shoes, hair in two braids or short bob with hair pin, " +
          "background: old Korean school campus with cherry blossom trees, " +
          "or retro Korean street with old signboards and concrete buildings, " +
          "studio portrait with flash";
      } else if (styleOption === 'military_training') {
        // 교련복: 영화 말죽거리잔혹사 스타일
        // 카키색 교련복 + 전투모
        specificPrompt =
          "a student wearing 1970s 1980s Korean military training uniform Kyoryunbok, " +
          "olive khaki green uniform jacket and trousers, " +
          "matching olive green military cap on head, black military boots, " +
          "standing at attention, " +
          "background: dusty school dirt playground with goalposts, " +
          "or open field drill ground with Korean school building behind, " +
          "outdoor harsh sunlight";
      }

      // 최종 프롬프트 합체
      const promptText = `${specificPrompt}, ${MASTER_PROMPT}, masterpiece, best quality, photorealistic`;

      // 1단계: 백엔드에 예측 시작 요청
      setLoadingMsg('사진관 아저씨가 필름을 꺼내고 있습니다...');
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image, promptText }),
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

      // 2단계: 클라이언트에서 폴링 (서버 subrequest 제한 회피)
      const statusMessages = [
        '암실에서 현상액을 준비하고 있습니다...',
        '필름에 빛을 쬐고 있습니다...',
        '인화지에 상이 떠오르고 있습니다...',
        '색감을 보정하고 있습니다...',
        '거의 다 됐습니다, 조금만 기다려주세요...',
      ];
      let pollCount = 0;

      while (true) {
        await new Promise(r => setTimeout(r, 2000)); // 2초 간격 폴링
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

        // 2분 타임아웃
        if (pollCount > 60) {
          throw new Error('변환 시간이 너무 오래 걸립니다. 다시 시도해주세요.');
        }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || '변환 중 에러가 발생했습니다.');
      alert(`에러가 났어요: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🎞️ 7080 추억의 사진관</h1>
        <p>그 시절, 우리가 입었던 그 교복 그대로.</p>
      </header>

      <main className="main-content">
        {/* 왼쪽: 입력 창 */}
        <div className="card input-section">
          <h3>1. 사진을 올려주세요</h3>
          <input type="file" accept="image/*" onChange={handleFileChange} className="file-input" />
          
          {previewUrl && (
            <div className="image-preview">
              <img src={previewUrl} alt="미리보기" />
            </div>
          )}

          <h3>2. 스타일을 골라주세요</h3>
          <select 
            value={styleOption} 
            onChange={(e) => setStyleOption(e.target.value)}
            className="style-select"
          >
            <option value="male_uniform">남학생 교복 (친구/말죽거리 스타일)</option>
            <option value="female_uniform">여학생 교복 (클래식 스타일)</option>
            <option value="military_training">교련복 (말죽거리 스타일)</option>
          </select>

          <button 
            onClick={handleGenerate} 
            disabled={isLoading || !selectedFile}
            className="generate-btn"
          >
            {isLoading ? "타임머신 가동 중..." : "📸 과거로 돌아가기"}
          </button>
        </div>

        {/* 오른쪽: 결과 창 */}
        <div className="card result-section">
          <h3>3. 변환 결과</h3>
          {isLoading && <div className="placeholder"><p>{loadingMsg || '사진을 변환하고 있습니다...'}</p></div>}
          {error && <div className="placeholder"><p style={{color: 'red'}}>에러: {error}</p></div>}
          {resultUrl && (
            <div className="result-image">
              <img src={resultUrl} alt="변환된 사진" />
              <a href={resultUrl} download="result.png" className="download-btn">다운로드</a>
            </div>
          )}
          {!isLoading && !resultUrl && !error &&(
            <div className="placeholder">
              <p>아직 사진이 없습니다.<br/>왼쪽에서 변환을 시작해주세요.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>© 2026 추억의 사진관 | 기술문의: 010-0000-0000</p>
      </footer>
    </div>
  );
}

export default App;
