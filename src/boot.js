// ===== 저장 · 불러오기 · 시작 =====
function save() {
  if (!S) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* 저장 공간이 없으면 조용히 넘어간다 */ }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ } }
function load() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  if (!raw) return false;
  try {
    const d = JSON.parse(raw);
    if (!d || d.v !== 2 || typeof d.mi !== 'number') return false;   // 주 단위였던 v1 저장은 버린다
    const base = newGame({ name: d.name, seed: 1 });   // 새 항목이 생겨도 기본값을 채운다
    S = Object.assign(base, d);
    for (const p of Object.values(S.fut)) if (!p.lev) p.lev = FUT_OLD_LEV;   // 레버리지 전 포지션은 증거금 15% (6.7배)
    for (const r of Object.values(S.re)) {   // 부동산 관리 전 저장: 원래처럼 모두 월세로 둔다
      if (!r.mode) r.mode = 'wolse';
      if (r.dep == null) r.dep = 0;
      if (r.lease == null) r.lease = S.mi;
    }
    RUN = null;
    return true;
  } catch (e) { return false; }
}

// ---- 홈 화면 설치 ----
// 안드로이드 크롬은 설치 창을 바로 띄울 수 있고, 아이폰 사파리는 「공유 → 홈 화면에 추가」로 안내한다
const INSTALL = { evt: null, done: false };
function isStandalone() {
  return (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) || (typeof navigator !== 'undefined' && navigator.standalone === true);
}
function installState() {
  if (INSTALL.done || isStandalone()) return 'installed';
  if (INSTALL.evt) return 'prompt';
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return 'manual';
}
async function installApp() {
  if (!INSTALL.evt) return;
  INSTALL.evt.prompt();
  const choice = await INSTALL.evt.userChoice;
  INSTALL.evt = null;
  if (choice.outcome === 'accepted') { INSTALL.done = true; toast('홈 화면에 설치했습니다.'); }
  render();
}

// 클릭과 입력은 한곳에서 받는다. data-act 가 붙은 가장 가까운 요소의 동작을 부른다
function bindEvents() {
  document.addEventListener('click', ev => {
    const el = ev.target.closest && ev.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = ACT[el.dataset.act];
    if (el.dataset.act !== 'next') UI.confirmNext = false;   // 다른 걸 누르면 넘기기 확인을 취소한다
    if (fn) fn(el.dataset.arg, el, ev);
  });
  document.addEventListener('input', ev => {
    const el = ev.target; if (el && el.dataset && el.dataset.input) onInput(el.dataset.input, el.value);
  });
  document.addEventListener('keydown', ev => {
    if (!RUN || !RUN.cur) return;
    if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); ACT.storyTap(); }
    if (RUN.cur.c && /^[1-9]$/.test(ev.key)) ACT.choose(+ev.key - 1);
  });
}

if (typeof window !== 'undefined' && !window.__TEST__) {
  bindEvents();
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); INSTALL.evt = e; if (UI.sheet === 'settings') render(); });
  window.addEventListener('appinstalled', () => { INSTALL.done = true; INSTALL.evt = null; toast('홈 화면에 설치했습니다.'); });
  // 서비스 워커는 https 나 localhost 에서만 돈다 (GitHub Pages 는 https)
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
  render();
}
