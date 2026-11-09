import React, { useRef } from 'react';
import type { Dir, DirRecord, Stage, ProgressMap } from './core/types';
import { STAGE_LABEL, pkey } from './core/types';
import type { DiffSeg } from './core/grading';
import { ITEMS } from './core/data';
import { isDue, isMasteredDir } from './core/srs';

export function nav(path: string) { location.hash = '#/' + path; }

export function Btn({ children, kind = 'primary', ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' }) {
  return <button type="button" {...p} className={`btn btn-${kind} ${p.className ?? ''}`}>{children}</button>;
}

export function TopBar({ title, back = '' }: { title: string; back?: string | null }) {
  return (
    <header className="topbar">
      {back !== null && <Btn kind="ghost" className="back" onClick={() => nav(back)} aria-label="뒤로">← 뒤로</Btn>}
      <h1>{title}</h1>
    </header>
  );
}

export function StageChip({ r, label }: { r?: DirRecord; label: string }) {
  const s: Stage = r?.stage ?? 0;
  return <span className={`chip stage-${s}`} title={STAGE_LABEL[s]}>{label} {s === 5 ? '★' : ''}{STAGE_LABEL[s]}{r?.pendingRetry ? ' · 오답' : ''}</span>;
}

export const DIR_LABEL: Record<Dir, string> = { en: '뜻 보고 영어 쓰기', ko: '영어 보고 뜻 쓰기' };
export const DIR_ICON: Record<Dir, string> = { en: '🔤', ko: '📖' };
export const KEYBOARD_TIP: Record<Dir, string> = { en: '⌨️ 영어 키보드로 입력해 주세요 (🌐 키로 바꿀 수 있어요)', ko: '⌨️ 한글로 입력해 주세요' };

/** 정답 입력칸: 자동 대문자·자동 수정·맞춤법 검사 끔, 한글 조합 중 Enter는 제출하지 않음 */
export function AnswerInput({ dir, onSubmit, disabled, label = '제출', testId = 'answer' }: { dir: Dir; onSubmit: (v: string) => void; disabled?: boolean; label?: string; testId?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const send = () => { if (disabled) return; setTimeout(() => onSubmit(ref.current?.value ?? ''), 0); };
  return (
    <form className="answer-form" onSubmit={(e) => { e.preventDefault(); if (composing.current) return; send(); }}>
      <input ref={ref} data-testid={testId} className="answer-input" type="text" lang={dir === 'en' ? 'en' : 'ko'}
        autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false} enterKeyHint="done" disabled={disabled}
        aria-label="답 입력" placeholder={dir === 'en' ? '영어로 쓰기' : '뜻을 한글로 쓰기'} autoFocus
        onCompositionStart={() => { composing.current = true; }}
        onCompositionEnd={() => { composing.current = false; }}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229 || composing.current)) e.preventDefault(); }}
        onFocus={(e) => { const el = e.currentTarget; setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300); }} />
      <button type="submit" className="btn btn-primary submit" disabled={disabled} data-testid={testId + '-submit'}>{label}</button>
    </form>
  );
}

export function Diff({ segs, mode }: { segs: DiffSeg[]; mode: 'mine' | 'answer' }) {
  return (
    <span className="diff">
      {segs.map((s, i) => {
        const vis = s.text.replace(/ /g, '␣');
        if (s.kind === 'same') return <span key={i}>{s.text}</span>;
        return <mark key={i} className={s.kind} title={s.kind === 'extra' ? '더 쓴 글자' : '빠진 글자'}>{mode === 'mine' ? vis : vis}</mark>;
      })}
    </span>
  );
}

export function Modal({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return <div className="modal-back" onClick={onClose}><div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>{children}</div></div>;
}

export function chapterStats(ch: number, p: ProgressMap, today: string) {
  const items = ITEMS.filter((i) => i.chapter === ch);
  let met = 0, enM = 0, koM = 0, both = 0, pending = 0, due = 0;
  for (const it of items) {
    const e = p[pkey(it.id, 'en')], k = p[pkey(it.id, 'ko')];
    if ((e?.attempts ?? 0) + (k?.attempts ?? 0) > 0) met++;
    if (isMasteredDir(e)) enM++; if (isMasteredDir(k)) koM++; if (isMasteredDir(e) && isMasteredDir(k)) both++;
    for (const r of [e, k]) { if (r?.pendingRetry) pending++; else if (isDue(r, today)) due++; }
  }
  return { total: items.length, met, enM, koM, both, pending, due };
}
