import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../store';
import { transient, type RoundSummary } from '../session';
import { ITEM_BY_ID, ITEMS, mainAnswer, promptText } from '../core/data';
import { planSession, insertRetry, type QueueEntry } from '../core/scheduler';
import { gradeItem, findSiblingMatch, siblings, diffChars, baseNorm } from '../core/grading';
import { applyAnswer } from '../core/srs';
import { localDate } from '../core/dates';
import { pkey, type AnswerResult, type Dir } from '../core/types';
import { REGIONS, enemyForChapters, ENEMIES, starsFor, rewardFor, levelOf } from '../core/game';
import { Friend, Enemy, Backdrop, type Mood } from '../art/Characters';
import { AnswerInput, Btn, Diff, DIR_ICON, DIR_LABEL, KEYBOARD_TIP, nav, Modal } from '../ui';
import { play } from '../sound';

interface Feedback {
  result: AnswerResult; input: string; answer: string; overcame: boolean; stageUp: boolean;
  sibling: { chapter: number; number: number; english: string } | null; retry: 'soon' | 'next' | null; combo: number;
}

export default function Battle() {
  const app = useApp();
  const cfg = transient.round;
  const today = localDate();
  const scope = useMemo(() => (cfg ? ITEMS.filter((i) => cfg.chapters.includes(i.chapter)) : []), [cfg]);
  const [queue, setQueue] = useState<QueueEntry[]>(() => {
    if (!cfg) return [];
    const n = app.settings.questionsPerRound;
    return planSession({ items: scope, dirs: cfg.dirs, n, progress: app.progress, today, mode: cfg.mode, recentSessions: app.game.recentSessions })
      .map((u) => ({ id: u.id, dir: u.dir, kind: 'normal' as const }));
  });
  const [idx, setIdx] = useState(0);
  const [hint, setHint] = useState<0 | 1 | 2>(0);
  const [fb, setFb] = useState<Feedback | null>(null);
  const [combo, setCombo] = useState(0);
  const [fx, setFx] = useState<string>('');
  const [practice, setPractice] = useState<null | 'open' | 'done' | 'again'>(null);
  const [quit, setQuit] = useState(false);
  const counts = useRef({ strict: 0, relaxed: 0, aided: 0, wrong: 0, overcame: [] as string[], served: [] as string[] });
  const retried = useRef(new Set<string>());
  const busy = useRef(false);
  const fbAt = useRef(0);
  const enemyId = useMemo(() => enemyForChapters(cfg?.chapters ?? [1], app.game.rounds), []);
  const total = queue.length;
  const hits = counts.current.strict + counts.current.relaxed + counts.current.aided;

  useEffect(() => { if (!cfg) nav(''); }, [cfg]);
  if (!cfg) return null;
  if (total === 0) {
    return (
      <main className="screen center-screen">
        <p>{cfg.mode === 'wrong' ? '이 범위에는 남은 오답이 없어요! 🎉' : '출제할 단어가 없어요.'}</p>
        <Btn kind="gold" onClick={() => nav('map')}>지도로 가서 일반 탐험하기</Btn>
      </main>
    );
  }

  const cur = queue[idx];
  const item = ITEM_BY_ID[cur.id];
  const dir: Dir = cur.dir;
  const answer = mainAnswer(item, dir, app.overrides);
  const sibs = siblings(item, dir, scope);
  const R = REGIONS[(cfg.chapters[0] ?? 1) - 1];
  const fxOn = !app.settings.skipEffects;

  async function submit(raw: string) {
    if (busy.current || fb) return;
    if (baseNorm(raw) === '') return;
    busy.current = true;
    const g = gradeItem(raw, item, dir, app.overrides, app.settings);
    let result: AnswerResult = g.kind === 'wrong' ? 'wrong' : hint > 0 ? 'aided' : g.kind;
    const key = pkey(item.id, dir);
    const out = applyAnswer(app.progress[key], result, { today, now: new Date().toISOString(), hintUsed: hint === 1, answerViewed: hint === 2 });
    out.rec.served++; out.rec.lastServedAt = new Date().toISOString();
    counts.current.served.push(key);
    let sibling: Feedback['sibling'] = null;
    if (result === 'wrong') {
      const s = findSiblingMatch(raw, item, dir, scope.length ? scope : ITEMS, app.overrides, app.settings) ?? findSiblingMatch(raw, item, dir, ITEMS, app.overrides, app.settings);
      if (s) sibling = { chapter: s.chapter, number: s.number, english: s.englishDisplay };
    }
    let retry: Feedback['retry'] = null;
    if (result === 'wrong' || hint === 2) {
      const r = insertRetry(queue, idx, { id: item.id, dir }, retried.current);
      if (r.inserted) { setQueue(r.queue); retry = 'soon'; } else retry = 'next';
    }
    const ok = result !== 'wrong';
    const newCombo = ok ? combo + 1 : 0;
    if (result === 'strict') counts.current.strict++; else if (result === 'relaxed') counts.current.relaxed++; else if (result === 'aided') counts.current.aided++; else counts.current.wrong++;
    if (out.overcame) counts.current.overcame.push(key);
    setCombo(newCombo);
    fbAt.current = Date.now();
    setFb({ result, input: raw, answer, overcame: out.overcame, stageUp: out.stageUp, sibling, retry, combo: newCombo });
    setFx(ok ? (out.overcame ? 'overcome' : newCombo >= 3 ? 'combo' : 'hit') : 'miss');
    play(ok ? (out.overcame ? 'overcome' : newCombo >= 3 ? 'combo' : 'correct') : 'wrong');
    if (fxOn) setTimeout(() => setFx(''), 900);
    await app.commit({ [key]: out.rec });
    busy.current = false;
  }

  async function practiceSubmit(raw: string) {
    if (busy.current) return;
    busy.current = true;
    const g = gradeItem(raw, item, dir, app.overrides, app.settings);
    if (g.kind !== 'wrong') {
      const key = pkey(item.id, dir);
      const out = applyAnswer(app.progress[key], 'practice', { today, now: new Date().toISOString() });
      await app.commit({ [key]: out.rec });
      setPractice('done'); play('tap');
    } else setPractice('again');
    busy.current = false;
  }

  async function finish() {
    const c = counts.current;
    const correct = c.strict + c.relaxed + c.aided;
    const stars = starsFor(correct, total);
    const rw = rewardFor({ strict: c.strict, other: c.relaxed + c.aided, overcame: c.overcame.length, stars });
    const g = app.game;
    const defeated = correct >= total;
    const dex = { ...g.dex, [enemyId]: { met: (g.dex[enemyId]?.met ?? 0) + 1, defeated: (g.dex[enemyId]?.defeated ?? 0) + (defeated ? 1 : 0) } };
    const chapterStars = { ...g.chapterStars }, chapterClears = { ...g.chapterClears };
    cfg!.chapters.forEach((ch) => { if (cfg!.mode === 'explore') { chapterStars[ch] = Math.max(chapterStars[ch] ?? 0, stars); chapterClears[ch] = (chapterClears[ch] ?? 0) + 1; } });
    const game = { ...g, xp: g.xp + rw.xp, coins: g.coins + rw.coins, dex, chapterStars, chapterClears, rounds: g.rounds + 1,
      recentSessions: [...g.recentSessions, c.served].slice(-5), lastPlayDate: today };
    const carried: { id: string; dir: Dir }[] = [];
    const prog = { ...app.progress };
    queue.forEach((q) => { const r = prog[pkey(q.id, q.dir)]; if (r?.pendingRetry && !carried.some((x) => x.id === q.id && x.dir === q.dir)) carried.push({ id: q.id, dir: q.dir }); });
    const saved = await app.commit({}, { game });
    const summary: RoundSummary = { chapters: cfg!.chapters, mode: cfg!.mode, total, strict: c.strict, relaxed: c.relaxed, aided: c.aided, wrong: c.wrong,
      overcame: c.overcame, carried, stars, xp: rw.xp, coins: rw.coins, enemy: enemyId, defeated, levelUp: levelOf(game.xp) > levelOf(g.xp), newDex: !g.dex[enemyId], saved };
    transient.summary = summary;
    play('win');
    nav('result');
  }

  function next() {
    if (Date.now() - fbAt.current < 300) return; // Enter 연타로 문제를 건너뛰지 않게
    setFb(null); setHint(0); setPractice(null);
    if (idx + 1 >= queue.length) finish(); else setIdx(idx + 1);
  }

  const friendMood: Mood = fb ? (fb.result === 'wrong' ? 'happy' : 'cheer') : 'normal';
  const enemyMood: Mood = fb && fb.result !== 'wrong' ? 'hurt' : 'normal';
  const enemyName = ENEMIES.find((e) => e.id === enemyId)!.name;

  return (
    <main className="screen battle" style={{ ['--hue' as any]: R.hue }}>
      <div className="battle-top">
        <Btn kind="ghost" onClick={() => setQuit(true)} aria-label="탐험 그만하기">✕</Btn>
        <span className="chip">{cfg.mode === 'wrong' ? '👾 오답 추격' : `🗺️ ${cfg.chapters.length === 1 ? `Chapter ${cfg.chapters[0]} ${R.name}` : `${cfg.chapters.length}개 지역`}`}</span>
        <span className="chip" data-testid="progress">문제 {idx + 1} / {total}</span>
        {combo >= 2 && <span className="chip gold combo-chip">🔥 콤보 ×{combo}</span>}
      </div>
      <section className={`arena fx-${fx}`}>
        <Backdrop hue={R.hue} motif={R.motif} />
        <div className="fighter friend"><Friend id={app.game.friend!} deco={app.game.equipped} mood={friendMood} size={130} className={fx && fxOn && fx !== 'miss' ? 'lunge' : fx === 'miss' ? 'jump' : 'bob'} /></div>
        <div className="fighter enemy">
          <div className="hp" aria-label={`${enemyName} 남은 체력 ${total - hits}/${total}`}><span>{enemyName}</span><div className="hpbar"><i style={{ width: `${((total - hits) / total) * 100}%` }} /></div><small>체력 {total - hits}/{total}</small></div>
          <Enemy id={enemyId} mood={enemyMood} size={120} className={fx && fx !== 'miss' && fxOn ? 'shake' : 'float'} />
        </div>
        {fx === 'overcome' && <div className="burst gold">💪 지난번보다 강해졌어!</div>}
        {fx === 'combo' && <div className="burst">🔥 {combo}콤보!</div>}
        {fx === 'hit' && <div className="burst small">✨ 명중!</div>}
        {fx && fx !== 'miss' && <div className="sparkles" aria-hidden>{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ ['--a' as any]: `${i * 45}deg` }} />)}</div>}
      </section>

      <section className="question-card" data-testid="question" data-item={item.id} data-dir={dir}>
        <div className="q-meta">
          <span className={`chip dir-${dir}`}>{DIR_ICON[dir]} {DIR_LABEL[dir]}</span>
          <span className="chip" data-testid="q-ref">Chapter {item.chapter} · {item.number}번</span>
          {cur.kind === 'retry' && <span className="chip warn">🔁 다시 도전</span>}
        </div>
        <p className="prompt" lang={dir === 'en' ? 'ko' : 'en'} data-testid="prompt">{promptText(item, dir)}</p>
        {sibs.length > 0 && (
          <p className="tag warn">⚠️ 이 범위에 같은 {dir === 'en' ? '뜻' : '영어'} 단어가 또 있어요 ({sibs.map((s) => `Chapter ${s.chapter}·${s.number}번`).join(', ')}). 이 문제는 <b>Chapter {item.chapter}의 {item.number}번</b> 단어예요.</p>
        )}
        {!fb && (
          <>
            <p className="tip">{KEYBOARD_TIP[dir]}{dir === 'ko' ? ' · 뜻이 여러 개면 교재와 같은 순서로 쉼표까지 모두 써요' : ''}</p>
            {hint === 1 && <p className="hint">💡 첫 글자: <b>{Array.from(answer)[0]}</b> · 모두 {Array.from(answer).length}글자</p>}
            {hint === 2 && <p className="hint">👀 정답: <b>{answer}</b> — 보고 직접 입력해 보세요 (이번엔 연습으로 기록돼요)</p>}
            <AnswerInput key={`${idx}-${cur.id}-${dir}`} dir={dir} onSubmit={submit} />
            <div className="row wrap">
              {hint < 1 && <Btn kind="ghost" onClick={() => setHint(1)}>💡 첫 글자 힌트</Btn>}
              {hint < 2 && <Btn kind="ghost" onClick={() => setHint(2)}>👀 정답 보기</Btn>}
            </div>
          </>
        )}
        {fb && (
          <div className={`feedback ${fb.result === 'wrong' ? 'bad' : 'good'}`} role="status" data-testid="feedback" data-result={fb.result}>
            {fb.result === 'strict' && <h3>⭕ 정답! {fb.overcame ? '지난번에 틀렸던 단어를 이겨냈어!' : fb.combo >= 3 ? `${fb.combo}번 연속 정답!` : ''}</h3>}
            {fb.result === 'relaxed' && <h3>🟡 맞았어요 (완화 채점)<small> 교재 표기: <b>{fb.answer}</b> · 엄격 채점 숙련도에는 들어가지 않아요</small></h3>}
            {fb.result === 'aided' && <h3>🟢 맞았어요 (도움 사용)<small> 다음에는 혼자서 맞혀 보자!</small></h3>}
            {fb.stageUp && <p className="chip ok">🏅 숙련 단계가 올랐어요!</p>}
            {fb.result === 'wrong' && (
              <>
                <h3>❌ 아쉬워요! 친구가 응원해요: “괜찮아, 같이 다시 보자!”</h3>
                {fb.sibling && <p className="tag warn">🔎 같은 뜻의 다른 단어예요{dir === 'ko' ? '(같은 영어의 다른 항목 뜻)' : ''}. 이번 문제는 <b>Chapter {item.chapter}의 {item.number}번</b> 단어예요. (쓴 답은 Chapter {fb.sibling.chapter}의 {fb.sibling.number}번 {fb.sibling.english}의 답)</p>}
                <div className="compare">
                  <div><span className="label">내 답</span><Diff segs={diffChars(fb.input, fb.answer).mine} mode="mine" /></div>
                  <div><span className="label">교재 정답</span><Diff segs={diffChars(fb.input, fb.answer).answer} mode="answer" /></div>
                  <p className="small">빨간 줄 = 내가 더 쓴 글자, 초록 밑줄 = 빠진 글자 (␣는 띄어쓰기). 다른 글자 {diffChars(fb.input, fb.answer).changed}개</p>
                </div>
                {practice === null && <Btn kind="secondary" onClick={() => setPractice('open')}>✍️ 정답을 보고 한 번 연습하기</Btn>}
                {(practice === 'open' || practice === 'again') && (
                  <div className="practice">
                    <p>정답: <b>{fb.answer}</b> — 똑같이 따라 써 보세요 {practice === 'again' && <span className="tag bad">조금 달라요, 다시!</span>}</p>
                    <AnswerInput key={'p' + practice} dir={dir} onSubmit={practiceSubmit} label="연습 완료" testId="practice" />
                  </div>
                )}
                {practice === 'done' && <p className="chip ok">✍️ 연습 완료! (점수와 숙련도에는 들어가지 않아요)</p>}
              </>
            )}
            {fb.retry === 'soon' && <p className="small">🔁 이 단어는 조금 뒤에 다시 나와요.</p>}
            {fb.retry === 'next' && <p className="small">📌 이 단어는 다음 탐험에서 먼저 다시 만나요.</p>}
            <Btn kind="gold" autoFocus onClick={next} data-testid="next">{idx + 1 >= queue.length ? '결과 보기 →' : '다음 문제 →'}</Btn>
          </div>
        )}
      </section>
      {quit && (
        <Modal onClose={() => setQuit(false)}>
          <p>탐험을 그만할까요? 지금까지 푼 답은 이미 저장됐어요. (보상은 끝까지 해야 받아요)</p>
          <div className="row"><Btn kind="secondary" onClick={() => setQuit(false)}>계속하기</Btn><Btn kind="danger" onClick={() => nav('')}>그만하기</Btn></div>
        </Modal>
      )}
    </main>
  );
}
