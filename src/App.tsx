import { useState, type ChangeEvent } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [styleOption, setStyleOption] = useState('school_uniform'); // 기본값: 검정 교복
  const [isLoading, setIsLoading] = useState(false);
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

      // 프롬프트(명령어) 설정
      let promptText = "Korean vintage school uniform, black uniform, 1970s retro style";
      if (styleOption === 'military_training') {
        promptText = "Korean retro military training school uniform (Kyoryunbok), camouflage pattern, 1980s vibe";
      }

      // 우리 백엔드 API(/api/generate)를 호출
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Image,
          promptText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '알 수 없는 에러가 발생했습니다.');
      }

      const data = await response.json();
      setResultUrl(data.resultUrl);

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
            <option value="school_uniform">검정 옛날 교복 (남/녀)</option>
            <option value="military_training">얼룩무늬 교련복</option>
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
          {isLoading && <div className="placeholder"><p>사진을 변환하고 있습니다...</p></div>}
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
