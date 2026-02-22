import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import "../index.css";

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
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const BASE_URL = "https://api.sogeun.cloud";

  const getCleanToken = () => {
    const rawToken = localStorage.getItem("accessToken") || "";
    let token = rawToken.replace(/['"<>\\]/g, "").trim();
    if (token.toLowerCase().startsWith("bearer ")) {
      token = token.substring(7).trim();
    }
    return token;
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("위치 서비스를 지원하지 않습니다."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  const handleSelectTrack = async (track: Track) => {
    setSelectedTrackId(track.trackId);
    if (audioRef.current) audioRef.current.pause();

    const cleanToken = getCleanToken();
    const config = { 
      headers: { 
        Authorization: `Bearer ${cleanToken}`, 
        "Content-Type": "application/json" 
      } 
    };
    
    const musicData = {
      trackId: track.trackId,
      title: track.trackName,
      artist: track.artistName,
      artworkUrl: track.artworkUrl100,
      previewUrl: track.previewUrl,
    };

    try {
      console.log("🎵 음악 변경 시도...");
      await axios.post(`${BASE_URL}/api/broadcast/changemusic`, { music: musicData }, config);
      
      // ✅ [데이터 즉시 반영 핵심] 로컬 스토리지에 노래 정보 저장
      // 프로필 페이지에서 이 값을 읽어서 "한로로"를 갈아끼우게 됩니다.
      localStorage.setItem("temp_trackName", track.trackName);
      localStorage.setItem("temp_artistName", track.artistName);
      
      alert(`'${track.trackName}' 변경 완료!`);
      
      // ✅ 로그인 페이지로 튕기지 않게 히스토리 뒤로가기 사용
      navigate(-1); 
      
    } catch (error: any) {
      if (error.response?.status === 409) {
        try {
          const loc = await getCurrentLocation();
          const onPayload = {
            title: `${track.trackName} 방송`.slice(0, 15),
            content: "함께 들어요!",
            lat: Number(loc.latitude.toFixed(6)),
            lon: Number(loc.longitude.toFixed(6)),
            music: musicData 
          };

          await axios.post(`${BASE_URL}/api/broadcast/on`, onPayload, config);
          
          // ✅ 방송 시작 시에도 동일하게 저장
          localStorage.setItem("temp_trackName", track.trackName);
          localStorage.setItem("temp_artistName", track.artistName);

          await new Promise(resolve => setTimeout(resolve, 500));
          alert("방송을 시작했습니다!");
          navigate(-1); 
          
        } catch (innerError: any) {
          alert("방송 시작 실패");
        }
      } else {
        alert("오류 발생");
      }
      setSelectedTrackId(null);
    }
  };

  const handleSearch = async (isNewSearch = true) => {
    if (!query) return;
    const newLimit = isNewSearch ? 20 : limit + 20;
    try {
      const res = await axios.get(`https://itunes.apple.com/search`, {
        params: { term: query, entity: "song", limit: newLimit, country: "kr" },
      });
      setResults(res.data.results.map((item: any) => ({
        trackId: item.trackId, trackName: item.trackName, artistName: item.artistName,
        artworkUrl100: item.artworkUrl100, previewUrl: item.previewUrl,
      })));
      setLimit(newLimit);
    } catch (err) { console.error(err); }
  };

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }}
      className="fixed inset-0 z-50 flex flex-col pt-12"
      style={{ background: "linear-gradient(169deg, #f8c1e9 0%, #c3c3ec 34.81%, #9fc3e9 66.28%, #6bcda6 99.18%)", backgroundAttachment: "fixed" }}
    >
      <audio ref={audioRef} />
      <div className="w-full flex items-center justify-between px-5 mb-6 text-white font-bold">
        <button onClick={() => navigate(-1)} className="p-2">뒤로</button>
        <h1 className="text-[18px]">노래변경</h1>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden px-5 w-full">
        <div className="flex items-center bg-white/40 h-[50px] rounded-[16px] px-4 mb-6 backdrop-blur-md border border-white/20">
          <input 
            className="bg-transparent flex-1 outline-none text-white placeholder-white" 
            value={query} onChange={(e) => setQuery(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && handleSearch(true)} 
            placeholder="음악 검색..." 
          />
          <button onClick={() => handleSearch(true)} className="text-[#FF4D4D] font-bold ml-2">검색</button>
        </div>

        <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
          {results.map((track) => (
            <div 
              key={track.trackId}
              className="flex items-center p-3 rounded-[20px] mb-3 bg-white/60 border border-white/20 cursor-pointer"
              onClick={() => { if (audioRef.current) { audioRef.current.src = track.previewUrl; audioRef.current.play(); } }}
            >
              <img src={track.artworkUrl100} className="w-12 h-12 rounded-xl mr-4 shadow-sm" alt="" />
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-[#333] mb-0.5">{track.trackName}</p>
                <p className="text-[12px] text-[#666] truncate">{track.artistName}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleSelectTrack(track); }}
                className="text-[13px] font-bold px-3 py-1.5 rounded-full bg-white/80 active:scale-95 transition-transform"
              >
                {selectedTrackId === track.trackId ? "..." : "선택"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SongEditPage;