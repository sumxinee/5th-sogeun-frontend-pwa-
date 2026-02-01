/* eslint-disable */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../index.css'; // 전역 CSS 불러오기

export default function AuthPage() {
  const navigate = useNavigate();

  // true면 로그인 화면, false면 회원가입 화면
  const [isLoginMode, setIsLoginMode] = useState(true);

  // 입력값 상태 관리
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [pwCheck, setPwCheck] = useState("");
  const [nickname, setNickname] = useState("");

  // Vercel 환경 변수에서 가져오는 API 주소
  const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://pruxd7efo3.execute-api.ap-northeast-2.amazonaws.com/clean";

  // 모드 전환 시 입력값 초기화
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setId("");
    setPw("");
    setPwCheck("");
    setNickname("");
  };

  // 로그인 로직
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !pw) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        loginId: id,
        password: pw,
      });
      
      if (response.status === 200 || response.status === 201) {
        console.log("🎉 로그인 성공!", response.data);
        alert("소근에 오신 것을 환영해요!");
        // 로그인 성공 시 GPS 화면으로 이동
        navigate("/gps", { state: { userId: id } });
      }
    } catch (error: any) {
      console.error("로그인 에러:", error);
      alert("로그인 실패! 아이디 또는 비밀번호를 확인해주세요.");
    }
  };

  // 회원가입 로직
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !pw || !pwCheck || !nickname) {
      alert("모든 정보를 입력해주세요.");
      return;
    }

    if (pw !== pwCheck) {
      alert("비밀번호가 일치하지 않습니다.");
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
      alert("회원가입에 실패했습니다.");
    }
  };

  return (
    /* 중요: index.css에 정의한 클래스 이름으로 변경 */
    <div className="auth-container">
      <h1 className="auth-title">{isLoginMode ? "로그인" : "회원가입"}</h1>

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
          className="auth-input"
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="off"
        />

        {!isLoginMode && (
          <input
            className="auth-input"
            type="password"
            placeholder="비밀번호 확인"
            value={pwCheck}
            onChange={(e) => setPwCheck(e.target.value)}
            autoComplete="off"
          />
        )}

        <button type="submit" className="auth-button">
          {isLoginMode ? "로그인" : "가입하기"}
        </button>
      </form>

      <div className="auth-toggle-container">
        <span>
          {isLoginMode ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}
        </span>
        <button
          type="button"
          className="auth-toggle-link"
          onClick={toggleMode}
          style={{ marginLeft: "10px" }}
        >
          {isLoginMode ? "회원가입하기" : "로그인하기"}
        </button>
      </div>
    </div>
  );
}