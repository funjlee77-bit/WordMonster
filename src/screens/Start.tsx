import { useState } from 'react';
import { useApp } from '../store';
import { FRIENDS } from '../core/game';
import { Friend } from '../art/Characters';
import { Btn, nav } from '../ui';
import type { FriendId } from '../core/types';

export default function Start() {
  const app = useApp();
  const [pick, setPick] = useState<FriendId | null>(null);
  const [nick, setNick] = useState('');
  return (
    <main className="screen start">
      <div className="title-block">
        <p className="eyebrow">GRADE 5 · 500단어 · 25개 지역</p>
        <h1 className="game-title">단어 몬스터 탐험대</h1>
        <p>함께 탐험할 친구 몬스터를 골라 주세요!</p>
      </div>
      <div className="friend-pick">
        {FRIENDS.map((f) => (
          <button key={f.id} className={`pick-card ${pick === f.id ? 'on' : ''}`} onClick={() => setPick(f.id)} data-testid={`pick-${f.id}`} aria-pressed={pick === f.id}>
            <Friend id={f.id} mood={pick === f.id ? 'cheer' : 'normal'} size={140} className={pick === f.id ? 'jump' : ''} />
            <strong>{f.name}</strong><span className="muted">{f.kind}</span><span className="small">{f.desc}</span>
            {pick === f.id && <span className="chip ok">✔ 선택됨</span>}
          </button>
        ))}
      </div>
      <label className="field">탐험가 별명 (선택 · 실명 대신 별명을 써 주세요)
        <input value={nick} maxLength={12} onChange={(e) => setNick(e.target.value)} placeholder="예: 번개탐험가" autoComplete="off" />
      </label>
      <Btn kind="gold" disabled={!pick} data-testid="start-go" onClick={async () => { await app.commit({}, { game: { ...app.game, friend: pick, nickname: nick.trim() } }); nav(''); }}>탐험 시작하기 →</Btn>
      <Btn kind="ghost" onClick={() => nav('guide')}>📲 아이패드 설치·오프라인 안내</Btn>
    </main>
  );
}
