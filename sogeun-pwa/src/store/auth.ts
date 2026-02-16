import { atomWithStorage } from "jotai/utils";

// 액세스 토큰은 보통 문자열입니다.
export const accessTokenAtom = atomWithStorage<string | null>(
  "accessToken",
  null,
);

// userId는 서버 명세에 따라 number 또는 string으로 확실히 고정하는 게 좋습니다.
// 만약 서버에서 주는 ID가 숫자라면 아래 형식을 유지하되,
// 로컬 스토리지 값을 읽을 때 숫자로 변환하는 과정이 필요할 수 있습니다.
export const userIdAtom = atomWithStorage<number | null>("userId", null);
