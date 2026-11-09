import { useState } from 'react';
import { useApp } from '../store';
import { ITEMS, ITEM_BY_ID, CHAPTERS, mainAnswer, promptText } from '../core/data';
import { gradeItem, diffChars, siblings } from '../core/grading';
import { applyAnswer } from '../core/srs';
import { localDate } from '../core/dates';
import { pkey, type Dir, type ExamRecord, type DirRecord } from '../core/types';
import { Btn, TopBar, nav, DIR_ICON, DIR_LABEL, KEYBOARD_TIP, Modal, Diff } from '../ui';

interface Running { id: string; startedAt: string; chapters: number[]; dirMode: 'mix' | 'en' | 'ko'; qs: { id: string; dir: Dir }[]; answers: string[]; idx: number }

function shuffle<T>(a: T[]) { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }

export function buildExam(chapters: number[], dirMode: 'mix' | 'en' | 'ko', count: number): { id: string; dir: Dir }[] {
  const pool = shuffle(ITEMS.filter((i) => chapters.includes(i.chapter))).slice(0, count); // 같은 항목은 한 번만
  return shuffle(pool.map((it, k) => ({ id: it.id, dir: (dirMode === 'mix' ? (k % 2 === 0 ? 'en' : 'ko') : dirMode) as Dir })));
}

