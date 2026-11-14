import { useRef, useState } from 'react';
import { useApp } from '../store';
import { ITEM_BY_ID, ITEMS, mainAnswer, promptText } from '../core/data';
import { gradeItem, diffChars, baseNorm, findSiblingMatch } from '../core/grading';
import { applyAnswer } from '../core/srs';
import { localDate } from '../core/dates';
import { pkey, type GameState } from '../core/types';
import { FRUIT_BY_ID, COLOSSEUM_LEGENDS, RARITY_LABEL } from '../core/fruits';
import {
  newRun, answer, blockResult, nextIndex, curQs, curAns, scoreOf, correctCount, monsterForIndex, nextLegend, advance, wrongOf,
  BLOCK, PASS_SCORE, MAX_STAGE, type EnduranceRun, type EnduranceHistory,
} from '../core/endurance';
import { Friend, Colosseum, type Mood } from '../art/Characters';
import { FruitMonster } from '../art/FruitMonster';
import { AnswerInput, Btn, Diff, DIR_ICON, DIR_LABEL, KEYBOARD_TIP, Modal, TopBar, nav } from '../ui';
import { CaptureEvent } from './Result';
import { play } from '../sound';

const phaseName = (stage: number) => (stage === 0 ? '본선' : `오답 스테이지 ${stage}`);

function addCapture(g: GameState, id: string): { game: GameState; first: boolean } {
  const first = !g.captured?.[id];
  const f = FRUIT_BY_ID[id];
  const bonus = first ? (f.rarity === 'legend' ? 50 : f.rarity === 'rare' ? 20 : 5) : 0;
  return { first, game: { ...g, coins: g.coins + bonus, captured: { ...(g.captured ?? {}), [id]: { at: g.captured?.[id]?.at ?? new Date().toISOString(), count: (g.captured?.[id]?.count ?? 0) + 1 } } } };
}

interface Fb { ok: boolean; result: string; input: string; answer: string; sibling: string | null; note: string[]; captureFirst: string | null }

