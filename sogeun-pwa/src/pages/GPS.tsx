/* eslint-disable */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useAtom } from "jotai"; // 1. Jotai 추가
import { accessTokenAtom, numericUserIdAtom } from "../store/auth"; // 토큰 아톰
import { locationAtom } from "../store/location"; // 기존에 있던 위치 아톰 활용
import { currentTrackAtom, isPlayingAtom } from "../store/music";
import type { Track } from "./SearchPage";
import musicPlanetIcon from "../assets/logo.png";
import { Heart, ThumbsUp } from "lucide-react";

interface ServerUserData {
  id: number;
  broadcastId: number;
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
  //부모로부터 전달받은 재생/복구 함수 추가
  onPlayPeopleMusic: (url: string) => void;
  onTogglePlay: (shouldPlay: boolean) => void;
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
  broadcastId: number;
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
// 좋아요 개수에 따른 레벨 및 반경 설정 (이미지 기준)
const LEVEL_CONFIG = [
  { lv: 1, minLikes: 0, maxLikes: 2, radius: 50 },
  { lv: 2, minLikes: 2, maxLikes: 5, radius: 100 },
  { lv: 3, minLikes: 6, maxLikes: 10, radius: 150 },
  { lv: 4, minLikes: 11, maxLikes: 15, radius: 200 },
  { lv: 5, minLikes: 16, maxLikes: 20, radius: 250 },
  { lv: 6, minLikes: 21, maxLikes: 30, radius: 300 },
  { lv: 7, minLikes: 31, maxLikes: 40, radius: 350 },
];
const GPS: React.FC<GPSProps> = ({
  onPlusClick,
  //onSelectTrack,
  onPlayPeopleMusic,
  onTogglePlay,
}) => {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<DetectedUser | null>(null);

  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isThumbUp, setIsThumbUp] = useState<boolean>(false);
  const [currentTrack] = useAtom(currentTrackAtom);
  //console.log("현재 트랙 데이터:", currentTrack);
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
  const [isUserMusicPlaying, setIsUserMusicPlaying] = useState(false);
  // 🔥 이 줄을 추가하세요! (추천 숫자를 관리하는 상태)
  const [recommendCount, setRecommendCount] = useState<number>(0);

