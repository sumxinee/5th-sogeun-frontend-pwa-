/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useAtom, useAtomValue } from "jotai"; // 1. Jotai 추가
import { accessTokenAtom, userIdAtom } from "../store/auth"; // 토큰 아톰
import { locationAtom } from "../store/location"; // 기존에 있던 위치 아톰 활용
import { currentTrackAtom, isPlayingAtom } from "../store/music";
import type { Track } from "./SearchPage";
interface ServerUserData {
  id: number;
  nickname: string;
  musicName: string;
  artistName: string;
  latitude: number;
  longitude: number;
  previewUrl: string;
  artworkUrl: string;
}

interface GPSProps {
  onPlusClick: () => void;
  currentTrack: Track | null;
  onSelectTrack: (track: Track) => void;
}

// ------------------- [타입 정의] -------------------
interface HUDCircle {
  id: number;
  r: number;
  w: number;
  o: number;
  duration: number;
}

interface DetectedUser {
  id: number;
  name: string;
  song: string;
  artist: string;
  distance: string;
  lat: number;
  lng: number;
  angle: number;
  radius: number;
  previewUrl: string;
  artworkUrl: string;
}

interface Particle {
  id: number;
  top: string;
  left: string;
  size: number;
  opacity: number;
  duration: number;
}

// ------------------- [아이콘 컴포넌트] -------------------
const Icons = {
  Home: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  Plus: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-9 w-9 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        d="M12 4v16m8-8H4"
      />
    </svg>
  ),
  Profile: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  Music: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
      />
    </svg>
  ),
  ChevronDown: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  ),
  HeartOutline: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  ),
  HeartFilled: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8 text-red-500 fill-red-500"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  ),
};

