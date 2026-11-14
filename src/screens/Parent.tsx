import { useMemo, useState } from 'react';
import { useApp } from '../store';
import { ITEMS, ITEM_BY_ID, CHAPTERS, WORD_DATA, baseAnswer, mainAnswer, acceptedAnswers } from '../core/data';
import { localDate } from '../core/dates';
import { pkey, STAGE_LABEL, type Dir, type Settings } from '../core/types';
import { makeBackup, checkBackup, type BackupCheck } from '../core/backup';
import { Btn, TopBar, chapterStats, DIR_LABEL, Modal, StageChip } from '../ui';
import { REGIONS } from '../core/game';

declare const __BUILD_TAG__: string;
export const APP_VERSION = '1.2.0';

type Tab = 'stats' | 'wrong' | 'words' | 'grading' | 'backup' | 'reset' | 'exams';

function Gate({ onPass }: { onPass: () => void }) {
  const [q] = useState(() => { const a = 6 + Math.floor(Math.random() * 7), b = 6 + Math.floor(Math.random() * 7); return { a, b }; });
  const [v, setV] = useState('');
  return (
    <main className="screen center-screen">
      <TopBar title="🔒 부모 메뉴" />
      <p>어른 확인: <b>{q.a} × {q.b}</b> = ?</p>
      <form className="answer-form" onSubmit={(e) => { e.preventDefault(); if (Number(v) === q.a * q.b) onPass(); }}>
        <input className="answer-input" inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} data-testid="gate" autoFocus />
        <button className="btn btn-primary submit" type="submit" data-testid="gate-ok">확인</button>
      </form>
    </main>
  );
}

