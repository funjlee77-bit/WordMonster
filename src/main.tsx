import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProvider } from './store';
import { registerSW } from './pwa';
import './styles.css';

// 화면 키보드가 올라오면 보이는 높이를 CSS 변수로 알려 답안·버튼이 가려지지 않게 함
function trackViewport() {
  const vv = window.visualViewport;
  const upd = () => {
    const kb = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
    document.documentElement.style.setProperty('--kb', `${kb}px`);
  };
  vv?.addEventListener('resize', upd); vv?.addEventListener('scroll', upd); upd();
}
trackViewport();
registerSW();
createRoot(document.getElementById('root')!).render(<React.StrictMode><AppProvider><App /></AppProvider></React.StrictMode>);
