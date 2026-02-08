/* eslint-disable */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../index.css"; // 전역 CSS 불러오기
import { useSetAtom } from "jotai";
import { accessTokenAtom } from "../store/auth";
import { userIdAtom } from "../store/auth";

export default function AuthPage() {
  const navigate = useNavigate();
  const setAccessToken = useSetAtom(accessTokenAtom);

  // true면 로그인 화면, false면 회원가입 화면
  const [isLoginMode, setIsLoginMode] = useState(true);

  // 입력값 상태 관리
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [pwCheck, setPwCheck] = useState("");
  const [nickname, setNickname] = useState("");

  // 에러 메시지 상태 관리 (와이어프레임의 빨간 글씨 구현용)
  const [errorMessage, setErrorMessage] = useState("");

  // Vercel 환경 변수에서 가져오는 API 주소
  const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://pruxd7efo3.execute-api.ap-northeast-2.amazonaws.com/clean";

  // 모드 전환 시 입력값 및 에러 초기화
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setId("");
    setPw("");
    setPwCheck("");
    setNickname("");
    setErrorMessage(""); // 에러 메시지 초기화
  };
  const setUserId = useSetAtom(userIdAtom);
  // 로그인 로직
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(""); // 기존 에러 초기화

    if (!id || !pw) {
      setErrorMessage("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        loginId: id,
        password: pw,
      });

      if (response.status === 200 || response.status === 201) {
        console.log("🎉 로그인 성공!", response.data);

        const { accessToken, userId } = response.data; // 서버 응답에 userId가 있다고 가정

        if (accessToken && userId) {
          setAccessToken(accessToken);
          setUserId(userId); // 내 진짜 ID 저장
        }
        alert("소근에 오신 것을 환영해요!");
        navigate("/gps", { state: { userId: id } });
      }
    } catch (error: any) {
      console.error("로그인 에러:", error);
      // 와이어프레임처럼 인풋 밑에 빨간 글씨로 띄우기 위해 상태 업데이트
      setErrorMessage("아이디 또는 비밀번호가 일치하지 않습니다.");
    }
  };

  // 회원가입 로직
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!id || !pw || !pwCheck || !nickname) {
      setErrorMessage("모든 정보를 입력해주세요.");
      return;
    }

    if (pw !== pwCheck) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        loginId: id,
        password: pw,
        nickname: nickname,
      });

      if (response.status === 200 || response.status === 201) {
        alert("회원가입 완료! 로그인 해주세요.");
        setIsLoginMode(true);
      }
    } catch (error: any) {
      console.error("회원가입 에러:", error);
      setErrorMessage("이미 사용 중인 아이디거나 오류가 발생했습니다.");
    }
  };

  return (
    <div className="auth-container">
      {/* 1. 상단 로고 및 텍스트 영역 (와이어프레임 디자인 반영) */}
      <div className="auth-header">
        <p className="auth-sub-text">Hello SOGEUNian !</p>
        {/* 아이콘이 있다면 <img> 태그로 교체 가능, 현재는 텍스트 아이콘 */}
        <div className="auth-logo-icon" style={{ fontSize: "40px" }}>
          🎧
        </div>
        <h1 className="auth-title">{isLoginMode ? "로그인" : "회원가입"}</h1>
      </div>

      <form
        className="auth-form"
        onSubmit={isLoginMode ? handleLogin : handleSignup}
      >
        <input
          className="auth-input"
          type="text"
          placeholder="아이디"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />

        {!isLoginMode && (
          <input
            className="auth-input"
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        )}

        <input
          className={`auth-input ${errorMessage ? "error" : ""}`}
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="off"
        />

        {!isLoginMode && (
          <input
            className={`auth-input ${
              !isLoginMode && pw !== pwCheck && pwCheck ? "error" : ""
            }`}
            type="password"
            placeholder="비밀번호 확인"
            value={pwCheck}
            onChange={(e) => setPwCheck(e.target.value)}
            autoComplete="off"
          />
        )}

        {/* 2. 에러 메시지 표시 영역 (빨간 글씨) */}
        {errorMessage && <p className="auth-error-msg">⚠ {errorMessage}</p>}

        <button type="submit" className="auth-button">
          {isLoginMode ? "로그인" : "가입하기"}
        </button>
      </form>

      {/* 3. 하단 링크 (CSS flex 정렬을 위해 불필요한 스타일 제거) */}
      <div className="auth-toggle-container">
        <span>
          {isLoginMode ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}
        </span>
        <button type="button" className="auth-toggle-link" onClick={toggleMode}>
          {isLoginMode ? "회원가입하기" : "로그인하기"}
        </button>
      </div>
    </div>
  );
}