export default function Parent() {
  const [pass, setPass] = useState(false);
  const [tab, setTab] = useState<Tab>('stats');
  if (!pass) return <Gate onPass={() => setPass(true)} />;
  const tabs: [Tab, string][] = [['stats', '📊 성취도'], ['wrong', '❗ 자주 틀림'], ['words', '📘 단어·정답'], ['grading', '⚙️ 채점·설정'], ['backup', '💾 백업·복원'], ['exams', '📝 시험 기록'], ['reset', '🗑 초기화']];
  return (
    <main className="screen parent">
      <TopBar title="부모 메뉴" />
      <div className="chapter-tabs">{tabs.map(([t, l]) => <button key={t} className={`tab wide ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)} data-testid={`ptab-${t}`}>{l}</button>)}</div>
      {tab === 'stats' && <Stats />}
      {tab === 'wrong' && <Frequent />}
      {tab === 'words' && <Words />}
      {tab === 'grading' && <Grading />}
      {tab === 'backup' && <Backup />}
      {tab === 'exams' && <Exams />}
      {tab === 'reset' && <Reset />}
    </main>
  );
}

function Stats() {
  const app = useApp(); const today = localDate();
  return (
    <section className="panel">
      <p className="small">⭐ 탐험 별은 게임 기록이고, 숙련은 다른 날 도움 없이 엄격 채점으로 1·3·7일 복습을 통과한 단어예요. 양방향 숙련 = 영어 쓰기와 뜻 쓰기 모두 숙련.</p>
      <div className="table-wrap"><table className="table">
        <thead><tr><th>Chapter</th><th>만남</th><th>영어쓰기 숙련</th><th>뜻쓰기 숙련</th><th>양방향</th><th>남은 오답</th><th>오늘 복습</th><th>탐험 별</th></tr></thead>
        <tbody>{CHAPTERS.map((c) => { const s = chapterStats(c, app.progress, today); return (
          <tr key={c}><td>{c} {REGIONS[c - 1].name}</td><td>{s.met}/20</td><td>{s.enM}</td><td>{s.koM}</td><td>{s.both}</td><td>{s.pending}</td><td>{s.due}</td><td>{app.game.chapterStars[c] ?? 0}</td></tr>); })}</tbody>
      </table></div>
    </section>
  );
}

function Frequent() {
  const app = useApp();
  const rows = Object.entries(app.progress).filter(([, r]) => r.wrong > 0).sort((a, b) => b[1].wrong - a[1].wrong || (b[1].lastAt ?? '').localeCompare(a[1].lastAt ?? '')).slice(0, 40);
  if (!rows.length) return <section className="panel"><p>아직 틀린 기록이 없어요.</p></section>;
  return (
    <section className="panel"><div className="table-wrap"><table className="table">
      <thead><tr><th>항목</th><th>방향</th><th>틀림</th><th>시도</th><th>혼자 정답</th><th>힌트 사용</th><th>단계</th><th>다음 복습</th><th>최근</th></tr></thead>
      <tbody>{rows.map(([k, r]) => { const [id, d] = k.split('|') as [string, Dir]; const it = ITEM_BY_ID[id]; return (
        <tr key={k}><td>{it.chapter}·{it.number} {it.englishDisplay}<br /><small>{it.koreanAnswer}</small></td><td>{DIR_LABEL[d]}</td><td>{r.wrong}</td><td>{r.attempts}</td><td>{r.unaidedCorrect}</td><td>{r.helpCount}</td><td>{STAGE_LABEL[r.stage]}{r.pendingRetry ? ' · 오답 남음' : ''}</td><td>{r.due ?? '-'}</td><td>{r.lastAt ? new Date(r.lastAt).toLocaleString('ko-KR') : '-'}<br /><small>{r.lastResult}</small></td></tr>); })}</tbody>
    </table></div></section>
  );
}

function Words() {
  const app = useApp();
  const [ch, setCh] = useState(1);
  const [edit, setEdit] = useState<{ id: string; dir: Dir } | null>(null);
  return (
    <section className="panel">
      <p className="small">교재 원문(C·D·E열)은 바뀌지 않아요. 수정·대체 정답은 따로 저장되고, 백업에 함께 들어가요.</p>
      <div className="chapter-tabs">{CHAPTERS.map((c) => <button key={c} className={`tab ${c === ch ? 'on' : ''}`} onClick={() => setCh(c)}>{c}</button>)}</div>
      <div className="table-wrap"><table className="table">
        <thead><tr><th>번호</th><th>C 영어(교재)</th><th>D 뜻</th><th>E 철자 정답</th><th>F·G</th><th>기록</th><th>수정</th></tr></thead>
        <tbody>{ITEMS.filter((i) => i.chapter === ch).map((it) => { const ov = app.overrides[it.id]; return (
          <tr key={it.id}>
            <td>{it.number}</td><td>{it.englishDisplay}</td>
            <td>{it.koreanAnswer}{ov?.ko && <div className="tag warn">수정: {acceptedAnswers(it, 'ko', app.overrides).join(' / ')}</div>}</td>
            <td>{it.englishAnswer}{ov?.en && <div className="tag warn">수정: {acceptedAnswers(it, 'en', app.overrides).join(' / ')}</div>}</td>
            <td className="small">{[it.sourceCheck, it.note].filter(Boolean).join(' · ') || '-'}</td>
            <td><StageChip r={app.progress[pkey(it.id, 'en')]} label="영" /><StageChip r={app.progress[pkey(it.id, 'ko')]} label="뜻" /></td>
            <td><Btn kind="ghost" onClick={() => setEdit({ id: it.id, dir: 'en' })}>영어</Btn><Btn kind="ghost" onClick={() => setEdit({ id: it.id, dir: 'ko' })}>뜻</Btn></td>
          </tr>); })}</tbody>
      </table></div>
      {edit && <EditAnswer {...edit} onClose={() => setEdit(null)} />}
    </section>
  );
}

function EditAnswer({ id, dir, onClose }: { id: string; dir: Dir; onClose: () => void }) {
  const app = useApp(); const it = ITEM_BY_ID[id];
  const o = app.overrides[id]?.[dir];
  const [main, setMain] = useState(o?.replace ?? '');
  const [alts, setAlts] = useState((o?.alternates ?? []).join('\n'));
  const [ask, setAsk] = useState<null | 'save' | 'clear'>(null);
  const doSave = async (reset: boolean, clear: boolean) => {
    const alternates = alts.split('\n').map((s) => s.trim()).filter(Boolean);
    const next = clear || (!main.trim() && !alternates.length) ? null : { replace: main.trim() || undefined, alternates, updatedAt: new Date().toISOString() };
    await app.setOverride(id, dir, next, reset); onClose();
  };
  return (
    <Modal onClose={onClose}>
      <h3>Chapter {it.chapter}·{it.number}번 {it.englishDisplay} — {DIR_LABEL[dir]}</h3>
      <p>교재 정답: <b>{baseAnswer(it, dir)}</b> · 지금 대표 정답: <b>{mainAnswer(it, dir, app.overrides)}</b></p>
      <label className="field">대표 정답 바꾸기 (비우면 교재 정답 사용)<input value={main} onChange={(e) => setMain(e.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck={false} /></label>
      <label className="field">추가로 인정할 정답 (한 줄에 하나, 쉼표가 들어간 뜻도 한 줄에 그대로)<textarea rows={3} value={alts} onChange={(e) => setAlts(e.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck={false} /></label>
      {!ask && <div className="row wrap"><Btn kind="gold" onClick={() => setAsk('save')}>저장</Btn>{o && <Btn kind="danger" onClick={() => setAsk('clear')}>수정 취소(교재 정답으로)</Btn>}<Btn kind="ghost" onClick={onClose}>닫기</Btn></div>}
      {ask && (
        <div className="panel">
          <p>이 항목({DIR_LABEL[dir]})의 지금까지 숙련도를 어떻게 할까요?</p>
          <div className="row wrap"><Btn kind="secondary" onClick={() => doSave(false, ask === 'clear')}>숙련도 유지</Btn><Btn kind="danger" onClick={() => doSave(true, ask === 'clear')}>이 항목 숙련도 초기화</Btn></div>
        </div>
      )}
    </Modal>
  );
}

function Grading() {
  const app = useApp(); const s = app.settings;
  const set = (p: Partial<Settings>) => app.commit({}, { settings: { ...s, ...p } });
  const Toggle = ({ k, label, desc }: { k: keyof Settings; label: string; desc: string }) => (
    <label className="toggle"><input type="checkbox" checked={!!s[k]} onChange={(e) => set({ [k]: e.target.checked } as any)} data-testid={`set-${k}`} /><span><b>{label}</b><br /><small>{desc}</small></span></label>
  );
  return (
    <section className="panel">
      <h3>채점 (기본: 모두 켜짐 = 엄격 채점)</h3>
      <p className="small">📖 뜻 쓰기(영어 → 뜻)는 항상 <b>부호(괄호·~·쉼표·따옴표·/ 등)와 띄어쓰기를 무시</b>하고 채점해요. 글자와 순서는 교재와 같아야 해요. 예) “(~한 상태로) 변하다, 되다” → “한 상태로 변하다 되다”, “한상태로변하다/되다” 모두 정답. 아래 설정은 영어 쓰기에 적용돼요.</p>
      <Toggle k="caseSensitive" label="대소문자 구분 (영어 쓰기)" desc="끄면 Europe / europe를 같은 답으로 봐요" />
      <Toggle k="spaceSensitive" label="띄어쓰기 구분 (영어 쓰기)" desc="끄면 단어 안·사이 띄어쓰기 차이를 무시해요" />
      <Toggle k="punctSensitive" label="문장부호·괄호 구분 (영어 쓰기)" desc="끄면 쉼표·괄호·하이픈·슬래시 차이를 무시해요" />
      <p className="small">완화 설정으로 맞힌 답은 ‘완화 정답’으로 따로 기록되고 숙련 단계는 올리지 않아요. 단어·뜻·순서가 다르면 완화 설정에서도 오답이에요.</p>
      <h3>게임</h3>
      <div className="row wrap"><span>한 판 문제 수</span>{([5, 8, 10] as const).map((n) => <Btn key={n} kind={s.questionsPerRound === n ? 'primary' : 'ghost'} onClick={() => set({ questionsPerRound: n })}>{n}문제</Btn>)}</div>
      <div className="row wrap"><span>문제 방향</span>{(['mix', 'en', 'ko'] as const).map((m) => <Btn key={m} kind={s.dirMode === m ? 'primary' : 'ghost'} onClick={() => set({ dirMode: m })}>{m === 'mix' ? '혼합' : DIR_LABEL[m]}</Btn>)}</div>
      <Toggle k="sound" label="효과음" desc="" />
      <Toggle k="reduceMotion" label="움직임 줄이기" desc="캐릭터 흔들림·점프를 줄여요" />
      <Toggle k="skipEffects" label="연출 건너뛰기" desc="정답·공격 연출을 생략해요" />
    </section>
  );
}

function download(name: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  const nav: any = navigator;
  if (nav.canShare?.({ files: [file] })) { nav.share({ files: [file], title: name }).catch(() => fallback()); return; }
  fallback();
  function fallback() { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }
}

function Backup() {
  const app = useApp();
  const [chk, setChk] = useState<BackupCheck | null>(null);
  const [msg, setMsg] = useState('');
  const exportIt = () => {
    const b = makeBackup({ settings: app.settings, overrides: app.overrides, progress: app.progress, game: app.game, exams: app.exams, endurance: app.endurance, enduranceHistory: app.enduranceHistory }, `${APP_VERSION} (${__BUILD_TAG__})`);
    download(`단어몬스터-백업-${localDate()}.json`, JSON.stringify(b, null, 1));
    setMsg('백업 파일을 만들었어요. iPad에서는 “파일에 저장”을 골라 보관해 주세요.');
  };
  return (
    <section className="panel">
      <h3>백업</h3>
      <p className="small">학습 기록·게임 상태·설정·정답 수정·시험 기록을 JSON 파일 하나로 저장해요. 아이 이름 같은 개인정보는 넣지 않아요(별명만 포함). 기록은 이 기기·이 앱(홈 화면 앱 또는 Safari)에만 저장되고, 웹사이트 데이터 삭제나 기기 정리로 사라질 수 있으니 가끔 백업해 주세요.</p>
      <Btn kind="gold" onClick={exportIt} data-testid="backup-export">💾 백업 파일 만들기</Btn>
      <h3>복원</h3>
      <label className="btn btn-secondary file-btn">📂 백업 파일 고르기
        <input type="file" accept="application/json,.json" data-testid="backup-file" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setChk(checkBackup(await f.text())); e.target.value = ''; }} />
      </label>
      {chk && !chk.ok && <div className="tag bad">복원할 수 없어요: {chk.errors.join(' / ')}</div>}
      {chk?.ok && (
        <Modal onClose={() => setChk(null)}>
          <h3>이 백업으로 복원할까요?</h3>
          <p>만든 시각: {chk.summary!.exportedAt ? new Date(chk.summary!.exportedAt).toLocaleString('ko-KR') : '-'}<br />학습 기록 {chk.summary!.records}개(단어 {chk.summary!.items}개) · 정답 수정 {chk.summary!.overrides}개 · 시험 {chk.summary!.exams}회 · 경험치 {chk.summary!.xp}</p>
          {chk.warnings.length > 0 && <p className="tag warn">{chk.warnings.join(' / ')}</p>}
          <p className="tag bad">지금 이 기기의 기록은 백업 내용으로 바뀌어요.</p>
          <div className="row"><Btn kind="secondary" onClick={() => setChk(null)}>취소</Btn><Btn kind="danger" data-testid="backup-confirm" onClick={async () => { const ok = await app.restore(chk.data!); setChk(null); setMsg(ok ? '복원했어요.' : '복원하지 못했어요.'); }}>복원하기</Btn></div>
        </Modal>
      )}
      {msg && <p className="chip ok" role="status">{msg}</p>}
      <p className="small">데이터 정보: {WORD_DATA.textbook} · {WORD_DATA.itemCount}단어 · 원본 {WORD_DATA.sourceFile} · 앱 {APP_VERSION} ({__BUILD_TAG__})</p>
    </section>
  );
}

function Exams() {
  const app = useApp();
  const list = useMemo(() => app.exams.slice().reverse(), [app.exams]);
  if (!list.length) return <section className="panel"><p>시험 기록이 없어요.</p></section>;
  return (
    <section className="panel"><table className="table">
      <thead><tr><th>날짜</th><th>범위</th><th>방향</th><th>결과</th></tr></thead>
      <tbody>{list.map((e) => <tr key={e.id}><td>{new Date(e.startedAt).toLocaleString('ko-KR')}</td><td>{e.chapters.join(', ')}</td><td>{e.dirMode}</td><td>{e.status === 'aborted' ? '중도 종료' : `${e.correct}/${e.total}`}</td></tr>)}</tbody>
    </table></section>
  );
}

function Reset() {
  const app = useApp();
  const [txt, setTxt] = useState('');
  const [keepGame, setKeepGame] = useState(true);
  const [done, setDone] = useState('');
  return (
    <section className="panel">
      <h3>학습 기록 초기화</h3>
      <p>모든 단어의 숙련도·오답·시험 기록을 지워요. 되돌릴 수 없으니 먼저 백업해 주세요. 교재 데이터와 정답 수정·설정은 그대로예요.</p>
      <label className="toggle"><input type="checkbox" checked={keepGame} onChange={(e) => setKeepGame(e.target.checked)} /><span>친구 몬스터·코인·장식·도감은 남기기</span></label>
      <label className="field">확인을 위해 <b>초기화</b>라고 입력하세요<input value={txt} onChange={(e) => setTxt(e.target.value)} /></label>
      <Btn kind="danger" disabled={txt.trim() !== '초기화'} onClick={async () => { const ok = await app.resetAll(keepGame); setDone(ok ? '초기화했어요.' : '초기화하지 못했어요.'); setTxt(''); }}>초기화</Btn>
      {done && <p className="chip ok">{done}</p>}
    </section>
  );
}
