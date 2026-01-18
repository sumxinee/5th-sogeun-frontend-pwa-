import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GPS from "./pages/GPS";
import SearchPage from "./pages/SearchPage";
import type { Track } from "./pages/SearchPage";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<"gps" | "search">("gps");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  // 트랙 선택 시 처리
  const handleSelectTrack = (track: Track) => {
    setCurrentTrack(track);
    setCurrentPage("gps");
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        {currentPage === "gps" ? (
          <motion.div
            key="gps-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <GPS
              onPlusClick={() => setCurrentPage("search")}
              currentTrack={currentTrack}
              onSelectTrack={handleSelectTrack} // 에러 해결을 위해 반드시 전달
            />
          </motion.div>
        ) : (
          <motion.div
            key="search-page"
            initial={{ y: "100%" }} // 아래에서 위로 등장
            animate={{ y: 0 }}
            exit={{ y: "100%" }} // 다시 아래로 내려가며 퇴장
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50"
          >
            <SearchPage
              onSelectTrack={handleSelectTrack}
              onBack={() => setCurrentPage("gps")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
