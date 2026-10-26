// ===== 그림: 아이콘 · 인물 · 장면 · 차트 =====
const ICON_PATHS = {
  home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-6h4v6"/>',
  chart: '<path d="M4 19h16"/><path d="m5 15 4-5 4 3 6-7"/><path d="M15 6h4v4"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  scroll: '<path d="M7 4h11v14a2 2 0 0 1-2 2H6"/><path d="M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2"/><path d="M10 9h5M10 13h5"/>',
  gem: '<path d="M6 4h12l3 5-9 11L3 9Z"/><path d="M3 9h18M9 4l3 16 3-16"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z"/><path d="M4 19V5"/><path d="M9 7h6"/>',
  gym: '<path d="M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12"/>',
  work: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  rest: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
  sns: '<path d="M4 5h16v11H9l-5 4Z"/><path d="M8 9h8M8 12h5"/>',
  shop: '<path d="M5 8h14l-1 12H6Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  bank: '<path d="M3 9 12 4l9 5"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
  watch: '<circle cx="12" cy="12" r="5"/><path d="M9 7 10 3h4l1 4M9 17l1 4h4l1-4M12 10v2l1.5 1"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  next: '<path d="m9 5 7 7-7 7"/>',
  ball: '<circle cx="12" cy="12" r="8"/><path d="M8.5 9.5c2-1.5 5-1.5 7 0M8.5 14.5c2 1.5 5 1.5 7 0"/>',
  back: '<path d="M15 5 8 12l7 7"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16.5 5.5l3 3M14 8l2 2"/>',
  minus: '<path d="M5 12h14"/>',
};
function icon(name, size) {
  return `<svg class="ic" width="${size || 20}" height="${size || 20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}

// ---- 색 ----
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * f))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

// ---- 벡터 인물 (아이·청소년) ----
// look: {hair, style:'short'|'long'|'bob'|'pony', skin, outfit, uniform, glasses}
let _svgUid = 0;
function personSVG(look, ageN, expr) {
  const u = 'p' + (++_svgUid);
  const kid = ageN <= 13;
  const skin = look.skin || '#f3cfb3', hair = look.hair || '#2a1d18', out = look.uniform ? '#2b3a63' : (look.outfit || '#f2c94c');
  const hr = kid ? 62 : 56, cy = kid ? 118 : 110;                // 머리 크기
  const hairBack = {
    long: `<path d="M${100 - hr - 6} ${cy} C${100 - hr - 12} ${cy + 70} ${100 - hr} ${cy + 120} ${100 - hr + 10} ${cy + 130} L${100 + hr - 10} ${cy + 130} C${100 + hr} ${cy + 120} ${100 + hr + 12} ${cy + 70} ${100 + hr + 6} ${cy}Z" fill="${shade(hair, 0.85)}"/>`,
    bob: `<path d="M${100 - hr - 6} ${cy - 4} C${100 - hr - 8} ${cy + 40} ${100 - hr} ${cy + 62} ${100 - hr + 8} ${cy + 66} L${100 + hr - 8} ${cy + 66} C${100 + hr} ${cy + 62} ${100 + hr + 8} ${cy + 40} ${100 + hr + 6} ${cy - 4}Z" fill="${shade(hair, 0.85)}"/>`,
    pony: `<path d="M${100 + hr - 6} ${cy - 30} C${100 + hr + 34} ${cy - 20} ${100 + hr + 30} ${cy + 50} ${100 + hr + 6} ${cy + 80} C${100 + hr + 14} ${cy + 40} ${100 + hr + 6} ${cy} ${100 + hr - 10} ${cy - 10}Z" fill="${shade(hair, 0.85)}"/>`,
  }[look.style] || '';
  // 머리 꼭대기(cy - hr)까지 덮으려면 3차 곡선 제어점을 머리 반지름의 1.36배 위에 둔다
  const top = cy - hr * 1.36;
  const fringe = look.style === 'short'
    ? `<path d="M${100 - hr - 3} ${cy + 10} C${100 - hr - 6} ${top - 11} ${100 + hr + 6} ${top - 11} ${100 + hr + 3} ${cy + 10} C${100 + hr - 4} ${cy - 14} ${100 + 34} ${cy - 22} ${100 + 12} ${cy - 18} C${100 - 6} ${cy - 28} ${100 - hr + 12} ${cy - 18} ${100 - hr - 3} ${cy + 10}Z" fill="url(#${u}h)"/>`
    : `<path d="M${100 - hr - 4} ${cy + 16} C${100 - hr - 8} ${top - 13} ${100 + hr + 8} ${top - 13} ${100 + hr + 4} ${cy + 16} C${100 + hr - 6} ${cy - 10} ${100 + 30} ${cy - 24} ${100 + 8} ${cy - 16} C${100 - 12} ${cy - 30} ${100 - hr + 10} ${cy - 12} ${100 - hr - 4} ${cy + 16}Z" fill="url(#${u}h)"/>`;
  const ey = cy + (kid ? 10 : 6), ex = kid ? 24 : 21, er = kid ? 9 : 7.5;
  const eye = x => expr === 'tired'
    ? `<path d="M${x - er} ${ey + 1} Q${x} ${ey + 5} ${x + er} ${ey + 1}" stroke="#3a2a22" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="${x}" cy="${ey}" rx="${er}" ry="${er * 1.15}" fill="#2a1d18"/><circle cx="${x + er * 0.35}" cy="${ey - er * 0.4}" r="${er * 0.35}" fill="#fff"/><circle cx="${x - er * 0.3}" cy="${ey + er * 0.4}" r="${er * 0.15}" fill="#fff" opacity=".8"/>`;
  const mouth = expr === 'smile' ? `<path d="M${100 - 10} ${ey + 24} Q100 ${ey + 34} ${100 + 10} ${ey + 24}" stroke="#a5463c" stroke-width="3" fill="#e88a7d" stroke-linecap="round"/>`
    : expr === 'tired' ? `<path d="M${100 - 7} ${ey + 28} L${100 + 7} ${ey + 28}" stroke="#a5463c" stroke-width="3" stroke-linecap="round"/>`
      : `<path d="M${100 - 8} ${ey + 25} Q100 ${ey + 30} ${100 + 8} ${ey + 25}" stroke="#a5463c" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const body = look.uniform
    ? `<path d="M34 260 C38 214 62 200 84 196 L116 196 C138 200 162 214 166 260Z" fill="${out}"/><path d="M88 196 L100 228 L112 196Z" fill="#f4f4f4"/><path d="M96 204 L100 236 L104 204Z" fill="#8b2b3a"/>`
    : `<path d="M30 260 C34 214 60 ${kid ? 204 : 200} 84 ${kid ? 200 : 196} L116 ${kid ? 200 : 196} C140 ${kid ? 204 : 200} 166 214 170 260Z" fill="url(#${u}o)"/><path d="M84 ${kid ? 200 : 196} Q100 ${kid ? 212 : 208} 116 ${kid ? 200 : 196}" stroke="${shade(out, 0.75)}" stroke-width="4" fill="none"/>`;
  return `<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
  <radialGradient id="${u}s" cx="45%" cy="38%" r="70%"><stop offset="0" stop-color="${shade(skin, 1.05)}"/><stop offset="1" stop-color="${shade(skin, 0.86)}"/></radialGradient>
  <linearGradient id="${u}h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(hair, 1.4)}"/><stop offset="1" stop-color="${shade(hair, 0.8)}"/></linearGradient>
  <linearGradient id="${u}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(out, 1.08)}"/><stop offset="1" stop-color="${shade(out, 0.78)}"/></linearGradient></defs>
  ${hairBack}${body}
  <path d="M90 ${cy + hr - 12} L90 ${kid ? 202 : 198} Q100 ${kid ? 208 : 204} 110 ${kid ? 202 : 198} L110 ${cy + hr - 12}Z" fill="${shade(skin, 0.86)}"/>
  <ellipse cx="100" cy="${cy}" rx="${hr}" ry="${hr * 1.02}" fill="url(#${u}s)"/>
  <ellipse cx="${100 - hr + 2}" cy="${cy + 8}" rx="7" ry="10" fill="${shade(skin, 0.88)}"/><ellipse cx="${100 + hr - 2}" cy="${cy + 8}" rx="7" ry="10" fill="${shade(skin, 0.88)}"/>
  <ellipse cx="${100 - ex - 6}" cy="${ey + 18}" rx="10" ry="5.5" fill="#f08a8a" opacity="${expr === 'smile' ? 0.45 : 0.25}"/><ellipse cx="${100 + ex + 6}" cy="${ey + 18}" rx="10" ry="5.5" fill="#f08a8a" opacity="${expr === 'smile' ? 0.45 : 0.25}"/>
  ${eye(100 - ex)}${eye(100 + ex)}
  <path d="M${100 - ex - 9} ${ey - 16} Q${100 - ex} ${ey - 20} ${100 - ex + 9} ${ey - 16}" stroke="${shade(hair, 0.9)}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M${100 + ex - 9} ${ey - 16} Q${100 + ex} ${ey - 20} ${100 + ex + 9} ${ey - 16}" stroke="${shade(hair, 0.9)}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M98 ${ey + 12} Q100 ${ey + 16} 102 ${ey + 12}" stroke="${shade(skin, 0.7)}" stroke-width="2" fill="none"/>
  ${mouth}${fringe}
  ${look.glasses ? `<g fill="none" stroke="#333" stroke-width="2.5"><circle cx="${100 - ex}" cy="${ey}" r="${er + 6}"/><circle cx="${100 + ex}" cy="${ey}" r="${er + 6}"/><path d="M${100 - ex + er + 6} ${ey} L${100 + ex - er - 6} ${ey}"/></g>` : ''}
  </svg>`;
}
const PLAYER_LOOK = { hair: '#2a1d18', style: 'short', outfit: '#f2c94c' };
const FAMILY_LOOK = { mom: { hair: '#3a2a22', style: 'bob', outfit: '#7d8b4f' }, dad: { hair: '#2a2a2a', style: 'short', outfit: '#c9b896', glasses: true }, sis: { hair: '#1c1c1c', style: 'bob', outfit: '#f28fb0' } };

