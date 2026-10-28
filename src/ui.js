// ===== 화면 =====
// 화면 상태는 저장하지 않는다. 게임 상태는 S, 이야기 진행은 RUN 에 있다
const UI = { sort: 'base', bet: null, tab: 'main', sheet: null, sel: null, side: 'buy', slot: null, shopTab: 'gear', pview: 'map', estSel: null, confirmNext: false, lottoPick: [], ftab: 'KS', range: '5y', qty: 1, amt: 100000, bubble: '', say: {}, giftOpen: false,
  typed: 0, typedKey: '', toastMsg: '', endShown: false, confirmNew: false, recall: null, scrollKey: '', pops: [], finP: 'q', order: null };
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad2 = n => String(n).padStart(2, '0');
let toastTimer = null;
toast = function (msg) {
  UI.toastMsg = msg;
  const t = $('toast'); if (t) { t.textContent = msg; t.hidden = !msg; }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { UI.toastMsg = ''; const e = $('toast'); if (e) e.hidden = true; }, 2400);
};
function disp(t) {
  const given = S.name.length >= 3 ? S.name.slice(1) : S.name;
  return String(t).replace(/이준호/g, S.name).replace(/준호/g, given);
}
const pctCls = x => x > 0.005 ? 'up' : x < -0.005 ? 'down' : 'muted';
const pctSpan = (x, d) => `<span class="${pctCls(x)}">${fmtPct(x, d)}</span>`;
function shortSchool() {
  const g = year() - 1992;
  if (g <= 6) return '초' + g; if (g <= 9) return '중' + (g - 6); if (g <= 12) return '고' + (g - 9);
  if (S.job === 'office') return '직장인'; if (S.job === 'investor') return '투자자';
  return year() <= 2008 && S.edu ? '대' + Math.min(4, year() - 2004) : '사회인';
}

// ---- 전체 그리기 ----
function render() {
  const ph = $('phone'); if (!ph) return;
  if (!S) { ph.innerHTML = titleHTML(); return; }
  const key = UI.tab + '|' + UI.sheet + '|' + UI.sel + '|' + UI.ftab;
  const vEl = ph.querySelector && ph.querySelector('.view'), sEl = ph.querySelector && ph.querySelector('.sheet-body');
  const vTop = vEl ? vEl.scrollTop : 0, sTop = sEl ? sEl.scrollTop : 0;
  ph.innerHTML = topbarHTML() + `<main class="view">${viewHTML()}</main>` + tabbarHTML()
    + (UI.sheet ? sheetHTML() : '') + (UI.order ? orderPopHTML() : '') + (RUN && RUN.cur ? storyHTML() : UI.pops.length ? popHTML(UI.pops[0]) : '')
    + `<div class="toast" id="toast"${UI.toastMsg ? '' : ' hidden'}>${esc(UI.toastMsg)}</div>`;
  if (key === UI.scrollKey) {
    const v = ph.querySelector && ph.querySelector('.view'), s = ph.querySelector && ph.querySelector('.sheet-body');
    if (v) v.scrollTop = vTop; if (s) s.scrollTop = sTop;
  }
  UI.scrollKey = key;
  typewriter();
}
function afterTurn() {
  if (!UI.pops.length) storyStart();   // 결산 창을 먼저 보고 나서 이야기가 시작된다
  if (S.ended && !RUN && !UI.endShown) { UI.endShown = true; UI.sheet = 'ending'; }
  render();
}

// ---- 상단 바 ----
function topbarHTML() {
  const nw = netWorth(), gain = nw - S.monthStartNW, g = gemCount(), mx = maxSta();
  return `<header class="topbar">
    <div class="tb1">
      <div class="st"><small>보유 현금</small><b class="num ${S.cash < 0 ? 'bad' : ''}">${fmtWon(S.cash)}</b></div>
      <div class="st"><small>총자산</small><b class="num">${fmtWon(nw)}</b></div>
      <div class="st"><small>이달 수익</small><b class="num ${pctCls(gain)}">${fmtSigned(Math.round(gain))}</b></div>
      <button class="gem-pill" data-act="sheet" data-arg="gemshop" aria-label="보석">${icon('gem', 15)}<span class="num">${g === Infinity ? '∞' : g}</span></button>
      <button class="icon-btn" data-act="sheet" data-arg="settings" aria-label="설정">${icon('gear', 18)}</button>
    </div>
    <div class="tb2">
      <span class="chip-date num">${year()}.${pad2(month())}</span>
      <span class="chip-age">${age()}살 · ${shortSchool()}</span>
      <div class="sta" title="체력"><div class="bar"><i class="${S.sta / mx < 0.25 ? 'low' : ''}" style="width:${Math.round(S.sta / mx * 100)}%"></i></div><span class="num">${Math.round(S.sta)}/${mx}</span></div>
      <button class="icon-btn" data-act="sheet" data-arg="log" aria-label="로그">${icon('scroll', 18)}</button>
    </div>
  </header>`;
}
function tabbarHTML() {
  const t = [['main', '메인', 'home'], ['invest', '투자', 'chart'], ['people', '인연', 'heart'], ['status', '상태', 'user']];
  const next = S.ended ? '<button class="next" disabled><span><b>엔딩</b></span></button>'
    : `<button class="next ${UI.confirmNext ? 'confirm' : ''}" data-act="next" aria-label="다음 달로 넘기기"><span><b>${UI.confirmNext ? '넘길까요?' : '다음 달'}</b><small class="num">${S.mi >= LAST_MI ? '마지막 달' : fmtYM(S.mi + 1)}</small></span>${icon('next', 18)}</button>`;
  return `<nav class="tabbar">${t.map(([k, l, i]) => `<button class="${UI.tab === k ? 'on' : ''}" data-act="tab" data-arg="${k}">${icon(i, 22)}${l}</button>`).join('')}${next}</nav>`;
}
function viewHTML() {
  if (UI.tab === 'invest') return investHTML();
  if (UI.tab === 'people') return peopleHTML();
  if (UI.tab === 'status') return statusHTML();
  return mainHTML();
}

// ---- 메인 ----
function mainHTML() {
  const j = jobInfo(), a = age();
  const fig = a >= 20 ? playerFigure() : `<div class="hero-fig">${playerFigure()}</div>`;
  const money = a <= 19 ? `설날 세뱃돈 ${fmtWon(won100(NEWYEAR_MONEY * cpiF()))}` : `생활비 월 ${fmtWon(livingCost())}`;
  const kq = curYM() >= '1996-07' ? ` · 코스닥 ${macro('kosdaq').toFixed(0)} ${pctSpan(macroChange('kosdaq'))}` : '';
  // 막힌 행동은 흐리게 보이되 눌리게 둔다 (누르면 이유를 알려 준다)
  const emptySlot = '<div class="act empty" aria-hidden="true"><small>준비 중</small></div>';   // 빈 칸: 다음 업데이트에 쓸 자리
  const btn = (k, ic, sub) => `<button class="act ${actionBlocked(k) ? 'dim' : ''}" data-act="do" data-arg="${k}">${icon(ic, 22)}${ACTIONS[k].label}<small>${sub}</small></button>`;
  return `<div class="main">
    <div class="hero">${roomSVG()}${fig}
      <span class="hero-tag">${esc(S.name)} · ${schoolLabel()}</span>
      <button class="recall-btn" data-act="recall">${icon('gem', 14)}기억 더듬기</button>
      ${(b => b ? `<div class="bubble">${esc(b)}</div>` : '')(UI.bubble || (S.hints || []).map(h => '💭 ' + h.t).join('\n'))}
    </div>
    <div class="info">
      <div class="l1">${esc(j.name)} 1회 ${j.pay ? fmtWon(j.pay) : '-'} · ${money}</div>
      <div class="l2 num">코스피 ${macro('kospi').toFixed(2)} ${pctSpan(macroChange('kospi'))}${kq} · 환율 ${Math.round(fxNow()).toLocaleString()}원 · 금리 ${(MARKET.m.cd[S.mi] || 0).toFixed(1)}%</div>
    </div>
    <div class="actions">
      ${btn('study', 'book', '체력 -' + ACTIONS.study.cost)}
      ${btn('gym', 'gym', '체력 -' + ACTIONS.gym.cost + ' · 최대↑')}
      ${btn('work', 'work', (j.pay ? '+' + fmtWon(j.pay) : '체력 -' + ACTIONS.work.cost) + ' · ' + usedThisMonth('work') + '/' + ACTIONS.work.perMonth)}
      ${emptySlot}
      ${btn('sns', 'sns', usedThisMonth('sns') ? '이번 달 완료' : snsName(curYM()))}
      <button class="act" data-act="sheet" data-arg="shop">${icon('shop', 22)}쇼핑<small>물건 사기</small></button>
      ${emptySlot}${emptySlot}
    </div>
  </div>`;
}

// ---- 투자 ----
function investHTML() {
  const b = breakdown();
  const stocks = b.KS + b.KQ + b.US + b.ETF + b.COIN + b.fut + b.opt + b.bond;
  const held = Object.keys(S.hold).sort((x, y) => holdValue(y) - holdValue(x));
  const tile = (k, ic, name, val, sub, cls) => `<button class="tile ${cls || ''}" data-act="sheet" data-arg="${k}">${icon(ic, 24)}<b>${name}</b><i class="num">${val}</i><span>${sub}</span></button>`;
  const estN = Object.values(S.re).reduce((s, r) => s + r.q, 0), luxN = Object.values(S.lux).reduce((s, n) => s + n, 0);
  const ls = leaseMonth(), emptyN = Object.keys(S.re).reduce((s, id) => s + (S.re[id].mode === 'empty' ? rentN(id) : 0), 0);
  return `<div class="pad">
    <button class="card fin-link" data-act="sheet" data-arg="finance"><h3>투자 평가액 <span class="r">실현 손익 <b class="num ${pctCls(S.realized)}">${fmtSigned(S.realized)}</b></span></h3>
      <div class="big num">${fmtWon(stocks + b.dep + b.estate + b.lux)}</div>
      <div class="sub">현금 ${fmtWon(S.cash)} · 대출 ${fmtWon(S.bank.loan)}${b.jdep ? ' · 전세 보증금 ' + fmtWon(b.jdep) : ''}</div>
      <div class="sub num">받은 배당 ${fmtWon(S.divTotal)} · 낸 수수료 ${fmtWon(S.feePaid)} · 낸 세금 ${fmtWon(S.taxPaid)}</div>
      <span class="fin-more">상세 재무 내역 ${icon('next', 14)}</span></button>
    ${S.flags.account ? '' : '<div class="note warn">아직 증권 계좌가 없습니다. 이야기를 진행하세요.</div>'}
    <div class="tiles">
      ${tile('stocks', 'chart', '주식', fmtWon(stocks), '국내·해외·ETF·파생·코인')}
      ${tile('bank', 'bank', '은행', fmtWon(b.dep - b.loan), `예금 연 ${depRate().toFixed(1)}%`)}
      ${tile('estate', 'building', '부동산', fmtWon(b.estate), estN ? estN + '채 보유' : age() < 20 ? '엄마 명의로 매입' : '아파트 매입')}
      ${tile('estMgr', 'key', '부동산 관리', estN ? '월 ' + fmtSigned(ls.rent - ls.tax - ls.empty) : '-', S.home ? '거주 · ' + EST[S.home].name : emptyN ? `<em class="warn">빈 집 ${emptyN}채 · 세를 놓으세요</em>` : estN ? '거주·월세·전세' : '산 집에 살거나 세놓기')}
      ${tile('lux', 'watch', '명품', fmtWon(b.lux), luxN ? luxN + '점 보유' : '시계·가방·주얼리')}
      ${tile('lotto', 'ball', '로또 6/45', S.lotto ? `제${S.lotto.no}회` : curYM() < LOTTO_OPEN ? LOTTO_OPEN.replace('-', '.') + ' 시작' : '-', S.lotto ? `${S.lotto.tickets.length}/${LOTTO_MAX}장 · 번호 ${S.lotto.open}/6` : `1장 ${LOTTO_PRICE.toLocaleString()}원 · 달마다 ${LOTTO_MAX}장`)}
    </div>
    ${held.length ? `<div class="card"><h3>보유 종목</h3><div class="list">${held.map(id => {
      const h = S.hold[id], v = holdValue(id), pl = h.cost ? (v / h.cost - 1) * 100 : 0;
      return `<button class="li" data-act="openTicker" data-arg="${id}"><div class="nm"><em>${tkName(id)}</em></div><div class="pr num">${fmtWon(v)}</div>
        <div class="ds">${fmtQty(id, h.q)} · 평단 ${fmtWon(h.cost / h.q)}</div><div class="ch num">${pctSpan(pl)}</div></button>`;
    }).join('')}</div></div>` : ''}
  </div>`;
}

