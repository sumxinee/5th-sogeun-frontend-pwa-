/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useAtom, useAtomValue } from "jotai"; // 1. Jotai 추가
import { accessTokenAtom, userIdAtom } from "../store/auth"; // 토큰 아톰
import { locationAtom } from "../store/location"; // 기존에 있던 위치 아톰 활용
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

const GPS: React.FC<GPSProps> = ({
  onPlusClick,
  currentTrack,
  onSelectTrack,
}) => {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<DetectedUser | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // 4. 레이더 장식용 회전 선들
  const extraSegments = [
    { r: 145, w: 1, d: "4 4", s: 20, dir: 1 },
    { r: 125, w: 3, d: "40 80", s: 15, dir: -1 },
    { r: 70, w: 2, d: "25 65", s: 10, dir: -1 },
  ];

  // 5. 심장박동 Path
  const centeredPath =
    "M -100 50 H 35 L 43 35 L 51 65 L 59 50 H 92 L 100 25 L 108 75 L 116 50 H 149 L 157 35 L 165 65 L 173 50 H 300";

  // ------------------- [API 1: SSE 연결 (데이터 수신)] -------------------
  /*useEffect(() => {
    const token = localStorage.getItem("accessToken");
    console.log("1. SSE useEffect 진입 완료. 토큰:", token);

    if (!token || token === "null" || token === "undefined") {
      console.log("2. 토큰이 없어서 종료합니다.");
      return;
    }
    console.log("3. 현재 위치 상태:", myLocation);
    if (!myLocation) {
      console.log("4. 위치 정보가 아직 없어서 기다립니다.");
      return;
    }

    const BASE_URL =
      "https://pruxd7efo3.execute-api.ap-northeast-2.amazonaws.com/clean";
    const sseEndpoint = `${BASE_URL}/sse/location/nearby?userId=1&lat=${myLocation.lat}&lon=${myLocation.lng}`;

    console.log("실제 전송 URL:", sseEndpoint);

    const eventSource = new EventSourcePolyfill(sseEndpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
      heartbeatTimeout: 60 * 60 * 1000,
    });
    console.log("실제 토큰 값:", token);
    console.log("전송 URL 확인:", sseEndpoint);
    eventSource.onopen = () => console.log("SSE Connected!");

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setServerUsers(parsedData);
      } catch (error) {
        console.error("SSE Data Parse Error:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [localStorage.getItem("accessToken")]); // 2. 토큰 값이 변경될 때마다 다시 시도하도록 설정 // 의존성 배열에 필요시 token을 추가할 수 있습니다.

  // ------------------- [API 2: 내 위치 추적 및 서버 전송] -------------------
  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    const BASE_URL =
      "https://pruxd7efo3.execute-api.ap-northeast-2.amazonaws.com/clean";
    const userId = 1; // SSE와 동일하게 유지하세요.

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMyLocation({ lat: latitude, lng: longitude });

        // [핵심 수정] 위치가 바뀔 때마다 최신 토큰을 새로 가져옵니다.
        const token = localStorage.getItem("accessToken");

        // 토큰이 잘 가져와지는지 확인하기 위한 로그 (배포 후 확인용)
        console.log("현재 전송 시도 토큰:", token);

        // URL 파라미터 방식 유지 (Body는 비웁니다)
        const url = `${BASE_URL}/sse/location/update?userId=${userId}&lat=${latitude}&lon=${longitude}`;

        fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
          .then(async (res) => {
            if (!res.ok) {
              const errorText = await res.text();
              console.error(`업데이트 실패 (${res.status}):`, errorText);
            } else {
              console.log("위치 업데이트 성공!");
            }
          })
          .catch((err) => console.error("위치 전송 네트워크 실패:", err));
      },
      (error) => console.error("위치 추적 오류:", error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);*/

  /* const BASE_URL =
    "https://pruxd7efo3.execute-api.ap-northeast-2.amazonaws.com/clean";
  const userId = 1; // 테스트용 아이디

  // ------------------- [기능 1: 실시간 주변 유저 수신 (Nearby - SSE)] -------------------
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    // TypeScript null 체크 가드
    if (
      !token ||
      !myLocation ||
      myLocation.lat === undefined ||
      myLocation.lng === undefined
    ) {
      return;
    }

    const sseEndpoint = `${BASE_URL}/sse/location/nearby?userId=${userId}&lat=${myLocation.lat}&lon=${myLocation.lng}`;
    const ctrl = new AbortController();

    const connectSSE = async () => {
      try {
        await fetchEventSource(sseEndpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
            "Cache-Control": "no-cache",
          },
          signal: ctrl.signal,
          async onopen(res) {
            if (res.ok) console.log("🚀 SSE 연결 성공!");
            else console.error("SSE 연결 실패:", res.status);
          },
          onmessage(event) {
            if (event.data && event.data !== "heartbeat") {
              try {
                const parsedData = JSON.parse(event.data);
                setServerUsers(parsedData);
              } catch (e) {
                console.error("데이터 파싱 실패:", e);
              }
            }
          },
          onerror(err) {
            console.error("SSE 에러:", err);
            ctrl.abort();
          },
        });
      } catch (err) {
        if (!ctrl.signal.aborted) console.log("SSE 중단");
      }
    };

    connectSSE();
    return () => ctrl.abort();
  }, [myLocation?.lat, myLocation?.lng]); // 위치가 바뀔 때마다 주변 정보 다시 구독

  // ------------------- [기능 2: 내 위치 서버에 전송 (Update - POST)] -------------------
  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMyLocation({ lat: latitude, lng: longitude });

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        // 소수점 6자리로 고정하여 서버 부담을 줄이고 정확도 유지
        const url = `${BASE_URL}/sse/location/update?userId=${userId}&lat=${latitude.toFixed(6)}&lon=${longitude.toFixed(6)}`;

        fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
          },
        })
          .then(async (res) => {
            if (res.ok) console.log("📍 위치 업데이트 성공!");
            else {
              const txt = await res.text();
              console.error(`업데이트 실패 (${res.status}):`, txt);
            }
          })
          .catch((err) => console.error("네트워크 에러:", err));
      },
      (error) => console.error("위치 추적 오류:", error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ------------------- [Logic: 유저 위치 계산 및 렌더링 업데이트] -------------------
  // 내 위치나 서버 유저 데이터가 바뀔 때마다 레이더 상의 위치(angle, radius)를 다시 계산
  useEffect(() => {
    if (!myLocation) return;

    const updatedUsers = serverUsers.map((user) => {
      // 1. 위도/경도 차이 계산
      const dy = user.latitude - myLocation.lat;
      const dx = user.longitude - myLocation.lng;

      // 2. 각도 계산 (Radar 상의 위치)
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      // 3. 거리 계산 (미터 단위, 대략적)
      const rawDistMeters = Math.sqrt(dx * dx + dy * dy) * 111000; // 위도 1도 ≈ 111km

      // 4. 레이더 UI용 반지름(radius) 변환 (최대 140px로 제한)
      const uiRadius = Math.min(rawDistMeters * 2, 140); // 스케일 조정 필요 시 곱하는 수 변경

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

    setNearbyUsers(updatedUsers);
  }, [myLocation, serverUsers]);
*/
  // ------------------- [기능 1: 실시간 주변 유저 수신 (SSE)] -------------------

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

        /*if (!token) return;

        const url = `${BASE_URL}/sse/location/update?userId=${userId}&lat=${latitude.toFixed(6)}&lon=${longitude.toFixed(6)}`;

        fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })*/
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
    if (!myLocation || serverUsers.length === 0) return;

    const updatedUsers = serverUsers.map((user) => {
      const dy = user.latitude - myLocation.lat;
      const dx = user.longitude - myLocation.lng;
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

    setNearbyUsers(updatedUsers);
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

  // ------------------- [Effect: Audio Playback] -------------------
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (selectedUser && selectedUser.previewUrl) {
      const audio = new Audio(selectedUser.previewUrl);
      audio.loop = true;
      audio.volume = 0.5;
      audio.play().catch((err) => console.log("자동 재생 막힘:", err));
      audioRef.current = audio;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [selectedUser]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      setSelectedUser(null);
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
                animate={{ rotate: 360 * seg.dir }}
                transition={{
                  duration: seg.s,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{ transformOrigin: "210px 210px" }}
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

        {/* Users (여기가 수정됨: 네모난 툴팁 복구) */}
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

            {/* [복구됨] 작은 반투명 네모 (툴팁) */}
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

      {/* 5. 사용자 리스트 (여기가 수정됨: 배경 하얗게) */}
      <div className="flex-1 px-6 pb-32 z-10 overflow-y-auto space-y-4 scrollbar-hide">
        {nearbyUsers.map((user) => (
          <div
            key={user.id}
            onClick={() => setSelectedUser(user)}
            // [수정] bg-white/70 으로 변경하여 더 하얗게 만듦
            className="flex items-center bg-white/70 backdrop-blur-xl p-4 rounded-[24px] border border-white/40 shadow-xl active:scale-95 transition-transform cursor-pointer"
          >
            <div className="w-12 h-12 bg-white/50 rounded-2xl flex items-center justify-center mr-4 pointer-events-none overflow-hidden shadow-inner">
              <img
                src={user.artworkUrl}
                className="w-full h-full object-cover"
                alt="art"
              />
            </div>
            <div className="flex-1 pointer-events-none">
              <h3 className="text-sm font-black text-gray-800 leading-tight truncate">
                {user.song}
              </h3>
              <p className="text-[11px] text-gray-500 mt-1 font-bold">
                {user.name}
              </p>
            </div>
            <div className="text-right pointer-events-none">
              <div className="text-pink-500 text-xs font-bold mb-1.5">
                ♥ 234
              </div>
              <div className="flex items-center justify-end font-bold text-[10px] text-gray-400">
                <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5" />
                {user.distance}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 6. 하단 내비게이션 */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] h-20 bg-white/95 backdrop-blur-3xl rounded-[40px] border border-white/50 flex justify-around items-center px-6 shadow-2xl z-[100]">
        <AnimatePresence>
          {currentTrack && (
            <motion.div
              onClick={() => onSelectTrack(currentTrack)}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: -260 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute bottom-1/2 left-0 right-0 mx-auto bg-white/80 backdrop-blur-xl border border-white/40 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 w-[90%] cursor-pointer z-[110] justify-center"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 overflow-hidden border border-white/40">
                <img
                  src={currentTrack.artworkUrl100}
                  alt="art"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-[12px] font-black text-gray-800 truncate max-w-[100px] leading-tight">
                  {currentTrack.trackName}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => navigate("/gps")}
          className="flex flex-col items-center text-pink-500 font-black"
        >
          <Icons.Home />
          <span className="text-[10px] mt-1">홈</span>
        </button>
        <div className="-mt-12">
          <motion.button
            onClick={onPlusClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
          >
            <Icons.Plus />
          </motion.button>
        </div>
        <button
          onClick={() => navigate("/profile")}
          className="flex flex-col items-center text-gray-400 font-black opacity-70"
        >
          <Icons.Profile />
          <span className="text-[10px] mt-1">나</span>
        </button>
      </div>

      {/* 7. 바텀시트 모달 (디자인 유지) */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-black/60 z-[150] backdrop-blur-sm"
            />
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.8 }}
              onDragEnd={handleDragEnd}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 h-[85vh] bg-[#F3F5F9] rounded-t-[36px] z-[200] p-6 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
            >
              {/* Header */}
              <div className="w-full flex justify-between items-center mb-6 px-2">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-full text-cyan-400"
                >
                  <Icons.ChevronDown />
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-cyan-400 font-bold text-sm px-2"
                >
                  확인
                </button>
              </div>

              {/* Profile */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full mb-3" />
                <h2 className="text-lg font-bold text-black mb-0.5">
                  {selectedUser.name}
                </h2>
                <p className="text-xs text-gray-400">
                  {selectedUser.distance} 떨어져 있어요
                </p>
              </div>

              {/* Album Art & Visualizer */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative w-64 h-64 rounded-[24px] overflow-hidden shadow-lg mb-6">
                  <img
                    src={selectedUser.artworkUrl}
                    className="w-full h-full object-cover grayscale-[0.3] contrast-125"
                    alt="Album Art"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <motion.div
                        key={bar}
                        animate={{
                          height: [20, 50, 20],
                          opacity: [0.8, 1, 0.8],
                        }}
                        transition={{
                          duration: 0.5 + Math.random() * 0.3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: bar * 0.1,
                        }}
                        className="w-2.5 bg-white/90 rounded-full shadow-sm"
                      />
                    ))}
                  </div>
                  <div className="absolute bottom-4 w-full flex justify-center">
                    <span className="text-white/40 font-black text-4xl tracking-tighter drop-shadow-md">
                      NWJNS
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-black mb-1 text-center">
                  {selectedUser.song}
                </h3>
                <p className="text-sm text-gray-400 font-medium text-center">
                  {selectedUser.artist}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between w-full px-8 mb-4">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className="p-3 rounded-full hover:bg-gray-100 transition-colors active:scale-90"
                >
                  {isLiked ? <Icons.HeartFilled /> : <Icons.HeartOutline />}
                </button>
                <button className="flex-1 ml-6 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                  <span>노래 좋아요 보내기</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GPS;
