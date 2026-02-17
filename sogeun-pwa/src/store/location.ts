import { atom } from "jotai";

// 위도(lat), 경도(lng)를 저장할 원자(Atom) 생성

export const locationAtom = atom<{ lat: number; lon: number } | null>(null);
