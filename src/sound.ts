// 효과음: 파일 없이 기기에서 직접 만들어 재생(Web Audio)
let ctx: AudioContext | null = null;
let enabled = true;
export const setSoundEnabled = (on: boolean) => { enabled = on; };
function tone(freq: number, start: number, dur: number, type: OscillatorType = 'triangle', vol = 0.15) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + dur + 0.02);
}
export function play(kind: 'correct' | 'combo' | 'overcome' | 'wrong' | 'tap' | 'win') {
  if (!enabled) return;
  try {
    ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    if (kind === 'correct') { tone(660, 0, 0.12); tone(990, 0.08, 0.16); }
    if (kind === 'combo') [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.06, 0.14, 'square', 0.08));
    if (kind === 'overcome') [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, i * 0.07, 0.25, 'sine', 0.12));
    if (kind === 'wrong') { tone(330, 0, 0.18, 'sine', 0.1); tone(262, 0.12, 0.22, 'sine', 0.1); }
    if (kind === 'tap') tone(880, 0, 0.05, 'sine', 0.05);
    if (kind === 'win') [523, 659, 784, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.1, 0.18));
  } catch { /* 소리 없음 */ }
}
