import { useState, useRef, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// 페이지 컴포넌트들
import AuthPage from "./pages/AuthPage";
import GPS from "./pages/GPS";
import SearchPage from "./pages/SearchPage";
import ProfileEditPage from "./pages/ProfileEditPage";
import ProfilePage from "./pages/ProfilePage";
import type { Track } from "./pages/SearchPage";

const MainScreen = () => {
  // 1. 오디오 객체를 담을 ref가 부모에 있어야 합니다.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentPage, setCurrentPage] = useState<"gps" | "search">("gps");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  const [bgmUrl, setBgmUrl] = useState<string>("");
  // 주변 사람 노래를 들을 때 원래 노래를 기억해둘 공간
  const [originalBgmUrl, setOriginalBgmUrl] = useState<string>("");

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.2; // 기본 볼륨 설정
      if (bgmUrl) {
        audioRef.current.play().catch(() => {}); // URL 있으면 재생
      } else {
        audioRef.current.pause(); // URL 없으면 멈춤
      }
    }
  }, [bgmUrl]);
  // 2. 재생/일시정지만 제어하는 함수를 만듭니다.
  const handleTogglePlay = (shouldPlay: boolean) => {
    if (!audioRef.current) return;

    if (shouldPlay) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };
  const handleSelectTrack = (track: Track) => {
    setCurrentTrack(track);
    setBgmUrl(track.previewUrl);
    setOriginalBgmUrl(track.previewUrl); // 나중에 돌아올 '진짜 내 노래'로 저장
    setCurrentPage("gps");
  };

  // GPS 화면(주변 사람들)에서 호출할 재생/복구 로직
  const handlePlayPeopleMusic = (url: string) => {
    if (url) {
      // 주변 사람 노래 재생 (잠시 교체)
      setBgmUrl(url);
    } else {
      // 바텀시트 닫을 때: 원래 내가 듣던 노래(original)로 복구
      setBgmUrl(originalBgmUrl);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-transparent">
      <audio ref={audioRef} src={bgmUrl} loop />

      <AnimatePresence mode="wait">
        {currentPage === "gps" ? (
          <motion.div
            key="gps-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0"
          >
            <GPS
              onPlusClick={() => setCurrentPage("search")}
              currentTrack={currentTrack}
              onSelectTrack={handleSelectTrack}
              // 주변 사람 노래 틀 때는 URL을, 닫을 때는 빈 값을 넣도록 GPS를 수정해야 함
              onPlayPeopleMusic={handlePlayPeopleMusic}
              onTogglePlay={handleTogglePlay}
            />
          </motion.div>
        ) : (
          <motion.div
            key="search-page"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute inset-0 z-50"
          >
            <SearchPage
              onPlayMusic={(url) => {
                setBgmUrl(url);
                // SearchPage에서 재생하는 건 '미리듣기' 성격이 강하므로
                // originalBgmUrl은 바꾸지 않고 bgmUrl만 바꿉니다.
              }}
              onBack={() => setCurrentPage("gps")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/gps" element={<MainScreen />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<ProfileEditPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
