import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../store';
import { transient, type RoundSummary } from '../session';
import { ITEM_BY_ID, ITEMS, mainAnswer, promptText } from '../core/data';
import { planSession, insertRetry, type QueueEntry } from '../core/scheduler';
import { gradeItem, findSiblingMatch, siblings, diffChars, baseNorm } from '../core/grading';
import { applyAnswer } from '../core/srs';
import { localDate } from '../core/dates';
import { pkey, type AnswerResult, type Dir, type GameState } from '../core/types';
import { REGIONS, starsFor, rewardFor, levelOf } from '../core/game';
import { KINGDOMS, questionsForKingdoms } from '../core/kingdoms';
import { TH_NORMAL, TH_RETRY, milestoneTier, nextMilestone, pickTarget, bumpDaily, addCaptureTo, CAPTURE_BONUS, pendingKeys } from '../core/streak';
import type { MTier } from '../core/monsters';
import { Friend, Backdrop, type Mood } from '../art/Characters';
import { MonsterArt, monInfo } from '../art/MonsterArt';
import { AnswerInput, Btn, Diff, DIR_ICON, DIR_LABEL, KEYBOARD_TIP, nav, Modal } from '../ui';
import { CaptureEvent } from './Result';
import { play } from '../sound';
import { speakWord, stopSpeaking, speechSupported } from '../speech';
import { gradeListen, applyListen, listenPending, planListen } from '../core/listen';

interface Feedback {
  result: AnswerResult; input: string; answer: string; overcame: boolean; stageUp: boolean;
  sibling: { chapter: number; number: number; english: string } | null; retry: 'soon' | 'next' | null; streak: number;
  capture: { id: string; first: boolean } | null;
}
const TIER_KO: Record<MTier, string> = { common: '일반', rare: '희귀', legend: '레전드' };

