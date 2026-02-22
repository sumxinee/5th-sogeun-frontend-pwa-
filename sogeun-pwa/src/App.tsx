import { useState, useRef, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { fetchEventSource } from "@microsoft/fetch-event-source";

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

const BASE_URL = "https://api.sogeun.cloud";

// MainScreen에서 발생하는 Props 전달 에러를 방지하기 위해 래퍼 컴포넌트 정리
const MainScreen = ({
  currentTrack,
  bgmUrl,
  setBgmUrl,
  handleSelectTrack,
  myLocation,
  serverUsers,
}: any) => {
  const [currentPage, setCurrentPage] = useState<"gps" | "search">("gps");

  return (
    <div className="relative w-full h-screen overflow-hidden bg-transparent">
      <AnimatePresence mode="wait">
        {currentPage === "gps" ? (
          <motion.div
            key="gps-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0"
          >
            {/* GPSProps 타입 에러를 방지하기 위해 명세에 있는 모든 핸들러 전달 */}
            <GPS
              onPlusClick={() => setCurrentPage("search")}
              currentTrack={currentTrack}
              onSelectTrack={handleSelectTrack}
              myLocation={myLocation}
              serverUsers={serverUsers}
              onTogglePlay={(play: boolean) => {
                const audio = document.querySelector("audio");
                if (audio) {
                  if (play) audio.play().catch(() => {});
                  else audio.pause();
                }
              }}
              onPlayPeopleMusic={(url: string) => setBgmUrl(url || bgmUrl)}
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
              onPlayMusic={(url: string) => setBgmUrl(url)}
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
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [bgmUrl, setBgmUrl] = useState<string>("");
  const [myLocation, setMyLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [serverUsers, setServerUsers] = useState<any[]>([]);
  const [isStreamConnected, setIsStreamConnected] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const myUserId = localStorage.getItem("userId");

  // 토큰 정제 (useCallback으로 최적화 및 에러 방지)
  const getCleanToken = useCallback(() => {
    const rawToken = localStorage.getItem("accessToken") || "";
    return rawToken.replace(/['"<>\\]/g, "").trim();
  }, []);

  const cleanToken = getCleanToken();

  // 1. 전역 위치 추적 및 서버 업데이트
  useEffect(() => {
    if (!("geolocation" in navigator) || !cleanToken || !myUserId) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMyLocation({ lat: latitude, lon: longitude });

        const numericUserId = Number(myUserId);
        if (isNaN(numericUserId)) return;

        axios
          .post(
            `${BASE_URL}/api/sse/location/update?userId=${numericUserId}`,
            { lat: latitude, lon: longitude },
            {
              headers: {
                Authorization: `Bearer ${cleanToken}`,
                "Content-Type": "application/json",
              },
            },
          )
          .catch(() => {
            /* 에러 무시 */
          });
      },
      () => {
        /* 에러 핸들러 */
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [cleanToken, myUserId]);

  // 2. 전역 SSE 스트림 연결
  useEffect(() => {
    if (!cleanToken || !myLocation) return;

    const ctrl = new AbortController();
    const connectStream = async () => {
      try {
        await fetchEventSource(`${BASE_URL}/api/sse/stream`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${cleanToken}`,
            Accept: "text/event-stream, application/json",
          },
          signal: ctrl.signal,
          onopen: async (res) => {
            if (res.ok) {
              console.log("📡 SSE 스트림 연결 성공");
              setIsStreamConnected(true);
            }
          },
          onmessage: (event) => {
            if (event.data === "heartbeat" || event.data === "ok") return;
            try {
              const data = JSON.parse(event.data);
              if (Array.isArray(data)) setServerUsers(data);
            } catch {
              /* 파싱 에러 방지 */
            }
          },
          onerror: () => {
            ctrl.abort();
            setIsStreamConnected(false);
          },
        });
      } catch {
        /* 에러 방지 */
      }
    };

    connectStream();
    return () => ctrl.abort();
  }, [cleanToken, myLocation]);

  // 3. 방송 자동 ON 로직 (currentTrack이 변경될 때만 실행)
  useEffect(() => {
    if (
      isStreamConnected &&
      currentTrack?.trackId &&
      cleanToken &&
      myLocation
    ) {
      axios
        .post(
          `${BASE_URL}/api/broadcast/on`,
          {
            lat: myLocation.lat,
            lon: myLocation.lon,
            music: {
              trackId: currentTrack.trackId,
              title: currentTrack.trackName,
              artist: currentTrack.artistName,
              artworkUrl: currentTrack.artworkUrl100,
              previewUrl: currentTrack.previewUrl,
            },
          },
          { headers: { Authorization: `Bearer ${cleanToken}` } },
        )
        .catch(() => {});
    }
  }, [isStreamConnected, currentTrack, cleanToken, myLocation]);

  const handleSelectTrack = (track: Track) => {
    setCurrentTrack(track);
    setBgmUrl(track.previewUrl);
  };

  return (
    <BrowserRouter>
      {/* 전역 오디오: 끊김 없는 재생 보장 */}
      <audio ref={audioRef} src={bgmUrl} loop autoPlay />
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route
          path="/gps"
          element={
            <MainScreen
              currentTrack={currentTrack}
              bgmUrl={bgmUrl}
              setBgmUrl={setBgmUrl}
              handleSelectTrack={handleSelectTrack}
              myLocation={myLocation}
              serverUsers={serverUsers}
            />
          }
        />
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
