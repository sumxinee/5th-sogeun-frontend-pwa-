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
  const [currentPage, setCurrentPage] = useState<"gps" | "search">("gps");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [bgmUrl, setBgmUrl] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (bgmUrl) {
        audioRef.current.play().catch(() => {}); // URL 있으면 재생
      } else {
        audioRef.current.pause(); // URL 없으면 멈춤
      }
    }
  }, [bgmUrl]);
  const handleSelectTrack = (track: Track) => {
    setCurrentTrack(track);
    setCurrentPage("gps");
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
              onPlayMusic={(url) => setBgmUrl(url)}
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