// 인물 그림: 일러스트가 있고 어른이면 그림 파일, 아니면 벡터
function portraitHTML(id, cls) {
  const c = CH[id], a = charAge(id);
  if (c.asset && a >= (c.adultAt || 0)) return `<img class="pt ${cls || ''}" src="${PORTRAIT_DIR + c.asset}" alt="${c.name}" draggable="false">`;
  const look = c.look || FAMILY_LOOK[id] || { hair: '#2a1d18', style: c.gender === '여' ? 'long' : 'short', outfit: '#8fb3e0' };
  return personSVG(Object.assign({ uniform: a >= 14 && a <= 19 }, look), a, 'smile');
}

// ---- 주인공 ----
function playerExpr() { const r = S.sta / maxSta(); return r < 0.25 ? 'tired' : r > 0.7 ? 'smile' : 'neutral'; }
// 입고 있는 상의 색 (어린 시절 그림)
function topColor() { const id = S.equip && S.equip.top; return id && GR[id] && GR[id].color ? { outfit: GR[id].color } : {}; }
// 20대·30대는 일러스트, 그 전에는 벡터 그림
function playerAsset() { const a = age(); return a >= 30 ? 'h1037.png' : a >= 20 ? 'h1021.png' : null; }
function playerFigure() {
  const f = playerAsset();
  if (f) return `<img class="hero-img" src="${PORTRAIT_DIR}${f}" alt="${S.name}" draggable="false">`;
  return personSVG(Object.assign({}, PLAYER_LOOK, topColor(), { uniform: age() >= 14 && !S.equip.top }), age(), playerExpr());
}
function playerFace() {
  const f = playerAsset();
  if (f) return `<img class="pt" src="${PORTRAIT_DIR}${f}" alt="${S.name}" draggable="false">`;
  return personSVG(Object.assign({}, PLAYER_LOOK, topColor(), { uniform: age() >= 14 && !S.equip.top }), age(), 'smile');
}
// 시대별 방 (세로 화면에 맞춘 300×380. 가운데 아래는 주인공 자리라 비워 둔다)
function roomSVG() {
  const y = year(), m = month();
  const wall = y < 2005 ? '#e9d9bd' : y < 2015 ? '#dfe6ea' : '#e8e4f0';
  const floor = y < 2005 ? '#b98a5e' : y < 2015 ? '#a7a2a0' : '#c9b8a6';
  const sky = m <= 2 || m === 12 ? '#bcd3ea' : m <= 5 ? '#bfe3f2' : m <= 8 ? '#8ccbf0' : '#f2c69b';
  const thing = y < 2005   // 브라운관 TV → 노트북 → 모니터
    ? `<rect x="206" y="222" width="78" height="64" rx="8" fill="#5b5f66"/><rect x="214" y="230" width="62" height="46" rx="6" fill="#3b4a5c"/>`
    : y < 2015
      ? `<path d="M212 278 h70 l8 10 h-86z" fill="#9aa3ad"/><rect x="218" y="238" width="58" height="40" rx="4" fill="#2f3640"/><rect x="222" y="242" width="50" height="32" fill="#46637f"/>`
      : `<rect x="204" y="222" width="84" height="56" rx="4" fill="#1d2129"/><rect x="208" y="226" width="76" height="46" fill="#4d6a8a"/><rect x="238" y="278" width="16" height="10" fill="#2a2f38"/>`;
  return `<svg class="room" viewBox="0 0 300 380" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="300" height="380" fill="${wall}"/>
  ${y < 2005 ? '<g opacity=".18" fill="#a07a4a">' + Array.from({ length: 48 }, (_, i) => `<circle cx="${(i % 8) * 40 + 10}" cy="${Math.floor(i / 8) * 50 + 20}" r="3"/>`).join('') + '</g>' : ''}
  <rect x="16" y="44" width="104" height="104" rx="4" fill="#fff"/><rect x="22" y="50" width="92" height="92" fill="${sky}"/>
  <circle cx="48" cy="76" r="13" fill="#fff6c8" opacity=".9"/>
  <path d="M68 50v92M22 96h92" stroke="#fff" stroke-width="4"/>
  <rect x="212" y="40" width="66" height="80" rx="3" fill="#fff" stroke="#d0c3ad"/><rect x="212" y="40" width="66" height="19" fill="#d9534f"/>
  <text x="245" y="54" font-size="10" text-anchor="middle" fill="#fff" font-family="sans-serif">${y}</text>
  <text x="245" y="96" font-size="29" font-weight="700" text-anchor="middle" fill="#333" font-family="sans-serif">${m}</text>
  <text x="245" y="112" font-size="9" text-anchor="middle" fill="#888" font-family="sans-serif">월</text>
  <rect y="300" width="300" height="80" fill="${floor}"/><rect y="298" width="300" height="4" fill="${shade(floor, 0.8)}"/>
  <rect x="192" y="286" width="108" height="12" rx="2" fill="${shade(floor, 0.7)}"/><rect x="200" y="298" width="8" height="40" fill="${shade(floor, 0.6)}"/>
  ${thing}
  </svg>`;
}
// ---- 이야기 장면 ----
function sceneSVG(name) {
  const W = (inner, bg) => `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${bg}${inner}</svg>`;
  const grad = (id, a, b) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="300" fill="url(#${id})"/>`;
  switch (name) {
    case 'night2026': return W(`
      <rect x="40" y="30" width="150" height="120" fill="#0b1226" stroke="#26314f" stroke-width="6"/>
      ${Array.from({ length: 26 }, (_, i) => `<rect x="${50 + (i * 37) % 130}" y="${60 + (i * 53) % 80}" width="5" height="7" fill="#f7d774" opacity="${0.3 + (i % 5) / 7}"/>`).join('')}
      <rect x="0" y="210" width="400" height="90" fill="#151a26"/><rect x="60" y="196" width="280" height="16" rx="4" fill="#2a2f3d"/>
      <g transform="rotate(-6 200 190)"><rect x="150" y="160" width="110" height="38" rx="2" fill="#e9e4d6"/><circle cx="242" cy="179" r="9" fill="none" stroke="#c0392b" stroke-width="2.5"/><path d="M160 172h60M160 180h50M160 188h40" stroke="#9a9488" stroke-width="2"/></g>
      <rect x="282" y="176" width="24" height="40" rx="4" fill="#0d0f14"/><rect x="285" y="180" width="18" height="30" fill="#5d8bd6" opacity=".9"/>
      <circle cx="294" cy="195" r="60" fill="#5d8bd6" opacity=".08"/>`, grad('gn', '#0e1424', '#1b2235'));
    case 'room1996': return roomSceneFixed();
    case 'bank': return W(`
      <rect x="20" y="24" width="360" height="150" rx="6" fill="#0f1a12" stroke="#2d3b2f" stroke-width="4"/>
      ${['삼성전자', '현대전자', '한국이동통신', '포항제철', '기아자동차', '한국전력'].map((n, i) => `<text x="36" y="${52 + i * 22}" font-size="13" fill="#8fe39a" font-family="monospace">${n}</text><text x="250" y="${52 + i * 22}" font-size="13" fill="${i % 3 ? '#ff6b5e' : '#8fe39a'}" font-family="monospace">${i % 3 ? '▲' : '▼'} ${(1 + i * 0.7).toFixed(1)}%</text>`).join('')}
      <rect y="200" width="400" height="100" fill="#3a3530"/>
      ${[40, 110, 180, 250, 320].map(x => `<rect x="${x}" y="214" width="46" height="34" rx="6" fill="#6b5b4d"/><circle cx="${x + 23}" cy="206" r="13" fill="#2b2622"/>`).join('')}`, grad('gb', '#4a443c', '#2a2622'));
    case 'news': return W(`
      <rect x="40" y="36" width="320" height="200" rx="16" fill="#1a1d22"/><rect x="54" y="50" width="292" height="164" rx="6" fill="#2d4a73"/>
      <circle cx="200" cy="118" r="26" fill="#e3c2a4"/><path d="M160 214 C164 168 236 168 240 214Z" fill="#1f2a3c"/><path d="M174 98 C178 80 222 80 226 98 C214 90 186 90 174 98Z" fill="#222"/>
      <rect x="54" y="176" width="292" height="26" fill="#c0392b"/><text x="66" y="194" font-size="14" font-weight="700" fill="#fff" font-family="sans-serif">속보</text>
      <rect x="110" y="184" width="200" height="8" rx="2" fill="#fff" opacity=".7"/>
      <rect x="170" y="236" width="60" height="24" fill="#111"/>`, grad('gw', '#3b3f47', '#24272d'));
    case 'school': return W(`
      <rect x="40" y="30" width="320" height="130" rx="4" fill="#2f5d42" stroke="#8a6a44" stroke-width="8"/>
      <text x="200" y="90" font-size="22" text-anchor="middle" fill="#f3f3e6" font-family="sans-serif" opacity=".9">${year()}년 ${month()}월</text>
      <path d="M90 120 q20 -10 40 0 t40 0" stroke="#f3f3e6" stroke-width="2" fill="none" opacity=".6"/>
      <rect y="200" width="400" height="100" fill="#b98a5e"/>
      ${[0, 1, 2, 3].map(i => `<rect x="${30 + i * 92}" y="206" width="70" height="30" rx="3" fill="#d9b382"/><rect x="${40 + i * 92}" y="236" width="6" height="40" fill="#7a5a3a"/><rect x="${84 + i * 92}" y="236" width="6" height="40" fill="#7a5a3a"/>`).join('')}`, grad('gs', '#efe6d0', '#d8c9a8'));
    case 'street': return W(`
      ${[[0, 120, 70], [70, 90, 60], [130, 140, 80], [210, 100, 50], [260, 150, 70], [330, 110, 70]].map(([x, h, w]) => `<rect x="${x}" y="${230 - h}" width="${w}" height="${h}" fill="#3b3550"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${x + 8 + (i % 2) * (w / 2)}" y="${240 - h + Math.floor(i / 2) * 22}" width="8" height="10" fill="#f6d27a" opacity=".7"/>`).join('')}`).join('')}
      <rect y="230" width="400" height="70" fill="#2a2633"/><path d="M0 266h400" stroke="#f6d27a" stroke-width="3" stroke-dasharray="20 16" opacity=".6"/>
      <rect x="64" y="150" width="4" height="80" fill="#222"/><circle cx="66" cy="148" r="8" fill="#ffe9a8"/><circle cx="66" cy="148" r="30" fill="#ffe9a8" opacity=".15"/>`, grad('gst', '#f39c6b', '#6d4b8a'));
    case 'home': return W(`
      <rect x="250" y="40" width="110" height="80" rx="3" fill="#cdb38b" stroke="#a88d63" stroke-width="4"/><path d="M262 104 l20-24 18 14 22-28 26 38z" fill="#7f9b6a"/>
      <rect y="210" width="400" height="90" fill="#9b7653"/>
      <path d="M30 210 v-50 a14 14 0 0 1 14-14 h150 a14 14 0 0 1 14 14 v50z" fill="#8c3b3b"/><rect x="24" y="190" width="196" height="30" rx="10" fill="#a54a4a"/>
      <rect x="240" y="220" width="120" height="14" rx="3" fill="#6b4a2e"/><rect x="250" y="234" width="8" height="30" fill="#5a3d25"/><rect x="342" y="234" width="8" height="30" fill="#5a3d25"/>
      <rect x="350" y="150" width="6" height="60" fill="#444"/><path d="M336 150 h34 l-8 -24 h-18z" fill="#f3e2b0"/>`, grad('gh', '#e8d8b8', '#cdb894'));
    case 'campus': return W(`
      <rect x="110" y="90" width="180" height="140" fill="#b9a089"/><path d="M100 92 L200 40 L300 92Z" fill="#8a6f58"/>
      ${[0, 1, 2].map(i => `<rect x="${130 + i * 55}" y="120" width="30" height="40" fill="#e9f1f7"/>`).join('')}<rect x="180" y="180" width="40" height="50" fill="#5a4636"/>
      <rect y="230" width="400" height="70" fill="#8fbf6f"/>
      ${Array.from({ length: 18 }, (_, i) => `<circle cx="${(i * 47) % 400}" cy="${40 + (i * 29) % 160}" r="${4 + i % 3}" fill="#f7b6c8" opacity=".85"/>`).join('')}
      <rect x="30" y="140" width="10" height="90" fill="#6b4a33"/><circle cx="35" cy="130" r="38" fill="#f4a9bf"/><rect x="360" y="150" width="10" height="80" fill="#6b4a33"/><circle cx="365" cy="140" r="34" fill="#f4a9bf"/>`, grad('gc', '#9fd3f2', '#e6f4fb'));
    case 'cafe': return W(`
      <rect x="30" y="30" width="200" height="140" rx="6" fill="#f6e3c3" opacity=".9"/><path d="M130 30v140M30 100h200" stroke="#7a5236" stroke-width="5"/>
      <rect y="200" width="400" height="100" fill="#5a3b28"/><rect x="40" y="186" width="320" height="16" rx="4" fill="#8a5b3c"/>
      <path d="M150 168 h30 v18 a10 10 0 0 1 -10 10 h-10 a10 10 0 0 1 -10 -10z" fill="#fff"/><path d="M180 174 a6 6 0 0 1 0 12" stroke="#fff" stroke-width="3" fill="none"/>
      <path d="M230 168 h30 v18 a10 10 0 0 1 -10 10 h-10 a10 10 0 0 1 -10 -10z" fill="#fff"/>
      <path d="M160 160 q4 -10 0 -18M240 160 q4 -10 0 -18" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>
      ${[280, 320, 360].map(x => `<circle cx="${x}" cy="60" r="10" fill="#ffd98a"/><path d="M${x} 20v30" stroke="#333" stroke-width="2"/>`).join('')}`, grad('gcf', '#a57452', '#6e4a33'));
    case 'office': return W(`
      ${[0, 1, 2].map(i => `<rect x="${30 + i * 120}" y="140" width="100" height="62" rx="4" fill="#2d333d"/><rect x="${36 + i * 120}" y="146" width="88" height="50" fill="#6f9fd8"/><rect x="${72 + i * 120}" y="202" width="16" height="16" fill="#2d333d"/>`).join('')}
      <rect y="218" width="400" height="16" fill="#c9ced6"/><rect y="234" width="400" height="66" fill="#8d96a3"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${i * 70}" y="30" width="50" height="8" rx="4" fill="#fff" opacity=".8"/>`).join('')}`, grad('go', '#dfe6ee', '#b8c3d1'));
    case 'stadium': return W(`
      <rect y="150" width="400" height="150" fill="#2f8a43"/><path d="M0 230 Q200 190 400 230" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/><circle cx="200" cy="232" r="22" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>
      <path d="M0 150 L400 150 L400 60 Q200 20 0 60Z" fill="#3b3550"/>
      ${Array.from({ length: 90 }, (_, i) => `<circle cx="${(i * 47) % 400 + 4}" cy="${70 + (i * 13) % 70}" r="3" fill="${['#e5484d', '#f6d27a', '#ffffff', '#5b8cff'][i % 4]}" opacity=".85"/>`).join('')}
      <rect x="150" y="26" width="100" height="34" rx="4" fill="#111"/><text x="200" y="49" font-size="16" text-anchor="middle" fill="#ffd25a" font-family="monospace">${year()}</text>
      ${[40, 360].map(x => `<rect x="${x - 3}" y="10" width="6" height="140" fill="#666"/><rect x="${x - 18}" y="6" width="36" height="12" rx="2" fill="#fff8d0"/>`).join('')}`, grad('gsd', '#1d2a55', '#3b4a7a'));
    case 'memory': return W(`
      ${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 97) % 400}" cy="${(i * 61) % 300}" r="${1 + i % 4}" fill="#fff" opacity="${0.2 + (i % 6) / 10}"/>`).join('')}
      <circle cx="200" cy="150" r="90" fill="#fff" opacity=".12"/><circle cx="200" cy="150" r="50" fill="#fff" opacity=".18"/>`,
      `<defs><radialGradient id="gm" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#e9f0ff"/><stop offset=".5" stop-color="#7e8fd6"/><stop offset="1" stop-color="#2a2f5e"/></radialGradient></defs><rect width="400" height="300" fill="url(#gm)"/>`);
    default: return W('', grad('gd', '#cfd8e3', '#9aa8bb'));
  }
}
function roomSceneFixed() { // 1996년 1월 아침의 방 (프롤로그 고정)
  const save = S.mi;
  S.mi = miOf('1996-01');
  const svg = roomSVG();
  S.mi = save;
  return svg;
}
function artHTML(art) {
  if (!art) return '';
  const [k, v] = art.split(':');
  if (k === 'char') return `<div class="art-char">${portraitHTML(v)}</div>`;
  return `<div class="art-scene">${sceneSVG(v)}</div>`;
}

