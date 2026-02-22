import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SearchPage from "./SearchPage";
import type { Track } from "./SearchPage";
import "../index.css";
import musicPlanetIcon from "../assets/logo.png";

// ------------------- [아이콘 컴포넌트] -------------------
const Icons = {
  Pin: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  ),
  Play: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  ),
  Home: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7"
      width="28"
      height="28"
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
      width="36"
      height="36"
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
  ),
  Profile: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7"
      width="28"
      height="28"
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
};

export default function ProfilePage() {
  const navigate = useNavigate();

  // 1. 상태(State) 생성
  const [nickname, setNickname] = useState(
    () => localStorage.getItem("profile_nickname") || "익명",
  );
  const [profileImg, setProfileImg] = useState(
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  );

  // 🔥 [수정됨] 검색창 열림/닫힘 상태 추가!
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInitialTab, setSearchInitialTab] = useState<"search" | "likes">(
    "search",
  );

  // 2. useEffect: 컴포넌트가 마운트될 때 localStorage에서 데이터 불러오기
  useEffect(() => {
    const savedNickname = localStorage.getItem("profile_nickname");
    const savedImage = localStorage.getItem("profile_image");

    if (savedNickname) setNickname(savedNickname);
    if (savedImage) setProfileImg(savedImage);
  }, []);

  // 3. 렌더링에 사용할 데이터 묶음
  const userData = {
    handle: "music_cat",
    nickname: nickname,
    level: 7,
    likesCurrent: 24,
    likesMax: 30,
    location: "123m 떨어져 있어요",
    profileImg: profileImg,
    likedSongs: [
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150",
      "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=150",
      "https://images.unsplash.com/photo-1459749411177-287ce3288b71?w=150",
    ],
  };

  // "더보기" 전용 클릭 핸들러
  const handleOpenLikes = () => {
    setSearchInitialTab("likes"); // 좋아요 탭으로 설정
    setIsSearchOpen(true); // 검색창 열기
  };

  // 중앙 행성 버튼 클릭 핸들러 (기본 검색으로 열기)
  const handleOpenSearch = () => {
    setSearchInitialTab("search"); // 검색 탭으로 설정
    setIsSearchOpen(true);
  };

  const progressPercent = (userData.likesCurrent / userData.likesMax) * 100;

  // 검색창에서 노래를 선택했을 때의 로직
  const handleSelectTrack = (track: Track) => {
    console.log("선택된 트랙:", track);
    setIsSearchOpen(false); // 선택 후 창 닫기
  };

  const handleSongClick = () => {
    navigate("/profile/edit/song");
  };

  return (
    <div
      className="clean-profile-bg"
      style={{
        paddingTop: "60px",
        paddingBottom: "120px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        background:
          "linear-gradient(169deg, #f8c1e9 0%, #c3c3ec 34.81%, #9fc3e9 66.28%, #6bcda6 99.18%)",
      }}
    >
      {/* 1. 상단 핸들 */}
      <div
        style={{
          width: "100%",
          paddingLeft: "24px",
          marginTop: "-10px",
          marginBottom: "15px",
          alignSelf: "flex-start",
        }}
      >
        <h1
          style={{
            fontSize: "18px",
            fontWeight: "900",
            color: "#333333",
            margin: 0,
            fontFamily: "sans-serif",
          }}
        >
          {userData.handle}
        </h1>
      </div>

      {/* 2. 프로필 이미지 & 레벨 뱃지 */}
      <div style={{ position: "relative", marginBottom: "13px" }}>
        <div
          style={{
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            border: "3px solid #FFFFFF",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <img
            src={userData.profileImg}
            alt="프로필"
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        </div>

        {/* 레벨 뱃지 */}
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            width: "50px",
            height: "50px",
            backgroundColor: "#4FD1C5",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "black",
            fontWeight: "700",
            fontSize: "18px",
            border: "3px solid rgba(255,255,255,0.9)",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
          }}
        >
          {userData.level}
        </div>
      </div>

      {/* 3. 닉네임 및 정보 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
            marginBottom: "3px",
          }}
        >
          <span
            style={{ fontSize: "20px", fontWeight: "900", color: "#333333" }}
          >
            {userData.nickname}
          </span>
          <span
            style={{ fontSize: "13px", color: "#666666", fontWeight: "500" }}
          >
            {userData.location}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "3px",
            cursor: "pointer",
          }}
          onClick={handleSongClick}
        >
          <span
            style={{ color: "#FF005C", display: "flex", alignItems: "center" }}
          >
            <Icons.Play />
          </span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "rgba(255,255,255,0.9)",
              textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            0+0 · 한로로
          </span>
        </div>
      </div>

      {/* 4. 액션 버튼들 */}
      <div
        style={{
          display: "flex",
          width: "90%",
          gap: "13px",
          marginTop: "-14px",
          marginBottom: "17px",
        }}
      >
        <button
          className="glass-btn"
          style={{
            flex: 1,
            height: "35px",
            fontSize: "13px",
            fontWeight: "700",
            backgroundColor: "rgba(255, 255, 255, 0.35)",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 0,
          }}
          onClick={() => navigate("/profile/edit")}
        >
          프로필 수정
        </button>
        <button
          onClick={() => navigate("/sogeun-songs")}
          className="glass-btn"
          style={{
            flex: 1,
            height: "35px",
            fontSize: "13px",
            fontWeight: "700",
            backgroundColor: "rgba(255, 255, 255, 0.35)",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 0,
          }}
        >
          소근한 노래
        </button>
      </div>

      {/* 5. 레벨 카드 */}
      <div className="level-card">
        <div className="level-header">
          <span>레벨 {userData.level}</span>
          <span style={{ color: "#FFFFFF" }}>
            {userData.likesCurrent} / {userData.likesMax} likes
          </span>
        </div>

        <div className="progress-bar-bg">
          <div
            className="shiny-bar"
            style={{
              width: `${progressPercent}%`,
            }}
          ></div>
        </div>

        <div className="level-footer">
          다음 레벨까지 {userData.likesMax - userData.likesCurrent} likes 남음
        </div>
      </div>

      {/* 6. 좋아요 누른 노래 */}
      <div style={{ width: "100%" }}>
        <div
          style={{
            width: "90%",
            margin: "0 auto 12px auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "white",
              margin: 3,
              textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            좋아요 누른 노래
          </h3>
          <span
            onClick={handleOpenLikes}
            style={{
              fontSize: "11px",
              fontWeight: "500",
              color: "white",
              margin: 3,
              cursor: "pointer",
              opacity: 0.9,
              textDecoration: "underline",
            }}
          >
            더보기
          </span>
        </div>

        <div className="liked-songs-container">
          <div className="song-list-row">
            {userData.likedSongs.map((src, index) => (
              <div key={index} className="album-item">
                <img src={src} alt={`album-${index}`} />
              </div>
            ))}
          </div>
          <div className="glass-bar"></div>
        </div>
      </div>

      {/* 7. 하단 내비게이션 */}
      <div className="fixed bottom-0 left-0 w-full flex flex-col items-center z-[120] pointer-events-none pb-10">
        <div className="pointer-events-auto w-[88%] h-[75px] bg-white/95 backdrop-blur-3xl rounded-[38px] flex justify-between items-center px-10 shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative">
          <button
            onClick={() => navigate("/gps")}
            className="flex flex-col items-center text-gray-400 opacity-60 hover:opacity-100 transition-opacity"
          >
            <Icons.Home />
            <span className="text-[10px] font-bold mt-1">홈</span>
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 -top-14">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleOpenSearch}
              className="w-[120px] h-[120px] flex items-center justify-center rounded-full"
            >
              <img
                src={musicPlanetIcon}
                alt="Music Planet"
                className="w-full h-full object-contain drop-shadow-xl"
              />
            </motion.button>
          </div>

          <button className="flex flex-col items-center text-[#FF4B6E]">
            <Icons.Profile />
            <span className="text-[10px] font-bold mt-1">나</span>
          </button>
        </div>
      </div>

      {/* 8. 검색 페이지 오버레이 */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[200] pointer-events-auto"
            style={{
              background:
                "linear-gradient(169deg, #f8c1e9 0%, #c3c3ec 34.81%, #9fc3e9 66.28%, #6bcda6 99.18%)",
              backgroundAttachment: "fixed",
            }}
          >
            <SearchPage
              initialTab={searchInitialTab}
              onBack={() => setIsSearchOpen(false)}
              onPlayMusic={(url) => console.log("Play:", url)}
              onSelectTrack={handleSelectTrack}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div> /* 🔥 [수정됨] 맨 끝 닫는 태그를 </motion.div>에서 </div>로 수정! */
  );
}
