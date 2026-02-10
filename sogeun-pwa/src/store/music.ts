import { atom } from "jotai";
import type { Track } from "../pages/SearchPage";

// 재생 중인 트랙 정보 정보를 저장 (null이면 안 보임)
export const currentTrackAtom = atom<Track | null>(null);
// 재생/일시정지 상태 저장
export const isPlayingAtom = atom<boolean>(false);
// 음악 볼륨 저장 (0.0 ~ 1.0)
