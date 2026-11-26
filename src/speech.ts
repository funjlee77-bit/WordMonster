// 영어 읽어 주기: iPad(기기)에 들어 있는 영어 음성으로 읽어요(인터넷 필요 없음, 파일 없음)
// 버튼 한 번 = 한 번 읽고 → 2초 쉬고 → 한 번 더 읽기

export const REPEAT_GAP_MS = 2000;
export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

/** 읽을 글: 교재 철자 그대로, 슬래시(am/are/is)는 쉼표로 바꿔 "am, are, is"처럼 끊어 읽게 함 */
export const spokenText = (english: string) => english.replace(/\s*\/\s*/g, ', ').trim();

let cached: SpeechSynthesisVoice | null = null;
/** 영어 음성 중 가장 좋은 것(향상된/프리미엄 음성 우선, 미국 영어 우선) */
export function pickVoice(): SpeechSynthesisVoice | null {
  if (!speechSupported()) return null;
  const vs = window.speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang) || v.lang.toLowerCase() === 'en');
  if (!vs.length) return null;
  const score = (v: SpeechSynthesisVoice) =>
    (/premium/i.test(v.name) ? 40 : 0) + (/enhanced|improved|고품질|향상/i.test(v.name) ? 30 : 0) +
    (/en[-_]US/i.test(v.lang) ? 10 : /en[-_]GB/i.test(v.lang) ? 6 : 0) +
    (/samantha|ava|allison|susan|zoe|nicky|evan|tom/i.test(v.name) ? 5 : 0) + (v.localService ? 3 : 0) -
    (/novelty|bells|bubbles|whisper|zarvox|trinoids|albert|bad news|good news|organ|jester|cellos|boing|superstar|wobble|grandma|grandpa|rocko|shelley|flo|eddy|reed|sandy/i.test(v.name) ? 50 : 0);
  return [...vs].sort((a, b) => score(b) - score(a))[0];
}
if (speechSupported()) {
  try { window.speechSynthesis.addEventListener?.('voiceschanged', () => { cached = pickVoice(); }); } catch { /* 무시 */ }
}

let timer: ReturnType<typeof setTimeout> | null = null;
let token = 0;

export function stopSpeaking() {
  token++;
  if (timer) { clearTimeout(timer); timer = null; }
  // iPad Safari: 읽는 중이 아닐 때 cancel()을 부르면 바로 다음 읽기가 무시되는 경우가 있어 필요할 때만 부름
  if (speechSupported()) { try { const ss = window.speechSynthesis; if (ss.speaking || ss.pending) ss.cancel(); } catch { /* 무시 */ } }
}
let keep: SpeechSynthesisUtterance | null = null; // 읽는 도중 정리되어 onend가 안 오는 문제 방지

function sayOnce(text: string, rate: number, onEnd: () => void) {
  const u = new SpeechSynthesisUtterance(text);
  const v = cached ?? (cached = pickVoice());
  if (v) u.voice = v;
  u.lang = v?.lang ?? 'en-US';
  u.rate = rate; u.pitch = 1; u.volume = 1;
  let done = false;
  const fin = () => { if (!done) { done = true; onEnd(); } };
  u.onend = fin; u.onerror = fin;
  keep = u;
  window.speechSynthesis.speak(u);
}

/**
 * times번 읽기(기본 2번), 사이에 gapMs(기본 2초) 쉬기.
 * onState: 'speaking'(읽는 중) / 'gap'(쉬는 중) / 'done'
 */
export function speakWord(english: string, opts: { times?: number; gapMs?: number; rate?: number; onState?: (s: 'speaking' | 'gap' | 'done', n: number) => void } = {}): boolean {
  if (!speechSupported()) return false;
  stopSpeaking();
  const my = ++token;
  const times = opts.times ?? 2, gap = opts.gapMs ?? REPEAT_GAP_MS, rate = opts.rate ?? 0.85;
  const text = spokenText(english);
  const step = (n: number) => {
    if (my !== token) return;
    opts.onState?.('speaking', n);
    sayOnce(text, rate, () => {
      if (my !== token) return;
      if (n >= times) { opts.onState?.('done', n); return; }
      opts.onState?.('gap', n);
      timer = setTimeout(() => step(n + 1), gap);
    });
  };
  step(1);
  return true;
}
