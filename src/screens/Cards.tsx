import { useState } from 'react';
import { useApp } from '../store';
import { ITEMS, CHAPTERS, mainAnswer } from '../core/data';
import { siblings } from '../core/grading';
import { Btn, TopBar, StageChip, nav } from '../ui';
import { pkey } from '../core/types';
import { REGIONS } from '../core/game';

export default function Cards() {
  const app = useApp();
  const [ch, setCh] = useState<number>(app.game.selection[0] ?? 1);
  const [hide, setHide] = useState<'none' | 'ko' | 'en'>('none');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const items = ITEMS.filter((i) => i.chapter === ch);
  const scope = ITEMS.filter((i) => app.game.selection.includes(i.chapter) || i.chapter === ch);
  return (
    <main className="screen cards">
      <TopBar title={`학습 카드 · Chapter ${ch} ${REGIONS[ch - 1].name}`} />
      <div className="chapter-tabs" role="tablist">
        {CHAPTERS.map((c) => <button key={c} role="tab" aria-selected={c === ch} className={`tab ${c === ch ? 'on' : ''} ${app.game.selection.includes(c) ? 'sel' : ''}`} onClick={() => { setCh(c); setOpen({}); }}>{c}</button>)}
      </div>
      <div className="row wrap">
        <span className="small">스스로 시험:</span>
        <Btn kind={hide === 'none' ? 'primary' : 'ghost'} onClick={() => setHide('none')}>모두 보기</Btn>
        <Btn kind={hide === 'ko' ? 'primary' : 'ghost'} onClick={() => setHide('ko')}>뜻 가리기</Btn>
        <Btn kind={hide === 'en' ? 'primary' : 'ghost'} onClick={() => setHide('en')}>영어 가리기</Btn>
      </div>
      <div className="card-list">
        {items.map((it) => {
          const shown = open[it.id];
          const sib = siblings(it, 'en', scope);
          const en = mainAnswer(it, 'en', app.overrides), ko = mainAnswer(it, 'ko', app.overrides);
          return (
            <button key={it.id} className="word-card" onClick={() => setOpen((o) => ({ ...o, [it.id]: !o[it.id] }))}>
              <span className="num">Chapter {it.chapter} · {it.number}번</span>
              <span className="en">{hide === 'en' && !shown ? '❓ 눌러서 보기' : it.englishDisplay}</span>
              <span className="ko">{hide === 'ko' && !shown ? '❓ 눌러서 보기' : ko}</span>
              {en !== it.englishDisplay && (hide !== 'en' || shown) && <span className="type-this">✏️ 입력할 영어: <b>{en}</b></span>}
              {sib.length > 0 && <span className="tag warn">같은 뜻: {sib.map((s) => `Chapter ${s.chapter}·${s.number}번 ${s.englishDisplay}`).join(', ')}</span>}
              <span className="row wrap"><StageChip r={app.progress[pkey(it.id, 'en')]} label="영어쓰기" /><StageChip r={app.progress[pkey(it.id, 'ko')]} label="뜻쓰기" /></span>
            </button>
          );
        })}
      </div>
      <div className="action-bar"><Btn kind="gold" onClick={async () => { if (!app.game.selection.includes(ch)) await app.commit({}, { game: { ...app.game, selection: [ch] } }); nav('map'); }}>🗺️ 지도에서 탐험 시작</Btn></div>
    </main>
  );
}
