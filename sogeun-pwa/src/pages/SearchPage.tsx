import React, { useState, useRef, useLayoutEffect } from "react";
import axios from "axios";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { useAtom } from "jotai";
import { accessTokenAtom } from "../store/auth";
import "../index.css";

// 1. 트랙 정보 인터페이스
export interface Track {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  previewUrl: string;
}

export interface ServerLikeItem {
  id?: number;
  trackId?: number;
  musicName?: string;
  title?: string;
  artistName?: string;
  artist?: string;
  artworkUrl: string;
  previewUrl: string;
}

interface SearchPageProps {
  onBack: () => void;
  onPlayMusic: (url: string) => void;
  onSelectTrack: (track: Track) => void;
  initialTab?: "search" | "likes";
}

// 슬라이드 애니메이션 설정
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300, // 오른쪽 갈땐 오른쪽에서, 왼쪽 갈땐 왼쪽에서 등장
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300, // 반대 방향으로 퇴장
    opacity: 0,
  }),
};
const api = axios.create({
  baseURL: "https://pruxd7efo3.execute-api.ap-northeast-2.amazonaws.com/clean",
});

const SearchPage: React.FC<SearchPageProps> = ({
  onBack,
  onPlayMusic,
  onSelectTrack,
  initialTab = "search",
}) => {
  const [activeTab, setActiveTab] = useState<"search" | "likes">(initialTab);
  const [direction, setDirection] = useState(0);
  const [query, setQuery] = useState("");

  const [results, setResults] = useState<Track[]>([]);
  const [limit, setLimit] = useState(20);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);

  const [token] = useAtom(accessTokenAtom);

  React.useEffect(() => {
    const fetchLikedTracks = async () => {
      if (!token) return;
      try {
        const res = await api.get(`/api/library/likes`, {
          headers: { Authorization: `Bearer ${token}` }, // 토큰 헤더 추가
        });
        // 백엔드 데이터를 프론트 포맷으로 맞추기
        const mappedLikes: Track[] = res.data.map(
          (item: ServerLikeItem, index: number) => ({
            trackId: item.id || item.trackId || index,
            trackName: item.musicName || item.title,
            artistName: item.artistName || item.artist,
            artworkUrl100: item.artworkUrl,
            previewUrl: item.previewUrl,
          }),
        );
        setLikedTracks(mappedLikes);
      } catch (err) {
        console.error("좋아요 목록을 불러오는 데 실패했습니다.", err);
      }
    };

    if (activeTab === "likes") fetchLikedTracks();
  }, [activeTab, token]);

  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
  // 스크롤 컨테이너를 잡기 위한 ref
  const scrollRef = useRef<HTMLDivElement>(null);
  // 스크롤 위치를 기억할 변수
  const prevScrollY = useRef(0);

  //const audioRef = useRef<HTMLAudioElement | null>(null);
  const dragX = useMotionValue(0);
  // 드래그 시 배경 투명도 조절 (검은색 대신 부드럽게 사라지도록)
  const dragOpacity = useTransform(dragX, [-200, 0, 200], [0, 1, 0]);

  // 스와이프 뒤로가기
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // 1. 현재 '검색' 탭일 때
    if (activeTab === "search") {
      // 왼쪽으로 스와이프 (<-) : 좋아요 탭으로 이동
      if (offset < -50 || velocity < -500) {
        handleTabChange("likes");
      }
      // 오른쪽으로 길게 스와이프 (->) : 뒤로 가기 (창 닫기)
      else if (offset > 100 || velocity > 500) {
        onBack();
      }
    }
    // 2. 현재 '좋아요' 탭일 때
    else if (activeTab === "likes") {
      // 오른쪽으로 스와이프 (->) : 검색 탭으로 이동
      if (offset > 50 || velocity > 500) {
        handleTabChange("search");
      }
    }
  };

  // 탭 변경 함수 (클릭 시에도 애니메이션 방향 설정)
  const handleTabChange = (tab: "search" | "likes") => {
    if (activeTab === tab) return;
    setDirection(tab === "likes" ? 1 : -1);
    setActiveTab(tab);
  };

  // iTunes API 검색 (isNewSearch: true면 새 검색, false면 더 보기)
  const handleSearch = async (isNewSearch = true) => {
    if (!query) return;
    // 더 보기(isNewSearch === false)일 때만 현재 스크롤 위치 저장
    if (!isNewSearch && scrollRef.current) {
      prevScrollY.current = scrollRef.current.scrollTop;
    }
    // 새로운 검색이면 20개, 더 보기면 현재 개수 + 20개
    const newLimit = isNewSearch ? 20 : limit + 20;

    try {
      const res = await axios.get(`https://itunes.apple.com/search`, {
        params: {
          term: query,
          entity: "song",
          limit: newLimit, // ✅ offset 대신 limit 숫자를 늘려서 요청합니다.
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

      // iTunes API는 offset이 없으므로, 매번 전체 리스트를 새로 받아와서 덮어씌웁니다.
      setResults(mappedTracks);
      setLimit(newLimit); // 다음 요청을 위해 limit 상태 업데이트
    } catch (err) {
      console.error(err);
    }
  };

  // 화면이 그려진 직후 스크롤 위치를 복구하는 로직
  useLayoutEffect(() => {
    // 더 보기로 로딩된 경우(limit > 20)에만 스크롤 복구 수행
    if (limit > 20 && scrollRef.current) {
      scrollRef.current.scrollTop = prevScrollY.current;
    }
  }, [results, limit]); // results나 limit이 바뀔 때 실행

  // 트랙 최종 선택

  const toggleLike = async (track: Track) => {
    if (!token) return;
    const isLiked = likedTracks.some((t) => t.trackId === track.trackId);

    setLikedTracks((prev) =>
      isLiked
        ? prev.filter((t) => t.trackId !== track.trackId)
        : [track, ...prev],
    );

    // 서버에 토글(POST) 요청 보내기
    try {
      await api.post(
        "/api/update/music/likes",
        {
          music: {
            trackId: track.trackId,
            title: track.trackName, // 이름 변경 매핑!
            artist: track.artistName, // 이름 변경 매핑!
            artworkUrl: track.artworkUrl100, // 이름 변경 매핑!
            previewUrl: track.previewUrl,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      console.log("좋아요 상태 서버 전송 성공!");
    } catch (err) {
      console.error("좋아요 처리에 실패했습니다.", err);
      // 만약 서버 요청이 실패하면(예: 네트워크 오류), 다시 원래 상태로 롤백해주는 로직을 넣으면 더 완벽합니다.
      setLikedTracks((prev) =>
        isLiked
          ? [track, ...prev]
          : prev.filter((t) => t.trackId !== track.trackId),
      );
      alert("좋아요 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };
  // [1] 앨범 커버 클릭 시: 음악 재생 & 이퀄라이저 표시 (뒤로가기 X)
  const handleAlbumClick = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation(); // 부모(박스)의 클릭 이벤트가 실행되지 않게 막음!
    if (playingTrackId === track.trackId) {
      // 이미 재생 중인 곡을 누름 -> 멈춤
      setPlayingTrackId(null); // 상태 초기화
      onPlayMusic(""); // 음악 끄기 (빈 문자열 전달)
    } else {
      // 다른 곡을 누름 -> 재생
      setPlayingTrackId(track.trackId); // 상태 설정
      onPlayMusic(track.previewUrl); // 음악 켜기
      const audioEl = document.querySelector("audio");
      if (audioEl) audioEl.volume = 0.2;
    }
  };

  // [2] 박스 전체 클릭 시: 음악 재생 & GPS 화면으로 이동
  const handleBoxClick = (track: Track) => {
    onSelectTrack(track); // 음악은 계속 나와야 하니까 재생 요청
    const audioEl = document.querySelector("audio");
    if (audioEl) audioEl.volume = 0.2;
    onBack(); // 뒤로 가기
  };

  /*const togglePlay = (track: Track) => {
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
  };*/

  // ------------------------------------------------------------------
  // [UI 컴포넌트] 트랙 아이템
  // ------------------------------------------------------------------
  const TrackItem = ({ track }: { track: Track }) => (
    <div
      // 박스 전체를 누르면 GPS로 이동
      onClick={() => handleBoxClick(track)}
      className="flex items-center p-3 rounded-[24px] mb-3 backdrop-blur-md transition-colors
                  bg-white/20 border border-white/30 shadow-sm hover:bg-white/30 cursor-pointer"
    >
      {/* 앨범 커버 */}
      <div
        className="relative w-14 h-14 rounded-2xl mr-4 shrink-0 overflow-hidden cursor-pointer shadow-inner"
        onClick={(e) => handleAlbumClick(e, track)}
      >
        <img
          src={track.artworkUrl100}
          className="w-full h-full object-cover"
          alt=""
        />

        {/* 이퀄라이저 애니메이션 */}
        {playingTrackId === track.trackId ? (
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
        ) : (
          // 재생 중 아닐 땐 Play 아이콘
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
            <svg className="w-6 h-6 fill-white/80" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
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
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(track);
          }}
          className="active:scale-110 transition-transform p-2 rounded-full hover:bg-white/10"
        >
          <svg
            className={`w-6 h-6 ${likedTracks.some((t) => t.trackId === track.trackId) ? "fill-[#FF6B6B]" : "fill-white/60"}`}
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <motion.div
      drag="x"
      dragConstraints={{
        left: activeTab === "search" ? -50 : 0,
        right: activeTab === "search" ? 400 : 50,
      }}
      dragElastic={0.2} // 쫀득한 느낌
      onDragEnd={handleDragEnd}
      style={{ x: dragX, opacity: dragOpacity }}
      className="absolute inset-0 z-50 flex flex-col w-full min-h-screen pt-14 bg-transparent backdrop-blur-sm"
    >
      {/* 상단 헤더 & 토글 */}
      <div className="w-full px-6 mb-4 relative flex items-center justify-center min-h-[56px]">
        <div className="w-full flex justify-between items-center mb-6">
          <button
            onClick={onBack}
            className="bg-white/20 p-3 rounded-full border border-white/30"
          >
            <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </svg>
          </button>

          {/* 탭 전환 버튼 */}
          <div className="bg-white p-1 rounded-full flex items-center w-[180px] h-[44px] relative backdrop-blur-md border border-white/10">
            <button
              onClick={() => handleTabChange("search")}
              className={`flex-1 h-full rounded-full text-[14px] font-bold z-10 transition-colors duration-200 
                        ${activeTab === "search" ? "text-white" : "text-black/60"}`}
            >
              검색
            </button>
            <button
              onClick={() => handleTabChange("likes")}
              className={`flex-1 h-full rounded-full text-[14px] font-bold z-10 transition-colors duration-200 
                        ${activeTab === "likes" ? "text-white" : "text-black/60"}`}
            >
              좋아요
            </button>

            {/* 탭 슬라이더 */}
            <motion.div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#e95e8c] rounded-full shadow-md z-0"
              animate={{
                left: activeTab === "search" ? "4px" : "calc(50%)",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>

          <div className="w-11" />
        </div>
      </div>

      <AnimatePresence mode="popLayout" custom={direction}>
        {activeTab === "search" ? (
          <motion.div
            key="s"
            custom={direction}
            variants={slideVariants} // 슬라이드 효과 적용
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex-1 flex flex-col overflow-hidden px-6 w-full"
          >
            {/* 검색창 */}
            <div className="flex items-center bg-white/50 h-[52px] rounded-[20px] px-5 border border-white/40 mb-0.8 backdrop-blur-md shadow-sm focus-within:bg-white/30 transition-all">
              <input
                className="bg-transparent flex-1 outline-none font-medium text-[#8a8a8a] placeholder:text-[#333]/60 text-[15px]"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(true)}
                placeholder="어떤 노래를 찾으세요?"
              />
              <button
                onClick={() => handleSearch(true)}
                className="text-[#FF4D4D] font-bold text-[14px] ml-2 active:scale-95 transition-transform"
              >
                검색
              </button>
            </div>
            {/* 안내 멘트 추가 */}
            <p className="text-[11px] text-white/70 font-medium py-4 ml-1 drop-shadow-sm leading-none">
              💡 앨범 표지를 누르면 음악을 미리 들을 수 있어요. 다시 누르면
              노래가 멈춰요!
            </p>
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-2 pb-24 scrollbar-hide"
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
                      더 보기 (+20)
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center pt-20 text-white/60 font-bold">
                  검색 결과가 여기에 표시됩니다.
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="l"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex-1 px-6 overflow-y-auto space-y-2 pb-24 w-full"
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