// ---- 인연 ----
function peopleHTML() {
  const list = metList();
  const seg = `<div class="seg wide">${[['map', '관계도'], ['list', '리스트']].map(([k, l]) => `<button class="${UI.pview === k ? 'on' : ''}" data-act="pview" data-arg="${k}">${l}</button>`).join('')}</div>`;
  const body = UI.pview === 'list'
    ? `<div class="card"><h3>인연 <span class="r">${list.length}명</span></h3><div class="list">${list.map(c => {
      const rl = relLabel(c.id), love = ['연인', '배우자', '썸'].includes(rl);
      return `<button class="person" data-act="person" data-arg="${c.id}">
        <div class="face">${portraitHTML(c.id)}</div>
        <div class="who"><b>${c.name}<small>${c.gender} · ${charAge(c.id)}살</small></b><span>${c.role} · ${c.feature}</span></div>
        <span class="rel ${love ? 'love' : ''}">${rl}</span></button>`;
    }).join('')}</div></div>`
    : relMapHTML();
  return `<div class="pad">${seg}${body}
    <div class="note">시간이 흐르고 이야기가 진행되면 새로운 사람을 만납니다. 대화·선물·${age() >= 17 ? '데이트' : '같이 놀기'}로 사이를 쌓으세요.</div></div>`;
}
// 관계도: 주인공을 가운데 두고 인물을 둘레에 놓는다. 가운데로 향하는 선은 나와의 관계(굵기 = 호감, 관계 이름은 인물 아래),
// 둘레의 점선은 인물끼리의 관계
// 서로 관계가 있는 사람끼리 이웃하게 놓는다 (점선이 가운데를 가로지르지 않게)
const MAP_ORDER = ['broker', 'mom', 'dad', 'sis', 'haeun', 'seoyun', 'taeho', 'teacher', 'chaerin', 'suyeon', 'gaeun', 'doyun', 'minji', 'hyunwoo', 'jisu'];
const KIND_COLOR = { family: '#d9962b', friend: '#3b7be0', romance: '#e0527e', mentor: '#1f9d55', rival: '#d64545' };
function relMapHTML() {
  const ids = [...MAP_ORDER.filter(id => S.people[id] && S.people[id].met), ...metList().map(c => c.id).filter(id => !MAP_ORDER.includes(id))];
  const n = ids.length, W = 360, H = n > 13 ? 470 : 420, cx = 180, cy = H / 2, sy = n > 13 ? 1.24 : 1.12;
  const R = n <= 4 ? 110 : n <= 8 ? 138 : 152;
  const pos = {};
  ids.forEach((id, i) => { const ang = -Math.PI / 2 + 2 * Math.PI * i / n; pos[id] = [cx + R * Math.cos(ang), cy + R * sy * Math.sin(ang)]; });
  const col = id => S.people[id].lover || S.people[id].spouse ? KIND_COLOR.romance : KIND_COLOR[CH[id].kind];
  // 점선 이름표는 인물 칸(얼굴·이름·관계)과 다른 이름표를 피해 빈자리를 찾아 놓는다
  const boxes = ids.map(id => { const [x, y] = pos[id]; return [x - 34, y - 38, x + 34, y + 38]; }).concat([[cx - 42, cy - 48, cx + 42, cy + 48]]);
  const hit = b => b[0] < 2 || b[2] > W - 2 || b[1] < 2 || b[3] > H - 2 || boxes.some(o => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
  function spot(x0, y0, dx, dy, w) {
    for (const s of [0, 12, -12, 24, -24, 36, -36, 48, -48, 60]) for (const v of [0, 14, -14, 28, -28]) {
      const x = x0 + dx * s - dy * v, y = y0 + dy * s + dx * v, b = [x - w / 2, y - 10, x + w / 2, y + 3];
      if (!hit(b)) { boxes.push(b); return [x, y]; }
    }
    return [x0, y0];
  }
  const links = REL_LINKS.filter(l => pos[l.a] && pos[l.b] && (!l.when || l.when())).map(l => {
    const [x1, y1] = pos[l.a], [x2, y2] = pos[l.b], mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    // 가운데 반대쪽으로 휘게 한다. 마주 보는 두 사람이면 가운데를 피해 옆으로 크게 돌린다
    const far = Math.hypot(mx - cx, my - cy) < 20, len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const qx = far ? mx - (y2 - y1) / len * R * 1.3 : mx + (mx - cx) * 0.5, qy = far ? my + (x2 - x1) / len * R * 1.3 : my + (my - cy) * 0.5;
    const px = 0.25 * x1 + 0.5 * qx + 0.25 * x2, py = 0.25 * y1 + 0.5 * qy + 0.25 * y2, d = Math.hypot(px - cx, py - cy) || 1;
    const [lx, ly] = spot(px, py, (px - cx) / d, (py - cy) / d, l.t.length * 9.5 + 6);
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${l.bad ? 'var(--bad)' : 'var(--muted)'}" stroke-width="1.3" stroke-dasharray="${l.bad ? '5 3' : '2 3'}" opacity=".85"/>
      <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" class="map-link ${l.bad ? 'bad' : ''}">${l.t}</text>`;
  }).join('');
  const spokes = ids.map(id => {
    const [x, y] = pos[id], w = Math.max(1.2, S.people[id].aff / 22);
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${col(id)}" stroke-width="${w.toFixed(1)}" stroke-linecap="round" opacity=".5"/>`;
  }).join('');
  const nodes = ids.map(id => { const [x, y] = pos[id];
    return `<button class="map-node" style="left:${(x / W * 100).toFixed(2)}%;top:${(y / H * 100).toFixed(2)}%;--c:${col(id)}" data-act="person" data-arg="${id}">
      <span class="face">${portraitHTML(id)}</span><b>${CH[id].name}</b><span class="rel-chip">${relLabel(id)}</span></button>`; }).join('');
  const me = `<div class="map-me" style="left:50%;top:${(cy / H * 100).toFixed(2)}%"><span class="face">${playerFace()}</span><b>${esc(S.name)}</b><small>${age()}살 · 나</small></div>`;
  const legend = [['family', '가족'], ['friend', '친구'], ['romance', '연애'], ['mentor', '어른'], ['rival', '경계']].map(([k, l]) => `<span><i style="background:${KIND_COLOR[k]}"></i>${l}</span>`).join('');
  return `<div class="card"><h3>관계도 <span class="r">${n}명</span></h3>
    <div class="relmap" style="aspect-ratio:${W}/${H}"><svg class="relmap-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true">${links}${spokes}</svg>${nodes}${me}</div>
    <div class="map-legend">${legend}<span>선 굵기 = 호감</span><span>점선 = 서로의 관계</span><span class="bad">빨간 점선 = 악연</span></div></div>`;
}

// ---- 상태 ----
const ASSET_ROWS = [['cash', '현금', '#8aa0b8'], ['dep', '예금', '#5fa8d3'], ['KS', '코스피', '#e5484d'], ['KQ', '코스닥', '#f08a5d'], ['US', '해외 주식', '#7c4dff'],
  ['ETF', 'ETF', '#b36ae2'], ['COIN', '코인', '#f0b43c'], ['fut', '선물', '#3ccf7e'], ['opt', '옵션', '#2a9d8f'], ['bond', '채권', '#6b7a8c'], ['estate', '부동산', '#8d6e63'], ['lux', '명품', '#e0527e']];
function statusHTML() {
  const b = breakdown(), nw = netWorth();
  const pos = ASSET_ROWS.map(([k, l, c]) => [k, l, c, Math.max(0, b[k])]).filter(r => r[3] > 0);
  const tot = pos.reduce((s, r) => s + r[3], 0) || 1;
  const hv = S.hist.map(h => h.nw);
  const labels = yearLabels(S.hist.map(h => h.mi));
  const st = ['int', 'hp', 'cha', 'fame'];
  const sp = spouseId(), lv = loverId();
  return `<div class="pad">
    <div class="card"><h3>순자산 <span class="r">이달 <b class="num ${pctCls(nw - S.monthStartNW)}">${fmtSigned(nw - S.monthStartNW)}</b></span></h3>
      <div class="big num">${fmtWon(nw, false)}</div><div class="sub num">${fmtWon(nw, true)}</div>
      <div class="stack" style="margin-top:10px">${pos.map(r => `<i style="width:${(r[3] / tot * 100).toFixed(2)}%;background:${r[2]}"></i>`).join('')}</div>
      <div class="legend">${pos.map(r => `<b><i style="background:${r[2]}"></i>${r[1]}</b><span class="num">${fmtWon(r[3])} <small class="muted">${(r[3] / tot * 100).toFixed(1)}%</small></span>`).join('')}
        ${b.loan ? `<b><i style="background:var(--bad)"></i>대출</b><span class="num bad">-${fmtWon(b.loan)}</span>` : ''}
        ${b.jdep ? `<b><i style="background:var(--bad)"></i>전세 보증금</b><span class="num bad">-${fmtWon(b.jdep)}</span>` : ''}
        <b class="muted">실현 손익 누계</b><span class="num ${pctCls(S.realized)}">${fmtSigned(S.realized)}</span>
        <b class="muted">받은 배당 누계 (세후)</b><span class="num good">${fmtWon(S.divTotal)}</span>
        <b class="muted">낸 수수료 누계</b><span class="num">${fmtWon(S.feePaid)}</span>
        <b class="muted">낸 세금 누계</b><span class="num">${fmtWon(S.taxPaid)}</span></div></div>
    <div class="card"><h3>자산 흐름 <span class="r">로그 눈금</span></h3>${lineChart(hv, { log: true, labels, color: 'var(--accent)', fmt: v => fmtWon(v), label: '순자산 흐름' })}</div>
    <div class="card"><h3>능력치</h3>
      ${st.map(k => { const v = stat(k), bonus = v - S.st[k];
        return `<div class="statrow"><span>${STAT_NAME[k]}</span><div class="bar"><i style="width:${Math.min(100, S.st[k])}%"></i>${bonus > 0 ? `<i class="plus" style="width:${Math.min(100 - Math.min(100, S.st[k]), bonus)}%"></i>` : ''}</div><span class="num">${Math.round(v)}${bonus > 0 ? `<small class="gemc"> +${Math.round(bonus)}</small>` : ''}</span></div>`; }).join('')}
      <div class="statrow"><span>체력</span><div class="bar"><i style="width:${S.sta / maxSta() * 100}%;background:var(--good)"></i></div><span class="num">${Math.round(S.sta)}</span></div>
      ${luxCha() ? `<div class="sub">명품 덕분에 매력 +${luxCha()}</div>` : ''}
      ${homeTier() ? `<div class="sub">${EST[S.home].name}(${homeTier().name})에 살아서 ${homeFxText()}</div>` : ''}
      <div class="sub">보라색 막대는 장비·명품·집으로 더해진 몫입니다. 공부·운동으로 오르는 양은 높을수록 줄어듭니다.</div>
      <div class="sub" style="margin-top:6px;line-height:1.6">지성: 수능·급여, 달마다 폭등·폭락 기억(${HINT_MIN_INT}부터), 양다리 들킬 확률↓<br>건강: 최대 체력 · 매력: 호감, 고백, 거래 협상, 새 인연<br>인기: SNS 수입(${SNS_INCOME_FROM}년부터), 새 인연, 광고 제안(${SPONSOR_FAME}부터) · SNS를 쉬면 조금씩 줄어듭니다</div></div>
    <div class="card"><h3>장착 <span class="r">눌러서 바꾸기</span></h3><div class="equip">${SLOTS.map(([s, l]) => { const id = S.equip[s], g = id && GR[id];
      return `<button class="eslot ${g ? 'g-' + g.g : ''}" data-act="slot" data-arg="${s}"><small>${l}</small><b>${g ? gradeTag(g.g) + g.name : '비어 있음'}</b>${g ? `<span>${fxText(g.fx)}${g.perk ? ' · ' + PERK_TEXT[g.perk] : ''}</span>` : ''}</button>`; }).join('')}</div></div>
    ${S.bets.length ? `<div class="card"><h3>진행 중인 내기</h3><div class="list">${S.bets.map(b => { const q = SPORT[b.id];
      return `<div class="li"><div class="nm"><em>${q.title}</em></div><div class="pr num">${fmtWon(b.stake)}</div><div class="ds">${q.opts[b.k][0]} · 배당 ${b.odds || q.opts[b.k][1]}배 · ${fmtYM(miOf(q.end))} 발표</div><div class="ch num">→ ${fmtWon(Math.round(b.stake * (b.odds || q.opts[b.k][1])))}</div></div>`; }).join('')}</div></div>` : ''}
    <div class="card"><h3>프로필</h3><div class="kv">
      <b>이름</b><span>${esc(S.name)}</span><b>나이</b><span>${age()}살 (${BIRTH_YEAR}년생)</span><b>지금</b><span>${schoolLabel()}</span><b>사는 곳</b><span>${homeLabel()}</span>
      <b>학력</b><span>${S.edu ? EDU[S.edu].label : '-'}</span><b>직업</b><span>${S.job === 'office' ? '회사원' : S.job === 'investor' ? '전업 투자자' : '-'}</span>
      <b>곁에 있는 사람</b><span>${sp ? CH[sp].name + ' (배우자)' : lv ? CH[lv].name + ' (연인)' : '-'}</span>
      <b>SNS 월 수입</b><span>${snsIncome() ? fmtWon(snsIncome()) : year() < SNS_INCOME_FROM ? SNS_INCOME_FROM + '년부터' : '인기 20 넘으면'}</span>
      <b>매력 협상</b><span>${haggle() ? (haggle() * 100).toFixed(1) + '% 유리' : '매력 30 넘으면'}</span>
      ${partners().length >= 2 ? `<b>양다리 들킬 확률</b><span class="bad">월 ${Math.round(cheatRisk() * 100)}%</span>` : ''}
      <b>계좌 명의</b><span>${age() < 20 ? '엄마 명의' : '본인 명의'}</span></div></div>
  </div>`;
}
function yearLabels(mis) {
  const n = mis.length; if (!n) return [];
  const yrs = (mis[n - 1] - mis[0]) / 12, step = yrs > 16 ? 5 : yrs > 6 ? 2 : 1;
  const out = [];
  mis.forEach((mi, i) => { const ym = ymOf(mi); if (ym.endsWith('-01') && (+ym.slice(0, 4)) % step === 0) out.push([i, "'" + ym.slice(2, 4)]); });
  return out;
}

// ---- 시트 ----
function sheetHTML() {
  const map = { lotto: lottoSheet, stocks: stocksSheet, bank: bankSheet, estate: estateSheet, estMgr: estMgrSheet, finance: financeSheet, lux: luxSheet, person: personSheet, shop: shopSheet, slot: slotSheet, log: logSheet,
    settings: settingsSheet, gemshop: gemShopSheet, recall: recallSheet, ending: endingSheet };
  const r = (map[UI.sheet] || (() => ({ title: '', body: '' })))();
  return `<div class="sheet" data-act="scrim"><div class="sheet-panel ${r.short ? 'short' : ''}">
    <div class="sheet-head">${r.back ? `<button class="icon-btn" data-act="${r.back}" aria-label="뒤로">${icon('back', 18)}</button>` : ''}<h2>${r.title}</h2>
      <button class="icon-btn" data-act="close" aria-label="닫기">${icon('close', 18)}</button></div>
    <div class="sheet-body">${r.body}</div>${r.foot ? `<div class="sheet-foot">${r.foot}</div>` : ''}</div></div>`;
}
const amtBox = (quick) => `<div class="qty" style="grid-template-columns:1fr"><input type="number" inputmode="numeric" min="0" data-input="amt" value="${Math.floor(UI.amt)}" aria-label="금액"></div>
  <div class="sub num" id="amtLabel" style="text-align:right">${fmtWon(UI.amt)}</div>
  <div class="quick">${quick.map(([l, v]) => `<button data-act="amtSet" data-arg="${v}">${l}</button>`).join('')}</div>`;
const cashQuick = () => [['10만', 100000], ['100만', 1000000], ['1000만', 10000000], ['1억', 100000000], ['전액', Math.max(0, Math.floor(S.cash))]];

// 주식 매매 창
function stocksSheet() {
  const chips = `<div class="chips">${TABS.map(t => { const open = tabOpen(t.id);
    return `<button class="${UI.ftab === t.id ? 'on' : ''} ${open ? '' : 'locked'}" data-act="ftab" data-arg="${t.id}">${open ? '' : icon('lock', 13)}${t.label}</button>`; }).join('')}</div>`;
  if (UI.sel && TK[UI.sel]) return { title: tkName(UI.sel), back: 'unsel', body: tickerDetail(UI.sel), foot: orderCard(UI.sel) };   // 주문창은 아래에 붙어 있다
  let body;
  if (!tabOpen(UI.ftab)) { const t = TABS.find(x => x.id === UI.ftab); body = `<div class="note">${icon('lock', 14)} ${t.why || ''} · ${t.open.replace('-', '년 ')}월에 열립니다.</div>`; }
  else if (UI.ftab === 'FUT') body = futuresView();
  else if (UI.ftab === 'OPT') body = optionsView();
  else if (UI.ftab === 'BOND') body = bondsView();
  else body = tickerList(UI.ftab);
  return { title: '주식 매매', body: chips + (S.flags.account ? '' : '<div class="note warn">아직 증권 계좌가 없습니다.</div>') + body };
}
function tickerList(tab) {
  const inTab = t => tab === 'ETF' || tab === 'US' || tab === 'COIN' ? t.tab === tab : (Array.isArray(t.tab) ? tkTab(t.id) === tab : t.tab === tab);
  const now = sortTickers(TICKERS.filter(t => inTab(t) && listed(t.id)), UI.sort);
  const later = TICKERS.filter(t => !listed(t.id) && MARKET.s[t.id] && MARKET.s[t.id].c.slice(S.mi).some(v => v != null) && (tab === 'ETF' || tab === 'US' || tab === 'COIN' ? t.tab === tab : byDate(t.tab, ymOf(MARKET.s[t.id].c.findIndex(v => v != null))) === tab));
  const row = t => { const id = t.id, h = S.hold[id], cap = UI.sort === 'cap' ? mcap(id) : 0, ret = h && h.cost ? (holdValue(id) / h.cost - 1) * 100 : null;
    return `<div class="li tk rows"><button class="tk-main" data-act="sel" data-arg="${id}"><div class="nm"><em>${tkName(id)}</em>${ret != null ? `<span class="badge ${ret >= 0 ? 'upb' : 'downb'} num">보유 ${fmtPct(ret)}</span>` : ''}${hintFor(id) ? `<span class="badge ${hintFor(id).up ? 'upb' : 'downb'}">💭 ${hintFor(id).up ? '폭등' : '폭락'}</span>` : ''}${S.reveal[id] >= S.mi ? '<span class="badge gem">기억</span>' : ''}</div>
      <div class="pr num">${fmtPrice(id, price(id))}</div><div class="ds">${cap ? '시총 ' + fmtWon(cap) + ' · ' : ''}${t.desc}</div><div class="ch num">${pctSpan(changePct(id))}</div></button>
      <div class="tk-btns"><button class="mini buy" data-act="ordOpen" data-arg="stock:${id}:buy">매수</button><button class="mini sell" data-act="ordOpen" data-arg="stock:${id}:sell" ${h ? '' : 'disabled'}>매도</button></div></div>`; };
  const sortSeg = `<div class="seg wide sort">${SORTS.map(([k, l]) => `<button class="${UI.sort === k ? 'on' : ''}" data-act="sort" data-arg="${k}">${l}</button>`).join('')}</div>`;
  return `${sortSeg}<div class="card"><h3>${TABS.find(x => x.id === tab).label} <span class="r">${{ base: '이번 달 등락', cap: '시가총액 큰 순', up: '이번 달 상승률 순', down: '이번 달 하락률 순' }[UI.sort]}</span></h3><div class="list">${now.map(row).join('') || '<div class="sub">거래할 수 있는 종목이 없습니다.</div>'}</div></div>
    ${later.length ? `<div class="card"><h3>상장 예정 <span class="r">전생의 기억</span></h3><div class="list">${later.map(t => { const fi = MARKET.s[t.id].c.findIndex(v => v != null);
      return `<div class="li"><div class="nm"><em>${tkName(t.id, ymOf(fi))}</em><span class="badge lock">${fmtYM(fi)}</span></div><div></div><div class="ds">${t.desc}</div></div>`; }).join('')}</div></div>` : ''}
    ${tab === 'KS' || tab === 'KQ' ? '<div class="sub">2000년 이전 일부 종목은 지수 흐름으로 추정한 값입니다.</div>' : ''}`;
}
function axisFmt(cur) { return v => cur === 'USD' ? '$' + (+v.toPrecision(3)).toLocaleString('en-US') : v >= 1e4 ? (+(v / 1e4).toPrecision(3)).toLocaleString() + '만' : Math.round(v).toLocaleString(); }
function revealLabel(key) {
  if (key.startsWith('re:')) return EST[key.slice(3)].name;
  if (key.startsWith('idx:')) return { ks200: '코스피200', ndx: '나스닥100', kospi: '코스피' }[key.slice(4)] || key;
  return TK[key] ? tkName(key) : key;
}
// 기억 떠올리기 상자: 떠올린 달의 값과, 다음 달을 떠올리는 버튼. valAt(mi) 는 지금 기준으로 맞춘 값
function revealBox(key, valAt, fmt) {
  const to = revealedTo(key), now = valAt(S.mi), rows = [];
  for (let mi = S.mi + 1; mi <= to; mi++) {
    const v = valAt(mi); if (v == null) continue;
    const r = (v / now - 1) * 100;
    rows.push(`<span class="num">${fmtYM(mi)}</span><b class="num">${fmt(v)}</b><span class="num ${pctCls(r)}">${fmtPct(r, 1)}</span>`);
  }
  // 1개월: 한 달 더 · 6·12개월: 지금부터 그만큼 뒤까지 (비용은 아직 안 떠올린 달들의 합)
  const btns = [[1, revealAhead(key) ? '한 달 더' : '1개월'], [6, '6개월'], [12, '12개월']].map(([m, l]) => {
    const can = m === 1 ? canReveal(key) : Math.min(S.mi + m, LAST_MI) > to, cost = m === 1 ? revealCost(key) : revealCostTo(key, m);
    return `<button class="btn gem sm" data-act="revealN" data-arg="${key}|${m}" ${can ? '' : 'disabled'}>${l}<small>💎${can ? cost : '-'}</small></button>`;
  }).join('');
  const btn = to >= LAST_MI || revealAhead(key) >= REVEAL_COST.length
    ? `<span class="sub">${to >= LAST_MI ? '더 먼 미래의 기억은 없습니다.' : '1년 뒤까지 떠올렸습니다.'}</span>`
    : `<div class="reveal-btns"><span class="sub">${icon('gem', 13)} 기억해내기</span>${btns}</div>`;
  return `<div class="memo-box">${rows.length ? `<div class="fut-list">${rows.join('')}</div>` : '<div class="sub">한 번에 한 달씩, 최대 1년 뒤까지 떠올릴 수 있습니다. 멀리 볼수록 보석이 더 듭니다.</div>'}
    <div class="row" style="margin-top:8px">${btn}</div></div>`;
}
function tickerChart(id, adj) {
  const rv = revealedTo(id);
  const first = adj.findIndex(v => v != null);
  const span = UI.range === '1y' ? 12 : UI.range === '5y' ? 60 : 9999;
  const start = Math.max(first, S.mi - span);
  const mis = []; for (let mi = start; mi <= rv; mi++) mis.push(mi);
  return lineChart(adj.slice(start, rv + 1), { split: S.mi - start, log: UI.range === 'all', labels: yearLabels(mis), fmt: axisFmt(TK[id].cur), label: tkName(id) + ' 시세' });
}
function tickerDetail(id) {
  const t = TK[id], p = price(id), u = unitKRW(id), h = S.hold[id];
  const adj = adjSeries(id, revealedTo(id));
  return `<div class="card"><div class="row"><span class="badge">${TABS.find(x => x.id === (t.tab === 'COIN' || t.tab === 'ETF' || t.tab === 'US' ? t.tab : tkTab(id))).label}</span><span class="sub">${t.desc}</span></div>
      <div class="row" style="margin-top:6px;align-items:baseline"><div class="big num">${fmtPrice(id, p)}</div>${pctSpan(changePct(id))}<span class="sub">지난달 대비</span></div>
      ${t.cur === 'USD' ? `<div class="sub num">≈ ${fmtWon(u)} · 환율 ${Math.round(fxNow()).toLocaleString()}원</div>` : ''}
      ${mcap(id) ? `<div class="sub num">${MARKET.s[id].na ? '순자산(추정)' : '시가총액'} ${fmtWon(mcap(id))}</div>` : ''}
      <div class="row" style="margin:10px 0 4px"><div class="seg">${[['1y', '1년'], ['5y', '5년'], ['all', '전체']].map(([k, l]) => `<button class="${UI.range === k ? 'on' : ''}" data-act="range" data-arg="${k}">${l}</button>`).join('')}</div></div>
      ${tickerChart(id, adj)}${revealBox(id, mi => adj[mi], v => fmtPrice(id, v))}</div>
    ${h ? `<div class="card"><h3>보유</h3><div class="kv"><b>수량</b><span class="num">${fmtQty(id, h.q)}</span><b>평균 단가</b><span class="num">${fmtWon(h.cost / h.q)}</span>
      <b>평가액</b><span class="num">${fmtWon(h.q * u)}</span><b>손익</b><span class="num ${pctCls(h.q * u - h.cost)}">${fmtSigned(h.q * u - h.cost)} (${fmtPct((h.q * u / h.cost - 1) * 100)})</span></div></div>` : ''}
    ${costCard(id)}`;
}
const pct3 = r => +(r * 100).toFixed(3) + '%';
// 배당과 거래 비용 안내
function costCard(id) {
  const t = TK[id], ym = curYM(), h = S.hold[id], dy = isCoin(id) ? 0 : trailingDiv(id), dm = isCoin(id) ? [] : divMonths(id);
  const fx = t.cur === 'USD' ? fxNow() : 1;
  const fee = isCoin(id) ? `거래소 ${pct3(feeCoin(ym))}` : t.cur === 'USD' ? `수수료 ${pct3(feeUSComm(ym))} + 환전 ${pct3(fxSpread(ym))}` : pct3(feeKR(ym));
  return `<div class="card"><h3>배당·비용 <span class="r">수수료는 살 때·팔 때 모두</span></h3><div class="kv cost">
    ${isCoin(id) ? '' : `<b>1년 배당 (1주)</b><span class="num">${dy ? fmtPrice(id, dy) + ' · 시가배당률 ' + (dy / price(id) * 100).toFixed(2) + '%/년' : '없음'}</span>`}
    ${dm.length ? `<b>배당 달</b><span>${dm.join('·')}월</span>` : ''}
    ${h && dy ? `<b>내 예상 배당</b><span class="num good">${fmtWon(h.q * dy * fx * (1 - divTax(id)))} / 년 (세후)</span>` : ''}
    <b>매매 수수료</b><span class="num">${fee}</span>
    ${sellTaxRate(id) ? `<b>거래세 (팔 때)</b><span class="num">${pct3(sellTaxRate(id))}</span>` : ''}
    ${isCoin(id) ? '' : `<b>배당 세금</b><span>${t.cur === 'USD' ? '미국 원천징수 15%' : '배당소득세 15.4%'}</span>`}
    ${isUSStock(id) ? `<b>양도세</b><span>연 차익 250만원 초과분 22% · 다음 해 5월</span>` : ''}
  </div></div>`;
}
// 주문: 매수·매도를 먼저 고르고, 막대를 끌어 수량을 정하고, 비율 버튼으로 빠르게 맞춘다
function orderMax(id) {
  if (UI.side === 'sell') return S.hold[id] ? S.hold[id].q : 0;
  return canTrade(id) ? 0 : maxBuy(id);
}
function tradeEst(id) {
  const g = UI.qty * unitKRW(id);
  const fee = g * feeRate(id);
  if (UI.side !== 'sell') return `예상 ${fmtWon(g + fee)} (수수료 ${fmtWon(fee)} 포함)`;
  const tax = g * sellTaxRate(id);
  return `받을 돈 ${fmtWon(g - fee - tax)} (수수료 ${fmtWon(fee)}${tax ? ' · 거래세 ' + fmtWon(tax) : ''} 뺌)`;
}
function orderCard(id) {
  const sell = UI.side === 'sell', max = orderMax(id), step = qtyStep(id);
  UI.qty = Math.min(UI.qty, max);
  const why = sell ? '보유 수량이 없습니다.' : canTrade(id) || '현금이 부족하거나 한 종목 한도에 닿았습니다.';
  return `<div class="dock">
    <div class="dock-row"><div class="seg side"><button class="${sell ? '' : 'on buy'}" data-act="side" data-arg="buy">매수</button><button class="${sell ? 'on sell' : ''}" data-act="side" data-arg="sell">매도</button></div>
      <span class="sub num dock-info">${sell ? `보유 ${fmtQty(id, max)}` : `최대 ${fmtQty(id, max)} · 현금 ${fmtWon(S.cash)}`}</span></div>
    ${max > 0 ? `<input type="range" class="qty-range ${sell ? 'sell' : 'buy'}" min="0" max="${max}" step="${step}" value="${UI.qty}" data-input="qty" aria-label="수량">
      <div class="dock-row"><b class="num qty-big" id="qtyLabel">${fmtQty(id, UI.qty)}</b><span class="num sub dock-est" id="estLabel">${tradeEst(id)}</span></div>
      <div class="dock-row"><div class="quick q4">${[[0.1, '10%'], [0.25, '25%'], [0.5, '50%'], [1, '최대']].map(([p, l]) => `<button data-act="pct" data-arg="${p}">${l}</button>`).join('')}</div>
        <button class="btn ${sell ? 'sell' : 'buy'} dock-go" id="tradeBtn" data-act="trade" data-arg="${id}" ${UI.qty > 0 ? '' : 'disabled'}>${sell ? '매도하기' : '매수하기'}</button></div>`
      : `<div class="note">${why}</div>`}
  </div>`;
}
// 선물 포지션 한 줄 (목록과 주문창에서 같이 쓴다)
function futPosStrip(fid) {
  const pos = S.fut[fid]; if (!pos) return '';
  const pl = futPL(fid);
  return `<div class="ord-pos"><span>${pos.dir > 0 ? '<b class="up">롱</b>' : '<b class="down">숏</b>'} ${pos.q}계약 · 진입 <b class="num">${pos.entry.toFixed(2)}</b><br><small class="muted num">증거금 ${fmtWon(pos.margin)}</small></span>
    <span class="num ${pctCls(pl)}"><b>${fmtSigned(pl)}</b><br><small>${fmtPct(pl / pos.margin * 100)}</small></span><button class="btn ghost sm" data-act="futClose" data-arg="${fid}">청산</button></div>`;
}
function futuresView() {
  return `<div class="note">선물은 지수가 오를지(<b class="up">롱</b>) 내릴지(<b class="down">숏</b>)에 거는 계약입니다. 계약 금액의 ${FUT_MARGIN * 100}%만 증거금으로 맡기고, 달이 바뀔 때 증거금이 ${FUT_CUT * 100}% 아래로 떨어지면 강제 청산됩니다.</div>` + FUTURES.map(f => {
    if (!futOpen(f.id)) return `<div class="card"><h3>${f.name}</h3><div class="note">${icon('lock', 14)} ${f.open.replace('-', '년 ')}월 상장</div></div>`;
    const p = futPrice(f.id), key = 'idx:' + f.idx;
    const mis = []; for (let mi = Math.max(0, S.mi - 36); mi <= revealedTo(key); mi++) mis.push(mi);
    return `<div class="card dv"><div class="dv-head"><div><b>${f.name}</b><span class="sub num">1포인트 = ${fmtWon(futMultKRW(f.id))}</span></div>
        <div class="dv-px"><b class="num">${p.toFixed(2)}</b>${pctSpan(macroChange(f.idx))}</div></div>
      ${lineChart(mis.map(mi => macroAt(f.idx, mi)), { split: S.mi - mis[0], labels: yearLabels(mis), label: f.name })}
      ${revealBox(key, mi => macroAt(f.idx, mi), v => v.toFixed(2))}
      ${futPosStrip(f.id)}
      <button class="btn dv-go" data-act="ordOpen" data-arg="fut:${f.id}">주문하기 <small class="num">1계약 ${fmtWon(futUnitCost(f.id))}</small></button></div>`;
  }).join('');
}
function optionsView() {
  const s = macro('ks200'), key = 'idx:ks200', chain = optChain();
  const mis = []; for (let mi = Math.max(0, S.mi - 36); mi <= revealedTo(key); mi++) mis.push(mi);
  const rows = chain.map(({ K }) => `<button class="li oc" data-act="ordOpen" data-arg="opt:${K}"><span class="num">${K.toFixed(1)}</span><span class="num up">${fmtWon(optUnitCost('C', K))}</span><span class="num down">${fmtWon(optUnitCost('P', K))}</span></button>`).join('');
  const mine = S.opt.map((o, i) => { const v = optValue(o);
    return `<div class="li tk"><div class="tk-main"><div class="nm"><em>${o.type === 'C' ? '콜' : '풋'} ${o.K.toFixed(1)}</em><span class="badge">${o.q}계약</span></div><div class="pr num">${fmtWon(v)}</div>
      <div class="ds">산 금액 ${fmtWon(o.cost)}</div><div class="ch num">${pctSpan((v / o.cost - 1) * 100)}</div></div>
      <div class="tk-btns"><button class="mini sell" data-act="optSell" data-arg="${i}">매도</button></div></div>`; }).join('');
  return `<div class="card dv"><div class="dv-head"><div><b>코스피200 옵션</b><span class="sub">만기 ${fmtYM(Math.min(LAST_MI, S.mi + 1))} 말 · 1포인트 = ${fmtWon(OPT_MULT)}</span></div>
      <div class="dv-px"><b class="num">${s.toFixed(2)}</b>${pctSpan(macroChange('ks200'))}</div></div>
    ${lineChart(mis.map(mi => macroAt('ks200', mi)), { split: S.mi - mis[0], labels: yearLabels(mis), label: '코스피200' })}
    ${revealBox(key, mi => macroAt('ks200', mi), v => v.toFixed(2))}
    <div class="oc-head sub"><span>행사가</span><span>콜 1계약 (오르면)</span><span>풋 1계약 (내리면)</span></div>
    <div class="list">${rows}</div>
    <button class="btn dv-go" data-act="ordOpen" data-arg="opt:">주문하기</button></div>
    ${mine ? `<div class="card"><h3>보유 옵션 <span class="r">다음 달로 넘어갈 때 정산</span></h3><div class="list">${mine}</div></div>` : ''}
    <div class="note">이번 달 종가로 사서, 다음 달로 넘어갈 때 그달 종가로 정산합니다. 콜은 지수가 행사가보다 높을수록, 풋은 낮을수록 돈이 되고, 아니면 0원이 됩니다. 수수료 ${pct3(OPT_FEE)} · 변동성 ${(optVol(S.mi) * 100).toFixed(0)}%</div>`;
}
function bondsView() {
  const list = BONDS.map(b => `<div class="li tk"><div class="tk-main"><div class="nm"><em>${b.name}</em></div><div class="pr num up">연 ${bondYield(b.id).toFixed(2)}%</div>
      <div class="ds">만기 ${b.term / 12}년${b.cur === 'USD' ? ' · 달러 자산(환율 영향)' : ''}</div><div class="ch"></div></div>
    <div class="tk-btns"><button class="mini buy" data-act="ordOpen" data-arg="bond:${b.id}">매수</button></div></div>`).join('');
  const mine = S.bonds.map(pos => { const v = bondValue(pos);
    return `<div class="li tk"><div class="tk-main"><div class="nm"><em>${BOND[pos.b].name}</em></div><div class="pr num">${fmtWon(v)}</div>
      <div class="ds">연 ${pos.y.toFixed(2)}% · ${fmtYM(pos.mat)} 만기</div><div class="ch num">${pctSpan((v / bondCost(pos) - 1) * 100)}</div></div>
      <div class="tk-btns"><button class="mini sell" data-act="bondSell" data-arg="${pos.u}">매도</button></div></div>`; }).join('');
  return `<div class="card"><h3>채권 <span class="r">금리가 오르면 값이 내립니다</span></h3><div class="list">${list}</div></div>
    ${mine ? `<div class="card"><h3>보유 채권 <span class="r">이자는 매달 현금으로</span></h3><div class="list">${mine}</div></div>` : ''}`;
}

// ---- 가운데 주문창 ----
// 주식: 매수/매도 고르기 · 선물: 수량 고르고 롱/숏 · 옵션: 행사가·수량 고르고 콜/풋 · 채권: 금액 고르고 매수
function ordEst() {
  const o = UI.order, q = UI.qty;
  if (o.kind === 'fut') { const v = futPrice(o.id) * futMultKRW(o.id) * q; return `증거금 ${fmtWon(v * FUT_MARGIN)} · 수수료 ${fmtWon(v * FUT_FEE)}`; }
  if (o.kind === 'opt') return `콜 ${fmtWon(optUnitCost('C', o.K) * q)} · 풋 ${fmtWon(optUnitCost('P', o.K) * q)}`;
  if (o.kind === 'bond') return `이자 달마다 약 ${fmtWon(UI.amt * bondYield(o.id) / 1200 * (1 - INTEREST_TAX))}`;
  return '';
}
// 계약 수 막대 + 비율 버튼 + 실행 버튼 둘
function contractDock(max, go, note) {
  UI.qty = Math.min(UI.qty, max);
  return `<div class="dock"><div class="dock-row"><span class="sub">수량</span><span class="sub num dock-info">최대 ${max.toLocaleString()}계약 · 현금 ${fmtWon(S.cash)}</span></div>
    ${max > 0 ? `<input type="range" class="qty-range" min="0" max="${max}" step="1" value="${UI.qty}" data-input="qty" aria-label="계약 수">
      <div class="dock-row"><b class="num qty-big" id="qtyLabel">${UI.qty.toLocaleString()}계약</b><span class="num sub dock-est" id="estLabel">${ordEst()}</span></div>
      <div class="quick q4">${[[0.1, '10%'], [0.25, '25%'], [0.5, '50%'], [1, '최대']].map(([p, l]) => `<button data-act="pct" data-arg="${p}">${l}</button>`).join('')}</div>
      <div class="ord-go2">${go.map(([arg, cls, label, sub, unit, lock]) => `<button class="btn ${cls} ord-go" data-act="ordGo" data-arg="${arg}" data-unit="${unit}"${lock ? ' data-lock="1" disabled' : UI.qty > 0 && UI.qty * unit <= S.cash + 1e-6 ? '' : ' disabled'}>${label}<small>${sub}</small></button>`).join('')}</div>`
      : `<div class="note">${note}</div>`}</div>`;
}
function orderPopHTML() {
  const o = UI.order; let kind = '', name = '', body = '';
  if (o.kind === 'stock') {
    const id = o.id, h = S.hold[id], t = TK[id];
    kind = TABS.find(x => x.id === (t.tab === 'COIN' || t.tab === 'ETF' || t.tab === 'US' ? t.tab : tkTab(id))).label; name = tkName(id);
    body = `<div class="ord-price"><b class="num">${fmtPrice(id, price(id))}</b>${pctSpan(changePct(id))}<span class="sp"></span>
        ${h ? `<span class="sub num">보유 ${fmtQty(id, h.q)} · ${pctSpan((holdValue(id) / h.cost - 1) * 100)}</span>` : ''}</div>
      ${orderCard(id)}
      <button class="btn ghost sm" data-act="ordDetail">차트·상세 보기 ${icon('next', 14)}</button>`;
  } else if (o.kind === 'fut') {
    const f = FUT[o.id], pos = S.fut[o.id];
    kind = '선물'; name = f.name;
    body = `<div class="ord-price"><b class="num">${futPrice(o.id).toFixed(2)}</b>${pctSpan(macroChange(f.idx))}<span class="sp"></span><span class="sub num">1포인트 = ${fmtWon(futMultKRW(o.id))}</span></div>
      ${futPosStrip(o.id)}
      ${contractDock(futMax(o.id), [['1', 'buy', '롱 ▲', '오르면 이익', futUnitCost(o.id), pos && pos.dir < 0], ['-1', 'sell', '숏 ▼', '내리면 이익', futUnitCost(o.id), pos && pos.dir > 0]],
        pos && pos.q >= POS_LIMIT.fut ? '포지션 한도(' + POS_LIMIT.fut + '계약)에 닿았습니다.' : '증거금이 부족합니다. (1계약 ' + fmtWon(futUnitCost(o.id)) + ')')}
      ${pos ? `<div class="sub">반대 방향은 지금 포지션을 청산한 뒤에 걸 수 있습니다.</div>` : ''}`;
  } else if (o.kind === 'opt') {
    const chain = optChain(), s = macro('ks200');
    if (!chain.some(c => c.K === o.K)) o.K = chain.reduce((a, c) => Math.abs(c.K - s) < Math.abs(a.K - s) ? c : a).K;   // 처음엔 지금 지수에 가장 가까운 행사가
    const K = o.K, atm = chain.reduce((a, c) => Math.abs(c.K - s) < Math.abs(a.K - s) ? c : a).K;
    kind = '옵션 · 만기 ' + fmtYM(Math.min(LAST_MI, S.mi + 1)) + ' 말'; name = '코스피200 옵션';
    body = `<div class="ord-price"><span class="sub">코스피200</span><b class="num">${s.toFixed(2)}</b>${pctSpan(macroChange('ks200'))}</div>
      <div class="sub">행사가</div>
      <div class="chips kchips">${chain.map(c => `<button class="${c.K === K ? 'on' : ''}" data-act="ordK" data-arg="${c.K}">${c.K.toFixed(1)}${c.K === atm ? ' · 지금' : ''}</button>`).join('')}</div>
      <div class="opt-prem"><div><small>콜 1계약 · 오르면 이익</small><b class="num up">${fmtWon(optUnitCost('C', K))}</b><span class="sub num">${optPremium('C', K).toFixed(2)}포인트</span></div>
        <div><small>풋 1계약 · 내리면 이익</small><b class="num down">${fmtWon(optUnitCost('P', K))}</b><span class="sub num">${optPremium('P', K).toFixed(2)}포인트</span></div></div>
      ${contractDock(optMax(K), [['C', 'buy', '콜 ▲', '오르면 이익', optUnitCost('C', K)], ['P', 'sell', '풋 ▼', '내리면 이익', optUnitCost('P', K)]], '현금이 부족하거나 이번 달 한도(' + POS_LIMIT.opt + '계약)에 닿았습니다.')}`;
  } else if (o.kind === 'bond') {
    const b = BOND[o.id], y = bondYield(o.id), max = Math.floor(S.cash / 10000) * 10000;
    UI.amt = Math.min(UI.amt, max);
    kind = '채권'; name = b.name;
    body = `<div class="ord-price"><b class="num up">연 ${y.toFixed(2)}%</b><span class="sp"></span><span class="sub">만기 ${b.term / 12}년${b.cur === 'USD' ? ' · 달러 자산' : ''}</span></div>
      <div class="sub">이자는 매달 현금으로 들어옵니다. 만기 전에 팔면 그때 금리에 따라 값이 달라집니다(금리가 오르면 내림).</div>
      <div class="dock"><div class="dock-row"><span class="sub">살 금액</span><span class="sub num dock-info">현금 ${fmtWon(S.cash)}</span></div>
      ${max >= 10000 ? `<input type="range" class="qty-range" min="0" max="${max}" step="10000" value="${UI.amt}" data-input="amt" aria-label="금액">
        <div class="dock-row"><b class="num qty-big" id="amtLabel">${fmtWon(UI.amt)}</b><span class="num sub dock-est" id="estLabel">${ordEst()}</span></div>
        <div class="quick q4">${[[0.1, '10%'], [0.25, '25%'], [0.5, '50%'], [1, '전액']].map(([p, l]) => `<button data-act="apct" data-arg="${p}">${l}</button>`).join('')}</div>
        <button class="btn buy ord-go" data-act="ordGo" data-arg="buy" ${UI.amt >= 10000 ? '' : 'disabled'}>매수하기</button>` : '<div class="note">1만원 이상 있어야 살 수 있습니다.</div>'}</div>`;
  }
  return `<div class="pop" data-act="ordScrim"><div class="pop-card order">
    <div class="ord-head"><div><small class="pop-kind">${kind}</small><h3>${name}</h3></div><button class="icon-btn" data-act="ordClose" aria-label="닫기">${icon('close', 18)}</button></div>
    ${body}</div></div>`;
}
// 막대를 끄는 동안 실행 버튼만 켜고 끈다 (계약 수 × 한 계약 값이 현금을 넘으면 끔)
function goBtns(n) {
  const ph = $('phone'); if (!ph || !ph.querySelectorAll) return;
  ph.querySelectorAll('.ord-go').forEach(b => { if (!b.dataset.lock) b.disabled = !(n > 0) || (b.dataset.unit ? n * +b.dataset.unit > S.cash + 1e-6 : false); });
}

// ---- 로또 6/45 ----
const ballColor = n => n <= 10 ? '#e6a700' : n <= 20 ? '#3d8fe0' : n <= 30 ? '#e5484d' : n <= 40 ? '#868b94' : '#3fa34d';   // 실제 공 색과 같은 번호대
const ball = (n, cls) => `<span class="ball ${cls || ''}" style="background:${ballColor(n)}">${n}</span>`;
function lottoPrizes(prize) {
  const rows = [[1, '6개 모두', '8,145,060'], [2, '5개 + 보너스', '1,357,510'], [3, '5개', '35,724'], [4, '4개', '733'], [5, '3개', '45']];
  return `<div class="card"><h3>당첨금 <span class="r">${prize ? '이번 회차 (회차마다 다름)' : '회차마다 이 범위에서'}</span></h3>
    <div class="ptable">${rows.map(([r, c, o]) => `<b>${r}등</b><span>${c}</span><span class="num">${prize ? fmtWon(prize[r]) : LOTTO_PRIZE[r][0] === LOTTO_PRIZE[r][1] ? fmtWon(LOTTO_PRIZE[r][0]) : fmtWon(LOTTO_PRIZE[r][0]) + '~' + fmtWon(LOTTO_PRIZE[r][1])}</span><small class="muted num">1/${o}</small>`).join('')}</div>
    <div class="sub" style="margin-top:6px">200만원 넘는 당첨금은 22%, 3억 넘는 부분은 33%를 세금으로 뗍니다.</div></div>`;
}
function lottoSheet() {
  const last = S.lottoLast;
  const lastCard = last ? `<div class="card"><h3>지난 회차 · 제${last.no}회</h3><div class="balls">${last.win.map(n => ball(n)).join('')}<span class="plus">+</span>${ball(last.bonus)}</div>
    <div class="sub" style="margin-top:6px">${last.tickets.length ? (last.best ? `${last.best}등 당첨 · 세후 ${fmtWon(last.won)}` : `${last.tickets.length}장 모두 낙첨`) : '사지 않았습니다'}</div></div>` : '';
  const L = S.lotto;
  if (!L) return { title: '로또 6/45', body: `<div class="note">${icon('lock', 14)} ${curYM() < LOTTO_OPEN ? `로또 6/45는 ${LOTTO_OPEN.replace('-', '년 ')}월에 처음 추첨합니다.` : '이번 달 추첨이 없습니다.'}</div>${lastCard}${lottoPrizes()}` };
  const known = L.seq.slice(0, L.open), pick = UI.lottoPick;
  return { title: '로또 6/45', body: `<div class="card"><h3>제${L.no}회 · 당첨 번호 기억 <span class="r">${fmtYM(S.mi)} 말 추첨</span></h3>
      <div class="balls">${L.seq.map((n, i) => i < L.open ? ball(n) : '<span class="ball hidden">?</span>').join('')}</div>
      <div class="row" style="margin-top:8px">${L.open < 6 ? `<button class="btn gem sm" data-act="lottoReveal">${icon('gem', 14)} 번호 하나 떠올리기 · 💎${lottoRevealCost()}</button>` : '<span class="sub">여섯 개를 모두 떠올렸습니다. 보너스 번호는 떠오르지 않습니다.</span>'}</div>
      <div class="sub" style="margin-top:6px">하나씩 열 때마다 보석이 더 듭니다 (💎${LOTTO_REVEAL_COST.join('·')}).</div></div>
    <div class="card"><h3>번호 고르기 <span class="r">${pick.length}/6 · 산 표 ${L.tickets.length}/${LOTTO_MAX}장</span></h3>
      <div class="lgrid">${Array.from({ length: 45 }, (_, i) => i + 1).map(n => `<button class="lnum ${pick.includes(n) ? 'on' : ''} ${known.includes(n) ? 'known' : ''}" data-act="lottoPick" data-arg="${n}">${n}</button>`).join('')}</div>
      <div class="quick" style="margin-top:8px"><button data-act="lottoAuto">자동</button><button data-act="lottoFill" ${known.length ? '' : 'disabled'}>기억한 번호로</button><button data-act="lottoClear">지우기</button></div>
      <button class="btn" style="width:100%;margin-top:8px" data-act="lottoBuy" ${pick.length === 6 && L.tickets.length < LOTTO_MAX ? '' : 'disabled'}>${LOTTO_PRICE.toLocaleString()}원에 사기</button></div>
    ${L.tickets.length ? `<div class="card"><h3>이번 회차에 산 표 <span class="r">추첨은 다음 달로 넘어갈 때</span></h3>${L.tickets.map((t, i) => `<div class="ticket"><span class="sub">${String.fromCharCode(65 + i)}</span>${t.map(n => ball(n, known.includes(n) ? 'hit' : '')).join('')}</div>`).join('')}</div>` : ''}
    ${lastCard}${lottoPrizes(L.prize)}` };
}
function bankSheet() {
  const lim = loanLimit();
  return { title: '은행', body: `<div class="card"><h3>금액</h3>${amtBox(cashQuick())}</div>
    <div class="card"><h3>예금 <span class="r num">연 ${depRate().toFixed(2)}% · 이자 매달</span></h3>
      <div class="big num">${fmtWon(S.bank.dep)}</div><div class="sub">이자에서 세금 ${(INTEREST_TAX * 100).toFixed(1)}%를 뗍니다.</div>
      <div class="btns" style="margin-top:8px"><button class="btn" data-act="dep">예금하기</button><button class="btn ghost" data-act="wd">찾기</button></div></div>
    <div class="card"><h3>대출 <span class="r num">연 ${loanRate().toFixed(2)}%</span></h3>
      <div class="big num ${S.bank.loan ? 'bad' : ''}">${fmtWon(S.bank.loan)}</div>
      <div class="sub">${age() < 20 ? '대출은 20살부터 받을 수 있습니다.' : `한도 ${fmtWon(lim)} (신용 + 부동산 담보 ${Math.round(ltv(curYM()) * 100)}%)`}</div>
      <div class="btns" style="margin-top:8px"><button class="btn" data-act="borrow" ${age() < 20 ? 'disabled' : ''}>빌리기</button><button class="btn ghost" data-act="repay" ${S.bank.loan ? '' : 'disabled'}>갚기</button></div></div>` };
}
// 매물 이미지: 만들어 둔 그림이 있으면 그것을, 없으면 기본 그림
function estateImg(id) { const f = ESTATE_IMGS.find(x => x.split('.')[0] === id); return 'assets/estate/' + (f || '_default.svg'); }
function estateSheet() {
  const gate = estateGate();
  const cards = ESTATES.map(e => {
    const img = `<img class="est-img" src="${estateImg(e.id)}" alt="" loading="lazy" draggable="false">`;
    if (!estateAvailable(e.id)) return `<div class="est-card locked"><div class="est-pic">${img}<span class="badge lock">${Math.min(...Object.keys(e.p).map(Number))}년 준공</span></div>
      <div class="est-info"><b>${e.name}</b><span class="sub">${e.area} · ${e.size}</span></div></div>`;
    const p = estatePrice(e.id), p1 = estatePrice(e.id, Math.max(0, S.mi - 12)), r = S.re[e.id], key = 're:' + e.id, open = UI.estSel === e.id;
    let detail = '';
    if (open) {   // 펼치면 두 칸을 차지하고 5년 시세와 기억 떠올리기
      const start = Math.max(0, S.mi - 60), mis = [];
      for (let mi = start; mi <= revealedTo(key); mi++) mis.push(mi);
      detail = `<div class="est-detail">${lineChart(mis.map(mi => estateAvailable(e.id, mi) ? estatePrice(e.id, mi) : null), { split: S.mi - start, labels: yearLabels(mis), fmt: v => fmtWon(v), label: e.name + ' 시세' })}
        ${revealBox(key, mi => estatePrice(e.id, mi), v => fmtWon(v))}
        ${r ? `<div class="sub num" style="margin-top:6px">${r.q}채 · 평단 ${fmtWon(r.cost / r.q)}</div>` : ''}</div>`;
    }
    return `<div class="est-card ${open ? 'open' : ''}">
      <button class="est-pic" data-act="estSel" data-arg="${e.id}" aria-label="${e.name} 시세 보기">${img}
        ${r ? `<span class="badge">${S.home === e.id ? '거주 · ' : ''}${r.q}채</span>` : ''}${S.reveal[key] > S.mi ? '<span class="badge gem">기억</span>' : ''}</button>
      <div class="est-info"><b>${e.name}</b><span class="sub">${e.area} · ${e.size}</span>
        <span class="row"><b class="num">${fmtWon(p)}</b><span class="sp"></span><small>${pctSpan((p / p1 - 1) * 100)}</small></span></div>
      ${detail}
      <div class="est-btns"><button class="btn sm" data-act="estBuy" data-arg="${e.id}">매입</button><button class="btn ghost sm" data-act="estSell" data-arg="${e.id}" ${r ? '' : 'disabled'}>매도</button></div>
      <div class="sub num est-cost">매입 비용 ${fmtWon(estateBuyCost(e.id))}</div></div>`;
  }).join('');
  return { title: '부동산', body: `${gate ? `<div class="note warn">${gate}</div>` : age() < 20 ? '<div class="note">엄마 명의로 살 수 있습니다.</div>' : ''}
    ${Object.keys(S.re).length ? `<button class="note link" data-act="sheet" data-arg="estMgr">${icon('key', 16)}<span>사들인 집은 <b>부동산 관리</b>에서 들어가 살거나 세를 놓습니다.</span>${icon('next', 14)}</button>` : ''}
    <div class="note">취득세·수수료 ${ESTATE_BUY_COST * 100}% · 월세 연 ${rentYield(MARKET.m.cd[S.mi] || 3).toFixed(1)}% · 전세가율 ${Math.round(anchorAt(JEONSE_RATE, S.mi) * 100)}% · 보유세 연 ${ESTATE_HOLD_TAX * 100}% · 팔 때 차익의 ${ESTATE_GAIN_TAX * 100}% 세금${haggle() ? ` · 매력 협상으로 사고팔 때 ${(haggle() * 100).toFixed(1)}% 유리` : ''} · 사진을 누르면 시세 · 시세는 공개 시세 흐름 기반 추정치</div>
    <div class="est-grid">${cards}</div>` };
}
// ---- 결과 창: 매도 체결 · 분기/연간 결산 ----
const wonRow = ([l, v, strong]) => `<b>${l}</b><span class="num${strong ? ' strong' : ''}">${v < 0 ? '-' + fmtWon(-v) : fmtWon(v)}</span>`;
const signRow = ([l, v]) => `<b>${l}</b><span class="num ${pctCls(v)}">${fmtSigned(v)}</span>`;
function popHTML(p) {
  return `<div class="pop" data-act="popScrim"><div class="pop-card ${p.kind}">${p.kind === 'report' ? reportHTML(p) : soldHTML(p)}
    <button class="btn" data-act="popClose">확인</button></div></div>`;
}
function soldHTML(p) {
  const pct = p.cost > 0 ? p.pl / p.cost * 100 : 0, c = pctCls(p.pl);
  return `<div class="pop-ic ${c}">${icon('check', 26)}</div>
    <small class="pop-kind">${p.title}</small><h3>${p.name}</h3><div class="sub num">${p.what}</div>
    <div class="pop-big num ${c}">${fmtSigned(p.pl)}<small>${fmtPct(pct)}</small></div>
    <div class="sub">${c === 'up' ? '이득을 봤습니다.' : c === 'down' ? '손해를 봤습니다.' : '본전입니다.'}</div>
    <div class="kv">${p.rows.map(wonRow).join('')}</div>`;
}
// 막대: 위는 늘어난 만큼, 아래는 줄어든 만큼
function barsHTML(steps) {
  const max = Math.max(1, ...steps.map(s => Math.abs(s.v || 0)));
  return `<div class="bars">${steps.map(s => { const h = s.v ? Math.max(3, Math.abs(s.v) / max * 100).toFixed(1) : 0;
    return `<div class="barcol"><div class="bhalf hi">${s.v > 0 ? `<i class="bu" style="height:${h}%"></i>` : ''}</div><div class="bhalf lo">${s.v < 0 ? `<i class="bd" style="height:${h}%"></i>` : ''}</div>
      <b>${s.l}</b><span class="num ${s.v == null ? 'muted' : pctCls(s.v)}">${s.v == null ? '-' : fmtSigned(s.v)}</span></div>`; }).join('')}</div>`;
}
function reportHTML(r) {
  const parts = r.parts.filter(x => x[1] != null && Math.abs(x[1]) >= 1), flows = r.flows.filter(x => x[1] != null && Math.abs(x[1]) >= 1);
  return `<small class="pop-kind">${r.title}</small><h3>${r.sub} 재산이 ${r.chg >= 0 ? '늘었습니다' : '줄었습니다'}</h3>
    <div class="pop-big num ${pctCls(r.chg)}">${fmtSigned(r.chg)}${r.pct != null ? `<small>${fmtPct(r.pct)}</small>` : ''}</div>
    <div class="sub num">순자산 ${fmtWon(r.nw0)} → <b>${fmtWon(r.nw1)}</b></div><div class="sub">같은 기간 코스피 ${pctSpan(r.kospi)}</div>
    ${barsHTML(r.steps)}
    ${parts.length ? `<div class="kv"><b class="kv-h">어디서 바뀌었나</b><span></span>${parts.map(signRow).join('')}</div>` : ''}
    ${flows.length ? `<div class="kv"><b class="kv-h">이 기간의 돈 흐름</b><span></span>${flows.map(signRow).join('')}</div>` : ''}`;
}

// ---- 상세 재무 내역 ----
function financeSheet() {
  const b = breakdown(), nw = netWorth(), debt = b.loan + b.jdep;
  const nRe = Object.values(S.re).reduce((s, r) => s + r.q, 0), nLux = Object.values(S.lux).reduce((s, n) => s + n, 0);
  const note = { estate: nRe ? nRe + '채' : '', lux: nLux ? nLux + '점' : '', dep: S.bank.dep ? '연 ' + depRate().toFixed(1) + '%' : '', fut: Object.keys(S.fut).length ? Object.keys(S.fut).length + '종목' : '', opt: S.opt.length ? S.opt.length + '건' : '', bond: S.bonds.length ? S.bonds.length + '건' : '' };
  const rows = ASSET_ROWS.map(([k, l, c]) => [k, l, c, b[k]]).filter(r => Math.abs(r[3]) >= 1);
  const totA = rows.reduce((s, r) => s + Math.max(0, r[3]), 0) || 1;
  const ago = n => { const h = histAt(S.mi - n); return h && h.mi === S.mi - n ? nw - h.nw : null; };
  const cmp = [['이번 달', nw - S.monthStartNW], ['3개월 전보다', ago(3)], ['1년 전보다', ago(12)]].filter(x => x[1] != null);
  const fl = monthFlow(), inc = fl.inc.reduce((s, r) => s + r[1], 0), out = fl.out.reduce((s, r) => s + r[1], 0), j = jobInfo();
  // 기간별 재산 변화: 최근 분기 8개 또는 해마다
  const first = S.hist[0].mi, per = [];
  if (UI.finP === 'y') for (let y = yearOf(S.mi); y >= yearOf(first); y--) { const m0 = Math.max(first, miOf(y + '-01')), m1 = Math.min(S.mi, miOf((y + 1) + '-01')); if (m1 > m0) per.push([y + '년', m0, m1, 'year', m1 === S.mi && month() !== 1]); }
  else { let m1 = S.mi; for (let k = 0; k < 8; k++) { const m0 = Math.max(first, m1 - ((+ymOf(m1).slice(5) - 1) % 3 || 3)); if (m0 >= m1) break; const ym = ymOf(m0); per.push([ym.slice(0, 4) + '년 ' + Math.ceil(+ym.slice(5) / 3) + '분기', m0, m1, 'q', m1 === S.mi && (+ymOf(S.mi).slice(5) - 1) % 3 !== 0]); m1 = m0; } }
  const perRows = per.map(([l, m0, m1, k, live]) => { const a = histAt(m0), z = m1 === S.mi ? { nw } : histAt(m1), d = z.nw - a.nw;
    return `<button class="li per" data-act="report" data-arg="${m0}:${m1}:${k}" ${live ? 'disabled' : ''}><div class="nm"><em>${l}</em>${live ? '<span class="badge lock">진행 중</span>' : ''}</div>
      <div class="pr num ${pctCls(d)}">${fmtSigned(d)}</div><div class="ds num">${fmtWon(a.nw)} → ${fmtWon(z.nw)}</div><div class="ch num">${a.nw > 0 ? pctSpan((z.nw / a.nw - 1) * 100) : ''}</div></button>`; }).join('');
  const body = `<div class="card"><h3>순자산 <span class="r">자산 - 빚</span></h3>
      <div class="big num">${fmtWon(nw, false)}</div><div class="sub num">${fmtWon(nw, true)}</div>
      <div class="kv" style="margin-top:8px"><b>자산 합계</b><span class="num">${fmtWon(totA)}</span><b>빚 합계</b><span class="num ${debt ? 'bad' : ''}">${debt ? '-' + fmtWon(debt) : '0원'}</span>
        ${cmp.map(signRow).join('')}</div></div>
    <div class="card"><h3>자산 <span class="r">${rows.length}가지</span></h3>
      <div class="stack">${rows.filter(r => r[3] > 0).map(r => `<i style="width:${(r[3] / totA * 100).toFixed(2)}%;background:${r[2]}"></i>`).join('')}</div>
      <div class="fin-rows">${rows.map(([k, l, c, v]) => `<div class="fin-row"><i style="background:${c}"></i><b>${l}${note[k] ? ` <small class="muted">${note[k]}</small>` : ''}</b><span class="num">${fmtWon(v)}</span><small class="num muted">${(Math.max(0, v) / totA * 100).toFixed(1)}%</small></div>`).join('')}</div></div>
    <div class="card"><h3>빚</h3>${debt ? `<div class="kv">
      ${b.loan ? `<b>대출 <small class="muted">연 ${loanRate().toFixed(2)}%</small></b><span class="num bad">-${fmtWon(b.loan)}</span>` : ''}
      ${b.jdep ? `<b>전세 보증금 <small class="muted">돌려줄 돈</small></b><span class="num bad">-${fmtWon(b.jdep)}</span>` : ''}</div>` : '<div class="sub">빚이 없습니다.</div>'}</div>
    <div class="card"><h3>투자 손익 <span class="r">누계</span></h3><div class="kv">
      ${signRow(['평가 손익 (지금 다 팔면)', unrealized()])}${signRow(['실현 손익', S.realized])}
      ${signRow(['받은 배당 (세후)', S.divTotal])}${signRow(['받은 월세', S.rentTotal])}${signRow(['받은 이자 (세후)', S.intTotal])}
      ${wonRow(['낸 수수료', -S.feePaid])}${wonRow(['낸 세금', -S.taxPaid])}</div></div>
    <div class="card"><h3>이번 달 현금 흐름 <span class="r">달이 바뀔 때 · 예상</span></h3><div class="kv">
      ${fl.inc.map(([l, v]) => `<b>${l}</b><span class="num good">+${fmtWon(v)}</span>`).join('')}
      ${fl.out.map(([l, v]) => `<b>${l}</b><span class="num bad">-${fmtWon(v)}</span>`).join('')}
      ${fl.inc.length + fl.out.length ? signRow(['합계', inc - out]) : '<b>정해진 수입·지출이 없습니다</b><span></span>'}</div>
      ${j.pay ? `<div class="sub" style="margin-top:6px">일하기 1번에 +${fmtWon(j.pay)} (${j.name}, 달마다 ${ACTIONS.work.perMonth}번까지)</div>` : ''}</div>
    <div class="card"><h3>기간별 재산 변화 <span class="r">눌러서 결산 보기</span></h3>
      <div class="seg wide" style="margin-bottom:8px">${[['q', '분기별'], ['y', '연도별']].map(([k, l]) => `<button class="${UI.finP === k ? 'on' : ''}" data-act="finP" data-arg="${k}">${l}</button>`).join('')}</div>
      <div class="list">${perRows || '<div class="sub">아직 지난 기간이 없습니다.</div>'}</div></div>`;
  return { title: '상세 재무 내역', body };
}

// ---- 부동산 관리 ----
const homeLabel = () => S.home ? EST[S.home].name + ' (자가)' : age() < 20 ? '부모님 집' : '셋집';
const homeFxText = (t = homeTier()) => Object.entries(t.fx).map(([k, v]) => STAT_NAME[k] + ' +' + v).concat(age() >= 20 ? ['생활비 -' + HOME_SAVE * 100 + '%'] : []).join(' · ');
const pip = m => `<i class="pip ${m}"></i>`;
function estMgrSheet() {
  const ids = Object.keys(S.re).sort((a, b) => (b === S.home) - (a === S.home) || estatePrice(b) * S.re[b].q - estatePrice(a) * S.re[a].q);
  const back = 'estMgrBack';
  if (!ids.length) return { title: '부동산 관리', back, body: `<div class="empty-state">${icon('key', 40)}<b>가진 집이 없습니다</b>
    <span class="sub">부동산에서 집을 사면 여기서 들어가 살거나, 월세·전세를 놓아 부수입을 얻을 수 있습니다.</span>
    <button class="btn" data-act="sheet" data-arg="estate">${icon('building', 16)} 부동산 보러 가기</button></div>` };
  const h = S.home, t = homeTier(), ls = leaseMonth(), net = ls.rent - ls.tax - ls.empty, dep = jeonseTotal();
  const homeCard = `<div class="card home-card">
    <div class="home-pic">${h ? `<img class="est-img" src="${estateImg(h)}" alt="">` : icon('home', 32)}</div>
    <div class="home-txt"><small>지금 사는 곳</small><b>${h ? EST[h].name : homeLabel()}</b>
      <span class="sub">${h ? t.name + ' · ' + homeFxText(t) : '아래에서 「여기 들어가 살기」를 누르면 건강·매력이 오르고' + (age() >= 20 ? ' 생활비가 줄어듭니다.' : ' 가족이 기뻐합니다.')}</span></div>
    ${h ? '<button class="btn ghost sm" data-act="leave">나가기</button>' : ''}</div>`;
  const sum = `<div class="card"><h3>임대 정산 <span class="r">달이 바뀔 때 · 예상</span></h3><div class="kv">
    <b>월세 수입</b><span class="num good">+${fmtWon(ls.rent)}</span>
    <b>보유세</b><span class="num">-${fmtWon(ls.tax)}</span>
    ${ls.empty ? `<b>빈 집 관리비</b><span class="num bad">-${fmtWon(ls.empty)}</span>` : ''}
    <b>합계</b><span class="num ${pctCls(net)}"><b>${fmtSigned(net)}</b></span>
    ${dep ? `<b>맡아 둔 전세 보증금</b><span class="num">${fmtWon(dep)} <small class="muted">나중에 돌려줄 돈</small></span>` : ''}</div></div>`;
  const cards = ids.map(id => {
    const r = S.re[id], e = EST[id], n = rentN(id), mine = h === id;
    const pips = (mine ? pip('home') : '') + pip(r.mode).repeat(n);
    const info = !n ? '세를 놓을 집이 없습니다. 한 채 더 사면 세를 놓을 수 있습니다.'
      : r.mode === 'wolse' ? `${n}채 월세 · 달마다 <b class="good">+${fmtWon(wolseOf(id) * n)}</b>`
      : r.mode === 'jeonse' ? `${n}채 전세 · 보증금 <b>${fmtWon(r.dep)}</b> · ${fmtYM(r.lease + JEONSE_TERM)} 재계약`
      : `<span class="warn">${n}채 비어 있음 · 관리비 달마다 -${fmtWon(estatePrice(id) * n * EMPTY_COST / 12)}</span>`;
    const opt = m => m === r.mode ? '' : m === 'wolse' ? '월 ' + fmtWon(wolseOf(id) * n) : m === 'jeonse' ? '+' + fmtWon(jeonseDep(id) * n) : r.mode === 'jeonse' ? '-' + fmtWon(r.dep) : '';
    const seg = n ? `<div class="seg wide lease">${['empty', 'wolse', 'jeonse'].map(m => `<button class="${r.mode === m ? 'on ' + m : ''}" data-act="lease" data-arg="${id}:${m}">${LEASE_NAME[m]}${opt(m) ? `<small class="num">${opt(m)}</small>` : ''}</button>`).join('')}</div>` : '';
    return `<div class="mgr-card">
      <div class="mgr-pic"><img class="est-img" src="${estateImg(id)}" alt="" loading="lazy">${mine ? `<span class="badge">${icon('home', 11)}거주</span>` : ''}</div>
      <div class="mgr-body"><b>${e.name}</b><span class="sub num">${e.area} · ${r.q}채 · 시세 ${fmtWon(estatePrice(id) * r.q)}</span>
        <div class="pips">${pips}</div><span class="sub">${info}</span></div>
      ${seg}
      ${mine ? '' : `<button class="btn ghost sm mgr-live" data-act="live" data-arg="${id}">${icon('home', 14)} 여기 들어가 살기${n ? '' : ''}</button>`}</div>`;
  }).join('');
  const legend = `<div class="pip-legend">${pip('home')}거주 ${pip('wolse')}월세 ${pip('jeonse')}전세 ${pip('empty')}빈 집</div>`;
  const guide = `<div class="note"><b>월세</b>는 달마다 꼬박꼬박 들어옵니다. <b>전세</b>는 집값의 ${Math.round(anchorAt(JEONSE_RATE, S.mi) * 100)}% 정도를 보증금으로 한 번에 받아 다른 곳에 굴릴 수 있지만, 세입자를 내보낼 때 돌려줘야 하고 ${JEONSE_TERM / 12}년마다 그때 시세로 다시 계약합니다(집값이 내리면 차액을 돌려줍니다). <b>빈 집</b>은 관리비만 나갑니다.
    세입자를 들일 때 중개수수료 ${LEASE_FEE * 100}% · 이사는 한 달에 한 번, 이사비 ${fmtWon(moveCost())}</div>`;
  return { title: '부동산 관리', back, body: `${homeCard}${sum}${legend}<div class="mgr-list">${cards}</div>${guide}` };
}
function luxSheet() {
  return { title: '명품', body: `<div class="note">가진 명품은 매력을 올리고, 인연에게 선물할 수 있습니다. 시세가 정가보다 높으면 리셀가로 사야 합니다.${haggle() ? ` 매력 협상으로 되팔 때 ${(haggle() * 100).toFixed(1)}% 더 받습니다.` : ''}</div>
    ${LUXURY.map(l => {
      if (!luxAvailable(l.id)) return `<div class="card"><div class="row"><b>${l.name}</b><span class="sp"></span><span class="badge lock">${l.from}년 출시</span></div></div>`;
      const n = S.lux[l.id] || 0;
      return `<div class="card"><div class="row"><b>${l.name}</b>${n ? `<span class="badge">${n}개</span>` : ''}<span class="sp"></span><span class="sub">${l.kind} · 매력 +${l.cha}</span></div>
        <div class="kv" style="margin-top:6px"><b>살 때</b><span class="num">${fmtWon(luxBuyPrice(l.id))}</span><b>팔 때</b><span class="num">${fmtWon(luxValue(l.id) * (1 + haggle()))} <small class="muted">(정가의 ${Math.round(luxPrem(l.id) * 100)}%)</small></span></div>
        <div class="btns" style="margin-top:8px"><button class="btn sm" data-act="luxBuy" data-arg="${l.id}">구입</button><button class="btn ghost sm" data-act="luxSell" data-arg="${l.id}" ${n ? '' : 'disabled'}>판매</button></div></div>`;
    }).join('')}` };
}
function personSheet() {
  const id = UI.sel, c = CH[id], p = S.people[id]; if (!c || !p) return { title: '' };
  const o = outingInfo(id), rl = relLabel(id);
  const gifts = [...Object.keys(S.inv).map(k => [k, ITEM[k].name, S.inv[k]]), ...Object.keys(S.gear).map(k => [k, GR[k].name + ' ' + GR[k].g, S.gear[k]]), ...Object.keys(S.lux).map(k => [k, LUX[k].name, S.lux[k]])];
  const likes = c.likes.map(k => (ITEM[k] || LUX[k] || {}).name).filter(Boolean).join(', ');
  return { title: c.name, body: `<div class="pf">${portraitHTML(id)}</div>
    <div class="card"><div class="row"><b style="font-size:18px">${c.name}</b><span class="sub">${c.gender} · ${charAge(id)}살</span><span class="sp"></span><span class="rel ${['연인', '배우자', '썸'].includes(rl) ? 'love' : ''}">${rl}</span></div>
      <div class="sub" style="margin:2px 0 8px">${c.role} · ${c.feature}</div>
      <div class="row"><div class="affbar" style="flex:1"><i style="width:${p.aff}%"></i></div><span class="num sub">호감 ${Math.round(p.aff)}</span></div></div>
    ${UI.say[id] ? `<div class="say">${esc(disp(UI.say[id]))}</div>` : ''}
    <div class="acts">
      <button class="btn ghost" data-act="talk" data-arg="${id}" ${p.talkMi === S.mi ? 'disabled' : ''}>대화 <small class="muted">체력 ${TALK_COST}</small></button>
      <button class="btn ghost" data-act="outing" data-arg="${id}" ${p.outMi === S.mi ? 'disabled' : ''}>${o.label} <small class="muted">체력 ${o.sta} · ${fmtWon(o.cost)}</small></button>
      <button class="btn ghost" data-act="giftOpen" ${p.giftMi === S.mi ? 'disabled' : ''}>선물</button>
      ${c.kind === 'family' && age() >= 20 ? `<button class="btn ghost" data-act="money" data-arg="${id}" ${p.giftMi === S.mi ? 'disabled' : ''}>용돈 드리기</button>` : ''}
      ${canConfess(id) ? `<button class="btn" style="background:var(--love)" data-act="confess" data-arg="${id}">고백하기</button>` : ''}
      ${canPropose(id) ? `<button class="btn" style="background:var(--love)" data-act="propose" data-arg="${id}">청혼하기</button>` : ''}
      ${p.mem ? '' : `<button class="btn gem" data-act="remember" data-arg="${id}">${icon('gem', 14)} 기억 떠올리기</button>`}
    </div>
    ${UI.giftOpen ? `<div class="card"><h3>무엇을 줄까요</h3>${gifts.length ? `<div class="gifts">${gifts.map(([k, n, cnt]) => `<button data-act="gift" data-arg="${id}:${k}"><b>${n}</b>${cnt}개${c.likes.includes(k) && p.mem ? ' · ♥' : ''}</button>`).join('')}</div>` : '<div class="sub">선물할 물건이 없습니다. 쇼핑에서 사 오세요.</div>'}</div>` : ''}
    ${p.mem ? `<div class="card"><h3>${icon('gem', 14)} 전생의 기억</h3><p style="margin:0 0 8px;font-size:13.5px">${esc(disp(c.past))}</p><div class="sub">좋아하는 것: ${likes}</div></div>` : ''}
    ${canRomance(id) && !p.lover && !p.spouse && partners().length ? `<div class="note warn">이미 만나는 사람이 있습니다. 고백하면 양다리가 되고, 달마다 월 ${Math.round(cheatRisk(partners().length + 1) * 100)}% 확률로 들킬 수 있습니다. 지성이 높을수록 덜 들킵니다.</div>` : ''}
    ${canRomance(id) && !p.lover && !p.spouse && p.aff < 75 ? '<div class="sub">호감이 75를 넘으면 고백할 수 있습니다.</div>' : ''}
    ${p.lover && !canPropose(id) ? '<div class="sub">27살이 넘고 호감이 90이 되면 청혼할 수 있습니다.</div>' : ''}` };
}
const gradeTag = g => `<span class="grade g-${g}">${g}</span>`;
const fxText = fx => Object.entries(fx).map(([k, v]) => `${STAT_NAME[k]} +${v}`).join(' · ');
function shopSheet() {
  const seg = `<div class="seg wide">${[['gear', '옷·장신구'], ['item', '소모품·선물']].map(([k, l]) => `<button class="${UI.shopTab === k ? 'on' : ''}" data-act="shopTab" data-arg="${k}">${l}</button>`).join('')}</div>`;
  if (UI.shopTab === 'item') {
    const inv = Object.keys(S.inv);
    return { title: '쇼핑', body: seg + `<div class="card"><div class="list">${shopList().map(i => `<div class="li"><div class="nm"><em>${i.name}</em></div><div class="pr num">${fmtWon(shopPrice(i.id))}</div>
      <div class="ds">${i.desc}${S.inv[i.id] ? ' · ' + S.inv[i.id] + '개 있음' : ''}</div><div class="ch"><button class="btn sm" data-act="shopBuy" data-arg="${i.id}">사기</button></div></div>`).join('')}</div></div>
      ${inv.length ? `<div class="sub">가방: ${inv.map(k => ITEM[k].name + ' ' + S.inv[k]).join(', ')}</div>` : ''}
      <div class="note">쇼핑은 시간이 흐르지 않습니다. 선물은 인연 탭에서 줄 수 있습니다.</div>` };
  }
  const list = gearList();
  return { title: '쇼핑', body: seg + `<div class="note">산 옷과 장신구는 빈 칸이면 바로 입습니다. 상태 탭에서 바꿔 입거나, 인연에게 선물할 수 있습니다. 등급: ${['N', 'R', 'SR', 'SSR'].map(gradeTag).join(' ')}</div>
    ${SLOTS.map(([s, l]) => { const items = list.filter(g => g.slot === s); if (!items.length) return '';
      return `<div class="card"><h3>${l}${S.equip[s] ? ` <span class="r">입은 것: ${GR[S.equip[s]].name}</span>` : ''}</h3><div class="list">${items.map(g => `<div class="li"><div class="nm">${gradeTag(g.g)}<em>${g.name}</em>${S.gear[g.id] ? `<span class="badge">${S.gear[g.id]}개</span>` : ''}</div>
        <div class="pr num">${fmtWon(gearPrice(g.id))}</div><div class="ds">${fxText(g.fx)}${g.perk ? ' · ' + PERK_TEXT[g.perk] : ''}${g.hand ? ' · 양손' : ''}</div><div class="ch"><button class="btn sm" data-act="gearBuy" data-arg="${g.id}">사기</button></div></div>`).join('')}</div></div>`; }).join('')}` };
}
function slotSheet() {
  const s = UI.slot, cur = S.equip[s], name = (SLOTS.find(x => x[0] === s) || [])[1];
  const owned = Object.keys(S.gear).filter(id => slotsFor(id).includes(s) && id !== cur);
  const row = (id, btn) => { const g = GR[id]; return `<div class="li"><div class="nm">${gradeTag(g.g)}<em>${g.name}</em><span class="badge">${S.gear[id]}개</span></div><div class="pr">${btn}</div><div class="ds">${fxText(g.fx)}${g.perk ? ' · ' + PERK_TEXT[g.perk] : ''}</div><div></div></div>`; };
  return { title: name + ' 장착', body: `${cur ? `<div class="card"><h3>입고 있는 것</h3><div class="list">${row(cur, `<button class="btn ghost sm" data-act="unequip" data-arg="${s}">벗기</button>`)}</div></div>` : ''}
    <div class="card"><h3>가진 것</h3><div class="list">${owned.map(id => row(id, `<button class="btn sm" data-act="equip" data-arg="${s}:${id}">입기</button>`)).join('') || '<div class="sub">이 칸에 맞는 물건이 없습니다.</div>'}</div></div>
    <button class="btn ghost" data-act="shopOpen">쇼핑하러 가기</button>` };
}
function logSheet() {
  return { title: '진행 기록', body: `<div class="logs">${S.log.map(l => `<div class="${l.k}"><time>${fmtYM(l.mi)}</time>${esc(disp(l.t))}</div>`).join('') || '<div>아직 기록이 없습니다.</div>'}</div>` };
}
function settingsSheet() {
  const th = S.theme || 'system';
  const ins = installState();
  const installCard = `<div class="card"><h3>홈 화면에 설치 <span class="r">앱처럼 쓰기</span></h3>
    ${ins === 'installed' ? '<div class="note">앱으로 설치되어 있습니다.</div>'
      : ins === 'prompt' ? `<button class="btn" style="width:100%" data-act="install">${icon('home', 16)} 홈 화면에 설치</button>`
      : ins === 'ios' ? '<div class="note">사파리 아래쪽 <b>공유 버튼</b>(네모에 위 화살표)을 누르고 <b>「홈 화면에 추가」</b>를 고르세요.</div>'
      : '<div class="note">브라우저 메뉴(⋮)에서 <b>「앱 설치」</b> 또는 <b>「홈 화면에 추가」</b>를 고르세요. 안드로이드는 크롬, 아이폰은 사파리에서 열어야 합니다.</div>'}
    <div class="sub" style="margin-top:6px">설치하면 주소창 없이 전체 화면으로 열리고, 인터넷이 없어도 이어서 할 수 있습니다.</div></div>`;
  return { title: '설정', body: `${installCard}<div class="card"><h3>화면</h3><div class="row"><span>테마</span><span class="sp"></span><div class="seg">${[['system', '시스템'], ['light', '밝게'], ['dark', '어둡게']].map(([k, l]) => `<button class="${th === k ? 'on' : ''}" data-act="theme" data-arg="${k}">${l}</button>`).join('')}</div></div>
      <div class="row" style="margin-top:10px"><span>대사 속도</span><span class="sp"></span><div class="seg">${[[1, '보통'], [0, '바로']].map(([k, l]) => `<button class="${S.textSpeed === k ? 'on' : ''}" data-act="speed" data-arg="${k}">${l}</button>`).join('')}</div></div></div>
    <div class="card"><h3>보석</h3><button class="btn gem" style="width:100%" data-act="sheet" data-arg="gemshop">${icon('gem', 15)} 보석 상점</button>
      <button class="btn ghost" style="width:100%;margin-top:8px" disabled>광고 건너뛰기 · 추후 구현</button></div>
    <div class="card"><h3>저장</h3><div class="sub" style="margin-bottom:8px">달이 바뀔 때와 사고팔 때마다 자동으로 저장됩니다.</div>
      <div class="btns"><button class="btn ghost" data-act="saveNow">지금 저장</button><button class="btn ${UI.confirmNew ? '' : 'ghost'}" style="${UI.confirmNew ? 'background:var(--bad)' : ''}" data-act="newGame">${UI.confirmNew ? '정말 처음부터?' : '새 게임'}</button></div></div>
    <div class="card"><h3>정보</h3><div class="kv"><b>버전</b><span>${VERSION} (개발 버전)</span><b>시세 데이터</b><span>${MARKET.start} ~ ${MARKET.end}</span><b>받은 날</b><span>${MARKET.fetched}</span></div>
      <div class="sub" style="margin-top:8px">종목·지수 월말 종가는 Yahoo Finance, 환율·금리·주택가격은 FRED에서 받았습니다. 2000년 이전 일부 종목, 코스닥 2000년 9월 이전, 부동산·명품 시세는 추정치입니다.</div></div>`, short: false };
}
function gemShopSheet() {
  const total = REVEAL_COST.reduce((s, c) => s + c, 0);
  return { title: '보석', body: `<div class="card" style="text-align:center"><div class="gemc">${icon('gem', 36)}</div><div class="big num gemc" style="margin-top:4px">${gemCount() === Infinity ? '∞' : gemCount()}</div>
      <div class="sub">${DEV_INFINITE_GEMS ? '개발 버전 · 보석을 무한으로 쓸 수 있습니다' : '보유 보석'} · 지금까지 ${S.gemsUsed || 0}개 사용</div><div class="sub">보석 1개 ≈ ${GEM_WON}원</div></div>
    <div class="card"><h3>기억 떠올리기 <span class="r">주식·부동산·지수, 한 달씩</span></h3>
      <div class="cost-row">${REVEAL_COST.map((c, i) => `<span><small>${i + 1}개월 뒤</small><b>💎${c}</b></span>`).join('')}</div>
      <div class="sub">종목마다 따로 떠올립니다. 1년 뒤까지 모두 떠올리면 💎${total}. 달이 지나도 이미 떠올린 기억은 남습니다.</div></div>
    <div class="card"><h3>그 밖에</h3><div class="kv"><b>기억 더듬기 (오를·내릴 종목)</b><span>${Object.entries(RECALL_COST).map(([h, c]) => `${h}개월 💎${c}`).join(' · ')}</span>
      <b>로또 당첨 번호 (하나씩)</b><span>💎${LOTTO_REVEAL_COST.join('·')}</span>
      <b>스포츠 내기 결과 떠올리기</b><span>💎${GEM_COST.bet}</span>
      <b>인물에 대한 전생의 기억</b><span>💎${GEM_COST.person}</span><b>광고 건너뛰기</b><span class="muted">추후 구현</span></div></div>
    <div class="card"><h3>충전 <span class="r">결제 연동 전</span></h3><div class="list">${GEM_PACKS.map(p => `<div class="li"><div class="nm"><em>💎 ${p.gems}</em><span class="sub">개당 ${Math.round(p.won / p.gems)}원</span></div><div class="pr"><button class="btn sm" disabled>${p.won.toLocaleString()}원</button></div></div>`).join('')}</div></div>` };
}
function recallSheet() {
  const r = UI.recall;
  if (!r) return { title: '기억 더듬기', body: `<div class="note gem">${icon('gem', 14)} 앞으로 크게 오르고 내릴 종목과 다가올 사건을 더듬어 봅니다. 멀리 볼수록 보석이 더 듭니다.</div>
    <div class="tiles">${Object.entries(RECALL_COST).map(([h, c]) => `<button class="tile" data-act="recallH" data-arg="${h}"><b>${h === '12' ? '1년' : h + '개월'}</b><span>${fmtYM(Math.min(LAST_MI, S.mi + +h))}까지</span><i class="gemc">💎 ${c}</i></button>`).join('')}</div>` };
  const row = x => `<button class="li" data-act="openTicker" data-arg="${x.id}"><div class="nm"><em>${tkName(x.id)}</em></div><div class="pr num ${pctCls(x.r)}">${fmtPct(x.r * 100, 0)}</div><div class="ds">${TK[x.id].desc}</div><div></div></button>`;
  return { title: '기억 더듬기', back: 'recallBack', body: `<div class="note gem">${icon('gem', 14)} ${fmtYM(r.to)}까지 ${r.h}개월의 기억입니다. 코스피는 ${fmtPct(r.kospi * 100, 0)}.</div>
    <div class="card"><h3>크게 오를 것</h3><div class="list">${r.up.map(row).join('')}</div></div>
    <div class="card"><h3>크게 내릴 것</h3><div class="list">${r.down.map(row).join('')}</div></div>
    ${r.ev.length ? `<div class="card"><h3>다가올 사건</h3><div class="kv">${r.ev.map(h => `<b>${h.ym.replace('-', '.')}</b><span>${h.t}</span>`).join('')}</div></div>` : ''}` };
}
function endingSheet() {
  const g = endingGrade(), sp = spouseId();
  return { title: '엔딩', body: `<div class="card" style="text-align:center"><div class="sub">2026년, ${age()}살</div><div style="font-size:56px;font-weight:900;line-height:1.1" class="gemc">${g.money}</div>
      <div class="big num">${fmtWon(g.nw)}</div><div class="sub">1996년 1월 ${fmtWon(START_CASH)}에서 시작</div></div>
    <div class="card"><h3>이번 생</h3><div class="kv"><b>곁에 있는 사람</b><span>${sp ? CH[sp].name : '없음'}</span><b>인연 평균 호감</b><span class="num">${g.rel}</span>
      <b>아빠의 보증</b><span>${S.flags.guaranteeBlocked ? '막았다' : S.flags.debtPaid ? '대신 갚았다' : '막지 못했다'}</span>
      <b>지수</b><span>${S.flags.avoidJisu ? '만나지 않았다' : sp === 'jisu' ? (S.flags.hwHome ? '같은 결말' : '다른 결말') : S.flags.metJisu ? '다른 길을 갔다' : '-'}</span>
      <b>태호</b><span>${S.flags.taehoSaved ? '구했다' : S.flags.taehoLost ? '구하지 못했다' : '-'}</span><b>실현 손익</b><span class="num">${fmtSigned(S.realized)}</span></div></div>
    <div class="btns"><button class="btn" data-act="newGame">새 게임</button><button class="btn ghost" data-act="close">둘러보기</button></div>` };
}

// ---- 이벤트 팝업 ----
function storyLine() {
  const L = RUN.cur; if (!L) return null;
  const T = L.c ? (RUN.prev || {}) : L;
  const isMe = T.s === 'me', who = T.s ? (isMe ? S.name : CH[T.s].name) : '';
  return { L, T, isMe, who, text: disp(T.n || T.t || ''), key: RUN.key + ':' + RUN.i };
}
function storyHTML() {
  if (RUN.cur && RUN.cur.bet) return betHTML(SPORT[RUN.cur.bet]);
  const x = storyLine(); if (!x) return '';
  const full = !!x.L.c || UI.typedKey !== x.key || UI.typed >= x.text.length || !S.textSpeed;
  const shown = full ? x.text : x.text.slice(0, UI.typed);
  return `<div class="story" data-act="storyTap"><div class="story-card">
    <div class="story-art">${artHTML(RUN.art)}<span class="story-title">${esc(RUN.title || '')}</span></div>
    <div class="story-box">
      ${x.who ? `<span class="story-name ${x.isMe ? 'me' : ''}">${esc(x.who)}</span>` : ''}
      <div class="story-text ${x.T.n ? 'narr' : ''} ${x.isMe ? 'mono' : ''}">${esc(shown)}</div>
      ${x.L.c ? `<div class="story-choices">${x.L.c.map((ch, k) => { const need = choiceNeed(ch);
        return `<button data-act="choose" data-arg="${k}" ${need ? 'disabled' : ''}>${esc(disp(ch.t))}${need ? `<small>${need}</small>` : ''}</button>`; }).join('')}</div>`
        : '<div class="story-next">▼ 눌러서 계속</div>'}
    </div></div></div>`;
}
// 내기 창: 위에 금액 막대, 아래에 보기. 막대를 끄는 동안에는 글자만 바꾼다 (onInput)
function betState(q) {
  const bk = betKind(), cash = Math.max(0, Math.floor(S.cash / bk.unit) * bk.unit);
  if (!UI.bet || UI.bet.id !== q.id) UI.bet = { id: q.id, k: null, stake: Math.min(cash, betFull()) };
  UI.bet.stake = Math.min(UI.bet.stake, cash);
  return { bk, cash, B: UI.bet };
}
const betOptText = (q, k, stake) => { const o = betOdds(q, k, stake); return `${o}배 · 맞히면 ${fmtWon(Math.round(stake * o))}`; };
const betNote = stake => stake > betFull() ? `${fmtWon(betFull())}을 넘게 걸어서 배당이 줄었습니다.` : `${fmtWon(betFull())}까지는 기본 배당, 그보다 많이 걸면 배당이 줄어듭니다.`;
function betHTML(q) {
  const { bk, cash, B } = betState(q), mem = S.betMem && S.betMem[q.id];
  return `<div class="story" data-act="noop"><div class="story-card">
    <div class="story-art bet-art">${artHTML('scene:stadium')}<span class="story-title">${esc(RUN.title || '')}</span></div>
    <div class="story-box bet-box">
      <b class="bet-q">${q.title}</b>
      <div class="sub">${bk.intro} 결과는 ${fmtYM(miOf(q.end))}에 나옵니다.</div>
      <div class="bet-stake">
        <div class="row"><span class="sub">걸 금액 · 현금 ${fmtWon(S.cash)}</span><span class="sp"></span><b class="num qty-big" id="betStake">${fmtWon(B.stake)}</b></div>
        <input type="range" class="qty-range" min="0" max="${cash}" step="${bk.unit}" value="${B.stake}" data-input="bet" aria-label="걸 금액" ${cash ? '' : 'disabled'}>
        <div class="quick q4">${[0.1, 0.25, 0.5, 1].map(p => `<button data-act="betPct" data-arg="${p}">${p === 1 ? '전액' : p * 100 + '%'}</button>`).join('')}</div>
        <div class="sub" id="betNote" style="margin-top:4px">${betNote(B.stake)}</div>
      </div>
      <div class="bet-mem">${mem ? `${icon('gem', 14)}<span>「${q.opts[q.win][0]}」${josa(q.opts[q.win][0], '이었다', '였다')}. 분명히 기억난다.</span>`
        : `<button class="btn gem sm" data-act="betRemember">${icon('gem', 14)} 결과 떠올리기 · 💎${GEM_COST.bet}</button><span class="sub">보석을 쓰면 정답이 떠오릅니다.</span>`}</div>
      <div class="bet-opts">${q.opts.map(([name, odds], k) => `<button class="bet-opt ${B.k === k ? 'on' : ''} ${mem && k === q.win ? 'known' : ''}" data-act="betPick" data-arg="${k}"><span>${name}${mem && k === q.win ? ' <i class="mem">💭 기억</i>' : ''}<small>기본 ${odds}배</small></span><b class="num" id="betOdds${k}">${betOptText(q, k, B.stake)}</b></button>`).join('')}</div>
      <div class="btns"><button class="btn ghost" data-act="betSkip">이번엔 넘긴다</button><button class="btn" id="betBtn" data-act="betPlace" ${B.k != null && B.stake >= bk.unit ? '' : 'disabled'}>걸기</button></div>
    </div></div></div>`;
}
let typeTimer = null;
function typewriter() {
  const x = RUN && RUN.cur && !RUN.cur.c ? storyLine() : null;
  if (!x || !S.textSpeed || typeof setInterval !== 'function') { clearInterval(typeTimer); return; }
  if (UI.typedKey === x.key) return;
  UI.typedKey = x.key; UI.typed = 0;
  clearInterval(typeTimer);
  const el = document.querySelector('.story-text'); if (el) el.textContent = '';
  typeTimer = setInterval(() => {
    // 그사이 다음 대사로 넘어갔으면 멈춘다 (지난 대사가 새 대사를 덮어쓰지 않게)
    const now = RUN && RUN.cur && storyLine();
    if (!now || now.key !== x.key) { clearInterval(typeTimer); return; }
    UI.typed += 2;
    const e = document.querySelector('.story-text');
    if (e) e.textContent = x.text.slice(0, UI.typed);
    if (UI.typed >= x.text.length) clearInterval(typeTimer);
  }, 24);
}

// ---- 시작 화면 ----
function titleHTML() {
  const has = hasSave();
  return `<div class="title"><div class="art">${sceneSVG('night2026')}</div><div class="title-in">
    <h1><small>1996 · 회귀</small>회귀자의 선택</h1>
    <p>2026년, 마흔한 살. 아내의 배신과 남의 아이.<br>눈을 뜨니 1996년, 열한 살의 겨울방학이었다.<br>주식, 코인, 부동산. 그리고 사람. 이번엔 다르게 산다.</p>
    <input type="text" maxlength="8" data-input="name" value="${esc(UI.name || DEFAULT_NAME)}" aria-label="주인공 이름">
    <button class="btn" data-act="start">새로 시작</button>
    ${has ? '<button class="btn ghost" data-act="continue">이어하기</button>' : ''}
    <div class="dev">${VERSION} 개발 버전 · 보석 무한 · 실제 시세 ${MARKET.start.slice(0, 4)}~${MARKET.end.replace('-', '.')}</div>
  </div></div>`;
}

// ---- 동작 ----
// 팔았으면 저장하고 결과 창을 띄운다
function sold(r) { if (r.ok) { save(); if (r.v && r.v.kind === 'sold') UI.pops.push(r.v); } render(); }
const ACT = {
  tab(t) { UI.tab = t; UI.bubble = ''; render(); },
  sheet(s) { UI.sheet = s; UI.giftOpen = false; UI.confirmNew = false; if (s === 'stocks' && !UI.sel) UI.sel = null; render(); },
  close() { UI.sheet = null; UI.sel = null; UI.order = null; UI.giftOpen = false; render(); },
  scrim(_, el, ev) { if (ev && ev.target === el) ACT.close(); },
  unsel() { UI.sel = null; render(); },
  ftab(t) { const tb = TABS.find(x => x.id === t); UI.ftab = t; UI.sel = null; if (!tabOpen(t)) toast(`${tb.label}은 ${tb.open.replace('-', '년 ')}월에 열립니다.`); render(); },
  sel(id) { UI.sel = id; UI.qty = 0; UI.side = 'buy'; render(); },
  side(s) { UI.side = s; UI.qty = 0; render(); },
  pct(p) {
    const o = UI.order;
    if (o && o.kind !== 'stock') { const max = o.kind === 'fut' ? futMax(o.id) : optMax(o.K); UI.qty = +p >= 1 ? max : Math.min(max, Math.max(1, Math.floor(max * p))); return render(); }
    const id = o ? o.id : UI.sel, max = orderMax(id); UI.qty = +p >= 1 ? max : Math.min(max, Math.max(qtyStep(id), roundQty(id, max * p))); render();
  },
  trade(id) { const r = UI.side === 'sell' ? sell(id, UI.qty) : buy(id, UI.qty); if (r.ok) { UI.qty = 0; UI.order = null; if (!r.v) toast(S.log[0].t); } sold(r); },
  shopTab(t) { UI.shopTab = t; render(); },
  shopOpen() { UI.sheet = 'shop'; UI.shopTab = 'gear'; render(); },
  gearBuy(id) { const r = buyGear(id); if (r.ok) { toast(GR[id].name + (r.v ? '을(를) 입었습니다.' : '을(를) 샀습니다. 상태 탭에서 입을 수 있습니다.')); save(); } render(); },
  slot(s) { UI.slot = s; UI.sheet = 'slot'; render(); },
  equip(a) { const [s, id] = a.split(':'); if (equip(s, id).ok) { save(); UI.sheet = null; } render(); },
  unequip(s) { unequip(s); save(); render(); },
  openTicker(id) { const t = TK[id]; UI.sheet = 'stocks'; UI.ftab = t.tab === 'COIN' || t.tab === 'ETF' || t.tab === 'US' ? t.tab : tkTab(id); ACT.sel(id); },
  range(r) { UI.range = r; render(); },
  sort(k) { UI.sort = k; render(); },
  amtSet(v) { UI.amt = +v; render(); },
  buy(id) { if (buy(id, UI.qty).ok) { save(); } render(); },
  sell(id) { sold(sell(id, UI.qty)); },
  sellAll(id) { if (S.hold[id]) sold(sell(id, S.hold[id].q)); },
  reveal(key) { if (revealNext(key, revealLabel(key)).ok) save(); render(); },
  revealN(a) { const i = a.lastIndexOf('|'), key = a.slice(0, i), m = +a.slice(i + 1); if ((m === 1 ? revealNext(key, revealLabel(key)) : revealUpTo(key, m, revealLabel(key))).ok) save(); render(); },
  estSel(id) { UI.estSel = UI.estSel === id ? null : id; render(); },
  pview(v) { UI.pview = v; render(); },
  futClose(fid) { const r = closeFut(fid); if (r.ok) UI.order = null; sold(r); },
  optSell(i) { sold(sellOpt(+i)); },
  bondSell(u) { sold(sellBond(+u)); },
  dep() { deposit(Math.min(UI.amt, S.cash)); save(); render(); },
  wd() { withdraw(UI.amt); save(); render(); },
  borrow() { borrow(UI.amt); save(); render(); },
  repay() { repay(UI.amt); save(); render(); },
  estBuy(id) { const isNew = !S.re[id]; if (buyEstate(id).ok) { save(); if (isNew) toast('샀습니다. 부동산 관리에서 들어가 살거나 세를 놓으세요.'); } render(); },
  estSell(id) { sold(sellEstate(id)); },
  lease(arg) { const [id, m] = arg.split(':'); if (setLease(id, m).ok) save(); render(); },
  live(id) { if (moveIn(id).ok) save(); render(); },
  leave() { if (moveOut().ok) save(); render(); },
  estMgrBack() { UI.sheet = 'estate'; render(); },
  luxBuy(id) { if (buyLux(id).ok) save(); render(); },
  luxSell(id) { sold(sellLux(id)); },
  ordOpen(a) {
    const [kind, id, side] = a.split(':');
    UI.order = { kind, id: kind === 'opt' ? null : id, K: kind === 'opt' && id ? +id : null };
    UI.qty = 0; UI.amt = 0; if (kind === 'stock') UI.side = side || 'buy';
    render();
  },
  ordClose() { UI.order = null; render(); },
  ordScrim(_, el, ev) { if (ev && ev.target === el) ACT.ordClose(); },
  ordK(k) { UI.order.K = +k; UI.qty = Math.min(UI.qty, optMax(+k)); render(); },
  ordDetail() { const id = UI.order.id; UI.order = null; UI.sheet = 'stocks'; UI.sel = id; render(); },
  ordGo(a) {
    const o = UI.order; if (!o) return;
    const r = o.kind === 'fut' ? openFut(o.id, +a, UI.qty) : o.kind === 'opt' ? buyOpt(a, o.K, UI.qty) : o.kind === 'bond' ? buyBond(o.id, UI.amt) : null;
    if (!r) return;
    if (r.ok) { UI.order = null; UI.qty = 0; toast(S.log[0].t); }
    sold(r);
  },
  apct(p) { UI.amt = Math.floor(S.cash * +p / 10000) * 10000; render(); },
  popClose() { UI.pops.shift(); afterTurn(); },
  popScrim(_, el, ev) { if (ev && ev.target === el) ACT.popClose(); },
  report(a) { const [m0, m1, k] = a.split(':'); const r = periodReport(+m0, +m1, k); if (r) UI.pops.push(r); render(); },
  finP(k) { UI.finP = k; render(); },
  shopBuy(id) { if (buyShop(id).ok) { toast(ITEM[id].name + '을(를) 샀습니다.'); save(); } render(); },
  person(id) { UI.sheet = 'person'; UI.sel = id; UI.giftOpen = false; render(); },
  talk(id) { const r = talk(id); if (r.ok) UI.say[id] = r.v; afterTurn(); },
  outing(id) { const r = outing(id); if (r.ok) { UI.sheet = null; UI.bubble = `${CH[id].name}와 즐거운 시간을 보냈습니다.`; } afterTurn(); },
  giftOpen() { UI.giftOpen = !UI.giftOpen; render(); },
  gift(a) { const [id, k] = a.split(':'); if (giveGift(id, k).ok) { UI.giftOpen = false; UI.say[id] = CH[id].likes.includes(k) ? '어? 이거 내가 좋아하는 건데! 고마워.' : '고마워. 잘 쓸게.'; save(); } afterTurn(); },
  money(id) { if (giveMoney(id).ok) { UI.say[id] = '뭘 이런 걸 다… 고맙다.'; save(); } render(); },
  confess(id) { const r = confess(id); if (r.ok && !r.v) UI.say[id] = '…미안. 아직은 잘 모르겠어.'; UI.sheet = r.v ? null : UI.sheet; save(); afterTurn(); },
  propose(id) { if (propose(id).ok) UI.sheet = null; save(); afterTurn(); },
  remember(id) { remember(id); save(); render(); },
  do(kind) {
    if (kind === 'shop') return ACT.sheet('shop');
    const r = doAction(kind); if (r.ok) UI.bubble = r.v; afterTurn();
  },
  recall() { UI.recall = null; UI.sheet = 'recall'; render(); },
  recallH(h) { const r = recall(+h); if (r.ok) { UI.recall = r.v; save(); } render(); },
  recallBack() { UI.recall = null; render(); },
  lottoPick(n) { n = +n; const p = UI.lottoPick, i = p.indexOf(n); if (i >= 0) p.splice(i, 1); else if (p.length < 6) p.push(n); else toast('6개까지 고를 수 있습니다.'); p.sort((a, b) => a - b); render(); },
  lottoAuto() { UI.lottoPick = lottoAuto(); render(); },
  lottoFill() { const L = S.lotto; if (!L) return; const p = L.seq.slice(0, L.open); for (const n of lottoAuto()) if (p.length < 6 && !p.includes(n)) p.push(n); UI.lottoPick = p.sort((a, b) => a - b); render(); },
  lottoClear() { UI.lottoPick = []; render(); },
  lottoBuy() { if (buyLotto(UI.lottoPick).ok) { UI.lottoPick = []; save(); } render(); },
  lottoReveal() { if (lottoReveal().ok) save(); render(); },
  // 다음 달: 아직 할 수 있는 행동이 남았으면 한 번 더 눌러야 넘어간다
  next() {
    if (S.ended || RUN) return;
    const canAct = ['study', 'gym', 'work'].some(k => !actionBlocked(k));
    if (canAct && !UI.confirmNext) { UI.confirmNext = true; toast(`체력이 ${Math.round(S.sta)} 남았습니다. 한 번 더 누르면 다음 달로 넘어갑니다.`); return render(); }
    UI.confirmNext = false;
    const r = nextMonth();
    if (r.ok) { UI.bubble = S.ended ? '마지막 달이 끝났습니다.' : S.hints.length ? '' : `${year()}년 ${month()}월 · 지난달보다 ${fmtSigned(netWorth() - S.monthStartNW)}`;
      const os = takeOptSettle(); if (os) UI.pops.push(os);               // 옵션이 만기로 정산됐으면 결과 창
      const rep = !S.ended && periodDue(); if (rep) UI.pops.push(rep);   // 분기·해가 바뀌면 결산 창
      save(); }
    afterTurn();
  },
  storyTap(_, el, ev) {
    if (!RUN || !RUN.cur || RUN.cur.bet) return;
    const x = storyLine();
    if (!x.L.c && S.textSpeed && UI.typedKey === x.key && UI.typed < x.text.length) { UI.typed = x.text.length; clearInterval(typeTimer); render(); return; }
    if (x.L.c) return;
    storyAdvance(); afterTurn();
  },
  choose(k) { storyChoose(+k); afterTurn(); },
  betPick(k) { if (UI.bet) UI.bet.k = +k; render(); },
  betPct(p) { const q = SPORT[UI.bet && UI.bet.id]; if (!q) return; const { bk, cash } = betState(q); UI.bet.stake = +p >= 1 ? cash : Math.floor(cash * p / bk.unit) * bk.unit; render(); },
  betPlace() {
    const B = UI.bet, q = B && SPORT[B.id]; if (!q) return;
    const r = placeBet(q.id, B.k, B.stake);
    if (!r.ok) return render();
    RUN.lines.splice(RUN.i + 1, 0, { n: `${q.opts[B.k][0]}에 ${fmtWon(S.bets[S.bets.length - 1].stake)}을 걸었습니다. 배당 ${r.v}배, 맞히면 ${fmtWon(Math.round(S.bets[S.bets.length - 1].stake * r.v))}입니다.` });
    UI.bet = null; save(); storyAdvance(); afterTurn();
  },
  betSkip() { UI.bet = null; storyAdvance(); afterTurn(); },
  betRemember() { if (UI.bet && betRemember(UI.bet.id).ok) { UI.bet.k = SPORT[UI.bet.id].win; save(); } render(); },
  theme(t) { S.theme = t; applyTheme(); save(); render(); },
  speed(v) { S.textSpeed = +v; save(); render(); },
  saveNow() { save(); toast('저장했습니다.'); },
  install() { installApp(); },
  newGame() {
    if (!UI.confirmNew && UI.sheet !== 'ending') { UI.confirmNew = true; return render(); }
    UI.confirmNew = false; clearSave(); S = null; RUN = null; UI.sheet = null; UI.tab = 'main'; UI.endShown = false; render();
  },
  start() { UI.sheet = null; UI.tab = 'main'; UI.endShown = false; newGame({ name: (UI.name || DEFAULT_NAME).trim() || DEFAULT_NAME }); applyTheme(); save(); afterTurn(); },
  continue() { if (load()) { applyTheme(); afterTurn(); } else toast('저장된 게임이 없습니다.'); },
};
function onInput(name, value) {
  if (name === 'qty') {   // 막대를 끄는 동안에는 다시 그리지 않고 글자만 바꾼다
    UI.qty = Math.max(0, +value || 0);
    const o = UI.order, id = o ? (o.kind === 'stock' ? o.id : null) : UI.sel;
    const q = $('qtyLabel'), e = $('estLabel'), b = $('tradeBtn');
    if (o && o.kind !== 'stock') {   // 선물·옵션: 계약 수
      if (q) q.textContent = UI.qty.toLocaleString() + '계약';
      if (e) e.textContent = ordEst();
      goBtns(UI.qty);
    } else if (id && TK[id]) {
      if (q) q.textContent = fmtQty(id, UI.qty);
      if (e) e.textContent = tradeEst(id);
      if (b) b.disabled = !(UI.qty > 0);
    }
  } else if (name === 'bet' && UI.bet) {
    const q = SPORT[UI.bet.id], { bk } = betState(q);
    UI.bet.stake = Math.floor((+value || 0) / bk.unit) * bk.unit;
    const s = $('betStake'), n = $('betNote'), b = $('betBtn');
    if (s) s.textContent = fmtWon(UI.bet.stake);
    if (n) n.textContent = betNote(UI.bet.stake);
    q.opts.forEach((_, k) => { const e = $('betOdds' + k); if (e) e.textContent = betOptText(q, k, UI.bet.stake); });
    if (b) b.disabled = !(UI.bet.k != null && UI.bet.stake >= bk.unit);
  } else if (name === 'amt') {
    UI.amt = Math.max(0, +value || 0);
    const e = $('amtLabel'); if (e) e.textContent = fmtWon(UI.amt);
    if (UI.order && UI.order.kind === 'bond') { const x = $('estLabel'); if (x) x.textContent = ordEst(); goBtns(UI.amt >= 10000 ? 1 : 0); }
  } else if (name === 'name') UI.name = value;
}
function applyTheme() {
  const t = S && S.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
}
