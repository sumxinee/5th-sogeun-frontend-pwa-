//import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../index.css";

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
  Profile: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
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

export default function OtherUserProfilePage() {
  const navigate = useNavigate();

  // 더미 데이터 (남의 정보)
  const userData = {
    handle: "music_cat",
    nickname: "음악듣는고양이",
    level: 7,
    likesCurrent: 24,
    likesMax: 30,
    location: "123m 떨어져 있어요",
    profileImg:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    likedSongs: [
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150",
      "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=150",
      "https://images.unsplash.com/photo-1459749411177-287ce3288b71?w=150",
    ],
  };

  const progressPercent = (userData.likesCurrent / userData.likesMax) * 100;

  return (
    <div
      className="clean-profile-bg"
      style={{
        paddingTop: "60px",
        paddingBottom: "120px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background:
          "linear-gradient(169deg, #f8c1e9 0%, #c3c3ec 34.81%, #9fc3e9 66.28%, #6bcda6 99.18%)",
        minHeight: "100vh",
      }}
    >
      {/* 1. 상단 핸들 (뒤로가기 기능 추가 추천) */}
      <div
        style={{
          width: "100%",
          paddingLeft: "24px",
          marginTop: "-10px",
          marginBottom: "15px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
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
      <div style={{ position: "relative", marginBottom: "1px" }}>
        <div className="profile-image-container">
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
        <div className="level-badge">{userData.level}</div>
      </div>

      {/* 3. 닉네임 및 정보 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          alignItems: "center",
          marginBottom: "20px",
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
          }}
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

      {/* 5. 레벨 카드 */}
      <div className="level-card">
        {/* 헤더 */}
        <div className="level-header">
          <span>레벨 {userData.level}</span>
          <span style={{ color: "#FFFFFF" }}>
            {userData.likesCurrent} / {userData.likesMax} likes
          </span>
        </div>

        {/* 진행 바 배경 (회색 트랙) */}
        <div className="progress-bar-bg">
          {/* 진행 바 채우기 (여기가 반짝이는 부분!) */}
          <div
            className="shiny-bar"
            style={{
              width: `${progressPercent}%`,
            }}
          ></div>
        </div>

        {/* 푸터 */}
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
            style={{
              fontSize: "11px",
              fontWeight: "500",
              color: "white",
              margin: 3,
              cursor: "pointer",
              opacity: 0.9,
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
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[88%] h-[72px] bg-white/95 backdrop-blur-2xl rounded-[36px] flex justify-between items-center px-10 shadow-2xl z-[100]">
        <button
          onClick={() => navigate("/gps")}
          className="flex flex-col items-center text-gray-400 opacity-60 hover:opacity-100 transition-opacity"
        >
          <Icons.Home />
          <span className="text-[10px] font-bold mt-1">홈</span>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
          <motion.button
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

        {/* 남의 프로필을 볼 때는 '나' 버튼이 활성화(분홍색)되지 않도록 text-gray-400으로 변경 */}
        <button
          onClick={() => navigate("/profile")}
          className="flex flex-col items-center text-gray-400 opacity-60 hover:opacity-100 transition-opacity"
        >
          <Icons.Profile />
          <span className="text-[10px] font-bold mt-1">나</span>
        </button>
      </div>
    </div>
  );
}