export default function Battle() {
  const app = useApp();
  const cfg = transient.round;
  const today = localDate();
  const retryMode = cfg?.mode === 'retry';
  const listenMode = cfg?.mode === 'listen' || cfg?.mode === 'listenWrong';
  const th = retryMode ? TH_RETRY : TH_NORMAL;
  const kingdoms = cfg?.kingdoms?.length ? cfg.kingdoms : null;
  const scope = useMemo(() => (cfg ? (retryMode ? ITEMS : ITEMS.filter((i) => cfg.chapters.includes(i.chapter))) : []), [cfg]);
  const [queue, setQueue] = useState<QueueEntry[]>(() => {
    if (!cfg) return [];
    if (listenMode) {
      // 듣고 쓰기: 무작위 순서, 소리로만 출제
      const ids = cfg.mode === 'listen' ? planListen(scope, questionsForKingdoms(cfg.kingdoms?.length ?? 1)) : planListen(scope.filter((i) => listenPending(app.game, scope).includes(i.id)), 9999);
      return ids.map((id) => ({ id, dir: 'en' as Dir, kind: 'normal' as const }));
    }
    if (retryMode) {
      // 재도전: 쌓인 오답 전체 (오래된 것부터)
      return pendingKeys(app.progress).sort((a, b) => (app.progress[a].lastAt ?? '').localeCompare(app.progress[b].lastAt ?? ''))
        .map((k) => { const [id, dir] = k.split('|') as [string, Dir]; return { id, dir, kind: 'normal' as const }; })
        .filter((q) => ITEM_BY_ID[q.id]);
    }
    const n = cfg.mode === 'explore' ? questionsForKingdoms(cfg.kingdoms?.length ?? 1) : app.settings.questionsPerRound;
    return planSession({ items: scope, dirs: cfg.dirs, n, progress: app.progress, today, mode: cfg.mode === 'wrong' ? 'wrong' : 'explore', recentSessions: app.game.recentSessions })
      .map((u) => ({ id: u.id, dir: u.dir, kind: 'normal' as const }));
  });
  const [idx, setIdx] = useState(0);
  const [hint, setHint] = useState<0 | 1 | 2>(0);
  const [fb, setFb] = useState<Feedback | null>(null);
  const [streak, setStreak] = useState(0);
  const [fx, setFx] = useState<string>('');
  const [practice, setPractice] = useState<null | 'open' | 'done' | 'again'>(null);
  const [quit, setQuit] = useState(false);
  const [capShow, setCapShow] = useState<{ id: string; first: boolean } | null>(null);
  const [speak, setSpeak] = useState<'idle' | 'speaking' | 'gap'>('idle');
  const [heard, setHeard] = useState(0);
  const [homo, setHomo] = useState<string | null>(null);
  const [caseNote, setCaseNote] = useState(false);
  const counts = useRef({ strict: 0, relaxed: 0, aided: 0, wrong: 0, overcame: [] as string[], served: [] as string[], captures: [] as { id: string; first: boolean }[], best: 0 });
  const retried = useRef(new Set<string>());
  const busy = useRef(false);
  const fbAt = useRef(0);
  // 다음 포획 대상 (등급별로 미리 정해 두고, 잡으면 새로 정함)
  const [targets, setTargets] = useState<Record<MTier, string>>(() => ({
    common: pickTarget('common', kingdoms, app.game.captured), rare: pickTarget('rare', kingdoms, app.game.captured), legend: pickTarget('legend', kingdoms, app.game.captured),
  }));
  const total = queue.length;

  useEffect(() => { if (!cfg) nav(''); }, [cfg]);
  useEffect(() => () => stopSpeaking(), [idx]);
  if (!cfg) return null;
  if (total === 0) {
    return (
      <main className="screen center-screen">
        <p>{cfg.mode === 'explore' || cfg.mode === 'listen' ? '출제할 단어가 없어요.' : '남은 오답이 없어요! 🎉'}</p>
        <Btn kind="gold" onClick={() => nav('map')}>왕국 지도로 가기</Btn>
      </main>
    );
  }

  const cur = queue[idx];
  const item = ITEM_BY_ID[cur.id];
  const dir: Dir = cur.dir;
  const answer = mainAnswer(item, dir, app.overrides);
  const sibs = siblings(item, dir, scope);
  const R = REGIONS[(item.chapter ?? 1) - 1] ?? REGIONS[0];
  const fxOn = !app.settings.skipEffects;
  const next = nextMilestone(streak, th);
  const targetId = targets[next.tier];
  const target = monInfo(targetId);
  const toGo = next.at - streak;
  let lastAt = Math.floor(streak / th.legend) * th.legend;
  for (let x = streak; x > lastAt; x--) if (milestoneTier(x, th)) { lastAt = x; break; }
  const gaugePct = Math.max(0, Math.min(100, ((streak - lastAt) / (next.at - lastAt)) * 100));

  async function submit(raw: string) {
    if (busy.current || fb) return;
    if (baseNorm(raw) === '') return;
    busy.current = true;
    const g = gradeItem(raw, item, dir, app.overrides, app.settings);
    const result: AnswerResult = g.kind === 'wrong' ? 'wrong' : hint > 0 ? 'aided' : g.kind;
    const key = pkey(item.id, dir);
    const out = applyAnswer(app.progress[key], result, { today, now: new Date().toISOString(), hintUsed: hint === 1, answerViewed: hint === 2 });
    out.rec.served++; out.rec.lastServedAt = new Date().toISOString();
    counts.current.served.push(key);
    let sibling: Feedback['sibling'] = null;
    if (result === 'wrong') {
      const s = findSiblingMatch(raw, item, dir, scope, app.overrides, app.settings) ?? findSiblingMatch(raw, item, dir, ITEMS, app.overrides, app.settings);
      if (s) sibling = { chapter: s.chapter, number: s.number, english: s.englishDisplay };
    }
    let retry: Feedback['retry'] = null;
    if (!retryMode && (result === 'wrong' || hint === 2)) {
      const r = insertRetry(queue, idx, { id: item.id, dir }, retried.current);
      if (r.inserted) { setQueue(r.queue); retry = 'soon'; } else retry = 'next';
    }
    // 연속 정답: 혼자서 맞힌 답만 +1, 도움 받은 답은 그대로, 오답은 0
    const newStreak = result === 'wrong' ? 0 : result === 'aided' ? streak : streak + 1;
    if (result === 'strict') counts.current.strict++; else if (result === 'relaxed') counts.current.relaxed++; else if (result === 'aided') counts.current.aided++; else counts.current.wrong++;
    if (out.overcame) counts.current.overcame.push(key);
    counts.current.best = Math.max(counts.current.best, newStreak);
    let game: GameState = { ...app.game, daily: bumpDaily(app.game.daily, today, { solved: 1, streak: newStreak, overcame: out.overcame ? 1 : 0 }) };
    let capture: Feedback['capture'] = null;
    const tier = newStreak !== streak ? milestoneTier(newStreak, th) : null;
    if (tier) {
      const id = targets[tier];
      const c = addCaptureTo(game, id, CAPTURE_BONUS[tier]);
      game = c.game; capture = { id, first: c.first };
      counts.current.captures.push(capture);
      setTargets((t) => ({ ...t, [tier]: pickTarget(tier, kingdoms, game.captured, Math.random, [id]) }));
    }
    setStreak(newStreak);
    fbAt.current = Date.now();
    setFb({ result, input: raw, answer, overcame: out.overcame, stageUp: out.stageUp, sibling, retry, streak: newStreak, capture });
    const ok = result !== 'wrong';
    setFx(ok ? (capture ? 'overcome' : out.overcame ? 'overcome' : newStreak >= 3 ? 'combo' : 'hit') : 'miss');
    play(ok ? (capture || out.overcame ? 'overcome' : newStreak >= 3 ? 'combo' : 'correct') : 'wrong');
    if (fxOn) setTimeout(() => setFx(''), 900);
    await app.commit({ [key]: out.rec }, { game });
    busy.current = false;
  }

  function listenNow(times = 2) {
    play('tap');
    const ok = speakWord(answer, { times, onState: (s) => setSpeak(s === 'done' ? 'idle' : s) });
    if (ok) setHeard((h) => h + 1);
  }

  async function submitListen(raw: string) {
    if (busy.current || fb) return;
    if (baseNorm(raw) === '') return;
    busy.current = true;
    const g = gradeListen(raw, item, app.overrides);
    if (g.kind === 'homophone') { setHomo(g.homophone!); play('tap'); busy.current = false; return; }
    stopSpeaking(); setSpeak('idle');
    const ok = g.kind !== 'wrong';
    const result: AnswerResult = ok ? 'strict' : 'wrong';
    const now = new Date().toISOString();
    const before = app.game.listen?.[item.id];
    const overcame = ok && !!before?.pending;
    const key = pkey(item.id, 'en');
    counts.current.served.push(key);
    let retry: Feedback['retry'] = null;
    if (!ok) {
      const r = insertRetry(queue, idx, { id: item.id, dir }, retried.current);
      if (r.inserted) { setQueue(r.queue); retry = 'soon'; } else retry = 'next';
    }
    const newStreak = ok ? streak + 1 : 0;
    if (ok) counts.current.strict++; else counts.current.wrong++;
    if (overcame) counts.current.overcame.push(key);
    counts.current.best = Math.max(counts.current.best, newStreak);
    let game: GameState = { ...app.game, listen: { ...(app.game.listen ?? {}), [item.id]: applyListen(before, ok, now) },
      daily: bumpDaily(app.game.daily, today, { solved: 1, streak: newStreak, overcame: overcame ? 1 : 0 }) };
    let capture: Feedback['capture'] = null;
    const tier = newStreak !== streak ? milestoneTier(newStreak, th) : null;
    if (tier) {
      const id = targets[tier];
      const c = addCaptureTo(game, id, CAPTURE_BONUS[tier]);
      game = c.game; capture = { id, first: c.first };
      counts.current.captures.push(capture);
      setTargets((t) => ({ ...t, [tier]: pickTarget(tier, kingdoms, game.captured, Math.random, [id]) }));
    }
    setStreak(newStreak); setHomo(null); setCaseNote(g.kind === 'case');
    fbAt.current = Date.now();
    setFb({ result, input: raw, answer: g.answer, overcame, stageUp: false, sibling: null, retry, streak: newStreak, capture });
    setFx(ok ? (capture || overcame ? 'overcome' : newStreak >= 3 ? 'combo' : 'hit') : 'miss');
    play(ok ? (capture || overcame ? 'overcome' : newStreak >= 3 ? 'combo' : 'correct') : 'wrong');
    if (fxOn) setTimeout(() => setFx(''), 900);
    await app.commit({}, { game });
    busy.current = false;
  }

  async function practiceSubmit(raw: string) {
    if (listenMode) { setPractice(baseNorm(raw) === baseNorm(fb?.answer ?? '') ? 'done' : 'again'); return; }
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
    const chapterStars = { ...g.chapterStars }, chapterClears = { ...g.chapterClears };
    if (cfg!.mode === 'explore') cfg!.chapters.forEach((ch) => { chapterStars[ch] = Math.max(chapterStars[ch] ?? 0, stars); chapterClears[ch] = (chapterClears[ch] ?? 0) + 1; });
    const game = { ...g, xp: g.xp + rw.xp, coins: g.coins + rw.coins, chapterStars, chapterClears, rounds: g.rounds + 1,
      recentSessions: [...g.recentSessions, c.served.slice(-60)].slice(-5), lastPlayDate: today };
    const carried: { id: string; dir: Dir }[] = [];
    if (listenMode) queue.forEach((q) => { if (app.game.listen?.[q.id]?.pending && !carried.some((x) => x.id === q.id)) carried.push({ id: q.id, dir: 'en' }); });
    else queue.forEach((q) => { const r = app.progress[pkey(q.id, q.dir)]; if (r?.pendingRetry && !carried.some((x) => x.id === q.id && x.dir === q.dir)) carried.push({ id: q.id, dir: q.dir }); });
    const saved = await app.commit({}, { game });
    const summary: RoundSummary = { chapters: cfg!.chapters, mode: cfg!.mode, total, strict: c.strict, relaxed: c.relaxed, aided: c.aided, wrong: c.wrong,
      overcame: c.overcame, carried, stars, xp: rw.xp, coins: rw.coins, levelUp: levelOf(game.xp) > levelOf(g.xp), captures: c.captures, bestStreak: c.best, saved };
    transient.summary = summary;
    play('win');
    nav('result');
  }

  function next_() {
    if (Date.now() - fbAt.current < 300 || !fb) return;
    const cap = fb.capture;
    setFb(null); setHint(0); setPractice(null); setHeard(0); setHomo(null); setCaseNote(false); stopSpeaking(); setSpeak('idle');
    if (cap) setCapShow(cap);
    else if (idx + 1 >= queue.length) finish(); else setIdx(idx + 1);
  }
  function afterCapture() {
    setCapShow(null);
    if (idx + 1 >= queue.length) finish(); else setIdx(idx + 1);
  }

  const friendMood: Mood = fb ? (fb.result === 'wrong' ? 'happy' : 'cheer') : 'normal';
  const enemyMood: Mood = fb && fb.result !== 'wrong' ? 'hurt' : 'normal';
  const title = cfg.mode === 'listen' ? '🎧 듣고 쓰기' : cfg.mode === 'listenWrong' ? '🎧 듣기 오답 다시 듣기' : cfg.mode === 'retry' ? '🔁 재도전 스테이지' : cfg.mode === 'wrong' ? '👾 오답 추격'
    : `🗺️ ${(cfg.kingdoms ?? []).map((k) => KINGDOMS[k - 1]?.name).join(' · ')}`;

  return (
    <main className="screen battle" style={{ ['--hue' as any]: R.hue }}>
      {capShow && <CaptureEvent id={capShow.id} first={capShow.first} onClose={afterCapture} />}
      <div className="battle-top">
        <Btn kind="ghost" onClick={() => setQuit(true)} aria-label="탐험 그만하기">✕</Btn>
        <span className="chip">{title}</span>
        <span className="chip" data-testid="progress">문제 {idx + 1} / {total}</span>
        <span className={`chip ${streak >= 5 ? 'gold combo-chip' : ''}`} data-testid="streak">🔥 연속 {streak}</span>
      </div>
      <section className={`arena fx-${fx}`}>
        <Backdrop hue={R.hue} motif={R.motif} />
        <div className="fighter friend">
          <Friend id={app.game.friend!} deco={app.game.equipped} mood={friendMood} size={120} className={fx && fxOn && fx !== 'miss' ? 'lunge' : fx === 'miss' ? 'jump' : 'bob'} />
          {app.game.partner && <div className="partner"><MonsterArt id={app.game.partner} size={74} label={false} mood={friendMood} className="bob" /></div>}
        </div>
        <div className="fighter enemy">
          <div className="hp" data-testid="target"><span>{TIER_KO[next.tier]} · {app.game.captured?.[targetId] ? target.name : '???'}</span>
            <div className="hpbar catch"><i style={{ width: `${gaugePct}%` }} /></div>
            <small>포획까지 연속 {toGo}개 더!</small></div>
          <MonsterArt id={targetId} mood={enemyMood} size={124} label={false} silhouette={false} className={fx && fx !== 'miss' && fxOn ? 'shake' : 'float'} />
        </div>
        {fx === 'combo' && <div className="burst">🔥 {streak}연속!</div>}
        {fx === 'hit' && <div className="burst small">✨ 명중!</div>}
        {fx === 'overcome' && <div className="burst gold">{fb?.capture ? '🎯 포획!' : '💪 지난번보다 강해졌어!'}</div>}
        {fx && fx !== 'miss' && <div className="sparkles" aria-hidden>{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ ['--a' as any]: `${i * 45}deg` }} />)}</div>}
      </section>
      <p className="small catch-rule">연속 정답 {th.common}번 → 일반 · {th.rare}번 → 희귀 · {th.legend}번 → 레전드 친구를 만날 수 있어요</p>

      <section className="question-card" data-testid="question" data-item={item.id} data-dir={dir}>
        <div className="q-meta">
          {listenMode ? <span className="chip dir-en">🎧 듣고 철자 쓰기</span> : <>
          <span className={`chip dir-${dir}`}>{DIR_ICON[dir]} {DIR_LABEL[dir]}</span>
          <span className="chip" data-testid="q-ref">Chapter {item.chapter} · {item.number}번</span></>}
          {cur.kind === 'retry' && <span className="chip warn">🔁 다시 도전</span>}
        </div>
        {!listenMode && <p className="prompt" lang={dir === 'en' ? 'ko' : 'en'} data-testid="prompt">{promptText(item, dir)}</p>}
        {listenMode && !fb && (
          <div className="listen-box">
            <button type="button" className={`listen-btn ${speak !== 'idle' ? 'on' : ''}`} data-testid="listen" onClick={() => listenNow(2)} aria-label="단어 듣기 (두 번 읽어 줘요)">
              <span className="listen-icon" aria-hidden>{speak === 'idle' ? '🔊' : '🔉'}</span>
              <span>{speak === 'speaking' ? '읽는 중…' : speak === 'gap' ? '잠깐… 한 번 더 읽어 줄게' : heard ? '다시 듣기' : '눌러서 듣기'}</span>
              <small>한 번 읽고 2초 뒤 한 번 더</small>
            </button>
            {!speechSupported() && <p className="tag bad">⚠️ 이 기기에서는 읽어 주기 기능을 쓸 수 없어요.</p>}
          </div>
        )}
        {!listenMode && sibs.length > 0 && (
          <p className="tag warn">⚠️ 이 범위에 같은 {dir === 'en' ? '뜻' : '영어'} 단어가 또 있어요 ({sibs.map((s) => `Chapter ${s.chapter}·${s.number}번`).join(', ')}). 이 문제는 <b>Chapter {item.chapter}의 {item.number}번</b> 단어예요.</p>
        )}
        {!fb && listenMode && (
          <>
            <p className="tip">들은 단어의 철자를 소리 내어 말하면서 영어로 써요. 숙어는 띄어쓰기까지 그대로 써요.</p>
            {homo && <p className="hint" data-testid="homophone">🔎 <b>{homo}</b>도 소리가 같지만 이 단어가 아니에요! 뜻 힌트: <b>{item.koreanAnswer}</b> — 다시 써 보세요 (틀린 걸로 치지 않아요)</p>}
            <AnswerInput key={`L${idx}-${cur.id}`} dir="en" onSubmit={submitListen} />
            <p className="small">💡 iPad 키보드 위에 추천 단어가 보이면: 설정 → 일반 → 키보드에서 ‘자동 수정’과 ‘예측’을 꺼 주세요.</p>
          </>
        )}
        {!fb && !listenMode && (
          <>
            <p className="tip">{KEYBOARD_TIP[dir]}{dir === 'ko' ? ' · 뜻이 여러 개면 교재와 같은 순서로 모두 써요 (괄호·쉼표·띄어쓰기는 안 써도 돼요)' : ''}</p>
            {hint === 1 && <p className="hint">💡 첫 글자: <b>{Array.from(answer)[0]}</b> · 모두 {Array.from(answer).length}글자</p>}
            {hint === 2 && <p className="hint">👀 정답: <b>{answer}</b> — 보고 직접 입력해 보세요 (이번엔 연습으로 기록돼요)</p>}
            <AnswerInput key={`${idx}-${cur.id}-${dir}`} dir={dir} onSubmit={submit} />
            <div className="row wrap">
              {hint < 1 && <Btn kind="ghost" onClick={() => setHint(1)}>💡 첫 글자 힌트</Btn>}
              {hint < 2 && <Btn kind="ghost" onClick={() => setHint(2)}>👀 정답 보기</Btn>}
              {hint > 0 && <span className="small">힌트를 쓰면 연속 정답 수는 늘지 않아요(끊기지도 않아요)</span>}
            </div>
          </>
        )}
        {fb && (
          <div className={`feedback ${fb.result === 'wrong' ? 'bad' : 'good'}`} role="status" data-testid="feedback" data-result={fb.result}>
            {fb.result === 'strict' && <h3>⭕ 정답! {fb.overcame ? '지난번에 틀렸던 단어를 이겨냈어!' : fb.streak >= 3 ? `${fb.streak}연속 정답!` : ''}</h3>}
            {fb.result === 'relaxed' && <h3>🟡 맞았어요 (완화 채점)<small> 교재 표기: <b>{fb.answer}</b> · 엄격 채점 숙련도에는 들어가지 않아요</small></h3>}
            {fb.result === 'aided' && <h3>🟢 맞았어요 (도움 사용)<small> 다음에는 혼자서 맞혀 보자!</small></h3>}
            {listenMode && (
              <div className="listen-answer" data-testid="listen-answer">
                <p><span className="label">들려준 단어</span> <b lang="en">{fb.answer}</b> — {item.koreanAnswer}</p>
                {caseNote && <p className="small">🔠 철자는 맞았어요! 교재에는 대문자로 시작하는 <b>{fb.answer}</b>로 써요.</p>}
                <Btn kind="ghost" onClick={() => listenNow(1)}>🔊 한 번 더 듣기</Btn>
              </div>
            )}
            {fb.capture && <p className="chip gold">🎯 {fb.streak}연속 달성! {monInfo(fb.capture.id).name}(이)가 친구가 되고 싶어 해요!</p>}
            {fb.stageUp && <p className="chip ok">🏅 숙련 단계가 올랐어요!</p>}
            {fb.result === 'wrong' && (
              <>
                <h3>❌ 아쉬워요! 친구가 응원해요: “괜찮아, 같이 다시 보자!”</h3>
                {streak === 0 && counts.current.best >= 3 && <p className="small">연속 정답이 끊겼어요. 다시 시작해 볼까?</p>}
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
            {fb.retry === 'next' && <p className="small">{listenMode ? '📌 이 단어는 ‘듣기 오답 다시 듣기’에서 또 나와요.' : '📌 이 단어는 다음 탐험에서 먼저 다시 만나요.'}</p>}
            <Btn kind="gold" autoFocus onClick={next_} data-testid="next">{fb.capture ? '친구 만나러 가기 →' : idx + 1 >= queue.length ? '결과 보기 →' : '다음 문제 →'}</Btn>
          </div>
        )}
      </section>
      {quit && (
        <Modal onClose={() => setQuit(false)}>
          <p>탐험을 그만할까요? 지금까지 푼 답과 포획한 친구는 이미 저장됐어요. (경험치·별 보상은 끝까지 해야 받아요)</p>
          <div className="row"><Btn kind="secondary" onClick={() => setQuit(false)}>계속하기</Btn><Btn kind="danger" onClick={() => nav('')}>그만하기</Btn></div>
        </Modal>
      )}
    </main>
  );
}
