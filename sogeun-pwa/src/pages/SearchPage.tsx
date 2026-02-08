import React, { useState, useRef } from "react";
import axios from "axios";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import "../index.css";

// 1. 트랙 정보 인터페이스
export interface Track {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  previewUrl: string;
}

interface SearchPageProps {
  onBack: () => void;
  onSelectTrack: (track: Track) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({ onBack, onSelectTrack }) => {
  const [activeTab, setActiveTab] = useState<"search" | "likes">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);

  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const dragX = useMotionValue(0);
  // 드래그 시 배경 투명도 조절 (검은색 대신 부드럽게 사라지도록)
  const dragOpacity = useTransform(dragX, [0, 200], [1, 0]);

  // 스와이프 뒤로가기
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.x > 100 || info.velocity.x > 500) {
      onBack();
    }
  };

  // iTunes API 검색
  const handleSearch = async () => {
    if (!query) return;
    try {
      const res = await axios.get(`https://itunes.apple.com/search`, {
        params: { term: query, entity: "song", limit: 20, country: "kr" },
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
    } catch (err) {
      console.error(err);
    }
  };

  // 트랙 최종 선택
  const handleFinalSelect = async (track: Track) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = ""; // 소스 초기화
      }
      setPlayingTrackId(null);
      onSelectTrack(track);
      onBack();
    } catch (err) {
      console.error("전송 실패:", err);
      onSelectTrack(track);
      onBack();
    }
  };

  const toggleLike = (track: Track) => {
    setLikedTracks((prev) =>
      prev.some((t) => t.trackId === track.trackId)
        ? prev.filter((t) => t.trackId !== track.trackId)
        : [track, ...prev],
    );
  };

  const togglePlay = (track: Track) => {
    if (playingTrackId === track.trackId) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else if (audioRef.current) {
      audioRef.current.src = track.previewUrl;
      audioRef.current.loop = true; // ✅ 무한 반복 재생 활성화
      audioRef.current.volume = 0.2; // ✅ 음량을 10%로 조절 (0.0 ~ 1.0)
      audioRef.current.play().catch(() => {});
      setPlayingTrackId(track.trackId);
    }
  };

  // ------------------------------------------------------------------
  // [UI 컴포넌트] 트랙 아이템
  // ------------------------------------------------------------------
  const TrackItem = ({ track }: { track: Track }) => (
    <div
      className="flex items-center p-3 rounded-[24px] mb-3 backdrop-blur-md transition-colors
                    bg-white/20 border border-white/30 shadow-sm hover:bg-white/30"
    >
      {/* 앨범 커버 */}
      <div
        className="relative w-14 h-14 rounded-2xl mr-4 shrink-0 overflow-hidden cursor-pointer shadow-inner"
        onClick={() => togglePlay(track)}
      >
        <img
          src={track.artworkUrl100}
          className="w-full h-full object-cover"
          alt=""
        />

        {/* 이퀄라이저 애니메이션 */}
        {playingTrackId === track.trackId && (
          <div className="absolute inset-0 bg-black/30 flex items-end justify-center pb-3 gap-1">
            <motion.div
              animate={{ height: [4, 12, 4] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-1 bg-white rounded-full"
            />
            <motion.div
              animate={{ height: [12, 4, 12] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              className="w-1 bg-white rounded-full"
            />
            <motion.div
              animate={{ height: [6, 14, 6] }}
              transition={{ repeat: Infinity, duration: 0.7 }}
              className="w-1 bg-white rounded-full"
            />
          </div>
        )}
      </div>

      {/* 텍스트 정보 */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-[16px] font-bold truncate leading-tight text-white mb-1 drop-shadow-sm">
          {track.trackName}
        </p>
        <p className="text-[13px] text-white/80 truncate font-medium">
          {track.artistName}
        </p>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-3 pl-2">
        <button
          onClick={() => toggleLike(track)}
          className="active:scale-110 transition-transform p-2 rounded-full hover:bg-white/10"
        >
          <svg
            className={`w-6 h-6 ${likedTracks.some((t) => t.trackId === track.trackId) ? "fill-[#FF6B6B]" : "fill-white/60"}`}
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
        <button
          onClick={() => handleFinalSelect(track)}
          className="px-4 py-2 bg-white text-[#FF6B6B] text-[13px] font-bold rounded-full shadow-lg active:scale-95 transition-all"
        >
          선택
        </button>
      </div>
    </div>
  );

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 400 }}
      onDragEnd={handleDragEnd}
      style={{ x: dragX, opacity: dragOpacity }}
      className="absolute inset-0 z-50 flex flex-col w-full min-h-screen pt-14 bg-transparent backdrop-blur-sm"
    >
      <div className="absolute inset-0 bg-black/10 -z-10" />

      <audio ref={audioRef} onEnded={() => setPlayingTrackId(null)} />

      {/* 상단 헤더 & 토글 */}
      <div className="w-full flex flex-col items-center mb-4 px-6">
        <div className="w-full flex justify-between items-center mb-6">
          <button
            onClick={onBack}
            className="bg-white/20 p-3 rounded-full border border-white/30 backdrop-blur-md shadow-sm"
          >
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
            </svg>
          </button>

          {/* 탭 전환 버튼 */}
          <div className="bg-black/20 p-1 rounded-full flex items-center w-[180px] h-[44px] relative backdrop-blur-md border border-white/10">
            <button
              onClick={() => setActiveTab("search")}
              className={`flex-1 h-full rounded-full text-[14px] font-bold z-10 transition-colors duration-200 
                        ${activeTab === "search" ? "text-white" : "text-white/60"}`}
            >
              검색
            </button>
            <button
              onClick={() => setActiveTab("likes")}
              className={`flex-1 h-full rounded-full text-[14px] font-bold z-10 transition-colors duration-200 
                        ${activeTab === "likes" ? "text-white" : "text-white/60"}`}
            >
              좋아요
            </button>

            {/* 탭 슬라이더 */}
            <motion.div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#FF6B6B] rounded-full shadow-md z-0"
              animate={{
                left: activeTab === "search" ? "4px" : "calc(50%)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          <div className="w-11" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "search" ? (
          <motion.div
            key="s"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col overflow-hidden px-6"
          >
            {/* 검색창 */}
            <div className="flex items-center bg-white/20 h-[52px] rounded-[20px] px-5 border border-white/40 mb-6 backdrop-blur-md shadow-sm focus-within:bg-white/30 transition-all">
              <input
                className="bg-transparent flex-1 outline-none font-bold text-white placeholder:text-white/60 text-[15px]"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="어떤 노래를 찾으세요?"
              />
              <button
                onClick={handleSearch}
                className="text-white font-bold text-[14px] hover:text-[#FF6B6B] transition-colors"
              >
                검색
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pb-24 scrollbar-hide">
              {results.length > 0 ? (
                results.map((t) => <TrackItem key={t.trackId} track={t} />)
              ) : (
                <div className="text-center mt-20 text-white/60 text-sm">
                  검색 결과가 여기에 표시됩니다.
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="l"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 px-6 overflow-y-auto space-y-2 pb-24"
          >
            <h2 className="text-[20px] font-bold mb-5 text-white drop-shadow-md">
              찜한 목록
            </h2>
            {likedTracks.length > 0 ? (
              likedTracks.map((t) => <TrackItem key={t.trackId} track={t} />)
            ) : (
              <div className="text-center pt-20 text-white/60 font-bold">
                아직 찜한 음악이 없어요.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SearchPage;