  // 2. Jotai 상태 구독
  const [token, setToken] = useAtom(accessTokenAtom);
  const [myLocation, setMyLocation] = useAtom(locationAtom); // 전역 위치 상태 사용
  const [serverUsers, setServerUsers] = useState<ServerUserData[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<DetectedUser[]>([]);
  const [myUserId] = useAtom(numericUserIdAtom);
  const BASE_URL = "https://sogeun.cloud";

  const MAX_RADAR_DIST = 350;
  const RADAR_UI_RADIUS = 250;

  const handleRecommend = async () => {
    if (!selectedUser || !token) return;
    const prevThumb = isThumbUp;
    const prevCount = recommendCount;

    setIsThumbUp(!prevThumb);
    setRecommendCount(prevThumb ? prevCount - 1 : prevCount + 1);

    try {
      const res = await fetch(
        `${BASE_URL}/api/broadcast/${selectedUser.broadcastId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`, // 403 에러 방지 핵심
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) throw new Error("추천 서버 응답 에러");
      console.log("👍 추천 성공");
    } catch (error) {
      // 실패 시 롤백
      setIsThumbUp(prevThumb);
      setRecommendCount(prevCount);
      console.error("추천 실패:", error);
    }
  };
  // 2. 좋아요(하트) 버튼 클릭 시 서버 전송 함수 (검색창/라이브러리 동기화)
  const handleLikeToggle = async () => {
    if (!selectedUser || !token) return;
    const prevLiked = isLiked;
    setIsLiked(!prevLiked); // UI 즉시 업데이트
    try {
      const res = await fetch(`${BASE_URL}/api/update/music/likes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          music: {
            trackId: selectedUser.id,
            title: selectedUser.song,
            artist: selectedUser.artist,
            artworkUrl: selectedUser.artworkUrl,
            previewUrl: selectedUser.previewUrl,
          },
        }),
      });

      if (!res.ok) throw new Error("서버 저장 실패");
      if (!prevLiked) console.log("💖 내 보관함에 노래가 추가되었습니다!");
      else console.log("💔 내 보관함에서 노래가 제거되었습니다.");
    } catch (error) {
      setIsLiked(prevLiked);
      console.error("좋아요 통신 실패:", error);
    }
  };
  // 명세서 기반 API 호출 함수들
  const broadcastAPI = {
    // 음악 송출 ON
    on: async (token: string) =>
      fetch(`${BASE_URL}/api/broadcast/on`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),

    // 음악 송출 OFF
    off: async (token: string) =>
      fetch(`${BASE_URL}/api/broadcast/off`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),

    // 송출 중인 노래 변경
    changeMusic: async (token: string, musicData: any) =>
      fetch(`${BASE_URL}/api/broadcast/changemusic`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(musicData),
      }),
  };
  // selectedUser가 바뀔 때마다 해당 유저의 추천 정보를 가져오는 로직 추가
  useEffect(() => {
    const checkInitialLikeStatus = async () => {
      if (!selectedUser || !token) return;

      try {
        const res = await fetch(`${BASE_URL}/api/library/likes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const likedList = await res.json();

        // 💡 [수정된 부분] 변수명이 title이든 musicName이든, trackId든 다 걸러내도록 강화!
        const isAlreadyLiked = likedList.some((item: any) => {
          // 1. 혹시 서버가 trackId나 id로 준다면 가장 정확한 비교!
          const isSameId =
            String(item.trackId || item.id) === String(selectedUser.id);

          // 2. 이름으로 비교할 경우 (title/musicName 모두 허용)
          const serverTitle = item.title || item.musicName;
          const serverArtist = item.artist || item.artistName;
          const isSameName =
            serverTitle === selectedUser.song &&
            serverArtist === selectedUser.artist;

          // 둘 중 하나라도 맞으면 '이미 좋아요 한 노래'로 인정!
          return isSameId || isSameName;
        });

        setIsLiked(isAlreadyLiked);
      } catch (err) {
        console.error("초기 상태 로딩 실패:", err);
      }
    };

    checkInitialLikeStatus();
  }, [selectedUser, token]);

