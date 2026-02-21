import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// 1. 토큰 (기존과 동일)
export const accessTokenAtom = atomWithStorage<string | null>(
  "accessToken",
  null,
);

// 2. 스토리지용 원본 ID (문자열로 저장됨)
export const userIdAtom = atomWithStorage<string | null>("userId", null);

// 3. 🔥 컴포넌트에서 실제로 사용할 '숫자형' ID 아톰 (파생 아톰)
// 매번 Number()를 호출할 필요 없이, 이 아톰을 구독하면 알아서 숫자로 나옵니다.
export const numericUserIdAtom = atom((get) => {
  const rawId = get(userIdAtom);
  if (rawId === null || rawId === undefined || rawId === "") return 0;

  const parsed = Number(rawId);
  return isNaN(parsed) ? 0 : parsed;
});

// 4. 로그인 여부를 확인하는 유틸리티 아톰
export const isAuthenticatedAtom = atom((get) => {
  return !!get(accessTokenAtom) && get(numericUserIdAtom) !== 0;
});
