/* eslint-disable */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../index.css"; // 전역 CSS 불러오기
import { useSetAtom } from "jotai";
import { accessTokenAtom } from "../store/auth";
import { userIdAtom } from "../store/auth";
import { jwtDecode } from "jwt-decode";

export default function AuthPage() {
  const navigate = useNavigate();
  const setAccessToken = useSetAtom(accessTokenAtom);
  const setUserId = useSetAtom(userIdAtom);

  // true면 로그인 화면, false면 회원가입 화면
  const [isLoginMode, setIsLoginMode] = useState(true);

  // 입력값 상태 관리
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [pwCheck, setPwCheck] = useState("");
  const [nickname, setNickname] = useState("");

  // 개별 항목 실시간 에러 메시지 상태 (회원가입용)
  const [idError, setIdError] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwCheckError, setPwCheckError] = useState("");

  // 공통 에러 메시지 상태 (로그인 실패 및 폼 제출 에러용)
  const [errorMessage, setErrorMessage] = useState("");

  // 정규식
  const idRegex = /^[a-z0-9]{4,20}$/;
  const nicknameRegex = /^[a-zA-Z가-힣0-9]{2,10}$/;
  const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+~`|}{[\]:;?><,./-]).{8,16}$/;

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://pruxd7efo3.execute-api.ap-northeast-2.amazonaws.com/clean";

  // 모드 전환 시 모든 상태 초기화
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setId("");
    setPw("");
    setPwCheck("");
    setNickname("");
    setErrorMessage("");
    setIdError("");
    setNicknameError("");
    setPwError("");
    setPwCheckError("");
  };

  // 입력창에서 포커스가 벗어날 때(onBlur) 실행되는 실시간 유효성 검사 함수들
  const handleIdBlur = () => {
    if (!isLoginMode && id && !idRegex.test(id)) {
      setIdError("아이디: 사용할 수 없는 아이디입니다. 다른 아이디를 입력해 주세요.");
    } else {
      setIdError("");
    }
  };

  const handleNicknameBlur = () => {
    if (!isLoginMode && nickname && !nicknameRegex.test(nickname)) {
      setNicknameError("닉네임: 사용할 수 없는 닉네임입니다. 다른 닉네임을 입력해 주세요.");
    } else {
      setNicknameError("");
    }
  };

  const handlePwBlur = () => {
    if (!isLoginMode && pw && !pwRegex.test(pw)) {
      setPwError("비밀번호: 8~16자의 영문 대/소문자, 숫자, 특수문자를 사용해 주세요.");
    } else {
      setPwError("");
    }
    // 비밀번호 확인 칸이 이미 채워져 있는데, 위에서 비밀번호를 다시 수정한 경우 연동 검사
    if (!isLoginMode && pwCheck && pw !== pwCheck) {
      setPwCheckError("비밀번호가 일치하지 않습니다.");
    } else if (!isLoginMode && pwCheck && pw === pwCheck) {
      setPwCheckError("");
    }
  };

  const handlePwCheckBlur = () => {
    if (!isLoginMode && pwCheck && pw !== pwCheck) {
      setPwCheckError("비밀번호가 일치하지 않습니다.");
    } else {
      setPwCheckError("");
    }
  };

  // 로그인 로직
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

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
        const { accessToken } = response.data;
        if (accessToken) {
          setAccessToken(accessToken);
          try {
            const decoded: any = jwtDecode(accessToken);
            const extractedUserId = decoded.id || decoded.userId || decoded.sub;
            if (extractedUserId) {
              setUserId(String(extractedUserId));
              localStorage.setItem("userId", String(extractedUserId));
            }
          } catch (decodeError) {
            console.error("토큰 해독 실패:", decodeError);
          }
          alert("소근에 오신 것을 환영해요!");
          navigate("/gps");
        }
      }
    } catch (error: any) {
      setErrorMessage("아이디 또는 비밀번호가 일치하지 않습니다.");
    }
  };

  // 회원가입 제출 로직
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // 1. 빈 칸이 있는지 확인
    if (!id || !pw || !pwCheck || !nickname) {
      setErrorMessage("모든 정보를 입력해주세요.");
      return;
    }

    // 2. 입력창마다 띄워둔 실시간 에러가 하나라도 남아있거나 양식에 안 맞으면 서버로 안 보냄
    if (idError || nicknameError || pwError || pwCheckError || !idRegex.test(id) || !nicknameRegex.test(nickname) || !pwRegex.test(pw) || pw !== pwCheck) {
      setErrorMessage("입력하신 정보 중 양식에 맞지 않는 항목이 있습니다. 다시 확인해 주세요.");
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
      setErrorMessage("이미 사용 중인 아이디거나 오류가 발생했습니다.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <p className="auth-sub-text">Hello SOGEUNian !</p>
        <div className="auth-logo-icon" style={{ fontSize: "40px" }}>🎧</div>
        <h1 className="auth-title">{isLoginMode ? "로그인" : "회원가입"}</h1>
      </div>

      <form
        className="auth-form"
        onSubmit={isLoginMode ? handleLogin : handleSignup}
      >
        {/* 아이디 입력 */}
        <input
          className={`auth-input ${!isLoginMode && idError ? "error" : ""}`}
          type="text"
          placeholder="아이디"
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            if (!isLoginMode) setIdError(""); // 다시 타이핑을 시작하면 빨간 글씨 숨김
          }}
          onBlur={handleIdBlur} // 다음 칸으로 넘어갈 때 검사 실행
        />
        {!isLoginMode && idError && <p className="auth-error-msg" style={{ marginTop: "-10px", marginBottom: "10px", alignSelf: "flex-start", marginLeft: "5px" }}>⚠ {idError}</p>}

        {/* 닉네임 입력 (회원가입 시에만) */}
        {!isLoginMode && (
          <>
            <input
              className={`auth-input ${nicknameError ? "error" : ""}`}
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setNicknameError("");
              }}
              onBlur={handleNicknameBlur}
            />
            {nicknameError && <p className="auth-error-msg" style={{ marginTop: "-10px", marginBottom: "10px", alignSelf: "flex-start", marginLeft: "5px" }}>⚠ {nicknameError}</p>}
          </>
        )}

        {/* 비밀번호 입력 */}
        <input
          className={`auth-input ${!isLoginMode && pwError ? "error" : ""}`}
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            if (!isLoginMode) setPwError("");
          }}
          onBlur={handlePwBlur}
          autoComplete="off"
        />
        {!isLoginMode && pwError && <p className="auth-error-msg" style={{ marginTop: "-10px", marginBottom: "10px", alignSelf: "flex-start", marginLeft: "5px", textAlign: "left" }}>⚠ {pwError}</p>}

        {/* 비밀번호 확인 입력 (회원가입 시에만) */}
        {!isLoginMode && (
          <>
            <input
              className={`auth-input ${pwCheckError ? "error" : ""}`}
              type="password"
              placeholder="비밀번호 확인"
              value={pwCheck}
              onChange={(e) => {
                setPwCheck(e.target.value);
                setPwCheckError("");
              }}
              onBlur={handlePwCheckBlur}
              autoComplete="off"
            />
            {pwCheckError && <p className="auth-error-msg" style={{ marginTop: "-10px", marginBottom: "10px", alignSelf: "flex-start", marginLeft: "5px" }}>⚠ {pwCheckError}</p>}
          </>
        )}

        {/* 하단 공통 에러 메시지 (로그인 실패, 빈칸 제출 등) */}
        {errorMessage && <p className="auth-error-msg">⚠ {errorMessage}</p>}

        <button type="submit" className="auth-button">
          {isLoginMode ? "로그인" : "가입하기"}
        </button>
      </form>

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