  const toggleBottomSheetMusic = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedUser) return;

    const nextState = !isUserMusicPlaying;
    onTogglePlay(nextState); // 실제 오디오 재생/정지
    setIsUserMusicPlaying(nextState); // 이퀄라이저 표시 제어
  };

  const myTotalLikes = 0;

  const currentConfig =
    LEVEL_CONFIG.find(
      (c) => myTotalLikes >= c.minLikes && myTotalLikes <= c.maxLikes,
    ) || LEVEL_CONFIG[6]; // 범위를 벗어나면 최고 레벨 적용

  const currentMaxRadius = currentConfig.radius;
  const currentLevel = currentConfig.lv;
  // ------------------- [배경 및 HUD 초기 설정] -------------------
  // 2. 배경 파티클
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.5 + 0.4,
      duration: Math.random() * 20 + 20,
    })),
  );

  // 3. HUD 서클
  const [hudCircles] = useState<HUDCircle[]>(() => {
    const circles: HUDCircle[] = [];
    let currentR = 20;
    for (let i = 0; i < 3; i++) {
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

  //----------------------------------------------------------
  useEffect(() => {
    if (!token) return;
    const ctrl = new AbortController();

    const connectStream = async () => {
      try {
        await fetchEventSource(`${BASE_URL}/api/sse/stream`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
          },

          signal: ctrl.signal,
          onopen: async (res) => {
            if (res.ok) {
              console.log("📡 스트림 연결 성공");
              // 약간의 딜레이를 주어 서버가 세션을 완전히 잡을 시간을 줍니다.
              setTimeout(async () => {
                try {
                  const onRes = await broadcastAPI.on(token);
                  if (onRes.status === 500) {
                    console.error(
                      "서버 내부 에러: 방송 송출을 시작할 수 없습니다.",
                    );
                  } else {
                    console.log("📻 방송 송출 시작 (ON)");
                  }
                } catch (e) {
                  console.error("ON 호출 실패", e);
                }
              }, 500);
            }
          },
          onmessage: (event) => {
            if (event.data !== "heartbeat") {
              console.log("📻 방송 스트림 수신:", JSON.parse(event.data));
            }
          },
        });
      } catch (err) {
        console.error("Stream 에러:", err);
      }
    };

    connectStream();
    return () => {
      broadcastAPI.off(token);
      ctrl.abort();
    };
  }, [token]);
  //--------------------------- sse- nearby --------------------------

  useEffect(() => {
    // 1. 숫자로 변환 (NaN 방지 및 백엔드 타입 일치)
    const numericUserId = myUserId ? Number(myUserId) : 0;
    console.log("변환된 숫자 ID:", numericUserId);
    const isIdValid = !isNaN(numericUserId) && numericUserId !== 0;
    const isLocationValid = !!(myLocation?.lat && myLocation?.lon);
    const isTokenValid = !!token;

    if (!isIdValid || !isTokenValid || !isLocationValid) {
      console.log("⏳ SSE 대기 중...", {
        numericUserId,
        isLocationValid,
        isTokenValid,
      });
      return;
    }
    const sseEndpoint = `${BASE_URL}/api/sse/location/nearby?userId=${numericUserId}&lat=${myLocation!.lat}&lon=${myLocation!.lon}`;
    const ctrl = new AbortController();

    const connectSSE = async () => {
      try {
        await fetchEventSource(sseEndpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Jotai에서 가져온 토큰
            Accept: "text/event-stream",
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
                const data = JSON.parse(event.data);
                console.log("📥 서버 데이터 수신:", data);
                setServerUsers(data);
              } catch (e) {
                console.error("파싱 실패:", e, "원본 데이터:", event.data);
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
  }, [token, myLocation?.lat, myLocation?.lon, myUserId]); // 3. 토큰과 위치를 의존성에 추가

  useEffect(() => {
    console.log("로컬스토리지 확인:", localStorage.getItem("accessToken"));
  }, []);

  // ------------------- [기능 2: 내 위치 추적 및 서버 전송 update (POST)] -------------------
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      console.error("이 브라우저는 위치 정보를 지원하지 않습니다.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPos = { lat: latitude, lon: longitude };

        // 위치 상태 업데이트 (Jotai)
        setMyLocation(newPos);
        const numericUserId = Number(myUserId);
        // 토큰이 없으면 전송하지 않음
        if (token && myUserId && !isNaN(numericUserId)) {
          // 만약 숫자가 아니면(문자열 'yyyy' 등) 요청을 보내지 않음
          if (isNaN(numericUserId)) {
            console.error(
              "❌ 유효하지 않은 userId입니다. 실제 숫자가 필요합니다:",
              myUserId,
            );
            return;
          }
          // 2. URL 파라미터 구성 (userId만 포함하는 것이 가장 깔끔함)
          const url = `${BASE_URL}/api/sse/location/update?userId=${numericUserId}`;

          fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              UserId: String(numericUserId),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lat: latitude, // 숫자로 전달
              lon: longitude, // 숫자로 전달
            }),
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
      broadcastId: 998,
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
      const dx = user.longitude - (myLocation?.lon || 0);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const rawDistMeters = Math.sqrt(dx * dx + dy * dy) * 111000;
      const uiRadius = Math.min((rawDistMeters / currentMaxRadius) * 140, 140);

      return {
        id: user.id,
        broadcastId: user.broadcastId,
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

  // ------------------- [기능 3: 유저 거리 계산 로직] -------------------
  /*useEffect(() => {
    // 1. [수정] 목데이터를 생성하던 변수를 삭제하거나 무시합니다.

    // 2. 서버 데이터 변환 로직 (실제 유저들만 계산)
    const updatedUsers = serverUsers.map((user) => {
      const dy = user.latitude - (myLocation?.lat || 0);
      const dx = user.longitude - (myLocation?.lon || 0);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const rawDistMeters = Math.sqrt(dx * dx + dy * dy) * 111000;
      const uiRadius = Math.min(
        (rawDistMeters / MAX_RADAR_DIST) * RADAR_UI_RADIUS,
        RADAR_UI_RADIUS,
      );

      return {
        id: user.id,
        broadcastId: user.broadcastId,
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
  }, [myLocation, serverUsers]);*/

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
            const rawDist = Math.sqrt(dx * dx + dy * dy) * 111000;
            const radius = Math.min(
              (rawDist / MAX_RADAR_DIST) * RADAR_UI_RADIUS,
              RADAR_UI_RADIUS,
            );
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
    // 바텀시트 유저가 선택되면 부모에게 노래 재생 요청
    if (selectedUser?.previewUrl) {
      onPlayPeopleMusic(selectedUser.previewUrl);
      setIsUserMusicPlaying(true);
    }

    // [중요] 클린업 함수: 바텀시트가 닫힐 때(selectedUser가 null이 될 때)
    // 빈 값을 보내서 원래 노래로 복구시킴
    return () => {
      onPlayPeopleMusic(""); // 빈 주소를 보내 오디오 정지
      setIsUserMusicPlaying(false);
    };
  }, [selectedUser, onPlayPeopleMusic]);

  // ------------------- [Handle Drag - 수정됨] -------------------
  const handleDragEnd = (_: any, info: PanInfo) => {
    // 아래로 100px 이상 내리거나 빠르게 휘두르면 닫기
    if (info.offset.y > 100 || info.velocity.y > 500) {
      setSelectedUser(null);
    }
  };

  // ------------------- [Render] -------------------
  return (
    <div
      className="relative w-full min-h-screen font-sans relative overflow-hidden text-white"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background:
          "linear-gradient(169deg, #f8c1e9 0%, #c3c3ec 34.81%, #9fc3e9 66.28%, #6bcda6 99.18%)",
      }}
    >
      {/* 1. 배경 패턴 */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(rgba(103,232,249,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 mix-blend-screen" />
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute bg-white rounded-full mix-blend-screen opacity-20"
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
      <div className="w-full px-8 pt-16 z-10 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black tracking-tighter leading-none drop-shadow-md">
            소근
          </h1>
          <p className="text-sm opacity-80 mt-1 font-medium tracking-tight">
            소리가 근처에
          </p>
        </div>
        <div className="bg-pink-300/80 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center shadow-lg h-fit">
          <span className="mr-1">⚡</span> Lv.{currentLevel}
        </div>
      </div>
      {/* 3. 메인 레이더 */}
      <div className="relative flex items-center justify-center w-full max-w-[300px] aspect-square my-6">
        {/* ① 100m ~ 500m 고정 배경 링 (과녁판) */}
        {[100, 200, 300, 400, 500].map((dist) => {
          const r = (dist / MAX_RADAR_DIST) * RADAR_UI_RADIUS; // 거리별 픽셀 반지름
          return (
            <div
              key={`ring-${dist}`}
              className="absolute rounded-full border border-white/20 flex items-start justify-center pointer-events-none"
              style={{
                width: r * 2,
                height: r * 2,
              }}
            >
              {/* 거리 라벨 텍스트 */}
              <span className="text-white/40 text-[9px] -mt-3.5 bg-transparent px-1 font-medium tracking-widest">
                {dist}m
              </span>
            </div>
          );
        })}

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
              className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl whitespace-nowrap z-20 cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white drop-shadow-md flex items-center gap-1">
                  {user.name}
                  <span className="text-[8px]">☁️</span>
                </span>
                <span className="text-[8px] text-white/80 drop-shadow-sm">
                  <span
                    style={{
                      color: "#5ba0c5",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    {" "}
                    {user.song}
                  </span>
                </span>
              </div>
            </motion.div>
          </div>
        ))}
        {/* 부웅-부웅 퍼지는 파동 (HUD Circles) */}
        {hudCircles.map((circle, i) => (
          <motion.div
            key={`hud-${circle.id}`}
            initial={{ scale: 1.25, opacity: 0 }}
            animate={{ scale: 2, opacity: [0, circle.o, 0] }}
            transition={{
              duration: circle.duration,
              repeat: Infinity,
              delay: i * 0.7,
              ease: "easeOut",
            }}
            className="absolute rounded-full border-white/90 border-solid mix-blend-screen shadow-[0_0_12px_rgba(255,255,255,0.4)] pointer-events-none"
            style={{
              width: circle.r * 2,
              height: circle.r * 2,
              borderWidth: circle.w,
            }}
          />
        ))}

        {/* 뱅글뱅글 도는 사이버틱한 선들 (extraSegments) */}
        <div className="absolute inset-[-50px] z-15 pointer-events-none flex items-center justify-center">
          <svg
            viewBox="0 0 420 420"
            className="w-[420px] h-[420px] overflow-visible"
          >
            {extraSegments.map((seg, i) => (
              <motion.circle
                key={`seg-${i}`}
                cx="210"
                cy="210"
                r={seg.r}
                fill="none"
                stroke={seg.color}
                strokeWidth={seg.w}
                strokeDasharray={seg.d}
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,0.8))" }}
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
        {/* ======================================================= */}
        {/* 🌟 1. 레벨에 따라 크기가 변하는 두꺼운 흰색 원 */}
        <motion.div
          className="absolute z-10 pointer-events-none flex items-center justify-center"
          // 💡 핵심: 현재 레벨 반경을 500m 고정 비율로 계산해서 넓이/높이에 적용!
          animate={{
            width: (currentMaxRadius / MAX_RADAR_DIST) * RADAR_UI_RADIUS * 2,
            height: (currentMaxRadius / MAX_RADAR_DIST) * RADAR_UI_RADIUS * 2,
          }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }} // 크기가 변할 때 튕기듯 부드러운 효과
        >
          {/* 1-1. 심장 박동처럼 바운스하는 실제 흰색 원 */}
          <motion.div
            className="w-full h-full rounded-full border-[4px] border-[#f8c6e7] shadow-[0_0_20px_rgba(255,176,205,0.8),inset_0_0_20px_rgba(255,176,205,0.8)]"
            animate={{
              scale: [1, 1.05, 1, 1.02, 1], // 크기 변화: 두근(크게) - 두근(작게) - 휴식
              opacity: [0.8, 1, 0.85, 1, 0.8], // 커질 때 빛 번짐(투명도)도 살짝 밝아지게 디테일 추가!
            }}
            transition={{
              duration: 2, // 2초마다 심장박동 반복
              repeat: Infinity,
              times: [0, 0.15, 0.3, 0.45, 1], // 박자감 조절 (두근-두근... 쉬고... 두근-두근...)
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* 🌟 2. 심장박동(이퀄라이저) 라인 (배경에 고정) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-[450px] h-[260px] overflow-visible relative flex items-center justify-center">
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
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  filter:
                    "drop-shadow(0 0 4px rgba(255,255,255,1)) drop-shadow(0 0 15px rgba(255,255,255,0.8)) drop-shadow(0 0 30px rgba(255,255,255,0.6))",
                }}
                animate={{
                  pathLength: [0, 1, 1, 1],
                  pathOffset: [0, 0, 0, 1],
                  //opacity: [0, 1, 1, 0],
                  scale: [1, 1.05, 1, 1.02, 1], // 크기 변화: 두근(크게) - 두근(작게) - 휴식
                  opacity: [0.8, 1, 0.85, 1, 0.8],
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
      <div className="z-10 mb-10">
        <button
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(12px)",
            padding: "5px 12px",
            borderRadius: "99px",
            fontSize: "9px",
            fontWeight: "900",
            color: "#ffffff",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
            zIndex: 50, // 다른 요소에 가려지지 않게 높임
          }}
          className="active:scale-95 transition-transform"
        >
          <span
            style={{
              color: "rgba(255, 126, 179, 0.85)",
              fontWeight: "600",
              fontSize: "0.7rem",
            }}
          >
            내 반경
          </span>

          <span
            style={{
              color: "#ffffff",
              fontWeight: "800" /* 숫자 확실히 강조 */,
              fontSize: "0.9rem" /* 숫자를 살짝 키워야 더 잘 보임 */,
              margin: "0 4px" /* 숫자 양옆 간격 */,
              lineHeight: "1" /* 텍스트 상하 치우침 방지 */,
            }}
          >
            {" "}
            {currentMaxRadius}
          </span>

          <span
            style={{
              color: "rgba(255, 255, 255, 0.85)",
              fontWeight: "800",
              fontSize: "0.85rem",
            }}
          >
            m
          </span>
        </button>
      </div>
      {/* 5. 사용자 리스트  */}
      <div className="w-full px-8 space-y-4 z-10 pb-44 scrollbar-hide">
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
              <div className="flex items-center justify-end font-medium text-[10px] text-white">
                <div className="w-1.5 h-1.5 bg-[#FF7EB3] rounded-full mr-1.5" />
                {user.distance}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* 6. 하단 내비게이션 및 Now Playing 카드 (너비 및 위치 완전 수정) */}

      <div className="fixed bottom-0 left-0 w-full flex flex-col items-center z-[120] pointer-events-none pb-10">
        {/* [Now Playing] 하단바 바로 위에 위치하도록 배치 */}
        <AnimatePresence>
          {currentTrack && (
            <motion.div
              key="now-playing"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              style={{ pointerEvents: "auto" }} // 인라인 스타일로 강제 부여
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              //className="pointer-events-auto mx-auto bottom-full mb-4 bg-white/20 backdrop-blur-xl border border-white/30 p-2.5 rounded-[22px] shadow-lg flex items-center gap-3 w-[180px] cursor-pointer z-[999] relative"
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-white/20 backdrop-blur-xl border border-white/30 p-2.5 rounded-[22px] shadow-lg flex items-center gap-3 w-[200px] cursor-pointer z-[999]"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              <div className="relative w-10 h-10 rounded-xl bg-white/20 overflow-hidden flex-shrink-0">
                <img
                  src={currentTrack.artworkUrl100}
                  className="w-full h-full object-cover"
                  alt="art"
                />
                {/* 재생 중일 때만 이미지 위에 작은 막대기 애니메이션 표시 */}
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
        <div className="pointer-events-auto w-[88%] h-[75px] bg-white/95 backdrop-blur-3xl rounded-[38px] flex justify-between items-center px-10 shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative">
          {/* 홈 버튼 */}
          <button
            onClick={() => navigate("/gps")}
            className="flex flex-col items-center text-[#FF4B6E]"
          >
            <Icons.Home />
            <span className="text-[10px] font-bold mt-1">홈</span>
          </button>

          {/* 중앙 버튼 */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-14">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onPlusClick}
              className="w-[120px] h-[120px] flex items-center justify-center rounded-full"
              // onClick={() => ... } // 클릭 시 이동할 페이지가 있다면 여기에 추가
            >
              <img
                src={musicPlanetIcon}
                alt="Music Planet"
                // 이미지에 드롭 섀도우를 줘서 입체감 추가
                className="w-full h-full object-contain drop-shadow-xl"
              />
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
              //transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 h-[80vh] bg-[#F3F7FF]/70 rounded-t-[40px] z-[200] p-6 flex flex-col shadow-2xl"
            >
              {/* 상단 헤더: 민트색 확인 버튼 */}
              <div className="w-full flex justify-between items-center mb-4 px-2 ">
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
              <div className="flex flex-col items-center mb-5 pt-8">
                <div className="w-24 h-24 rounded-full mb-6 shadow-inner overflow-hidden border-2 border-white">
                  {selectedUser.artworkUrl && (
                    <img
                      src={selectedUser.artworkUrl}
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  )}
                </div>
                <h2 className="text-[18px] font-black text-black">
                  {selectedUser.name}
                </h2>
                <p className="text-[14px] text-gray-400 font-medium">
                  {selectedUser.distance} 떨어져 있어요
                </p>
              </div>

              {/* 앨범 정보 전체 */}
              <div className="flex flex-col items-center w-full px-4 mb-8">
                <motion.div
                  onClick={toggleBottomSheetMusic}
                  whileTap={{ scale: 0.98 }} // 클릭 효과도 제거하려면 1로 변경
                  className="flex flex-col items-center cursor-pointer"
                >
                  {/* 앨범 아트 박스 */}
                  <div className="relative w-60 h-60 rounded-[32px] overflow-hidden shadow-2xl mb-8">
                    {/* 앨범 이미지 */}
                    <img
                      src={selectedUser.artworkUrl}
                      className="w-full h-full object-cover"
                      alt="Album Art"
                    />

                    {/* 30% 검정색 필터 */}
                    <div
                      className={`absolute inset-0 bg-black/30 z-10 transition-opacity ${isPlaying ? "opacity-100" : "opacity-0"}`}
                    />

                    {/* 비주얼라이저 (재생 중일 때만 보임) */}
                    <AnimatePresence>
                      {isUserMusicPlaying && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/30 z-10 flex items-center justify-center gap-3"
                        >
                          <div className="absolute inset-0 flex items-center justify-center gap-3" />
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
                        </motion.div>
                      )}
                    </AnimatePresence>
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

              {/* 하단 버튼 영역: Glassmorphism 스타일로 교체 */}
              <div className="flex justify-center items-center gap-4 pb-12">
                {/* 좋아요 버튼 (카운트 없음) */}
                <motion.button
                  onClick={handleLikeToggle}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    backdropFilter: "blur(12px)",
                    padding: "8px 16px",
                    borderRadius: "99px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
                    border: "none",
                  }}
                >
                  <Heart
                    size={18}
                    color={isLiked ? "#FF4B91" : "rgba(255, 126, 179, 0.85)"}
                    fill={isLiked ? "#FF4B91" : "transparent"}
                    style={{ transition: "all 0.3s ease" }}
                  />
                  <span
                    style={{
                      color: "#ffffff",
                      fontWeight: "700",
                      fontSize: "0.8rem",
                    }}
                  >
                    좋아요
                  </span>
                </motion.button>

                {/* 추천 버튼 (카운트 포함) */}
                <motion.button
                  onClick={handleRecommend}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    backdropFilter: "blur(12px)",
                    padding: "8px 16px",
                    borderRadius: "99px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
                    border: "none",
                  }}
                >
                  <ThumbsUp
                    size={18}
                    color={isThumbUp ? "#4FD1C5" : "#ffffff"}
                    fill={isThumbUp ? "#4FD1C5" : "transparent"}
                    style={{ transition: "all 0.3s" }}
                  />
                  <span
                    style={{
                      color: "#ffffff",
                      fontWeight: "700",
                      fontSize: "0.8rem",
                    }}
                  >
                    추천
                  </span>
                  <span
                    style={{
                      color: "#ffffff",
                      fontWeight: "900",
                      fontSize: "0.9rem",
                    }}
                  >
                    {recommendCount}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GPS;
