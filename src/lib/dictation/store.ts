import { useSyncExternalStore } from "react";
import { uid } from "../store";
import type { SongLine } from "./cloze";

// Songs the learner adds and best scores, kept in this browser only. The lyrics never leave it.

export interface UserSong {
  id: string;
  title: string;
  /** A song (lyrics) or a film scene (subtitles) */
  kind?: "song" | "film";
  /** YouTube video id, played with YouTube's own embedded player */
  videoId?: string;
  /** Spotify track id, played with Spotify's own embedded player */
  spotifyId?: string;
  /** Played from a video or audio file on the learner's device, picked again each time (files are not stored) */
  localFile?: boolean;
  /** Name of that file, to remind which one to pick */
  fileName?: string;
  /** Seconds added to every time stamp so the text meets the media */
  offset?: number;
  lines: SongLine[];
  addedAt: number;
}

export interface BestScore {
  accuracy: number;
  /** Correct letters per minute */
  cpm: number;
  at: number;
}

export interface DictationState {
  v: 1;
  songs: UserSong[];
  best: Record<string, BestScore>;
  /** Turkish meanings fetched for lines that came without one, by German text */
  tr: Record<string, string>;
}

const STORAGE_KEY = "almanca-pratik:dinle:v1";

function defaultState(): DictationState {
  return { v: 1, songs: [], best: {}, tr: {} };
}

const SERVER_STATE = defaultState();
let state: DictationState = SERVER_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function parseStored(raw: string | null): DictationState {
  if (!raw) return defaultState();
  const data = JSON.parse(raw) as Partial<DictationState>;
  return { ...defaultState(), ...data, v: 1 };
}

function emit() {
  listeners.forEach((l) => l());
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    state = parseStored(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    state = defaultState();
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    try {
      state = parseStored(e.newValue);
      emit();
    } catch {
      // ignore unreadable data written by another tab
    }
  });
}

function update(fn: (s: DictationState) => DictationState) {
  load();
  state = fn(state);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or blocked: keep working in memory
  }
  emit();
}

function getState(): DictationState {
  load();
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useDictationState(): DictationState {
  return useSyncExternalStore(subscribe, getState, () => SERVER_STATE);
}

export function saveSong(song: Omit<UserSong, "id" | "addedAt"> & { id?: string }): UserSong {
  const existing = song.id ? getState().songs.find((s) => s.id === song.id) : undefined;
  const saved: UserSong = { ...song, id: existing?.id ?? uid(), addedAt: existing?.addedAt ?? Date.now() };
  update((s) => ({ ...s, songs: existing ? s.songs.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...s.songs] }));
  return saved;
}

/** Replaces the lines' start times; lines past the end of `starts` lose theirs. */
export function setSongTimes(id: string, starts: number[]) {
  update((s) => ({
    ...s,
    songs: s.songs.map((song) =>
      song.id === id
        ? { ...song, lines: song.lines.map(({ text, tr }, i) => ({ text, ...(tr ? { tr } : {}), ...(i < starts.length ? { start: starts[i] } : {}) })) }
        : song,
    ),
  }));
}

export function setSongOffset(id: string, offset: number) {
  update((s) => ({ ...s, songs: s.songs.map((song) => (song.id === id ? { ...song, offset: Math.round(offset * 100) / 100 } : song)) }));
}

export function setSongFileName(id: string, fileName: string) {
  update((s) => ({ ...s, songs: s.songs.map((song) => (song.id === id ? { ...song, fileName } : song)) }));
}

export function saveTranslation(de: string, tr: string) {
  update((s) => ({ ...s, tr: { ...s.tr, [de.trim()]: tr } }));
}

export function removeSong(id: string) {
  update((s) => {
    const best = { ...s.best };
    delete best[`song:${id}`];
    return { ...s, songs: s.songs.filter((x) => x.id !== id), best };
  });
}

/** Keeps the result if it beats the stored one (accuracy first, then speed). Returns true for a new record. */
export function recordScore(key: string, score: Omit<BestScore, "at">): boolean {
  const prev = getState().best[key];
  const better = !prev || score.accuracy > prev.accuracy || (score.accuracy === prev.accuracy && score.cpm > prev.cpm);
  if (better) update((s) => ({ ...s, best: { ...s.best, [key]: { ...score, at: Date.now() } } }));
  return better;
}
