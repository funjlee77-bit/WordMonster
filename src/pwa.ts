// Service Worker 등록과 "오프라인 준비" 상태 확인
// 준비 완료 = 현재 작동 중인 Service Worker가 앱 파일 전체(500단어 데이터 포함 JS 묶음 등)를 실제로 캐시에 갖고 있음을 확인했을 때만
import { useEffect, useState } from 'react';

export type OfflineState = { status: 'unsupported' | 'dev' | 'preparing' | 'ready' | 'failed'; detail?: string; version?: string; updateReady: boolean };
let state: OfflineState = { status: 'preparing', updateReady: false };
const subs = new Set<(s: OfflineState) => void>();
const set = (p: Partial<OfflineState>) => { state = { ...state, ...p }; subs.forEach((f) => f(state)); };
let reg: ServiceWorkerRegistration | null = null;
let userAppliedUpdate = false;

function askStatus(sw: ServiceWorker | null) {
  if (!sw) return;
  const ch = new MessageChannel();
  ch.port1.onmessage = (e) => {
    const d = e.data;
    if (d?.type === 'STATUS') {
      if (d.missing === 0) set({ status: 'ready', version: d.version, detail: `파일 ${d.total}개 준비됨` });
      else set({ status: 'preparing', detail: `${d.total - d.missing}/${d.total}` });
    }
  };
  sw.postMessage({ type: 'STATUS' }, [ch.port2]);
}

function track(r: ServiceWorkerRegistration) {
  const watch = (w: ServiceWorker | null, isUpdate: boolean) => {
    if (!w) return;
    w.addEventListener('statechange', () => {
      if (w.state === 'redundant' && !isUpdate) set({ status: 'failed', detail: '파일을 내려받지 못했어요.' });
      if (w.state === 'installed' && isUpdate) set({ updateReady: true });
      if (w.state === 'activated') askStatus(r.active);
    });
  };
  if (r.waiting && navigator.serviceWorker.controller) set({ updateReady: true });
  watch(r.installing, !!navigator.serviceWorker.controller);
  r.addEventListener('updatefound', () => watch(r.installing, !!navigator.serviceWorker.controller));
  if (r.active) askStatus(r.active);
}

export async function registerSW() {
  if (!('serviceWorker' in navigator)) { set({ status: 'unsupported' }); return; }
  if (!import.meta.env.PROD) { set({ status: 'dev', detail: '개발 모드에서는 오프라인 기능이 꺼져 있어요.' }); return; }
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (userAppliedUpdate) location.reload(); else askStatus(navigator.serviceWorker.controller); });
  try {
    reg = await navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js', { scope: import.meta.env.BASE_URL });
    track(reg);
    if (navigator.onLine) reg.update().catch(() => { /* 오프라인 등: 기존 버전 계속 사용 */ });
    setInterval(() => { if (reg?.active && state.status !== 'ready') askStatus(reg.active); }, 1500);
  } catch (e: any) { set({ status: 'failed', detail: String(e?.message ?? e) }); }
}

export async function retryPrepare() {
  set({ status: 'preparing', detail: '' });
  try {
    if (!reg) return registerSW();
    await reg.update();
    if (reg.active) askStatus(reg.active);
  } catch (e: any) { set({ status: 'failed', detail: '인터넷에 연결한 뒤 다시 시도해 주세요.' }); }
}

export function applyUpdate() {
  if (!reg?.waiting) return;
  userAppliedUpdate = true;
  reg.waiting.postMessage({ type: 'SKIP_WAITING' });
}

export function useOffline() {
  const [s, setS] = useState(state);
  useEffect(() => { subs.add(setS); setS(state); return () => { subs.delete(setS); }; }, []);
  return s;
}
export const isStandalone = () => (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true);
