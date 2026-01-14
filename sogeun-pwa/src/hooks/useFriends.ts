// src/hooks/useFriends.ts
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { Friend } from "../types";

// ⚠️ 백엔드 팀한테 물어봐서 받아와야 하는 서버 주소!
const SERVER_URL = "http://15.164.164.66:8080";
export const useFriends = (myLocation: { lat: number; lng: number } | null) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // 1. 소켓 연결 (앱 켜질 때 한 번만 실행)
  useEffect(() => {
    // 서버 문 두드리기 (연결)
    const socket = io(SERVER_URL, {
      transports: ["websocket"], // ⚡ 중요: 이걸 넣어야 더 빠르고 안정적입니다.
    });
    socketRef.current = socket;

    console.log("🔌 소켓 서버 연결 시도...");

    socket.on("connect", () => {
      console.log("✅ 서버와 연결 성공! (ID:", socket.id, ")");
    });

    // 👂 [듣기] 친구들 위치 데이터 받기
    // ⚠️ 백엔드 팀에게 물어볼 것 1: "친구 위치 줄 때 이벤트 이름이 뭐예요?" (예: 'update_friends')
    socket.on("update_friends", (data) => {
      // console.log("친구 위치 받음:", data);
      setFriends(data);
    });

    // 연결 끊기면 청소
    return () => {
      socket.disconnect();
      console.log("❌ 연결 종료");
    };
  }, []);

  // 2. 내 위치 전송 (내 위치가 바뀔 때마다 실행)
  useEffect(() => {
    if (!socketRef.current || !myLocation) return;

    socketRef.current.emit("send_location", myLocation);
  }, [myLocation]);

  return friends;
};