const GPS: React.FC<GPSProps> = ({ onPlusClick, onSelectTrack }) => {
  const navigate = useNavigate();
  //const [selectedUser, setSelectedUser] = useState<DetectedUser | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [isThumbUp, setIsThumbUp] = useState(false);
  const [currentTrack, setCurrentTrack] = useAtom(currentTrackAtom);
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // 클릭 시 다른 레이어로 이벤트가 퍼지는 것 방지
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // 멈춰있는 오디오를 다시 재생할 때 src가 비어있지 않은지 확인
      /*if (audioRef.current.src) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.error("Playback failed:", err);
            setIsPlaying(false);
          });
      }*/
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("재생 실패:", err));
    }
  };
  // 검색 결과가 바뀔 때마다 실행
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [selectedUser, setSelectedUser] = useState<DetectedUser | null>(null);

  // 2. Jotai 상태 구독
  const [token, setToken] = useAtom(accessTokenAtom);
  const [myLocation, setMyLocation] = useAtom(locationAtom); // 전역 위치 상태 사용
  const [serverUsers, setServerUsers] = useState<ServerUserData[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<DetectedUser[]>([]);
  const [myUserId] = useAtom(userIdAtom);
  const BASE_URL =
    "https://pruxd7efo3.execute-api.ap-northeast-2.amazonaws.com/clean";

  // ------------------- [배경 및 HUD 초기 설정] -------------------
  // 2. 배경 파티클
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2.2 + 0.2,
      opacity: Math.random() * 0.4 + 0.1,
      duration: Math.random() * 40 + 20,
    })),
  );

  // 3. HUD 서클
  const [hudCircles] = useState<HUDCircle[]>(() => {
    const circles: HUDCircle[] = [];
    let currentR = 20;
    for (let i = 0; i < 4; i++) {
      currentR += Math.floor(Math.random() * 20) + 15;
      circles.push({
        id: i,
        r: currentR,
        w: Math.random() * 1.5 + 1.2,
        o: Math.random() * 0.3 + 0.6,
        duration: Math.random() * 2 + 3.5,
      });
    }
    return circles;
  });

  // 4. 레이더 장식용 회전 선들 (수정됨)
  const extraSegments = [
    {
      r: 140,
      w: 4,
      d: "120 280",
      s: 8,
      dir: 1,
      color: "var(--sogun-cyan)",
    }, // 가장 바깥쪽 두꺼운 파란 원호
    {
      r: 120,
      w: 1,
      d: "40 80",
      s: 15,
      dir: -1,
      color: "var(--sogun-white)",
    },
    {
      r: 90,
      w: 2,
      d: "180 180",
      s: 12,
      dir: 1,
      color: "rgba(34, 211, 238, 0.4)",
    },
  ];

  // 5. 심장박동 Path
  const centeredPath =
    "M -100 50 H 35 L 43 35 L 51 65 L 59 50 H 92 L 100 25 L 108 75 L 116 50 H 149 L 157 35 L 165 65 L 173 50 H 300";

  useEffect(() => {
    // 토큰이나 위치가 없으면 연결하지 않음
    if (!token || !myLocation || !myUserId) {
      console.log("⏳ SSE 대기 중: ", {
        token: !!token,
        location: !!myLocation,
        userId: !!myUserId,
      });
      return;
    }

    const sseEndpoint = `${BASE_URL}/sse/location/nearby?userId=${myUserId}&lat=${myLocation.lat}&lon=${myLocation.lng}`;
    const ctrl = new AbortController();

    const connectSSE = async () => {
      try {
        await fetchEventSource(sseEndpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Jotai에서 가져온 토큰
            //Accept: "text/event-stream",
            Accept: "*/*",
            //"Cache-Control": "no-cache",
          },
          signal: ctrl.signal,
          onopen: async (res) => {
            if (res.ok) console.log("🚀 SSE 연결 성공!");
            else if (res.status === 401 || res.status === 403) {
              setToken(null); // 토큰 만료 시 초기화
              console.error("인증 에러: 로그인이 필요합니다.");
              console.error("SSE 연결 실패 상태코드:", res.status);
            }
          },
          onmessage: (event) => {
            if (event.data && event.data !== "heartbeat") {
              try {
                setServerUsers(JSON.parse(event.data));
              } catch (e) {
                console.error("파싱 실패:", e);
              }
            }
          },
          onerror: (err) => {
            console.error("SSE 에러:", err);
            ctrl.abort();
          },
        });
      } catch (err) {
        console.log("SSE 중단 또는 에러 발생");
      }
    };

    connectSSE();
    return () => ctrl.abort(); // 컴포넌트 언마운트 혹은 토큰/위치 변경 시 연결 해제
  }, [token, myLocation?.lat, myLocation?.lng]); // 3. 토큰과 위치를 의존성에 추가

  // ------------------- [기능 2: 내 위치 추적 및 서버 전송 (POST)] -------------------
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      console.error("이 브라우저는 위치 정보를 지원하지 않습니다.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPos = { lat: latitude, lng: longitude };

        // 위치 상태 업데이트 (Jotai)
        setMyLocation(newPos);
        // 토큰이 없으면 전송하지 않음
        if (token && myUserId) {
          const url = `${BASE_URL}/sse/location/update?userId=${myUserId}&lat=${latitude.toFixed(6)}&lon=${longitude.toFixed(6)}`;

          fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
            .then((res) => {
              if (res.ok) console.log("📍 위치 업데이트 성공!");
            })
            .catch((err) => console.error("위치 전송 실패:", err));
        }
      },
      (error) => console.error("위치 추적 오류:", error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [token, myUserId]); // 토큰이 있을 때만 watch 시작

  // ------------------- [기능 3: 유저 거리 계산 로직] -------------------
  useEffect(() => {
    // 1. 레이더에 항상 띄울 목데이터 정의
    const mockUser: DetectedUser = {
      id: 999,
      name: "홍익대학교 동기",
      song: "Ditto",
      artist: "NewJeans",
      distance: "123m",
      lat: 37.55,
      lng: 126.924,
      angle: 45,
      radius: 80,
      artworkUrl:
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/63/e5/e2/63e5e2e4-829b-924d-a1dc-8058a1d69bd4/196922462702_Cover.jpg/100x100bb.jpg",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/62/90/70/6290709d-e8ef-fbba-57f0-b5ef4ffb556d/mzaf_5031206073063517293.plus.aac.p.m4a",
    };

    // 2. 서버 데이터 변환 로직 (기존 코드 유지)
    const updatedUsers = serverUsers.map((user) => {
      const dy = user.latitude - (myLocation?.lat || 0);
      const dx = user.longitude - (myLocation?.lng || 0);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const rawDistMeters = Math.sqrt(dx * dx + dy * dy) * 111000;
      const uiRadius = Math.min(rawDistMeters * 2, 140);

      return {
        id: user.id,
        name: user.nickname,
        song: user.musicName,
        artist: user.artistName,
        lat: user.latitude,
        lng: user.longitude,
        artworkUrl: user.artworkUrl,
        previewUrl: user.previewUrl,
        angle: angle,
        radius: uiRadius,
        distance: `${Math.floor(rawDistMeters)}m`,
      };
    });

    // 3. [핵심] 목데이터 + 서버 데이터를 합쳐서 세팅
    setNearbyUsers([mockUser, ...updatedUsers]);
  }, [myLocation, serverUsers]);
  // ------------------- [Effect: Geolocation] -------------------
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setNearbyUsers((prev) =>
          prev.map((user) => {
            const dy = user.lat - latitude;
            const dx = user.lng - longitude;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            const rawDist = Math.sqrt(dx * dx + dy * dy) * 100000;
            const radius = Math.min(rawDist, 140);
            return {
              ...user,
              angle,
              radius,
              distance: `${Math.floor(rawDist / 10)}m`,
            };
          }),
        );
      },
      (error) => console.error("위치 추적 오류:", error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);
  // ------------------- [기능 3: 유저 거리 계산 로직] -------------------
  /*useEffect(() => {
    // 1. [수정] 목데이터를 생성하던 변수를 삭제하거나 무시합니다.

    // 2. 서버 데이터 변환 로직 (실제 유저들만 계산)
    const updatedUsers = serverUsers.map((user) => {
      const dy = user.latitude - (myLocation?.lat || 0);
      const dx = user.longitude - (myLocation?.lng || 0);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const rawDistMeters = Math.sqrt(dx * dx + dy * dy) * 111000;
      const uiRadius = Math.min(rawDistMeters * 2, 140);

      return {
        id: user.id,
        name: user.nickname,
        song: user.musicName,
        artist: user.artistName,
        lat: user.latitude,
        lng: user.longitude,
        artworkUrl: user.artworkUrl,
        previewUrl: user.previewUrl,
        angle: angle,
        radius: uiRadius,
        distance: `${Math.floor(rawDistMeters)}m`,
      };
    });

    // 3. [핵심] 이제 mockUser 없이 서버에서 온 데이터(updatedUsers)만 세팅합니다.
    setNearbyUsers(updatedUsers);
  }, [myLocation, serverUsers])*/

  // ------------------- [Effect: Audio Playback] -------------------
  useEffect(() => {
    let isComponentActive = true;
    // 1. 기존 오디오 객체가 있다면 즉시 정지 및 소스 초기화
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
      audioRef.current = null;
      setIsPlaying(false);
    }

    // 2. 바텀시트가 열려있고(selectedUser 존재) URL이 있을 때만 재생
    if (selectedUser?.previewUrl) {
      const audio = new Audio(selectedUser.previewUrl);
      audio.loop = true;
      audio.volume = 0.1;
      audioRef.current = audio;

      const playAudio = async () => {
        try {
          if (!isComponentActive) return;
          await audio.play();
          if (isComponentActive) setIsPlaying(true);
        } catch (err) {
          if (isComponentActive) setIsPlaying(false);
          console.warn("자동 재생 차단됨. 사용자의 인터랙션이 필요합니다.");
        }
      };

      audioRef.current = audio;
      playAudio();
    }

    // 3. [중요] 클린업 함수: 바텀시트가 닫힐 때(selectedUser -> null) 음악 정지
    return () => {
      isComponentActive = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
        audioRef.current = null;
        setIsPlaying(false);
      }
    };
  }, [selectedUser]); // selectedUser 상태를 감시함
  // 검색에서 트랙을 선택했을 때(currentTrack) 음악 재생을 위한 Effect
  useEffect(() => {
    if (currentTrack?.previewUrl) {
      // 기존 오디오 정지
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(currentTrack.previewUrl);
      audio.loop = true;
      audio.volume = 0.2;
      audioRef.current = audio;

      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [currentTrack]);
  // ------------------- [Handle Drag - 수정됨] -------------------
  const handleDragEnd = (_: any, info: PanInfo) => {
    // 아래로 100px 이상 내리거나 빠르게 휘두르면 닫기
    if (info.offset.y > 100 || info.velocity.y > 500) {
      setSelectedUser(null);
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // ------------------- [Render] -------------------
  return (
    <div
      className="flex flex-col w-full max-w-md mx-auto min-h-screen font-sans relative overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(135deg, #FBC2EB 0%, #A6C1EE 50%, #84FAB0 100%)",
      }}
    >
      {/* 1. 배경 패턴 */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(rgba(103,232,249,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 mix-blend-screen" />
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute bg-white rounded-full mix-blend-screen"
            style={{
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              boxShadow: `0 0 ${p.size * 3}px rgba(255,255,255,0.7)`,
            }}
            animate={{
              y: [0, -60, 0],
              x: [0, 25, 0],
              opacity: [p.opacity, p.opacity * 0.1, p.opacity],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>
      {/* 2. 상단 헤더 */}
      <div className="flex justify-between items-start pt-12 px-6 z-10">
        <div>
          <h1 className="text-2xl font-black tracking-tighter leading-none drop-shadow-md">
            소근
          </h1>
          <p className="text-sm opacity-80 mt-1 font-medium tracking-tight">
            소리가 근처에
          </p>
        </div>
        <div className="bg-pink-300/80 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center shadow-lg h-fit">
          <span className="mr-1">⚡</span> Lv.7
        </div>
      </div>
      {/* 3. 메인 레이더 */}
      <div className="relative flex flex-col items-center justify-center w-full aspect-square mt-4 mb-4 z-10 px-6">
        {/* Waves */}
        {[0, 2.5, 5.0].map((delay) => (
          <motion.div
            key={`wave-${delay}`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{
              scale: 3.2,
              opacity: [0, 0.55, 0],
              borderRadius: [
                "50% 50% 50% 50%",
                "45% 55% 48% 52%",
                "52% 48% 55% 45%",
                "50% 50% 50% 50%",
              ],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              delay,
              ease: "linear",
            }}
            className="absolute w-[240px] h-[240px] border-[4px] border-cyan-400/70 mix-blend-screen blur-[1px] shadow-[0_0_20px_rgba(34,211,238,0.5)]"
          />
        ))}

        {/* extraSegments */}
        <div className="absolute inset-[-80px] z-15 pointer-events-none">
          <svg viewBox="0 0 420 420" className="w-full h-full overflow-visible">
            {extraSegments.map((seg, i) => (
              <motion.circle
                key={i}
                cx="210"
                cy="210"
                r={seg.r}
                fill="none"
                stroke="rgba(0, 255, 255, 0.3)"
                strokeWidth={seg.w}
                strokeDasharray={seg.d}
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 8px var(--sogun-cyan))" }}
                animate={{ rotate: 360 * seg.dir }}
                transition={{
                  duration: seg.s,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </svg>
        </div>

        {/* HUD Circles */}
        {hudCircles.map((circle, i) => (
          <motion.div
            key={circle.id}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1.25, opacity: [0, circle.o, 0] }}
            transition={{
              duration: circle.duration,
              repeat: Infinity,
              delay: i * 0.7,
              ease: "easeOut",
            }}
            className="absolute rounded-full border-white/90 border-solid mix-blend-screen shadow-[0_0_12px_rgba(255,255,255,0.4)]"
            style={{
              width: circle.r * 2,
              height: circle.r * 2,
              borderWidth: circle.w,
            }}
          />
        ))}

        {/* Users */}
        {nearbyUsers.map((user) => (
          <div
            key={user.id}
            className="absolute z-[80]"
            style={{
              transform: `rotate(${user.angle}deg) translate(${user.radius}px) rotate(${-user.angle}deg)`,
            }}
            onClick={() => setSelectedUser(user)}
          >
            {/* 하얀 점 */}
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-4 h-4 bg-white rounded-full shadow-[0_0_15px_white] z-30 cursor-pointer"
            />

            {/* 작은 반투명 네모 (툴팁) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl whitespace-nowrap z-20 pointer-events-none"
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white drop-shadow-md flex items-center gap-1">
                  {user.name} <span className="text-[8px]">☁️</span>
                </span>
                <span className="text-[8px] text-white/80 drop-shadow-sm">
                  {user.song}
                </span>
              </div>
            </motion.div>
          </div>
        ))}

        {/* Center Scanner */}
        <div className="relative flex items-center justify-center w-[280px] h-[280px] rounded-full">
          <div className="absolute inset-0 rounded-full border-[10px] border-white shadow-[0_0_80px_rgba(255,255,255,1)] z-10" />
          <div className="w-[450px] h-[260px] overflow-visible relative flex items-center justify-center z-50">
            <svg
              width="100%"
              height="80%"
              viewBox="0 0 200 100"
              preserveAspectRatio="none"
              className="overflow-visible pointer-events-none"
            >
              <motion.path
                d={centeredPath}
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{
                  pathLength: [0, 1, 1, 1],
                  pathOffset: [0, 0, 0, 1],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  times: [0, 0.45, 0.6, 1],
                  ease: "easeInOut",
                }}
              />
            </svg>
          </div>
        </div>
      </div>
      {/* 4. 반경 설정 */}
      <div className="flex justify-center z-10 mt-6 mb-6">
        <button className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/40 text-[11px] font-black shadow-lg">
          내 반경 350m
        </button>
      </div>
      {/* 5. 사용자 리스트  */}
      <div className="flex-1 px-6 pb-32 z-10 overflow-y-auto space-y-4 scrollbar-hide">
        {nearbyUsers.map((user) => (
          <div
            key={user.id}
            onClick={() => setSelectedUser(user)}
            className="flex items-center bg-white/30 backdrop-blur-md p-4 rounded-[28px] border border-white/20 shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            <div className="w-14 h-14 bg-white/40 rounded-2xl flex items-center justify-center mr-4 overflow-hidden">
              {user.artworkUrl ? (
                <img
                  src={user.artworkUrl}
                  className="w-full h-full object-cover"
                  alt="art"
                />
              ) : (
                <Icons.Music />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-white leading-tight truncate">
                {user.song}
              </h3>
              <p className="text-[12px] text-white/70 mt-1 font-medium">
                {user.name}
              </p>
            </div>
            <div className="text-right">
              <div className="text-[#FF7EB3] text-[12px] font-bold mb-1 flex items-center justify-end gap-1">
                <span className="text-[10px]">♥</span> 234
              </div>
              <div className="flex items-center justify-end font-medium text-[10px] text-white/50">
                <div className="w-1.5 h-1.5 bg-[#FF7EB3] rounded-full mr-1.5" />
                {user.distance}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* 6. 하단 내비게이션 및 Now Playing 카드 (너비 및 위치 완전 수정) */}

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[88%] z-[120]">
        {/* [Now Playing] 하단바 바로 위에 위치하도록 배치 */}
        <AnimatePresence>
          {currentTrack && (
            <motion.div
              onClick={togglePlay} // 위에서 수정한 함수 연결
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              //style={{ pointerEvents: "auto" }} // 인라인 스타일로 강제 부여
              className="pointer-events-auto mx-auto mb-70 bg-white/20 backdrop-blur-xl border border-white/30 p-2.5 rounded-[22px] shadow-lg flex items-center gap-3 w-[180px] cursor-pointer z-[999] relative"
            >
              <div className="relative w-10 h-10 rounded-xl bg-white/20 overflow-hidden flex-shrink-0">
                <img
                  src={currentTrack.artworkUrl100}
                  className="w-full h-full object-cover"
                  alt="art"
                />
                {/* ✅ 재생 중일 때만 이미지 위에 작은 막대기 애니메이션 표시 */}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-0.5 px-1">
                    {[1, 2, 3].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: ["20%", "60%", "20%"] }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                        className="w-0.5 bg-[#FF4B91] rounded-full"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col overflow-hidden text-left">
                <span className="text-[8px] font-black text-[#FF4B91] tracking-wider mb-0.5 uppercase">
                  {isPlaying ? "Now Playing" : "Paused"}
                </span>
                <p className="text-[14px] font-bold text-white leading-tight truncate">
                  {currentTrack.trackName}
                </p>
                <p className="text-[11px] text-white/70 truncate">
                  {currentTrack.artistName}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* [Nav Bar] ProfilePage의 구조와 100% 동일하게 구현 */}
        <div className="pointer-events-auto w-full h-[72px] bg-white/95 backdrop-blur-2xl rounded-[36px] flex justify-between items-center px-10 shadow-2xl relative">
          {/* 홈 버튼 (GPS 페이지가 '홈'이므로 활성화 색상 적용) */}
          <button
            onClick={() => navigate("/")}
            className="flex flex-col items-center text-[#FF4B6E]"
          >
            <Icons.Home />
            <span className="text-[10px] font-bold mt-1">홈</span>
          </button>

          {/* 중앙 플러스 버튼 (ProfilePage와 동일한 그라데이션 및 위치) */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6">
            <motion.button
              onClick={onPlusClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-[64px] h-[64px] bg-gradient-to-tr from-[#FFDEE9] to-[#B5FFFC] rounded-full flex items-center justify-center shadow-lg border-[4px] border-[#F0F4F8]"
              style={{ boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </motion.button>
          </div>

          {/* 내 정보 버튼 (비활성화 상태) */}
          <button
            onClick={() => navigate("/profile")}
            className="flex flex-col items-center text-gray-400 opacity-60 hover:opacity-100 transition-opacity"
          >
            <Icons.Profile />
            <span className="text-[10px] font-bold mt-1">나</span>
          </button>
        </div>
      </div>
      {/* 7. 바텀시트 모달 (디자인 유지) */}

      <AnimatePresence>
        {selectedUser && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-black/40 z-[150] backdrop-blur-sm"
            />

            {/* 바텀시트 본체 */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.8 }}
              onDragEnd={handleDragEnd}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 h-[80vh] bg-[#F3F7FF]/80 rounded-t-[40px] z-[200] p-6 flex flex-col shadow-2xl"
            >
              {/* 상단 헤더: 민트색 확인 버튼 */}
              <div className="w-full flex justify-between items-center mb-4 px-2">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 text-[#4FD1C5]"
                >
                  <Icons.ChevronDown />
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-[#4FD1C5] font-bold text-[16px] px-2"
                >
                  확인
                </button>
              </div>

              {/* 프로필 섹션 */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-full mb-4 shadow-inner overflow-hidden border-2 border-white">
                  {selectedUser.artworkUrl && (
                    <img
                      src={selectedUser.artworkUrl}
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  )}
                </div>
                <h2 className="text-[18px] font-black text-black mb-1">
                  {selectedUser.name} {/* [해결] '사용자' 대신 변수 사용 */}
                </h2>
                <p className="text-[14px] text-gray-400 font-medium">
                  {selectedUser.distance} 떨어져 있어요
                </p>
              </div>

              {/* 앨범 정보 전체 */}
              <div className="flex flex-col items-center w-full px-4 mb-10">
                <motion.div
                  whileTap={{ scale: 1 }} // 클릭 효과도 제거하려면 1로 변경
                  className="flex flex-col items-center cursor-default" // cursor-pointer를 default로 변경
                >
                  {/* 앨범 아트 박스 */}
                  <div className="relative w-60 h-60 rounded-[32px] overflow-hidden shadow-2xl mb-8">
                    {/* 앨범 이미지 */}
                    <img
                      src={selectedUser.artworkUrl}
                      className="w-full h-full object-cover"
                      alt="Album Art"
                    />

                    {/* 30% 검정색 필터 (재생 중일 때만 더 어둡게 처리하면 예뻐요) */}
                    <div
                      className={`absolute inset-0 bg-black/30 z-10 transition-opacity ${isPlaying ? "opacity-100" : "opacity-0"}`}
                    />

                    {/* 비주얼라이저 (재생 중일 때만 보임) */}
                    {isPlaying && (
                      <>
                        <div className="absolute inset-0 bg-black/30" />{" "}
                        {/* 어둡게 만들기 */}
                        <div className="absolute inset-0 flex items-center justify-center gap-3">
                          {[1, 2, 3, 4, 3, 2, 1].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{ height: [30, 80, 30] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.1,
                              }}
                              className="w-3 bg-white/70 rounded-full"
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* 노래 정보 텍스트 */}
                  <div className="text-center">
                    <h3 className="text-[22px] font-black text-black mb-1 leading-tight">
                      {selectedUser.song}
                    </h3>
                    <p className="text-[15px] text-gray-500 font-bold">
                      {selectedUser.artist}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* 하단 버튼 영역: 핫핑크 하트 & 민트 엄지 */}
              <div className="flex flex-col items-center pb-12">
                <div className="flex items-center gap-12">
                  {/* 핫핑크 하트 버튼 */}
                  <motion.button
                    onClick={() => setIsLiked(!isLiked)}
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center"
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      /* isLiked가 false일 때는 회색(#D1D5DB), 
          true일 때는 핫핑크(#FF4B91)로 채워짐 
        */
                      fill={isLiked ? "#FF4B91" : "#D1D5DB"}
                      className="transition-colors duration-300"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </motion.button>

                  {/* 민트 엄지 버튼 */}
                  <motion.button
                    onClick={() => setIsThumbUp(!isThumbUp)}
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      /* isThumbUp이 false일 때는 회색(#D1D5DB), 
          true일 때는 민트색(#4FD1C5)으로 채워짐 
        */
                      fill={isThumbUp ? "#4FD1C5" : "#D1D5DB"}
                      className="transition-colors duration-300"
                    >
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GPS;