export default function Exam() {
  const app = useApp();
  const [chs, setChs] = useState<number[]>(app.game.selection);
  const [dirMode, setDirMode] = useState<'mix' | 'en' | 'ko'>('mix');
  const [count, setCount] = useState(20);
  const [run, setRun] = useState<Running | null>(app.currentExam as Running | null);
  const [confirm, setConfirm] = useState<null | 'submit' | 'quit'>(null);
  const [result, setResult] = useState<ExamRecord | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const avail = ITEMS.filter((i) => chs.includes(i.chapter)).length;

  const persist = (r: Running | null) => { setRun(r); app.commit({}, { currentExam: r }); };

  if (result) {
    const pct = Math.round((result.correct / result.total) * 100);
    return (
      <main className="screen exam" data-testid="exam-result">
        <TopBar title="실전 모드 결과" />
        <h2>{result.correct} / {result.total} 정답 ({pct}점)</h2>
        <p className="small">틀린 항목은 게임의 오답 복습(오답 몬스터 추격)에 추가됐어요.</p>
        <table className="table">
          <thead><tr><th>#</th><th>문제</th><th>내 답</th><th>교재 정답</th><th>결과</th></tr></thead>
          <tbody>
            {result.items.map((r, k) => {
              const it = ITEM_BY_ID[r.id]; const ans = mainAnswer(it, r.dir, app.overrides); const d = diffChars(r.answer, ans);
              return (
                <tr key={k} className={r.result === 'wrong' ? 'bad' : ''}>
                  <td>{k + 1}</td>
                  <td>{DIR_ICON[r.dir]} {promptText(it, r.dir)}<br /><small>Chapter {it.chapter}·{it.number}번</small></td>
                  <td>{r.answer ? (r.result === 'wrong' ? <Diff segs={d.mine} mode="mine" /> : r.answer) : <i>(빈칸)</i>}</td>
                  <td>{r.result === 'wrong' ? <Diff segs={d.answer} mode="answer" /> : ans}</td>
                  <td>{r.result === 'strict' ? '⭕' : r.result === 'relaxed' ? '🟡 완화' : '❌'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="row"><Btn kind="gold" onClick={() => setResult(null)}>다시 시험 보기</Btn><Btn kind="ghost" onClick={() => nav('')}>홈</Btn></div>
      </main>
    );
  }

  if (!run) {
    return (
      <main className="screen exam">
        <TopBar title="📝 학교 실전 모드" />
        <p className="small">게임 없이 시험지처럼 풀어요. 시험 중에는 정답·힌트를 보여주지 않고, 마지막에 제출하면 채점해요.</p>
        <section className="panel">
          <h3>1. 범위 (Chapter)</h3>
          <div className="chapter-tabs">
            {CHAPTERS.map((c) => <button key={c} className={`tab ${chs.includes(c) ? 'on' : ''}`} aria-pressed={chs.includes(c)} onClick={() => setChs((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c].sort((a, b) => a - b)))} data-testid={`exam-ch-${c}`}>{c}</button>)}
          </div>
          <div className="row"><Btn kind="ghost" onClick={() => setChs(CHAPTERS.slice())}>전체</Btn><Btn kind="ghost" onClick={() => setChs([])}>해제</Btn><span className="small">선택한 범위의 단어 {avail}개</span></div>
          <h3>2. 방향</h3>
          <div className="row wrap">
            {(['mix', 'en', 'ko'] as const).map((m) => <Btn key={m} kind={dirMode === m ? 'primary' : 'ghost'} onClick={() => setDirMode(m)}>{m === 'mix' ? '🔀 혼합' : `${DIR_ICON[m]} ${DIR_LABEL[m]}`}</Btn>)}
          </div>
          <h3>3. 문제 수</h3>
          <div className="row wrap">
            {[10, 20, 40].map((n) => <Btn key={n} kind={count === n ? 'primary' : 'ghost'} onClick={() => setCount(n)} disabled={n > avail && n !== 10} data-testid={`exam-n-${n}`}>{n}문제</Btn>)}
          </div>
          {count > avail && avail > 0 && <p className="tag warn">선택한 범위에 단어가 {avail}개라서 {avail}문제만 출제해요. (같은 단어는 한 시험에 한 번만 나와요)</p>}
        </section>
        <Btn kind="gold" disabled={!avail} data-testid="exam-start" onClick={() => persist({ id: 'ex' + Date.now(), startedAt: new Date().toISOString(), chapters: chs, dirMode, qs: buildExam(chs, dirMode, Math.min(count, avail)), answers: [], idx: 0 })}>시험 시작</Btn>
      </main>
    );
  }

  const q = run.qs[run.idx]; const it = ITEM_BY_ID[q.id];
  const scope = ITEMS.filter((i) => run.chapters.includes(i.chapter));
  const sib = siblings(it, q.dir, scope);
  const setAns = (v: string) => { const a = run.answers.slice(); a[run.idx] = v; return { ...run, answers: a }; };
  const go = (i: number, v?: string) => { const r = v !== undefined ? setAns(v) : run; persist({ ...r, idx: i }); setInputKey((k) => k + 1); };
  const unanswered = run.qs.filter((_, i) => !(run.answers[i] ?? '').trim()).length;

  async function submitAll() {
    const today = localDate(), now = new Date().toISOString();
    const prog: Record<string, DirRecord> = {};
    const items = run!.qs.map((qq, i) => {
      const ans = run!.answers[i] ?? '';
      const g = gradeItem(ans, ITEM_BY_ID[qq.id], qq.dir, app.overrides, app.settings);
      const key = pkey(qq.id, qq.dir);
      prog[key] = applyAnswer(prog[key] ?? app.progress[key], g.kind === 'wrong' ? 'wrong' : g.kind, { today, now }).rec;
      return { id: qq.id, dir: qq.dir, answer: ans, result: g.kind };
    });
    const rec: ExamRecord = { id: run!.id, startedAt: run!.startedAt, finishedAt: now, status: 'done', chapters: run!.chapters, dirMode: run!.dirMode, total: items.length, correct: items.filter((x) => x.result !== 'wrong').length, items };
    await app.commit(prog, { exams: [...app.exams, rec].slice(-50), currentExam: null });
    setRun(null); setResult(rec); setConfirm(null);
  }
  async function quit() {
    const rec: ExamRecord = { id: run!.id, startedAt: run!.startedAt, finishedAt: null, status: 'aborted', chapters: run!.chapters, dirMode: run!.dirMode, total: run!.qs.length, correct: 0, items: [] };
    await app.commit({}, { exams: [...app.exams, rec].slice(-50), currentExam: null });
    setRun(null); setConfirm(null); nav('');
  }
  const readInput = () => (document.querySelector('[data-testid="exam-answer"]') as HTMLInputElement | null)?.value ?? '';

  return (
    <main className="screen exam" data-testid="exam-run">
      <div className="battle-top">
        <Btn kind="ghost" onClick={() => setConfirm('quit')}>✕ 그만하기</Btn>
        <span className="chip">문제 {run.idx + 1} / {run.qs.length}</span>
        <span className="chip">빈칸 {unanswered}</span>
      </div>
      <section className="question-card">
        <div className="q-meta"><span className={`chip dir-${q.dir}`}>{DIR_ICON[q.dir]} {DIR_LABEL[q.dir]}</span><span className="chip">Chapter {it.chapter} · {it.number}번</span></div>
        <p className="prompt">{promptText(it, q.dir)}</p>
        {sib.length > 0 && <p className="tag warn">⚠️ 같은 {q.dir === 'en' ? '뜻' : '영어'} 단어가 범위에 또 있어요. 이 문제는 Chapter {it.chapter}의 {it.number}번 단어예요.</p>}
        <p className="tip">{KEYBOARD_TIP[q.dir]}</p>
        <form className="answer-form" onSubmit={(e) => { e.preventDefault(); const v = readInput(); if (run.idx + 1 < run.qs.length) go(run.idx + 1, v); else { persist(setAns(v)); setConfirm('submit'); } }}>
          <input key={inputKey + '-' + run.idx} data-testid="exam-answer" className="answer-input" defaultValue={run.answers[run.idx] ?? ''} lang={q.dir === 'en' ? 'en' : 'ko'}
            autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false} autoFocus enterKeyHint="next"
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault(); }}
            onBlur={(e) => { if ((run.answers[run.idx] ?? '') !== e.currentTarget.value) persist(setAns(e.currentTarget.value)); }} />
          <button type="submit" className="btn btn-primary submit">{run.idx + 1 < run.qs.length ? '다음 →' : '저장'}</button>
        </form>
        <div className="row">
          <Btn kind="secondary" disabled={run.idx === 0} onClick={() => go(run.idx - 1, readInput())}>← 이전</Btn>
          <Btn kind="secondary" disabled={run.idx + 1 >= run.qs.length} onClick={() => go(run.idx + 1, readInput())}>다음 →</Btn>
        </div>
      </section>
      <div className="jump-grid" aria-label="문제 바로가기">
        {run.qs.map((_, i) => <button key={i} className={`tab ${i === run.idx ? 'on' : ''} ${(run.answers[i] ?? '').trim() ? 'done' : ''}`} onClick={() => go(i, readInput())}>{i + 1}</button>)}
      </div>
      <Btn kind="gold" data-testid="exam-submit" onClick={() => { persist(setAns(readInput())); setConfirm('submit'); }}>📮 최종 제출하고 채점</Btn>
      {confirm === 'submit' && (
        <Modal onClose={() => setConfirm(null)}>
          <p>제출할까요? {unanswered > 0 ? `아직 빈칸이 ${unanswered}개 있어요 (빈칸은 오답이에요).` : '모든 문제에 답했어요.'}</p>
          <div className="row"><Btn kind="secondary" onClick={() => setConfirm(null)}>돌아가기</Btn><Btn kind="gold" data-testid="exam-confirm" onClick={submitAll}>제출</Btn></div>
        </Modal>
      )}
      {confirm === 'quit' && (
        <Modal onClose={() => setConfirm(null)}>
          <p>시험을 중간에 끝낼까요? 채점하지 않고 ‘중도 종료’로 기록돼요.</p>
          <div className="row"><Btn kind="secondary" onClick={() => setConfirm(null)}>계속 풀기</Btn><Btn kind="danger" onClick={quit}>중도 종료</Btn></div>
        </Modal>
      )}
    </main>
  );
}
