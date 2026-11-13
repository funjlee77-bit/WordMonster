export type Dir = 'en' | 'ko'; // en: 뜻 → 영어 쓰기, ko: 영어 → 뜻 쓰기

export interface WordItem {
  id: string; chapter: number; number: number;
  englishDisplay: string; koreanAnswer: string; englishAnswer: string;
  sourceCheck: string; note: string;
  grading: { en: string; ko: string };
}
export interface WordData {
  dataVersion: number; textbook: string; sourceFile: string; sourceSha256: string; itemCount: number; items: WordItem[];
}

/** strict: 도움 없이 엄격 채점 정답 / relaxed: 완화 설정에서만 정답 / aided: 힌트·정답보기 후 정답 / wrong: 오답 / practice: 보고 따라 쓰기 */
export type AnswerResult = 'strict' | 'relaxed' | 'aided' | 'wrong' | 'practice';

export type Stage = 0 | 1 | 2 | 3 | 4 | 5;
export const STAGE_LABEL: Record<Stage, string> = {
  0: '처음 만남', 1: '연습 중', 2: '1일 뒤 복습', 3: '3일 뒤 복습', 4: '7일 뒤 복습', 5: '숙련',
};

export interface DirRecord {
  attempts: number; unaidedCorrect: number; relaxedCorrect: number; aidedCorrect: number;
  wrong: number; practiced: number; helpCount: number;
  lastResult: AnswerResult | null; lastAt: string | null; lastHelpUsed: boolean;
  stage: Stage; due: string | null; lastStageUpDate: string | null; lastWrongDate: string | null;
  /** 오답(또는 정답 보기) 후 아직 도움 없이 다시 맞히지 못함 → 다음 판 우선 출제 */
  pendingRetry: boolean;
  served: number; lastServedAt: string | null;
}
export type ProgressMap = Record<string, DirRecord>; // key = `${id}|${dir}`
export const pkey = (id: string, dir: Dir) => `${id}|${dir}`;

export interface AnswerOverride { replace?: string; alternates: string[]; updatedAt: string }
export type Overrides = Record<string, Partial<Record<Dir, AnswerOverride>>>;

export interface Settings {
  questionsPerRound: 5 | 8 | 10;
  dirMode: 'mix' | 'en' | 'ko';
  caseSensitive: boolean; spaceSensitive: boolean; punctSensitive: boolean;
  sound: boolean; reduceMotion: boolean; skipEffects: boolean;
}
export const DEFAULT_SETTINGS: Settings = {
  questionsPerRound: 8, dirMode: 'mix', caseSensitive: true, spaceSensitive: true, punctSensitive: true,
  sound: true, reduceMotion: false, skipEffects: false,
};

export type FriendId = 'lumo' | 'moko' | 'quilly';
export type EnemyId = 'blot' | 'vine' | 'fizz' | 'clank' | 'murk';
export type DecoId = 'hat' | 'scarf' | 'glasses' | 'crown' | 'cape' | 'badge';

export interface GameState {
  friend: FriendId | null; nickname: string; xp: number; coins: number;
  decorations: DecoId[]; equipped: DecoId | null;
  chapterStars: Record<string, number>; chapterClears: Record<string, number>;
  dex: Partial<Record<EnemyId, { met: number; defeated: number }>>;
  rounds: number; recentSessions: string[][]; selection: number[]; lastPlayDate: string | null;
  /** 과일 몬스터 포획 기록 */
  captured: Record<string, { at: string; count: number }>;
  fruitMet: Record<string, number>;
}
export const DEFAULT_GAME: GameState = {
  friend: null, nickname: '', xp: 0, coins: 0, decorations: [], equipped: null,
  chapterStars: {}, chapterClears: {}, dex: {}, rounds: 0, recentSessions: [], selection: [1], lastPlayDate: null,
  captured: {}, fruitMet: {},
};

export interface ExamRecord {
  id: string; startedAt: string; finishedAt: string | null; status: 'done' | 'aborted';
  chapters: number[]; dirMode: 'mix' | 'en' | 'ko'; total: number; correct: number;
  items: { id: string; dir: Dir; answer: string; result: 'strict' | 'relaxed' | 'wrong' }[];
}
