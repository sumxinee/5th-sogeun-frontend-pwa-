import React, { useState, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, type PanInfo } from "framer-motion";
import "../index.css";

// 1. 트랙 정보 인터페이스
export interface Track {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  previewUrl: string;
}

const SongEditPage: React.FC = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [limit, setLimit] = useState(20);
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);

  // 어떤 곡이 선택되었는지 저장하는 상태
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollY = useRef(0);

  // --- iTunes API 검색 ---
  const handleSearch = async (isNewSearch = true) => {
    if (!query) return;

    if (!isNewSearch && scrollRef.current) {
      prevScrollY.current = scrollRef.current.scrollTop;
    }

    const newLimit = isNewSearch ? 20 : limit + 20;

    try {
      const res = await axios.get(`https://itunes.apple.com/search`, {
        params: {
          term: query,
          entity: "song",
          limit: newLimit,
          country: "kr",
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedTracks: Track[] = res.data.results.map((item: any) => ({
        trackId: item.trackId,
        trackName: item.trackName,
        artistName: item.artistName,
        artworkUrl100: item.artworkUrl100,
        previewUrl: item.previewUrl,
      }));

      setResults(mappedTracks);
      setLimit(newLimit);
    } catch (err) {
      console.error(err);
    }
  };

  useLayoutEffect(() => {
    if (limit > 20 && scrollRef.current) {
      scrollRef.current.scrollTop = prevScrollY.current;
    }
  }, [results, limit]);

  // --- 오디오 미리듣기 로직 ---
  const handleAlbumClick = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();

    if (playingTrackId === track.trackId) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = track.previewUrl;
        audioRef.current.volume = 0.2;
        audioRef.current.play().catch(() => {});
        setPlayingTrackId(track.trackId);
      }
    }
  };

  // --- 노래 선택 및 서버 전송 로직 ---
  const handleSelectTrack = async (track: Track) => {
    // 1. 선택된 UI 효과 주기 (회색 배경 등)
    setSelectedTrackId(track.trackId);

    // 2. 미리듣기 오디오 정지
    if (audioRef.current) audioRef.current.pause();

    console.log("선택된 프로필 노래:", track.trackName);

    try {
      // 3. 서버에 변경 요청 보내기
      // ※ 주의: '/api/members/profile/music' 부분은 백엔드 개발자가 알려준 실제 주소로 수정해야 할 수 있음
      await axios.patch(
        "/api/members/profile/music",
        {
          trackName: track.trackName,
          artistName: track.artistName,
          artworkUrl: track.artworkUrl100, // 앨범 커버
          previewUrl: track.previewUrl, // 미리듣기 링크
        },
        {
          headers: {
            // 토큰이 필요한 경우 아래 주석을 해제하고 사용
            // 'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
        },
      );

      // 4. 성공 시 알림 및 페이지 이동
      alert(`'${track.trackName}'(으)로 배경음악이 변경되었습니다!`);

      // 5. UX를 위해 약간의 딜레이 후 이동
      setTimeout(() => {
        navigate(-1); // 프로필 페이지로 복귀
      }, 200);
    } catch (error) {
      console.error("음악 변경 실패:", error);
      alert("음악 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setSelectedTrackId(null); // 에러 발생 시 선택 표시 해제
    }
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      navigate(-1);
    }
  };

  // ------------------------------------------------------------------
  // [UI 컴포넌트] 트랙 아이템
  // ------------------------------------------------------------------
  const TrackItem = ({ track }: { track: Track }) => {
    // 현재 이 트랙이 선택되었는지 확인
    const isSelected = selectedTrackId === track.trackId;

    return (
      <div
        onClick={(e) => handleAlbumClick(e, track)}
        className={`flex items-center p-3 rounded-[20px] mb-3 transition-colors duration-200
                   border border-white/20 shadow-sm cursor-pointer
                   ${isSelected ? "bg-black/10" : "bg-white/60 hover:bg-white/70"}`}
      >
        {/* 앨범 커버 */}
        <div className="relative w-12 h-12 rounded-xl mr-4 shrink-0 overflow-hidden cursor-pointer shadow-sm">
          <img
            src={track.artworkUrl100}
            className="w-full h-full object-cover"
            alt=""
          />
          {playingTrackId === track.trackId ? (
            <div className="absolute inset-0 bg-black/30 flex items-end justify-center pb-2 gap-1">
              <motion.div
                animate={{ height: [3, 10, 3] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="w-1 bg-white rounded-full"
              />
              <motion.div
                animate={{ height: [10, 3, 10] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="w-1 bg-white rounded-full"
              />
              <motion.div
                animate={{ height: [5, 12, 5] }}
                transition={{ repeat: Infinity, duration: 0.7 }}
                className="w-1 bg-white rounded-full"
              />
            </div>
          ) : null}
        </div>

        {/* 텍스트 정보 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center mr-2">
          <p className="text-[15px] font-bold truncate leading-tight text-[#333] mb-0.5">
            {track.trackName}
          </p>
          <p className="text-[12px] text-[#666] truncate font-medium">
            {track.artistName}
          </p>
        </div>

        {/* 우측 '선택' 버튼 */}
        <button
          onClick={() => handleSelectTrack(track)}
          disabled={isSelected} // 이미 선택된 경우 중복 클릭 방지
          className={`text-[13px] font-bold px-3 py-1.5 rounded-full transition-all
                ${
                  isSelected
                    ? "text-[#333] scale-95 cursor-default" // 선택됐을 때
                    : "text-[#555] hover:bg-black/5 active:scale-95" // 평소
                }`}
        >
          {isSelected ? "완료" : "선택"}
        </button>
      </div>
    );
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.5 }}
      onDragEnd={handleDragEnd}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-0 z-50 flex flex-col w-full min-h-screen pt-12"
      style={{
        background:
          "linear-gradient(169deg, #f8c1e9 0%, #c3c3ec 34.81%, #9fc3e9 66.28%, #6bcda6 99.18%)",
        backgroundAttachment: "fixed",
      }}
    >
      <audio ref={audioRef} onEnded={() => setPlayingTrackId(null)} />

      {/* --- 헤더 --- */}
      <div className="w-full flex items-center justify-between px-5 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-white active:scale-90 transition-transform"
        >
          <svg
            className="w-8 h-8 fill-white drop-shadow-md"
            viewBox="0 0 24 24"
          >
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>

        <h1 className="text-white text-[18px] font-bold drop-shadow-sm absolute left-1/2 -translate-x-1/2">
          노래변경
        </h1>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden px-5 w-full">
        {/* --- 검색창 --- */}
        <div className="flex items-center bg-white/40 h-[50px] rounded-[16px] px-4 mb-6 backdrop-blur-md shadow-sm focus-within:bg-white/50 transition-all">
          <input
            className="bg-transparent flex-1 outline-none font-medium text-[#333] placeholder:text-[#333]/60 text-[15px]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(true)}
            placeholder="음악 검색..."
          />
          <button
            onClick={() => handleSearch(true)}
            className="text-[#FF4D4D] font-bold text-[14px] ml-2 active:scale-95 transition-transform"
          >
            검색
          </button>
        </div>

        {/* --- 결과 리스트 --- */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-1 pb-24 scrollbar-hide"
          style={{
            msOverflowStyle: "none" /* IE, Edge */,
            scrollbarWidth: "none" /* Firefox */,
          }}
        >
          {results.length > 0 ? (
            <>
              {results.map((t) => (
                <TrackItem key={t.trackId} track={t} />
              ))}
              <div className="flex justify-center pt-4 pb-8">
                <button
                  onClick={() => handleSearch(false)}
                  className="px-6 py-2 rounded-full bg-white/20 border border-white/30 text-white font-bold text-sm hover:bg-white/30 transition-all active:scale-95"
                >
                  더 보기
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60%] opacity-80">
              <div className="mb-4 relative">
                <svg className="w-24 h-24 fill-white/80" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
              <p className="text-white/90 text-[15px] font-medium">
                검색 결과가 여기에 표시됩니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SongEditPage;
