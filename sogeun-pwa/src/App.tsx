// src/App.tsx
// 화면 전체를 관리하는 틀. 주소 확인하고 그 주소에 맞는 페이지를 화면에 갈아 끼우는 역할.
import GPS from "./pages/GPS"; // 1. Explore 파일 불러오기

function App() {
  return (
    <>
      {/* 2. 기존 글자들은 지우고 Explore 컴포넌트를 배치 */}
      <GPS />
    </>
  );
}

export default App;