// ---- 차트 ----
// vals: 값 배열 (null 허용) · split: 이 인덱스부터 미래(점선) · labels: [인덱스, 글자]
function lineChart(vals, opts) {
  opts = opts || {};
  const W = 340, H = opts.h || 150, P = { l: 6, r: 44, t: 10, b: 18 };
  const pts = vals.map((v, i) => [i, v]).filter(p => p[1] != null && isFinite(p[1]));
  if (pts.length < 2) return `<div class="chart-empty">기록이 부족합니다</div>`;
  const log = opts.log && pts.every(p => p[1] > 0);
  const f = v => log ? Math.log(v) : v;
  let lo = Math.min(...pts.map(p => f(p[1]))), hi = Math.max(...pts.map(p => f(p[1])));
  if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
  const n = vals.length - 1 || 1;
  const X = i => P.l + (W - P.l - P.r) * i / n, Y = v => P.t + (H - P.t - P.b) * (1 - (f(v) - lo) / (hi - lo));
  const sp = opts.split == null ? Infinity : opts.split;
  const past = pts.filter(p => p[0] <= sp), fut = pts.filter(p => p[0] >= sp);
  const path = a => a.map((p, k) => (k ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
  const area = past.length > 1 ? path(past) + `L${X(past[past.length - 1][0]).toFixed(1)} ${H - P.b}L${X(past[0][0]).toFixed(1)} ${H - P.b}Z` : '';
  const up = past.length > 1 && past[past.length - 1][1] >= past[0][1];
  const col = opts.color || (up ? 'var(--up)' : 'var(--down)');
  const inv = v => log ? Math.exp(v) : v;
  const fmt = opts.fmt || (v => (+v.toPrecision(3)).toLocaleString('ko-KR'));
  const lab = (opts.labels || []).map(([i, t]) => `<text x="${X(i).toFixed(1)}" y="${H - 4}" class="ax" text-anchor="middle">${t}</text>`).join('');
  const last = past[past.length - 1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.label || '차트'}">
    <path d="M${P.l} ${P.t}H${W - P.r}M${P.l} ${(P.t + H - P.b) / 2}H${W - P.r}M${P.l} ${H - P.b}H${W - P.r}" class="grid"/>
    <text x="${W - P.r + 4}" y="${P.t + 4}" class="ax">${fmt(inv(hi))}</text><text x="${W - P.r + 4}" y="${H - P.b + 4}" class="ax">${fmt(inv(lo))}</text>
    ${area ? `<path d="${area}" fill="${col}" opacity=".12"/>` : ''}
    <path d="${path(past)}" fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/>
    ${fut.length > 1 ? `<path d="${path(fut)}" fill="none" stroke="var(--gem)" stroke-width="2" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/>` : ''}
    ${last ? `<circle cx="${X(last[0]).toFixed(1)}" cy="${Y(last[1]).toFixed(1)}" r="3.5" fill="${col}"/>` : ''}
    ${lab}</svg>`;
}
