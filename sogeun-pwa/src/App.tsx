import { useState, useRef, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// 페이지 컴포넌트들
import AuthPage from "./pages/AuthPage";
import GPS from "./pages/GPS";
import SearchPage from "./pages/SearchPage";
import ProfileEditPage from "./pages/ProfileEditPage";
import ProfilePage from "./pages/ProfilePage";
import OtherUserProfilePage from "./pages/OtherUserProfilePage";
import SogeunSongsPage from "./pages/SogeunSongsPage";
import SongEditPage from "./pages/SongEditPage";
import type { Track } from "./pages/SearchPage";

const MainScreen = () => {
  const [currentPage, setCurrentPage] = useState<"gps" | "search">("gps");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [bgmUrl, setBgmUrl] = useState<string>("");
  const [originalBgmUrl, setOriginalBgmUrl] = useState<string>("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const location = useLocation(); // ✅ 위치 정보 감지 추가

  // --- 🔒 토큰 정제 함수 ---
  const getCleanToken = () => {
    const rawToken = localStorage.getItem("accessToken") || "";
    return rawToken.replace(/['"<>\\]/g, "").trim();
  };

  // --- 📡 방송 정보 가져오기 (이게 글자를 바꿔주는 핵심 함수입니다) ---
  const fetchMyBroadcastStatus = async () => {
    const token = getCleanToken();
    if (!token) return;

    try {
      // 내 방송 상태 조회 API (엔드포인트는 실제 서버 명세에 맞춰 확인 필요)
      const res = await axios.get("https://api.sogeun.cloud/api/broadcast/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data && res.data.music) {
        const music = res.data.music;
        const trackData: Track = {
          trackId: music.trackId,
          trackName: music.title,
          artistName: music.artist,
          artworkUrl100: music.artworkUrl,
          previewUrl: music.previewUrl
        };
        setCurrentTrack(trackData);
        setBgmUrl(trackData.previewUrl);
        setOriginalBgmUrl(trackData.previewUrl);
      }
    } catch (error) {
      console.log("방송 정보를 불러오지 못했습니다.");
    }
  };

  // 🌟 [핵심] 노래 변경 페이지에서 돌아왔을 때(shouldRefresh) 감지
  useEffect(() => {
    // SongEditPage에서 navigate("/", { state: { shouldRefresh: true } })로 보낸 신호를 읽음
    if (location.state?.shouldRefresh) {
      console.log("🔄 노래 변경 감지: 데이터를 새로고침합니다.");
      fetchMyBroadcastStatus();
      
      // ✅ 신호를 처리했으므로 state 초기화 (새로고침 시 무한 루프 방지)
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 메인 화면 진입 시 자동 방송 ON 및 초기 데이터 로딩
  useEffect(() => {
    const initBroadcast = async () => {
      const token = getCleanToken();
      if (!token) return;

      try {
        await axios.post('https://api.sogeun.cloud/api/broadcast/on', null, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("✅ 방송 자동 ON");
        fetchMyBroadcastStatus(); // 켜진 후 정보 가져오기
      } catch (error) {
        fetchMyBroadcastStatus(); // 이미 켜져있다면 정보만 가져오기
      }
    };

    initBroadcast();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.2;
      if (bgmUrl) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [bgmUrl]);

  const handleTogglePlay = (shouldPlay: boolean) => {
    if (!audioRef.current) return;
    shouldPlay ? audioRef.current.play() : audioRef.current.pause();
  };

  const handleSelectTrack = (track: Track) => {
    setCurrentTrack(track);
    setBgmUrl(track.previewUrl);
    setOriginalBgmUrl(track.previewUrl);
    setCurrentPage("gps");
  };

  const handlePlayPeopleMusic = (url: string) => {
    setBgmUrl(url || originalBgmUrl);
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
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50"
          >
            <SearchPage
              onPlayMusic={(url) => setBgmUrl(url)}
              onSelectTrack={handleSelectTrack}
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
        <Route path="/user/:id" element={<OtherUserProfilePage />} />
        <Route path="/sogeun-songs" element={<SogeunSongsPage />} />
        <Route path="/profile/edit/song" element={<SongEditPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;