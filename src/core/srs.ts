import type { AnswerResult, DirRecord, Stage, ProgressMap, Dir } from './types';
import { pkey } from './types';
import { addDays } from './dates';

/**
 * 숙련 단계 규칙 (방향별로 따로 계산)
 *  0 처음 만남 → 1 연습 중 → 2 "1일 뒤 복습" → 3 "3일 뒤 복습" → 4 "7일 뒤 복습" → 5 숙련
 *  - 단계는 "도움 없이 + 엄격 채점 정답"일 때만 오릅니다.
 *  - 단계 2 이상은 복습 예정일(due) 당일 또는 그 이후에 맞혀야 오릅니다.
 *  - 같은 날짜에 같은 방향은 한 번만 오릅니다. 그날 틀린 적이 있으면 그날은 오르지 않습니다.
 *  - 틀리면 1(연습 중)로 내려가고 다음 날(due = 내일)부터 다시 복습합니다.
 *  - 숙련(5) 뒤에도 30일 간격의 장기 복습에 다시 나옵니다.
 */
export const NEXT_INTERVAL: Record<number, number> = { 2: 1, 3: 3, 4: 7, 5: 30 };

export const emptyRecord = (): DirRecord => ({
  attempts: 0, unaidedCorrect: 0, relaxedCorrect: 0, aidedCorrect: 0, wrong: 0, practiced: 0, helpCount: 0,
  lastResult: null, lastAt: null, lastHelpUsed: false, stage: 0, due: null, lastStageUpDate: null, lastWrongDate: null,
  pendingRetry: false, served: 0, lastServedAt: null,
});

export interface ApplyOpts { today: string; now: string; answerViewed?: boolean; hintUsed?: boolean }
export interface ApplyOutcome { rec: DirRecord; stageUp: boolean; overcame: boolean }

export function applyAnswer(prev: DirRecord | undefined, result: AnswerResult, o: ApplyOpts): ApplyOutcome {
  const r: DirRecord = { ...(prev ?? emptyRecord()) };
  let stageUp = false, overcame = false;
  const help = !!(o.answerViewed || o.hintUsed);
  if (result === 'practice') { r.practiced++; return { rec: r, stageUp, overcame }; }
  r.attempts++;
  r.lastResult = result; r.lastAt = o.now; r.lastHelpUsed = help;
  if (help) r.helpCount++;
  switch (result) {
    case 'strict': {
      r.unaidedCorrect++;
      overcame = r.pendingRetry; // 예전에 틀렸던 것을 도움 없이 극복
      r.pendingRetry = false;
      const canUp = r.lastStageUpDate !== o.today && r.lastWrongDate !== o.today;
      if (r.stage <= 1) {
        if (canUp) { r.stage = 2; r.due = addDays(o.today, NEXT_INTERVAL[2]); stageUp = true; }
        else { r.stage = 1; if (!r.due) r.due = addDays(o.today, 1); }
      } else if (canUp && r.due !== null && r.due <= o.today) {
        const ns = Math.min(r.stage + 1, 5) as Stage;
        r.stage = ns; r.due = addDays(o.today, NEXT_INTERVAL[ns]); stageUp = true;
      }
      if (stageUp) r.lastStageUpDate = o.today;
      break;
    }
    case 'relaxed': r.relaxedCorrect++; if (r.stage === 0) r.stage = 1; break;
    case 'aided':
      r.aidedCorrect++; if (r.stage === 0) r.stage = 1;
      if (o.answerViewed) r.pendingRetry = true; // 정답을 보고 맞힌 것은 다음에 도움 없이 다시 확인
      break;
    case 'wrong':
      r.wrong++; r.stage = 1; r.due = addDays(o.today, 1); r.pendingRetry = true; r.lastWrongDate = o.today; break;
  }
  return { rec: r, stageUp, overcame };
}

export const isDue = (r: DirRecord | undefined, today: string) => !!r && r.stage >= 2 && r.due !== null && r.due <= today;
export const isMasteredDir = (r: DirRecord | undefined) => !!r && r.stage === 5;
export const isMastered = (p: ProgressMap, id: string) => isMasteredDir(p[pkey(id, 'en')]) && isMasteredDir(p[pkey(id, 'ko')]);
export const rec = (p: ProgressMap, id: string, d: Dir) => p[pkey(id, d)];
