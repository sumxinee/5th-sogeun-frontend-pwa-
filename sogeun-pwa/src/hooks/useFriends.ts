// src/hooks/useFriends.ts
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { Friend } from "../types";

const SERVER_URL = import.meta.env.VITE_API_URL;

export const useFriends = (myLocation: { lat: number; lng: number } | null) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // 1. 소켓 연결 (앱 켜질 때 한 번만 실행)
  useEffect(() => {
    // 서버 문 두드리기 (연결)
    const socket = io(SERVER_URL, {
      transports: ["websocket"], //
    });
    socketRef.current = socket;

    console.log("🔌 소켓 서버 연결 시도...");

    socket.on("connect", () => {
      console.log("✅ 서버와 연결 성공! (ID:", socket.id, ")");
    });

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
