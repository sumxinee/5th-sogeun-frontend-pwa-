// src/pages/GPS/index.tsx
import { useAtom } from "jotai";
import { locationAtom } from "../store/location";
import { useState, useEffect, useRef } from "react";
import styles from "./GPS.module.css";
import { useFriends } from "../hooks/useFriends";

// 📏 상수 설정
const LAT_TO_METER = 111000; // 위도 1도 ≈ 111km
const PX_PER_METER = 5; // 화면상 1m = 5px

const GPS = () => {
  const [location, setLocation] = useAtom(locationAtom);
  const [level, setLevel] = useState(1); // 1 = 20m, 2 = 40m ...
  const alertedFriends = useRef(new Set<number>());

  // 📡 친구들 위치 가져오기 (소켓/훅 사용)
  const friends = useFriends(location);

  // 내 반경 (m)
  const myRadiusMeters = level * 20;

  // 📍 [1. GPS 위치 추적 로직] (👈 아까 이게 빠져서 setLocation 에러가 났던 것!)
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // 내 위치 갱신!
        setLocation({ lat: latitude, lng: longitude });
      },
      (error) => console.error("GPS Error:", error),
      { enableHighAccuracy: true } // 배터리 좀 쓰더라도 정확하게
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [setLocation]);

  // 🔔 [2. 알림 로직]
  useEffect(() => {
    if (!location) return;

    friends.forEach((friend) => {
      // 거리 계산 (미터 단위)
      const distLat = (friend.lat - location.lat) * LAT_TO_METER;
      const distLng =
        (friend.lng - location.lng) *
        LAT_TO_METER *
        Math.cos(location.lat * (Math.PI / 180));
      const distanceMeters = Math.sqrt(distLat * distLat + distLng * distLng);

      // 내 반경 안에 들어왔는지 확인
      if (distanceMeters <= myRadiusMeters) {
        if (!alertedFriends.current.has(friend.id)) {
          console.log(
            `🔔 ${friend.name}님 발견! 거리: ${distanceMeters.toFixed(1)}m`
          );
          // 여기에 alert 대신 예쁜 토스트 UI를 넣으면 좋습니다.
          alertedFriends.current.add(friend.id);
        }
      } else {
        // 반경 밖으로 나가면 다시 알림 받을 수 있게 제거
        alertedFriends.current.delete(friend.id);
      }
    });
  }, [friends, location, myRadiusMeters]);

  // 🎨 좌표 변환 함수 (나를 화면 정중앙(0,0)으로)
  const getScreenPos = (lat: number, lng: number) => {
    if (!location) return { x: 0, y: 0 };
    const x =
      (lng - location.lng) *
      LAT_TO_METER *
      Math.cos(location.lat * (Math.PI / 180)) *
      PX_PER_METER;
    const y = -(lat - location.lat) * LAT_TO_METER * PX_PER_METER;
    return { x, y };
  };

  return (
    <div className={styles.container}>
      {/* 🌊 파동 효과 - 레벨 범위까지만 확산 */}
      <div className={styles.pulseWave} data-level={level} />

      {/* 📏 고정된 거리 원 (10m, 20m, 30m) */}
      {[10, 20, 30].map((m) => (
        <div
          key={m}
          className={styles.staticRing}
          style={{
            width: m * PX_PER_METER * 2,
            height: m * PX_PER_METER * 2,
          }}
        >
          <span className={styles.ringLabel} style={{ top: -10 }}>
            {m}m
          </span>
        </div>
      ))}

      {/* 🎯 내 레벨 반경 (주황색 원) */}
      <div
        className={styles.levelRing}
        style={{
          width: myRadiusMeters * PX_PER_METER * 2,
          height: myRadiusMeters * PX_PER_METER * 2,
        }}
      />

      {/* 📱 나 (중앙) */}
      <div className={styles.me}>📱</div>

      {/* 👥 친구들 */}
      {friends.map((friend) => {
        const { x, y } = getScreenPos(friend.lat, friend.lng);
        return (
          <div
            key={friend.id}
            className={styles.friend}
            style={{ transform: `translate(${x}px, ${y}px)` }}
          >
            <div className={styles.avatar}>{friend.emoji}</div>
            <span className={styles.name}>{friend.name}</span>
          </div>
        );
      })}

      {/* 🎛️ [3. 컨트롤 버튼] (👈 아까 이게 빠져서 setLevel 에러가 났던 것!) */}
      <div className={styles.controls}>
        <button
          className={styles.btn}
          onClick={() => setLevel(Math.max(1, level - 1))}
        >
          - 축소
        </button>
        <button className={styles.btn} onClick={() => setLevel(level + 1)}>
          + 확대
        </button>
      </div>

      {/* 디버그 정보 */}
      <div className={styles.debugInfo}>
        <p>
          현재 반경: {myRadiusMeters}m (Lv.{level})
        </p>
        {location && (
          <p>
            내 위치: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
        )}
      </div>
    </div>
  );
};

export default GPS;
