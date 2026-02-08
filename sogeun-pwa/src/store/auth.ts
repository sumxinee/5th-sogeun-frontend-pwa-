import { atomWithStorage } from "jotai/utils";

// 로컬스토리지의 'accessToken'과 연동되는 아톰
export const accessTokenAtom = atomWithStorage<string | null>(
  "accessToken",
  null,
);
export const userIdAtom = atomWithStorage<number | null>("userId", null);