export default function Endurance() {
  const app = useApp();
  const run = app.endurance;
  const [fb, setFb] = useState<Fb | null>(null);
  const [cap, setCap] = useState<string | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [fx, setFx] = useState('');
  const busy = useRef(false);
  const fbAt = useRef(0);
  const today = localDate();
  const legendsGot = COLOSSEUM_LEGENDS.filter((f) => app.game.captured?.[f.id]).length;

  const start = async () => { await app.commit({}, { endurance: newRun() }); setFb(null); };

  /* ───── 시작 화면 ───── */
  if (!run) {
    return (
      <main className="screen endurance">
        <TopBar title="🏟️ 끝장 퀴즈" />
        <section className="arena colosseum-hero"><Colosseum /><div className="fighter friend"><Friend id={app.game.friend!} deco={app.game.equipped} mood="cheer" size={120} className="bob" /></div><div className="fighter enemy"><FruitMonster def={COLOSSEUM_LEGENDS[0]} size={130} silhouette={!app.game.captured?.[COLOSSEUM_LEGENDS[0].id]} className="float" /></div></section>
        <section className="panel">
          <h2>500단어 전부 도전!</h2>
          <ul>
            <li>500단어가 한 번씩 나와요. 뜻→영어, 영어→뜻이 반씩 섞여 있어요. <b>힌트는 없어요.</b></li>
            <li>10문제마다 콜로세움 몬스터가 입장해요. 10문제 중 <b>8개 이상</b> 맞히면 일반 몬스터, <b>10개 모두</b> 맞히면 희귀 몬스터를 포획해요.</li>
            <li>본선 <b>{PASS_SCORE}점 이상(450개 이상 정답)</b>이면 레전드 몬스터 1마리 포획!</li>
            <li>끝나면 틀린 문제만 모아 <b>오답 스테이지 1·2·3</b>에 도전해요. 스테이지마다 레전드 보스가 기다리고, {PASS_SCORE}점 이상이면 포획해요.</li>
            <li>중간에 그만둬도 저장돼요. 며칠에 나눠서 이어 풀 수 있어요.</li>
          </ul>
          <p className="small">콜로세움 레전드 {legendsGot} / {COLOSSEUM_LEGENDS.length}</p>
          <div className="legend-row">{COLOSSEUM_LEGENDS.map((f) => <FruitMonster key={f.id} def={f} size={64} aura={false} silhouette={!app.game.captured?.[f.id]} />)}</div>
          <Btn kind="gold" onClick={start} data-testid="end-start">⚔️ 끝장 퀴즈 시작</Btn>
        </section>
        <History list={app.enduranceHistory} />
      </main>
    );
  }

  const stage = run.stage;
  const qs = curQs(run), ans = curAns(run);
  const done = correctCount(ans);
  const answered = ans.filter((x) => x !== null).length;

  /* ───── 단계 결과 / 최종 결과 ───── */
  if (run.status !== 'playing' && !fb && !cap) {
    if (run.status === 'done') {
      const remaining = run.stage === 0 ? 0 : wrongOf(run).length;
      return (
        <main className="screen endurance" data-testid="end-done">
          <TopBar title="🏟️ 끝장 퀴즈 완료" />
          <section className="panel">
            <h2>{remaining === 0 ? '🏆 완전 정복!' : '수고했어요!'}</h2>
            <p>본선 {scoreOf(run.main)}점 (정답 {correctCount(run.main)}/{run.order.length}){run.stageScores.map((s, i) => ` · 오답 스테이지 ${i + 1}: ${s}점`).join('')}</p>
            {run.awards.length > 0 && <div className="legend-row">{run.awards.map((a, i) => <div key={i} className="award"><FruitMonster def={FRUIT_BY_ID[a.fruit]} size={90} /><small>{a.phase === 'main' ? '본선' : `스테이지 ${a.phase.slice(5)}`} {a.score}점</small></div>)}</div>}
            {remaining > 0 && <p className="tag warn">아직 못 맞힌 단어 {remaining}개는 오답 몬스터 추격에서 계속 연습할 수 있어요.</p>}
            <div className="row wrap">
              <Btn kind="gold" data-testid="end-new" onClick={() => app.commit({}, { endurance: null })}>처음 화면으로</Btn>
              <Btn kind="ghost" onClick={() => nav('')}>🏠 홈</Btn>
            </div>
          </section>
        </main>
      );
    }
    // phaseDone
    const score = scoreOf(ans);
    const award = run.awards.find((a) => a.phase === (stage === 0 ? 'main' : `stage${stage}`));
    const wrong = wrongOf(run);
    const canNext = wrong.length > 0 && stage < MAX_STAGE;
    const nextBoss = canNext ? nextLegend(app.game.captured, run.awards.map((a) => a.fruit)) : null;
    const goNext = async () => {
      const r2 = advance(run, nextBoss);
      const kv: any = { endurance: r2 };
      if (r2.status === 'done') {
        const h: EnduranceHistory = { id: run.id, startedAt: run.startedAt, finishedAt: new Date().toISOString(), mainScore: scoreOf(run.main), stageScores: r2.stageScores, remainingWrong: r2.stage === 0 ? 0 : wrongOf(r2).length, awards: r2.awards.map((a) => a.fruit) };
        kv.enduranceHistory = [...app.enduranceHistory, h].slice(-30);
      }
      await app.commit({}, kv);
    };
    return (
      <main className="screen endurance" data-testid="end-phase">
        <TopBar title={`🏟️ ${phaseName(stage)} 결과`} />
        <section className="panel center">
          <h2 data-testid="end-score">{score}점</h2>
          <p>정답 {done} / {qs.length} · 틀린 문제 {wrong.length}개</p>
          {award ? (
            <div className="award big"><FruitMonster def={FRUIT_BY_ID[award.fruit]} size={180} mood="cheer" /><p>🌟 레전드 <b>{FRUIT_BY_ID[award.fruit].name}</b> 포획!</p></div>
          ) : (
            <p className="tag warn">{PASS_SCORE}점까지 {Math.round((PASS_SCORE - score) * 10) / 10}점이 모자라요. 레전드는 다음 기회에! {canNext ? '오답 스테이지에서 또 도전할 수 있어요.' : ''}</p>
          )}
          {canNext ? (
            <>
              <p>다음: <b>오답 스테이지 {stage + 1}</b> — 틀린 {wrong.length}문제를 다시 풀어요. 보스: <b>{FRUIT_BY_ID[nextBoss!].name}</b> ({PASS_SCORE}점 이상이면 포획)</p>
              <FruitMonster def={FRUIT_BY_ID[nextBoss!]} size={120} silhouette={!app.game.captured?.[nextBoss!]} />
              <Btn kind="gold" onClick={goNext} data-testid="end-next-stage">⚔️ 오답 스테이지 {stage + 1} 도전</Btn>
            </>
          ) : <Btn kind="gold" onClick={goNext} data-testid="end-finish">결과 보기</Btn>}
          <Btn kind="ghost" onClick={() => nav('')}>나중에 하기</Btn>
        </section>
      </main>
    );
  }

  /* ───── 문제 풀기 ───── */
  const i = fb ? Math.max(0, nextIndex(run) - 1) : nextIndex(run);
  const q = qs[Math.min(i, qs.length - 1)];
  const item = ITEM_BY_ID[q.id];
  const answerText = mainAnswer(item, q.dir, app.overrides);
  const enemyId = stage === 0 ? monsterForIndex(run, i) : run.stageBoss!;
  const enemy = FRUIT_BY_ID[enemyId];
  const blockStart = Math.floor(i / BLOCK) * BLOCK;
  const blockAns = stage === 0 ? run.main.slice(blockStart, blockStart + BLOCK) : [];
  const hpTotal = stage === 0 ? BLOCK : qs.length;
  const hpLeft = stage === 0 ? BLOCK - correctCount(blockAns) : qs.length - done;

  async function submit(raw: string) {
    if (busy.current || fb || !run) return;
    if (baseNorm(raw) === '') return;
    busy.current = true;
    const idx = nextIndex(run);
    const qq = curQs(run)[idx]; const it = ITEM_BY_ID[qq.id];
    const g = gradeItem(raw, it, qq.dir, app.overrides, app.settings);
    const key = pkey(it.id, qq.dir);
    const out = applyAnswer(app.progress[key], g.kind === 'wrong' ? 'wrong' : g.kind, { today, now: new Date().toISOString() });
    out.rec.served++; out.rec.lastServedAt = new Date().toISOString();
    let r2: EnduranceRun = answer(run, idx, { r: g.kind, a: raw });
    let game = app.game;
    const note: string[] = [];
    let captureFirst: string | null = null;
    if (r2.stage === 0) {
      const br = blockResult(r2, idx), tag = 'b' + Math.floor(idx / BLOCK);
      if (br.done && !r2.blockCaptures.includes(tag)) {
        r2 = { ...r2, blockCaptures: [...r2.blockCaptures, tag] };
        game = { ...game, fruitMet: { ...(game.fruitMet ?? {}), [br.monster]: (game.fruitMet?.[br.monster] ?? 0) + 1 } };
        const m = FRUIT_BY_ID[br.monster];
        if (br.capture) { const c = addCapture(game, br.monster); game = c.game; if (c.first) captureFirst = br.monster; note.push(`🎯 ${m.name} 포획! (10문제 중 ${br.correct}개 정답)${c.first ? '' : ' · 포획 횟수 +1'}`); }
        else note.push(`💨 ${m.name}를 쓰러뜨렸지만 포획은 못 했어요 (10문제 중 ${br.correct}개 · ${m.rarity === 'rare' ? '희귀는 10개 모두' : '8개 이상'} 필요)`);
      }
    }
    if (r2.status === 'phaseDone') {
      const score = scoreOf(curAns(r2));
      if (score >= PASS_SCORE) {
        const fid = r2.stage === 0 ? nextLegend(game.captured, r2.awards.map((a) => a.fruit)) : r2.stageBoss!;
        const c = addCapture(game, fid); game = c.game;
        r2 = { ...r2, awards: [...r2.awards, { phase: r2.stage === 0 ? 'main' : (`stage${r2.stage}` as any), fruit: fid, score, at: new Date().toISOString() }] };
        if (c.first && !captureFirst) captureFirst = fid; else if (c.first) note.push(`🌟 레전드 ${FRUIT_BY_ID[fid].name}도 포획!`);
      }
    }
    let sibling: string | null = null;
    if (g.kind === 'wrong') { const s = findSiblingMatch(raw, it, qq.dir, ITEMS, app.overrides, app.settings); if (s) sibling = `Chapter ${s.chapter}의 ${s.number}번 ${s.englishDisplay}`; }
    fbAt.current = Date.now();
    setFb({ ok: g.kind !== 'wrong', result: g.kind, input: raw, answer: mainAnswer(it, qq.dir, app.overrides), sibling, note, captureFirst });
    setFx(g.kind !== 'wrong' ? 'hit' : 'miss'); setTimeout(() => setFx(''), 800);
    play(g.kind !== 'wrong' ? 'correct' : 'wrong');
    await app.commit({ [key]: out.rec }, { endurance: r2, game });
    busy.current = false;
  }

  function next() {
    if (Date.now() - fbAt.current < 300 || !fb) return;
    const c = fb.captureFirst;
    setFb(null);
    if (c) setCap(c);
  }

  const friendMood: Mood = fb ? (fb.ok ? 'cheer' : 'happy') : 'normal';
  return (
    <main className={`screen battle endurance ${stage > 0 ? 'boss-stage' : ''}`}>
      {cap && <CaptureEvent id={cap} onClose={() => setCap(null)} />}
      <div className="battle-top">
        <Btn kind="ghost" onClick={() => nav('')} aria-label="나중에 이어하기">⏸ 나중에 이어하기</Btn>
        <span className="chip" data-testid="end-progress">{phaseName(stage)} {Math.min(answered + (fb ? 0 : 1), qs.length)} / {qs.length}</span>
        <span className="chip gold">정답 {done} · {answered ? scoreOf(ans.filter((x) => x !== null)) : 0}점</span>
      </div>
      <div className="xpbar end-bar" aria-label={`진행 ${answered}/${qs.length}`}><i style={{ width: `${(answered / qs.length) * 100}%` }} /></div>
      <section className={`arena fx-${fx}`}>
        <Colosseum boss={stage > 0} />
        <div className="fighter friend"><Friend id={app.game.friend!} deco={app.game.equipped} mood={friendMood} size={120} className={fx === 'hit' ? 'lunge' : 'bob'} /></div>
        <div className="fighter enemy">
          <div className="hp"><span>{stage === 0 ? `몬스터 ${Math.floor(i / BLOCK) + 1}/50 · ` : '보스 · '}{enemy.name}{enemy.rarity !== 'common' ? ` (${RARITY_LABEL[enemy.rarity]})` : ''}</span><div className="hpbar"><i style={{ width: `${(hpLeft / hpTotal) * 100}%` }} /></div><small>체력 {hpLeft}/{hpTotal}{app.game.captured?.[enemy.id] ? ' · 포획함' : ''}</small></div>
          <FruitMonster def={enemy} mood={fx === 'hit' ? 'hurt' : 'normal'} size={stage > 0 ? 150 : 130} className={fx === 'hit' ? 'shake' : 'float'} />
        </div>
        {fx === 'hit' && <div className="burst small">✨ 명중!</div>}
      </section>
      <section className="question-card" data-testid="end-question" data-item={item.id} data-dir={q.dir}>
        <div className="q-meta"><span className={`chip dir-${q.dir}`}>{DIR_ICON[q.dir]} {DIR_LABEL[q.dir]}</span><span className="chip">Chapter {item.chapter} · {item.number}번</span>{stage > 0 && <span className="chip warn">🔁 다시 도전</span>}</div>
        <p className="prompt">{promptText(item, q.dir)}</p>
        {!fb && (<><p className="tip">{KEYBOARD_TIP[q.dir]}{q.dir === 'ko' ? ' · 괄호·쉼표·띄어쓰기는 안 써도 돼요' : ''}</p><AnswerInput key={`${stage}-${i}`} dir={q.dir} onSubmit={submit} testId="end-answer" /></>)}
        {fb && (
          <div className={`feedback ${fb.ok ? 'good' : 'bad'}`} data-testid="end-feedback">
            <h3>{fb.ok ? (fb.result === 'relaxed' ? '🟡 맞았어요 (완화 채점)' : '⭕ 정답!') : '❌ 틀렸어요 — 오답 스테이지에서 다시 만나요'}</h3>
            {!fb.ok && (
              <div className="compare">
                <div><span className="label">내 답</span><Diff segs={diffChars(fb.input, fb.answer).mine} mode="mine" /></div>
                <div><span className="label">교재 정답</span><Diff segs={diffChars(fb.input, fb.answer).answer} mode="answer" /></div>
              </div>
            )}
            {fb.sibling && <p className="tag warn">🔎 같은 뜻의 다른 단어({fb.sibling})예요. 이번 문제는 Chapter {item.chapter}의 {item.number}번 단어예요.</p>}
            {fb.note.map((n, k) => <p key={k} className="chip ok">{n}</p>)}
            <Btn kind="gold" autoFocus onClick={next} data-testid="end-next">{run.status === 'phaseDone' ? '결과 보기 →' : '다음 문제 →'}</Btn>
          </div>
        )}
      </section>
      {confirmNew && <Modal onClose={() => setConfirmNew(false)}><p>지금 기록을 버리고 새로 시작할까요?</p><Btn kind="danger" onClick={() => { setConfirmNew(false); start(); }}>새로 시작</Btn></Modal>}
    </main>
  );
}

function History({ list }: { list: EnduranceHistory[] }) {
  if (!list.length) return null;
  return (
    <section className="panel">
      <h3>지난 끝장 퀴즈</h3>
      <table className="table"><thead><tr><th>날짜</th><th>본선</th><th>오답 스테이지</th><th>레전드</th></tr></thead>
        <tbody>{list.slice().reverse().map((h) => <tr key={h.id}><td>{new Date(h.finishedAt).toLocaleDateString('ko-KR')}</td><td>{h.mainScore}점</td><td>{h.stageScores.join(' → ') || '-'}</td><td>{h.awards.map((a) => FRUIT_BY_ID[a]?.name).join(', ') || '-'}</td></tr>)}</tbody>
      </table>
    </section>
  );
}
