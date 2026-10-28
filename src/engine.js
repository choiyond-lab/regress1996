// ===== 상태 · 시간 · 시세 · 거래 · 정산 =====
let S = null;
const TK = Object.fromEntries(TICKERS.map(t => [t.id, t]));
const CH = Object.fromEntries(CHARS.map(c => [c.id, c]));
const FUT = Object.fromEntries(FUTURES.map(f => [f.id, f]));
const BOND = Object.fromEntries(BONDS.map(b => [b.id, b]));
const EST = Object.fromEntries(ESTATES.map(e => [e.id, e]));
const LUX = Object.fromEntries(LUXURY.map(l => [l.id, l]));
const ITEM = Object.fromEntries(SHOP.map(i => [i.id, i]));
const GR = Object.fromEntries(GEAR.map(g => [g.id, g]));
const SPORT = Object.fromEntries(SPORTS.map(q => [q.id, q]));
const LAST_MI = MARKET.m.kospi.length - 1;

// ---- 날짜 ----
function ymOf(mi) {
  const [y0, m0] = MARKET.start.split('-').map(Number);
  const t = y0 * 12 + (m0 - 1) + mi;
  return Math.floor(t / 12) + '-' + String(t % 12 + 1).padStart(2, '0');
}
function miOf(ym) {
  const [y, m] = ym.split('-').map(Number), [y0, m0] = MARKET.start.split('-').map(Number);
  return (y - y0) * 12 + (m - m0);
}
const curYM = () => ymOf(S.mi);
const yearOf = mi => +ymOf(mi).slice(0, 4);
const year = () => yearOf(S.mi);
const month = () => +curYM().slice(5);
const ageAt = (born, y) => y - born + 1;          // 세는나이
const age = () => ageAt(BIRTH_YEAR, year());
const cpiF = (y) => (CPI[y || year()] || CPI[2026]) / CPI[1996];
const won100 = n => Math.round(n / 100) * 100;
function schoolLabel() {
  const y = year(), g = y - 1992;
  if (g <= 6) return '초등학교 ' + g + '학년';
  if (g <= 9) return '중학교 ' + (g - 6) + '학년';
  if (g <= 12) return '고등학교 ' + (g - 9) + '학년';
  if (S.job === 'office') return '회사원';
  if (S.job === 'investor') return '전업 투자자';
  if (y <= 2008 && S.edu) return EDU[S.edu].label + ' ' + Math.min(4, y - 2004) + '학년';
  return y <= 2008 ? '수험생' : '사회 초년생';
}
function stageOfAge(a) { return a <= 13 ? 'kid' : a <= 19 ? 'teen' : 'adult'; }

// ---- 난수 (저장되는 시드) ----
function rand() {
  let t = (S.rng = (S.rng + 0x6D2B79F5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ---- 새 게임 ----
function newGame(opts) {
  opts = opts || {};
  S = {
    v: 2, name: opts.name || DEFAULT_NAME, rng: (opts.seed || Date.now()) >>> 0,
    mi: miOf(START_YM), mo: {},
    cash: START_CASH, gems: 0, gemsUsed: 0, sta: STA_BASE + START_HP,
    st: { int: 25, hp: START_HP, cha: 20, fame: 0 },
    hold: {}, fut: {}, opt: [], bonds: [], bank: { dep: 0, loan: 0 }, re: {}, home: null, lux: {}, luxCost: {}, inv: {},
    flags: {}, people: {}, reveal: {}, gear: {}, equip: {}, bets: [], betMem: {},
    log: [], hist: [], queue: [], done: {}, uid: 1,
    job: null, jobSince: 0, edu: null, realized: 0, divTotal: 0, rentTotal: 0, intTotal: 0, feePaid: 0, taxPaid: 0, usGain: {}, ended: false, hints: [], lotto: null, lottoLast: null,
    monthStartNW: 0, tab: 'main', theme: 'system', textSpeed: 1,
  };
  for (const c of CHARS) if (c.meet === 'start') meet(c.id, true);
  newLotto();
  S.monthStartNW = netWorth();
  record();
  checkEvents();
  return S;
}

// ---- 기록 ----
function log(text, kind) {
  S.log.unshift({ mi: S.mi, t: text, k: kind || '' });
  if (S.log.length > 400) S.log.length = 400;
}
function record() {
  const b = breakdown(), r = Math.round;
  const h = { mi: S.mi, nw: r(netWorth()), cash: r(S.cash), liq: r(b.cash + b.dep), inv: r(b.KS + b.KQ + b.US + b.ETF + b.COIN + b.fut + b.opt + b.bond),
    re: r(b.estate), lux: r(b.lux), debt: r(b.loan + b.jdep), rl: r(S.realized), dv: r(S.divTotal), rent: r(S.rentTotal), it: r(S.intTotal), cost: r(S.feePaid + S.taxPaid) };
  const last = S.hist[S.hist.length - 1];
  if (last && last.mi === S.mi) S.hist[S.hist.length - 1] = h; else S.hist.push(h);
}

// ---- 시세 ----
// 한 달에 가격 하나: 그달 실제 월말 종가
function splitRatio(id, mi) {
  const s = MARKET.s[id]; if (!s || !s.sp.length) return 1;
  const ym = ymOf(mi); let r = 1;
  for (const [m, x] of s.sp) if (m === ym) r *= x;
  return r;
}
function priceAt(id, mi) { const s = MARKET.s[id]; return s && mi >= 0 && mi <= LAST_MI ? s.c[mi] : null; }
function price(id) { return priceAt(id, S.mi); }
// 지난달 종가를 지금 주식 수 기준으로 (이번 달 분할 반영)
function prevPrice(id) { const p = priceAt(id, S.mi - 1); return p == null ? null : p / splitRatio(id, S.mi); }
function macroAt(k, mi) {
  if (mi < 0 || mi > LAST_MI) return null;
  if (k === 'ks200') return MARKET.m.kospi[mi] * ks200Ratio(mi);
  return MARKET.m[k][mi];
}
const macro = k => macroAt(k, S.mi);
const fxNow = () => macro('fx');
function listed(id, mi) { const s = MARKET.s[id]; mi = mi == null ? S.mi : mi; return !!(s && s.c[mi] != null); }
function byDate(v, ym) { // [[년월, 값], ...] 또는 값 하나
  if (!Array.isArray(v)) return v;
  let out = v[0][1];
  for (const [m, x] of v) if (ym >= m) out = x;
  return out;
}
const tkName = (id, ym) => byDate(TK[id].names || TK[id].name, ym || curYM());
const tkTab = (id, ym) => byDate(TK[id].tab, ym || curYM());
const isCoin = id => TK[id] && TK[id].tab === 'COIN';
function unitKRW(id) { const p = price(id); return TK[id].cur === 'USD' ? p * fxNow() : p; }
// 지난달 대비 등락률
function changePct(id) { const p0 = prevPrice(id), p = price(id); return p0 ? (p / p0 - 1) * 100 : 0; }
function macroChange(k) { const a = macroAt(k, S.mi - 1), b = macro(k); return a ? (b / a - 1) * 100 : 0; }
function tabOpen(tab) { const t = TABS.find(x => x.id === tab); return curYM() >= t.open; }
// 분할 반영 연속 시계열 (차트용): 지금 주식 수 기준으로 맞춘다
// 과거 값은 그 뒤 지금까지의 분할 비율로 나누고, 미래 값은 지금부터 그때까지의 분할 비율을 곱한다
function adjSeries(id, toMi) {
  const s = MARKET.s[id], out = [];
  for (let mi = 0; mi <= toMi && mi <= LAST_MI; mi++) {
    if (s.c[mi] == null) { out.push(null); continue; }
    let f = 1;
    for (const [m, r] of s.sp) {
      const k = miOf(m);
      if (mi <= S.mi && k > mi && k <= S.mi) f /= r;
      if (mi > S.mi && k > S.mi && k <= mi) f *= r;
    }
    out.push(s.c[mi] * f);
  }
  return out;
}

// ---- 시가총액 (원) ----
// 지금 주식 수를 그달의 주식 수로 되돌려(그 뒤 분할 비율로 나눠) 그달 종가를 곱한다. 증자·자사주 소각은 반영하지 못한 근사값
// 코인은 유통량(비트코인·이더리움은 연도별), ETF 는 지금 순자산을 가격 흐름으로 되돌린 값. 정보가 없으면 0
function mcapAt(id, mi) {
  const s = MARKET.s[id], p = priceAt(id, mi); if (!s || p == null) return 0;
  const fx = TK[id].cur === 'USD' ? macroAt('fx', mi) : 1;
  let f = 1; for (const [m, r] of s.sp) if (miOf(m) > mi) f *= r;
  if (s.so) return p * s.so / f * fx;
  if (s.cs) return p * (COIN_SUPPLY[id] ? anchorAt(COIN_SUPPLY[id], mi, false) : s.cs) * fx;
  if (s.na && s.c[LAST_MI]) return s.na * (p / f) / s.c[LAST_MI] * fx;
  return 0;
}
const mcap = id => mcapAt(id, S.mi);
// 종목 정렬: base 기본 순서 · cap 시가총액 큰 순 · up 이번 달 상승률 순 · down 하락률 순
function sortTickers(list, how) {
  const key = { cap: t => -mcap(t.id), up: t => -changePct(t.id), down: t => changePct(t.id) }[how];
  return key ? list.map((t, i) => [t, key(t), i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map(x => x[0]) : list;
}

// ---- 주식·ETF·코인 거래 ----
// 매매 비용률 (한 번 사거나 팔 때). 해외 주식은 수수료에 환전 비용이 붙는다
function feeRate(id) { const ym = curYM(); return isCoin(id) ? feeCoin(ym) : TK[id].cur === 'USD' ? feeUSComm(ym) + fxSpread(ym) : feeKR(ym); }
const sellTaxRate = id => TK[id].cur === 'KRW' && TK[id].tab !== 'ETF' ? sellTax(curYM()) : 0;
const isUSStock = id => TK[id].cur === 'USD' && !isCoin(id);
function qtyStep(id) { return isCoin(id) ? 0.0001 : 1; }
function roundQty(id, q) { const st = qtyStep(id); return Math.floor(q / st + 1e-9) * st; }
function holdCap(id) { return (isCoin(id) ? coinCap(curYM()) : HOLD_CAP[TK[id].tab === 'ETF' || TK[id].tab === 'US' ? TK[id].tab : tkTab(id)]) * cpiF(); }
function maxBuy(id) {
  if (!listed(id)) return 0;
  const u = unitKRW(id) * (1 + feeRate(id));
  const room = Math.max(0, holdCap(id) - holdValue(id));
  return Math.max(0, roundQty(id, Math.min(S.cash, room) / u));
}
function canTrade(id) {
  if (!S.flags.account) return '아직 증권 계좌가 없습니다.';
  if (!listed(id)) return '아직 상장되지 않았습니다.';
  if (!tabOpen(TK[id].tab === 'COIN' ? 'COIN' : tkTab(id))) return '아직 열리지 않은 시장입니다.';
  return '';
}
function buy(id, q) {
  const why = canTrade(id); if (why) return fail(why);
  q = roundQty(id, q);
  if (!(q > 0)) return fail('수량을 확인하세요.');
  const gross = unitKRW(id) * q, fee = gross * feeRate(id);
  if (gross + fee > S.cash + 1e-6) return fail('현금이 부족합니다.');
  if (holdValue(id) + gross > holdCap(id)) return fail('시장에서 더 살 물량이 없습니다. 한 종목 한도 ' + fmtWon(holdCap(id)));
  S.cash -= gross + fee; S.feePaid += fee;
  const h = S.hold[id] || (S.hold[id] = { q: 0, cost: 0 });
  h.q += q; h.cost += gross + fee;
  log(`${tkName(id)} ${fmtQty(id, q)} 매수 · ${fmtWon(gross + fee)}`, 'blue');
  return ok();
}
function sell(id, q) {
  const h = S.hold[id];
  if (!h || h.q <= 0) return fail('보유 수량이 없습니다.');
  if (!listed(id)) return fail('거래할 수 없습니다.');
  q = Math.min(h.q, q >= h.q - 1e-9 ? h.q : roundQty(id, q));
  if (!(q > 0)) return fail('수량을 확인하세요.');
  const gross = unitKRW(id) * q;
  const tax = gross * sellTaxRate(id), fee = gross * feeRate(id);
  const net = gross - fee - tax;
  const costPart = h.cost * (q / h.q);
  S.cash += net; S.realized += net - costPart; S.feePaid += fee; S.taxPaid += tax;
  if (isUSStock(id)) S.usGain[year()] = (S.usGain[year()] || 0) + net - costPart;   // 해외 주식 양도소득세 계산용
  h.q -= q; h.cost -= costPart;
  if (h.q < 1e-6) delete S.hold[id];
  log(`${tkName(id)} ${fmtQty(id, q)} 매도 · ${fmtWon(net)} (손익 ${fmtSigned(net - costPart)})`, net >= costPart ? 'good' : 'bad');
  return ok({ kind: 'sold', title: '매도 체결', name: tkName(id), what: `${fmtQty(id, q)} × ${fmtPrice(id, price(id))}`, pl: net - costPart, cost: costPart,
    rows: [['판 금액', gross], ['수수료', -fee], ...(tax ? [['거래세', -tax]] : []), ['받은 돈', net, 1], ['산 금액 (평단 × 수량)', costPart]] });
}
function holdValue(id) { const h = S.hold[id]; return h && listed(id) ? h.q * unitKRW(id) : 0; }

// ---- 선물 ----
function futPrice(fid) { return macro(FUT[fid].idx); }
function futMultKRW(fid, pos) {
  const f = FUT[fid]; const m = pos ? pos.mult : f.mult(curYM());
  return m * (f.cur === 'USD' ? fxNow() : 1);
}
function futOpen(fid) { return curYM() >= FUT[fid].open && tabOpen('FUT'); }
function openFut(fid, dir, q) {
  if (!S.flags.account) return fail('아직 증권 계좌가 없습니다.');
  if (!futOpen(fid)) return fail('아직 상장되지 않았습니다.');
  q = Math.floor(q); if (!(q > 0)) return fail('수량을 확인하세요.');
  const pos = S.fut[fid];
  if (pos && pos.dir !== dir) return fail('반대 포지션은 먼저 청산하세요.');
  if ((pos ? pos.q : 0) + q > POS_LIMIT.fut) return fail('포지션 한도는 ' + POS_LIMIT.fut + '계약입니다.');
  const p = futPrice(fid), mult = FUT[fid].mult(curYM());
  const margin = p * futMultKRW(fid) * q * FUT_MARGIN, fee = p * futMultKRW(fid) * q * FUT_FEE;
  if (margin + fee > S.cash) return fail('증거금이 부족합니다. (필요 ' + fmtWon(margin + fee) + ')');
  S.cash -= margin + fee; S.feePaid += fee; S.realized -= fee;
  if (pos) { pos.entry = (pos.entry * pos.q + p * q) / (pos.q + q); pos.q += q; pos.margin += margin; }
  else S.fut[fid] = { dir, q, entry: p, margin, mult };
  log(`${FUT[fid].name} ${dir > 0 ? '매수' : '매도'} ${q}계약 · 증거금 ${fmtWon(margin)}`, 'blue');
  return ok();
}
function futPL(fid) { const pos = S.fut[fid]; return pos ? pos.dir * (futPrice(fid) - pos.entry) * futMultKRW(fid, pos) * pos.q : 0; }
function closeFut(fid, forced) {
  const pos = S.fut[fid]; if (!pos) return fail('포지션이 없습니다.');
  const pl = futPL(fid), fee = futPrice(fid) * futMultKRW(fid, pos) * pos.q * FUT_FEE;
  S.cash += pos.margin + pl - fee; S.realized += pl - fee; S.feePaid += fee;
  delete S.fut[fid];
  log(`${FUT[fid].name} ${forced ? '강제 청산' : '청산'} · 손익 ${fmtSigned(pl)}`, pl >= 0 ? 'good' : 'bad');
  return ok({ kind: 'sold', title: '청산 체결', name: FUT[fid].name, what: `${pos.dir > 0 ? '매수' : '매도'} ${pos.q}계약 · ${futPrice(fid).toFixed(2)}`, pl: pl - fee, cost: pos.margin,
    rows: [['맡긴 증거금', pos.margin], ['가격 손익', pl], ['수수료', -fee], ['받은 돈', pos.margin + pl - fee, 1]] });
}
// 주문창용: 선물 한 계약에 드는 돈(증거금 + 수수료)과 걸 수 있는 최대 계약 수
const futUnitCost = fid => futPrice(fid) * futMultKRW(fid) * (FUT_MARGIN + FUT_FEE);
function futMax(fid) { const pos = S.fut[fid]; return Math.max(0, Math.min(POS_LIMIT.fut - (pos ? pos.q : 0), Math.floor(S.cash / futUnitCost(fid)))); }
function checkMargin() {
  for (const fid of Object.keys(S.fut)) {
    const pos = S.fut[fid];
    if (pos.margin + futPL(fid) < pos.margin * FUT_CUT) { closeFut(fid, true); toast(FUT[fid].name + ' 증거금 부족으로 강제 청산되었습니다.'); }
  }
}

// ---- 옵션 (코스피200, 달마다 만기) ----
function normCdf(x) { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const d = 0.3989423 * Math.exp(-x * x / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; }
function bs(type, s, k, T, r, v) {
  if (T <= 0) return Math.max(0, type === 'C' ? s - k : k - s);
  const d1 = (Math.log(s / k) + (r + v * v / 2) * T) / (v * Math.sqrt(T)), d2 = d1 - v * Math.sqrt(T);
  return type === 'C' ? s * normCdf(d1) - k * Math.exp(-r * T) * normCdf(d2) : k * Math.exp(-r * T) * normCdf(-d2) - s * normCdf(-d1);
}
function optVol(mi) {
  const a = MARKET.m.kospi, rs = [];
  for (let i = Math.max(1, mi - 12); i < mi; i++) if (a[i] && a[i - 1]) rs.push(Math.log(a[i] / a[i - 1]));
  if (rs.length < 3) return 0.3;
  const m = rs.reduce((s, x) => s + x, 0) / rs.length;
  const sd = Math.sqrt(rs.reduce((s, x) => s + (x - m) ** 2, 0) / (rs.length - 1)) * Math.sqrt(12);
  return Math.min(0.8, Math.max(0.15, sd));
}
// 이번 달 종가로 사서 다음 달 종가로 정산하는 한 달짜리 옵션
function optChain() {
  const s0 = macro('ks200');
  const ks = [...new Set(OPT_STRIKES.map(k => Math.round(s0 * (1 + k) / 2.5) * 2.5))];
  return ks.map(K => ({ K }));
}
function optPremium(type, K) { // 포인트, 남은 기간 한 달
  const r = (MARKET.m.cd[S.mi] || 3) / 100;
  return Math.max(0.01, bs(type, macro('ks200'), K, 1 / 12, r, optVol(S.mi)));
}
function buyOpt(type, K, q) {
  if (!S.flags.account) return fail('아직 증권 계좌가 없습니다.');
  if (!tabOpen('OPT')) return fail('아직 상장되지 않았습니다.');
  q = Math.floor(q); if (!(q > 0)) return fail('수량을 확인하세요.');
  const held = S.opt.filter(o => o.mi === S.mi).reduce((s, o) => s + o.q, 0);
  if (held + q > POS_LIMIT.opt) return fail('이번 달 옵션 한도는 ' + POS_LIMIT.opt + '계약입니다.');
  const prem = optPremium(type, K) * OPT_MULT * q, fee = prem * OPT_FEE, cost = prem + fee;
  if (cost > S.cash) return fail('현금이 부족합니다.');
  S.cash -= cost; S.feePaid += fee;
  const o = S.opt.find(x => x.mi === S.mi && x.type === type && x.K === K);
  if (o) { o.q += q; o.cost += cost; } else S.opt.push({ mi: S.mi, exp: S.mi + 1, type, K, q, cost });
  log(`코스피200 ${type === 'C' ? '콜' : '풋'} ${K} ${q}계약 매수 · ${fmtWon(cost)}`, 'blue');
  return ok();
}
// 주문창용: 옵션 한 계약 값(수수료 포함)과 이번 달 더 살 수 있는 계약 수 (콜·풋 가운데 싼 쪽 기준)
const optUnitCost = (type, K) => optPremium(type, K) * OPT_MULT * (1 + OPT_FEE);
function optMax(K) {
  const held = S.opt.filter(o => o.mi === S.mi).reduce((s, o) => s + o.q, 0);
  const c = Math.max(1, Math.min(optUnitCost('C', K), optUnitCost('P', K)));
  return Math.max(0, Math.min(POS_LIMIT.opt - held, Math.floor(S.cash / c)));
}
// 옵션은 산 달에만 들고 있으므로 남은 기간은 늘 한 달이다
function optValue(o) { return optPremium(o.type, o.K) * OPT_MULT * o.q; }
function sellOpt(i) {
  const o = S.opt[i]; if (!o) return fail('포지션이 없습니다.');
  const fee = optValue(o) * OPT_FEE, v = optValue(o) * 0.97 - fee;
  S.cash += v; S.realized += v - o.cost; S.feePaid += fee; S.opt.splice(i, 1);
  log(`코스피200 ${o.type === 'C' ? '콜' : '풋'} ${o.K} 매도 · 손익 ${fmtSigned(v - o.cost)}`, v >= o.cost ? 'good' : 'bad');
  return ok({ kind: 'sold', title: '매도 체결', name: `코스피200 ${o.type === 'C' ? '콜' : '풋'} ${o.K}`, what: `${o.q}계약`, pl: v - o.cost, cost: o.cost,
    rows: [['수수료', -fee], ['받은 돈', v, 1], ['산 금액', o.cost]] });
}
// 월말 정산 때 부른다. 다음 달 종가로 만기 정산한다 (마지막 달이면 이번 달 종가)
function settleOptions() {
  const last = S.mi >= LAST_MI, s = macroAt('ks200', last ? S.mi : S.mi + 1), done = [];
  S.opt = S.opt.filter(o => {
    if (!last && o.exp > S.mi + 1) return true;
    const pay = Math.max(0, o.type === 'C' ? s - o.K : o.K - s) * OPT_MULT * o.q;
    S.cash += pay; S.realized += pay - o.cost;
    done.push({ type: o.type, K: o.K, q: o.q, cost: o.cost, pay });
    log(`옵션 만기 · ${o.type === 'C' ? '콜' : '풋'} ${o.K} → ${pay > 0 ? fmtWon(pay) + ' 지급' : '소멸'} (손익 ${fmtSigned(pay - o.cost)})`, pay > o.cost ? 'good' : 'bad');
    return false;
  });
  S.optSettle = done.length ? { s, mi: last ? S.mi : S.mi + 1, done } : null;
}
// 만기 정산 결과 창: 「다음 달」을 눌렀을 때 한 번 보여 주고 지운다
function takeOptSettle() {
  const x = S.optSettle; S.optSettle = null;
  if (!x) return null;
  const pay = x.done.reduce((a, o) => a + o.pay, 0), cost = x.done.reduce((a, o) => a + o.cost, 0);
  return { kind: 'sold', title: '옵션 만기 정산', name: `코스피200 옵션 ${x.done.length}건`, what: `${fmtYM(x.mi)} 말 코스피200 ${x.s.toFixed(2)}`, pl: pay - cost, cost,
    rows: [...x.done.map(o => [`${o.type === 'C' ? '콜' : '풋'} ${o.K.toFixed(1)} · ${o.q}계약${o.pay > 0 ? '' : ' (소멸)'}`, o.pay]), ['받은 돈', pay, 1], ['산 금액', cost]] };
}

// ---- 채권 ----
function bondYield(bid, mi) {
  const b = BOND[bid]; mi = mi == null ? S.mi : mi;
  return MARKET.m[b.base][mi] + b.adj + (b.credit ? creditSpread(ymOf(mi)) : 0);
}
function bondFx(b) { return b.cur === 'USD' ? fxNow() : 1; }
function buyBond(bid, amtKRW) {
  if (!S.flags.account) return fail('아직 증권 계좌가 없습니다.');
  if (!tabOpen('BOND')) return fail('아직 열리지 않았습니다.');
  amtKRW = Math.floor(amtKRW);
  if (!(amtKRW >= 10000)) return fail('1만원 이상 살 수 있습니다.');
  if (amtKRW > S.cash) return fail('현금이 부족합니다.');
  const b = BOND[bid];
  S.cash -= amtKRW;
  S.bonds.push({ u: S.uid++, b: bid, face: amtKRW / bondFx(b), y: bondYield(bid), mi0: S.mi, mat: S.mi + b.term });
  log(`${b.name} ${fmtWon(amtKRW)} 매수 · 연 ${bondYield(bid).toFixed(2)}%`, 'blue');
  return ok();
}
const bondCost = pos => pos.face * (BOND[pos.b].cur === 'USD' ? MARKET.m.fx[pos.mi0] : 1);   // 산 금액 (원)
function bondValue(pos) {
  const b = BOND[pos.b];
  const rem = Math.max(0, (pos.mat - S.mi) / 12), d = Math.min(b.dur, rem * 0.95);
  const pr = Math.min(1.6, Math.max(0.5, 1 - d * (bondYield(pos.b) - pos.y) / 100));
  return pos.face * pr * bondFx(b);
}
function sellBond(u) {
  const i = S.bonds.findIndex(x => x.u === u); if (i < 0) return fail('채권이 없습니다.');
  const pos = S.bonds[i], v = bondValue(pos) * 0.998, cost = bondCost(pos);
  S.cash += v; S.realized += v - cost; S.bonds.splice(i, 1);
  log(`${BOND[pos.b].name} 매도 · ${fmtWon(v)}`, v >= cost ? 'good' : 'bad');
  return ok({ kind: 'sold', title: '매도 체결', name: BOND[pos.b].name, what: '만기 전 매도', pl: v - cost, cost, rows: [['받은 돈', v, 1], ['산 금액', cost]] });
}

// ---- 은행 ----
const depRate = () => Math.max(0.1, (MARKET.m.cd[S.mi] || 3) + DEPOSIT_SPREAD);
const loanRate = () => (MARKET.m.cd[S.mi] || 3) + LOAN_SPREAD;
function loanLimit() {
  if (age() < 20) return 0;
  let lim = CREDIT_LIMIT * cpiF();
  for (const id of Object.keys(S.re)) lim += Math.max(0, estatePrice(id) * S.re[id].q - (S.re[id].dep || 0)) * ltv(curYM());   // 전세 보증금만큼은 담보에서 뺀다
  return Math.max(0, Math.floor(lim));
}
function deposit(a) { a = Math.floor(a); if (!(a > 0) || a > S.cash) return fail('금액을 확인하세요.'); S.cash -= a; S.bank.dep += a; log('예금 ' + fmtWon(a), 'blue'); return ok(); }
function withdraw(a) { a = Math.floor(Math.min(a, S.bank.dep)); if (!(a > 0)) return fail('금액을 확인하세요.'); S.bank.dep -= a; S.cash += a; log('예금 인출 ' + fmtWon(a), 'blue'); return ok(); }
function borrow(a) {
  a = Math.floor(a);
  if (age() < 20) return fail('대출은 20살부터 받을 수 있습니다.');
  if (!(a > 0) || S.bank.loan + a > loanLimit()) return fail('한도를 넘었습니다. (한도 ' + fmtWon(loanLimit()) + ')');
  S.bank.loan += a; S.cash += a; log('대출 ' + fmtWon(a) + ' · 연 ' + loanRate().toFixed(2) + '%', 'warn'); return ok();
}
function repay(a) { a = Math.floor(Math.min(a, S.bank.loan, S.cash)); if (!(a > 0)) return fail('금액을 확인하세요.'); S.bank.loan -= a; S.cash -= a; log('대출 상환 ' + fmtWon(a), 'good'); return ok(); }

// ---- 부동산 ----
function anchorAt(p, mi, geo) { // {연도: 값} 을 그해 6월 값으로 보고 잇는다
  const ys = Object.keys(p).map(Number).sort((a, b) => a - b);
  const x = yearOf(mi) + (+ymOf(mi).slice(5) - 6) / 12;
  if (x <= ys[0]) return p[ys[0]];
  if (x >= ys[ys.length - 1]) return p[ys[ys.length - 1]];
  let i = ys.findIndex(y => y >= x); const a = ys[i - 1], b = ys[i], t = (x - a) / (b - a);
  return geo ? p[a] * Math.pow(p[b] / p[a], t) : p[a] + (p[b] - p[a]) * t;
}
function estateAvailable(id, mi) { const e = EST[id]; mi = mi == null ? S.mi : mi; return yearOf(mi) >= Math.min(...Object.keys(e.p).map(Number)); }
function estatePrice(id, mi) { mi = mi == null ? S.mi : mi; return Math.round(anchorAt(EST[id].p, mi, true) * 1e8 / 1e5) * 1e5; }
function estateGate() {
  if (age() >= 20) return '';
  if ((S.people.mom && S.people.mom.aff) >= MINOR_ESTATE_MOM) return '';
  return '20살 전에는 엄마 명의로만 살 수 있습니다. 엄마 호감 ' + MINOR_ESTATE_MOM + ' 이상이 필요합니다.';
}
function buyEstate(id) {
  if (!estateAvailable(id)) return fail('아직 지어지지 않았습니다.');
  const g = estateGate(); if (g) return fail(g);
  if (S.re[id] && S.re[id].q >= ESTATE_MAX_UNITS) return fail('한 단지에서는 ' + ESTATE_MAX_UNITS + '채까지 살 수 있습니다.');
  const cost = estateBuyCost(id);
  if (cost > S.cash) return fail('현금이 부족합니다. (필요 ' + fmtWon(cost) + ')');
  S.cash -= cost;
  const isNew = !S.re[id];
  const r = S.re[id] || (S.re[id] = { q: 0, cost: 0, mode: 'empty', dep: 0, lease: S.mi });   // 처음 산 단지는 빈 집으로 시작한다
  r.q += 1; r.cost += cost;
  const d = isNew ? 0 : tenantIn(id);   // 이미 세를 놓은 단지면 새로 산 집에도 같은 방식으로 세입자를 들인다
  log(`${EST[id].name} 매입 · ${fmtWon(cost)} (세금·수수료 포함)${age() < 20 ? ' · 엄마 명의' : ''}${!isNew && r.mode !== 'empty' ? ` · ${LEASE_NAME[r.mode]} 세입자${d ? ' 보증금 ' + fmtWon(d) + ' 받음' : ''}` : ''}`, 'blue');
  return ok();
}
const estateBuyCost = id => estatePrice(id) * (1 - haggle()) * (1 + ESTATE_BUY_COST);   // 매력 협상 반영
function sellEstate(id) {
  const r = S.re[id]; if (!r) return fail('보유하지 않았습니다.');
  const n = rentN(id), wasHome = n <= 0;   // 세 놓은 집부터 팔고, 그것밖에 없으면 살던 집을 판다
  const back = !wasHome && r.mode === 'jeonse' ? r.dep / n : 0;   // 세입자 낀 채로 팔면 사는 사람이 보증금을 떠안는다
  const p = estatePrice(id), avg = r.cost / r.q, gross = p * (1 + haggle()), proceeds = gross * (1 - ESTATE_SELL_COST);
  const tax = Math.max(0, proceeds - avg) * ESTATE_GAIN_TAX, net = proceeds - tax;
  S.cash += net - back; r.dep -= back; S.realized += net - avg;
  r.q -= 1; r.cost -= avg;
  if (wasHome) S.home = null;
  if (r.q <= 0) delete S.re[id];
  log(`${EST[id].name} 매도 · ${fmtWon(net)} (양도세 ${fmtWon(tax)})${back ? ' · 전세 보증금 ' + fmtWon(back) + '은 산 사람이 떠안음' : ''}${wasHome ? ' · 살던 집이라 이사 나옴' : ''}`, net >= avg ? 'good' : 'bad');
  return ok({ kind: 'sold', title: '매도 체결', name: EST[id].name, what: `1채 · 시세 ${fmtWon(p)}${wasHome ? ' · 살던 집' : ''}`, pl: net - avg, cost: avg,
    rows: [['판 금액', gross], ['중개수수료', -(gross - proceeds)], ['양도세', -tax], ...(back ? [['전세 보증금 (산 사람이 떠안음)', -back]] : []), ['받은 돈', net - back, 1], ['산 금액', avg]] });
}

// ---- 부동산 관리: 거주와 임대 ----
// 단지마다 내가 사는 한 채를 뺀 나머지를 한 가지 방식(빈 집·월세·전세)으로 세를 놓는다
const rentN = id => S.re[id] ? S.re[id].q - (S.home === id ? 1 : 0) : 0;
function jeonseRate(id, mi) { return anchorAt(JEONSE_RATE, mi == null ? S.mi : mi, false) * (EST[id].kind === 'house' ? JEONSE_HOUSE : 1); }
const jeonseDep = id => Math.round(estatePrice(id) * jeonseRate(id) / 1e5) * 1e5;          // 한 채의 전세 보증금
const wolseOf = id => estatePrice(id) * rentYield(MARKET.m.cd[S.mi] || 3) / 100 / 12;       // 한 채의 월세
const jeonseTotal = () => Object.values(S.re).reduce((s, r) => s + (r.dep || 0), 0);       // 돌려줘야 할 보증금
const moveCost = () => won100(MOVE_COST * cpiF());
// 세입자 한 명이 들어온다. 전세면 보증금을 받고, 어느 쪽이든 중개수수료를 낸다
function tenantIn(id) {
  const r = S.re[id];
  if (r.mode === 'jeonse') { const d = jeonseDep(id), fee = d * LEASE_FEE; S.cash += d - fee; r.dep += d; S.feePaid += fee; return d; }
  if (r.mode === 'wolse') { const fee = wolseOf(id) * 100 * LEASE_FEE; S.cash -= fee; S.feePaid += fee; }
  return 0;
}
// 세입자 한 명이 나간다 (rentN 이 바뀌기 전에 부른다). 전세면 보증금을 돌려준다
function tenantOut(id) {
  const r = S.re[id], n = rentN(id);
  if (r.mode !== 'jeonse' || n <= 0) return 0;
  const d = r.dep / n; S.cash -= d; r.dep -= d; return d;
}
function setLease(id, mode) {
  const r = S.re[id]; if (!r) return fail('보유하지 않았습니다.');
  if (!LEASE_NAME[mode]) return fail();
  if (r.mode === mode) return ok();
  if (r.mode === 'jeonse' && r.dep > S.cash) return fail('돌려줄 전세 보증금이 부족합니다. (필요 ' + fmtWon(r.dep) + ')');
  if (r.mode === 'jeonse' && r.dep) { S.cash -= r.dep; log(`${EST[id].name} 전세 세입자 내보냄 · 보증금 ${fmtWon(r.dep)} 돌려줌`, 'warn'); }
  r.dep = 0; r.mode = mode; r.lease = S.mi;
  const n = rentN(id); let got = 0;
  for (let i = 0; i < n; i++) got += tenantIn(id);
  if (!n) return ok();
  if (mode === 'jeonse') log(`${EST[id].name} ${n}채 전세 · 보증금 ${fmtWon(got)} 받음 · ${fmtYM(S.mi + JEONSE_TERM)} 재계약`, 'blue');
  else if (mode === 'wolse') log(`${EST[id].name} ${n}채 월세 · 달마다 ${fmtWon(wolseOf(id) * n)}`, 'blue');
  else log(`${EST[id].name} ${n}채 빈 집으로 둠`, '');
  return ok();
}
// 사는 집의 급: 그달 들어설 수 있는 단지들 사이의 시세 순위
let _tier = { k: '', v: null };
function homeTier(id) {
  id = id || S.home; if (!id || !S.re[id]) return null;
  const key = S.mi + ':' + id;
  if (_tier.k !== key) {
    const p = estatePrice(id), ps = ESTATES.filter(e => estateAvailable(e.id)).map(e => estatePrice(e.id));
    const k = ps.filter(x => x < p).length / ps.length;
    _tier = { k: key, v: HOME_TIER[k >= 2 / 3 ? 2 : k >= 1 / 3 ? 1 : 0] };
  }
  return _tier.v;
}
function homeBonus(k) { const t = homeTier(); return t ? t.fx[k] || 0 : 0; }
function moveIn(id) {
  const r = S.re[id]; if (!r) return fail('보유하지 않았습니다.');
  if (S.home === id) return fail('이미 살고 있습니다.');
  if (usedThisMonth('move')) return fail('이사는 한 달에 한 번만 할 수 있습니다.');
  const n = rentN(id), back = r.mode === 'jeonse' && n ? r.dep / n : 0, cost = moveCost();
  if (back + cost > S.cash) return fail(`현금이 부족합니다. (이사비 ${fmtWon(cost)}${back ? ' + 돌려줄 전세 보증금 ' + fmtWon(back) : ''})`);
  tenantOut(id);                       // 세입자 한 명을 내보내고 들어간다
  const prev = S.home;
  S.home = id;
  if (prev && S.re[prev]) tenantIn(prev);   // 나온 집에는 그 단지 방식대로 새 세입자
  S.cash -= cost; S.mo.move = 1;
  let msg = `${EST[id].name}에 들어가 삽니다 · ${homeTier().name} · 이사비 ${fmtWon(cost)}${back ? ' · 전세 보증금 ' + fmtWon(back) + ' 돌려줌' : ''}`;
  if (age() < 20 && !S.flags.famMove) {   // 처음으로 가족과 함께 내 집에
    S.flags.famMove = true;
    for (const k of ['mom', 'dad', 'sis']) if (S.people[k]) S.people[k].aff = Math.min(100, S.people[k].aff + FAMILY_MOVE_AFF);
    msg += ` · 가족과 함께 이사해 가족 호감 +${FAMILY_MOVE_AFF}`;
  }
  log(msg, 'good');
  return ok();
}
function moveOut() {
  const id = S.home; if (!id) return fail('살고 있는 내 집이 없습니다.');
  if (usedThisMonth('move')) return fail('이사는 한 달에 한 번만 할 수 있습니다.');
  const cost = moveCost();
  if (cost > S.cash) return fail('이사비가 부족합니다. (' + fmtWon(cost) + ')');
  S.home = null; S.cash -= cost; S.mo.move = 1;
  if (S.re[id]) tenantIn(id);
  log(`${EST[id].name}에서 나왔습니다 · ${age() < 20 ? '본가로' : '셋집으로'} · 이사비 ${fmtWon(cost)}`, '');
  return ok();
}
// 이번 달 임대 정산 (달이 바뀔 때 반영). 화면의 예상치도 이것으로 그린다
function leaseMonth() {
  const o = { rent: 0, tax: 0, empty: 0 };
  for (const id of Object.keys(S.re)) {
    const r = S.re[id], p = estatePrice(id), n = rentN(id);
    o.tax += p * r.q * ESTATE_HOLD_TAX / 12;
    if (r.mode === 'wolse') o.rent += wolseOf(id) * n;
    else if (r.mode === 'empty') o.empty += p * n * EMPTY_COST / 12;
  }
  return o;
}
// 전세 재계약: 2년마다 그때 시세로. 집값이 내렸으면 차액을 돌려준다 (역전세)
function renewJeonse() {
  for (const id of Object.keys(S.re)) {
    const r = S.re[id], n = rentN(id);
    if (r.mode !== 'jeonse' || !n || S.mi + 1 - r.lease < JEONSE_TERM) continue;
    const nd = jeonseDep(id) * n, diff = nd - r.dep;
    S.cash += diff; r.dep = nd; r.lease = S.mi + 1;
    log(diff >= 0 ? `${EST[id].name} 전세 재계약 · 보증금 ${fmtWon(diff)} 올려 받음` : `${EST[id].name} 역전세 · 보증금 ${fmtWon(-diff)} 돌려줌`, diff >= 0 ? 'good' : 'bad');
  }
}

// ---- 명품 ----
function luxAvailable(id) { return !LUX[id].from || year() >= LUX[id].from; }
function luxRetail(id) { return anchorAt(LUX[id].retail, S.mi, true); }
function luxPrem(id) { return anchorAt(LUX[id].prem, S.mi, false); }
function luxBuyPrice(id) { return won100(luxRetail(id) * Math.max(1, luxPrem(id)) * fxNow()); }
function luxValue(id) { return won100(luxRetail(id) * luxPrem(id) * fxNow() * (1 - LUX_SELL_FEE)); }
function buyLux(id) {
  if (!luxAvailable(id)) return fail('아직 나오지 않았습니다.');
  const p = luxBuyPrice(id); if (p > S.cash) return fail('현금이 부족합니다.');
  S.cash -= p; S.lux[id] = (S.lux[id] || 0) + 1; S.luxCost[id] = (S.luxCost[id] || 0) + p;
  log(`${LUX[id].name} 구입 · ${fmtWon(p)}`, 'blue');
  return ok();
}
function sellLux(id) {
  if (!S.lux[id]) return fail('보유하지 않았습니다.');
  const v = luxValue(id) * (1 + haggle()), avg = S.luxCost[id] / S.lux[id];
  S.cash += v; S.realized += v - avg;
  S.lux[id]--; S.luxCost[id] -= avg; if (!S.lux[id]) { delete S.lux[id]; delete S.luxCost[id]; }
  log(`${LUX[id].name} 판매 · ${fmtWon(v)}`, v >= avg ? 'good' : 'bad');
  return ok({ kind: 'sold', title: '판매 완료', name: LUX[id].name, what: '1점', pl: v - avg, cost: avg, rows: [['판 금액', v, 1], ['산 금액', avg]] });
}
function luxCha() { let c = 0; for (const id of Object.keys(S.lux)) c += LUX[id].cha; return c; }

// ---- 쇼핑 ----
function shopList() {
  const ym = curYM();
  return SHOP.filter(i => (!i.from || ym >= i.from) && (!i.to || ym <= i.to) && (!i.minAge || age() >= i.minAge));
}
const shopPrice = id => won100(ITEM[id].won * cpiF());
function buyShop(id) {
  const it = ITEM[id]; if (!shopList().includes(it)) return fail('지금은 살 수 없습니다.');
  const p = shopPrice(id); if (p > S.cash) return fail('현금이 부족합니다.');
  S.cash -= p;
  if (it.fx) applyStats(it.fx);
  if (it.gift) S.inv[id] = (S.inv[id] || 0) + 1;
  log(`${it.name} 구입 · ${fmtWon(p)}`, '');
  return ok();
}

// ---- 능력치 ----
function maxSta() { return Math.round(STA_BASE + stat('hp')); }   // 운동으로 건강이 오르면 최대 체력도 오른다
// 실제로 쓰이는 능력치 = 기본값 + 장비 + (매력이면) 명품
function stat(k) { return Math.min(STAT_CAP, S.st[k] + gearBonus(k) + (k === 'cha' ? luxCha() : 0) + homeBonus(k)); }
function cha() { return stat('cha'); }
// 높을수록 덜 오른다: 기본값 × (1 - 현재값/105)²
function grow(v, base) { return base * Math.max(GROW_FLOOR, Math.pow(1 - Math.min(100, v) / 105, 2)); }
function applyStats(fx) {
  for (const k of ['int', 'hp', 'cha', 'fame']) if (fx[k]) S.st[k] = Math.max(0, Math.min(100, S.st[k] + fx[k]));
  if (fx.sta) S.sta += fx.sta;
  S.sta = Math.max(0, Math.min(maxSta(), S.sta));   // 건강이 깎이면 최대 체력도 줄어든다
}

// ---- 수입 ----
function jobInfo() {
  const a = age(), mw = MIN_WAGE[year()] || MIN_WAGE[2026];
  if (S.job === 'office') {
    const yrs = (S.mi - S.jobSince) / 12;
    return { name: '회사 업무', pay: won100(mw * 209 / 4 * EDU[S.edu || 'C'].mult * (1 + yrs * 0.04) * (1 + stat('int') / 400)) };
  }
  const j = JOBS.find(x => a <= x.maxAge);
  const pay = j.hours ? mw * j.hours : j.pay * cpiF();
  return { name: S.job === 'investor' ? '투자 공부' : j.name, pay: won100(S.job === 'investor' ? 0 : pay * (1 + stat('int') / 400)) };
}
function livingCost() {
  const a = age(); let c = 0;
  for (const r of LIVING_COST) if (a >= r.minAge) c = r.won;
  return won100(c * cpiF() * (spouseId() ? MARRIED_COST_MULT : 1) * (S.home ? 1 - HOME_SAVE : 1));   // 내 집에 살면 집세가 안 나간다
}

// ---- 행동 ----
// 행동은 시간을 쓰지 않는다. 체력과 달마다 정해진 횟수로만 막힌다
const usedThisMonth = kind => S.mo[kind] || 0;
function actionBlocked(kind) {
  if (S.ended) return '이야기가 끝났습니다.';
  if (S.queue.length) return '진행 중인 이야기가 있습니다.';
  const a = ACTIONS[kind];
  if (!a) return '할 수 없는 행동입니다.';
  if (a.perMonth && usedThisMonth(kind) >= a.perMonth) return kind === 'work' ? `이번 달 일은 다 했습니다. (한 달 ${a.perMonth}번)` : `${a.label}은(는) 한 달에 ${a.perMonth}번만 할 수 있습니다.`;
  if (a.cost > S.sta) return '체력이 부족합니다. 다음 달로 넘기면 다시 가득 찹니다.';
  return '';
}
function doAction(kind) {
  const why = actionBlocked(kind); if (why) return fail(why);
  const a = ACTIONS[kind];
  S.sta -= a.cost; S.mo[kind] = usedThisMonth(kind) + 1;
  let msg = '';
  if (kind === 'study') {
    const g = grow(S.st.int, 3); S.st.int = Math.min(100, S.st.int + g);
    msg = (age() <= 19 ? '공부했습니다' : '책을 읽고 공부했습니다') + ` · 지성 +${g.toFixed(1)}`;
  } else if (kind === 'gym') {
    const g = grow(S.st.hp, GYM_GAIN); S.st.hp = Math.min(100, S.st.hp + g); S.st.cha = Math.min(100, S.st.cha + grow(S.st.cha, 0.4));
    msg = `운동했습니다 · 건강 +${g.toFixed(1)} · 최대 체력 ${maxSta()}`;
  } else if (kind === 'work') {
    const j = jobInfo(); S.cash += j.pay;
    if (S.job === 'investor') S.st.int = Math.min(100, S.st.int + grow(S.st.int, 1.5));
    msg = `${j.name} · ${j.pay ? '+' + fmtWon(j.pay) : '지성 조금 상승'}`;
  } else if (kind === 'sns') msg = doSNS();
  log(msg, kind === 'work' ? 'good' : '');
  return ok(msg);
}
function doSNS() {
  const mult = hasPerk('smart') ? 2 : hasPerk('phone') ? 1.5 : 1;
  const g = (0.8 + cha() / 60) * mult * Math.max(0.1, 1 - S.st.fame / 110);
  S.st.fame = Math.min(100, S.st.fame + g);
  let msg = `${snsName(curYM())}에 글을 올렸습니다 · 인기 +${g.toFixed(1)}`;
  if (rand() < 0.4) { // 앞으로 석 달 크게 오를 종목 소문
    const to = Math.min(LAST_MI, S.mi + 3);
    const pool = TICKERS.filter(t => listed(t.id) && listed(t.id, to) && (t.tab !== 'COIN' || tabOpen('COIN')));
    let best = null, bv = 0.15;
    for (const t of pool) { const r = MARKET.s[t.id].c[to] / price(t.id) - 1; if (r > bv) { bv = r; best = t; } }
    if (best) { const line = SNS_TALK[Math.floor(rand() * SNS_TALK.length)].replace('{name}', tkName(best.id)); msg += ' · ' + line; toast(line); }
  }
  return msg;
}

// ---- 시간 ----
// 「다음 달」: 이번 달을 정산하고 다음 달로 넘어간다. 마지막 달이면 엔딩
function nextMonth() {
  if (S.ended) return fail('이야기가 끝났습니다.');
  if (S.queue.length) return fail('진행 중인 이야기가 있습니다.');
  const before = netWorth();
  monthEnd();
  if (S.mi >= LAST_MI) { S.ended = true; enqueue('finale'); record(); return ok(); }
  S.mi++;
  newMonth(before);
  checkMargin();
  checkEvents();
  return ok();
}
function monthEnd() {
  const parts = [];
  const si = snsIncome(); if (si) { S.cash += si; parts.push('SNS 수입 +' + fmtWon(si)); }
  if (!S.mo.sns && S.st.fame > 0) S.st.fame = Math.max(0, S.st.fame - FAME_DECAY);   // 글을 안 올리면 잊힌다
  const lc = livingCost(); if (lc) { S.cash -= lc; parts.push('생활비 -' + fmtWon(lc)); }
  if (S.bank.dep > 0) { const it = S.bank.dep * depRate() / 1200 * (1 - INTEREST_TAX); S.bank.dep += it; S.intTotal += it; parts.push('예금 이자 +' + fmtWon(it)); }
  if (S.bank.loan > 0) { const it = S.bank.loan * loanRate() / 1200; S.cash -= it; parts.push('대출 이자 -' + fmtWon(it)); }
  let cp = 0;
  S.bonds = S.bonds.filter(pos => {
    const b = BOND[pos.b];
    cp += pos.face * pos.y / 1200 * (1 - INTEREST_TAX) * bondFx(b);
    if (S.mi + 1 >= pos.mat) { S.cash += pos.face * bondFx(b); log(`${b.name} 만기 상환 · ${fmtWon(pos.face * bondFx(b))}`, 'good'); return false; }
    return true;
  });
  if (cp) { S.cash += cp; S.intTotal += cp; parts.push('채권 이자 +' + fmtWon(cp)); }
  const ls = leaseMonth();
  if (ls.rent) { S.cash += ls.rent; S.rentTotal += ls.rent; parts.push('월세 +' + fmtWon(ls.rent)); }
  if (ls.tax) { S.cash -= ls.tax; S.taxPaid += ls.tax; parts.push('보유세 -' + fmtWon(ls.tax)); }
  if (ls.empty) { S.cash -= ls.empty; parts.push('빈 집 관리비 -' + fmtWon(ls.empty)); }
  renewJeonse();
  const dv = payDividends(); if (dv) parts.push('배당 +' + fmtWon(dv));
  settleOptions();
  settleLotto();
  if (S.cash < 0 && S.bank.dep > 0) { const a = Math.min(S.bank.dep, -S.cash); S.bank.dep -= a; S.cash += a; parts.push('예금에서 부족분 ' + fmtWon(a) + ' 인출'); }
  if (S.cash < 0) { const it = -S.cash * OVERDRAFT_RATE; S.cash -= it; parts.push('연체 이자 -' + fmtWon(it)); }
  log(`${year()}년 ${month()}월 정산 · ${parts.join(' · ') || '변동 없음'}`, '');
}
// before: 넘기기 직전 순자산. 이달 수익은 여기서부터 잰다 (시세 변동 + 월말 정산 + 이번 달 행동)
function newMonth(before) {
  // 액면분할·병합: 보유 수량을 같은 비율로 바꾼다
  for (const id of Object.keys(S.hold)) {
    const r = splitRatio(id, S.mi);
    if (r !== 1) { S.hold[id].q *= r; log(`${tkName(id)} 주식 ${r >= 1 ? '분할' : '병합'} · 보유 수량 ×${+r.toFixed(4)}`, 'blue'); }
  }
  if (month() === US_GAIN_TAX.month) {   // 지난해 해외 주식 차익의 양도소득세
    const y = year() - 1, g = S.usGain[y] || 0, tax = Math.max(0, g - US_GAIN_TAX.free) * US_GAIN_TAX.rate;
    if (tax > 0) { S.cash -= tax; S.taxPaid += tax; log(`${y}년 해외 주식 양도소득세 -${fmtWon(tax)} (차익 ${fmtWon(g)}에서 ${fmtWon(US_GAIN_TAX.free)} 빼고 ${US_GAIN_TAX.rate * 100}%)`, 'warn'); }
    delete S.usGain[y];
  }
  if (month() === 2 && age() <= 19) { const nm = won100(NEWYEAR_MONEY * cpiF()); S.cash += nm; log('설날 세뱃돈 +' + fmtWon(nm), 'good'); }
  for (const k of Object.keys(S.reveal)) if (S.reveal[k] <= S.mi) delete S.reveal[k];
  S.sta = maxSta(); S.mo = {};
  newLotto();
  S.hints = memoryHints();
  for (const h of S.hints) log('💭 ' + h.t, 'memo');
  if (partners().length >= 2 && rand() < cheatRisk()) enqueue('caught:' + S.mi);
  settleBets();
  S.monthStartNW = before == null ? netWorth() : before;
  const gain = netWorth() - S.monthStartNW;
  log(`${year()}년 ${month()}월 · 지난달보다 자산 ${fmtSigned(gain)}`, gain >= 0 ? 'good' : 'bad');
  record();
}

// ---- 결산 ----
// 기록은 달이 시작될 때 남는다. 그 달 기록이 없으면(게임 시작 전) 처음 기록을 쓴다
const histAt = mi => S.hist.find(h => h.mi >= mi);
// 4·7·10월로 넘어오면 지난 분기, 1월이면 지난 한 해를 결산한다
function periodDue() {
  const m = month();
  if (m === 1) return periodReport(S.mi - 12, S.mi, 'year');
  if (m % 3 === 1) return periodReport(S.mi - 3, S.mi, 'q');
  return null;
}
function periodReport(mi0, mi1, kind) {
  const a = histAt(mi0), b = histAt(mi1);
  if (!a || !b || a === b) return null;
  const d = k => a[k] == null || b[k] == null ? null : b[k] - a[k];
  const ym = ymOf(mi1 - 1), y = +ym.slice(0, 4), m = +ym.slice(5), q = Math.ceil(m / 3);
  const step = (s, e, l) => { const x = histAt(s), z = histAt(e); return { l, v: x && z && x !== z && z.mi <= mi1 ? z.nw - x.nw : null }; };
  const steps = kind === 'year' ? [0, 1, 2, 3].map(k => step(mi0 + k * 3, mi0 + k * 3 + 3, (k + 1) + '분기'))
    : [0, 1, 2].map(k => step(mi0 + k, mi0 + k + 1, +ymOf(mi0 + k).slice(5) + '월'));
  return { kind: 'report', period: kind, mi0: a.mi, mi1: b.mi,
    title: kind === 'year' ? y + '년 결산' : `${y}년 ${q}분기 결산`,
    sub: kind === 'year' ? `${y}년 한 해 동안` : `${q * 3 - 2}월부터 ${q * 3}월까지`,
    nw0: a.nw, nw1: b.nw, chg: b.nw - a.nw, pct: a.nw > 0 ? (b.nw / a.nw - 1) * 100 : null,
    kospi: (macroAt('kospi', b.mi) / macroAt('kospi', a.mi) - 1) * 100, steps,
    parts: [['현금·예금', d('liq')], ['주식·파생·채권', d('inv')], ['부동산', d('re')], ['명품', d('lux')], ['빚 (대출·전세 보증금)', d('debt') == null ? null : -d('debt')]],
    flows: [['실현 손익', d('rl')], ['배당', d('dv')], ['월세', d('rent')], ['이자', d('it')], ['수수료·세금', d('cost') == null ? null : -d('cost')]] };
}
// 지금 다 팔면 생길 손익 (아직 실현하지 않은 것)
function unrealized() {
  let s = 0;
  for (const id of Object.keys(S.hold)) s += holdValue(id) - S.hold[id].cost;
  for (const fid of Object.keys(S.fut)) s += futPL(fid);
  for (const o of S.opt) s += optValue(o) - o.cost;
  for (const pos of S.bonds) s += bondValue(pos) - bondCost(pos);
  for (const id of Object.keys(S.re)) s += estatePrice(id) * S.re[id].q - S.re[id].cost;
  for (const id of Object.keys(S.lux)) s += luxValue(id) * S.lux[id] - S.luxCost[id];
  return s;
}
// 이번 달이 끝날 때 들어오고 나갈 돈 (예상)
function monthFlow() {
  const ls = leaseMonth();
  let cp = 0; for (const pos of S.bonds) cp += pos.face * pos.y / 1200 * (1 - INTEREST_TAX) * bondFx(BOND[pos.b]);
  const inc = [['SNS 수입', snsIncome()], ['예금 이자 (세후)', S.bank.dep * depRate() / 1200 * (1 - INTEREST_TAX)], ['채권 이자 (세후)', cp], ['월세', ls.rent]];
  const out = [['생활비', livingCost()], ['대출 이자', S.bank.loan * loanRate() / 1200], ['부동산 보유세', ls.tax], ['빈 집 관리비', ls.empty]];
  return { inc: inc.filter(r => r[1] >= 1), out: out.filter(r => r[1] >= 1) };
}

// ---- 자산 ----
function breakdown() {
  const b = { cash: S.cash, dep: S.bank.dep, KS: 0, KQ: 0, US: 0, ETF: 0, COIN: 0, fut: 0, opt: 0, bond: 0, estate: 0, lux: 0, loan: S.bank.loan, jdep: jeonseTotal() };
  for (const id of Object.keys(S.hold)) { const t = TK[id].tab === 'COIN' ? 'COIN' : TK[id].tab === 'ETF' ? 'ETF' : tkTab(id); b[t] += holdValue(id); }
  for (const fid of Object.keys(S.fut)) b.fut += S.fut[fid].margin + futPL(fid);
  for (const o of S.opt) b.opt += optValue(o);
  for (const pos of S.bonds) b.bond += bondValue(pos);
  for (const id of Object.keys(S.re)) b.estate += estatePrice(id) * S.re[id].q;
  for (const id of Object.keys(S.lux)) b.lux += luxValue(id) * S.lux[id];
  return b;
}
function netWorth() {
  const b = breakdown();
  return b.cash + b.dep + b.KS + b.KQ + b.US + b.ETF + b.COIN + b.fut + b.opt + b.bond + b.estate + b.lux - b.loan - b.jdep;
}
function investValue() { const b = breakdown(); return b.KS + b.KQ + b.US + b.ETF + b.COIN + b.fut + b.opt + b.bond; }

// ---- 보석 ----
const gemCount = () => DEV_INFINITE_GEMS ? Infinity : S.gems;
function spendGem(n) {
  if (!DEV_INFINITE_GEMS) { if (S.gems < n) { toast('보석이 부족합니다.'); return false; } S.gems -= n; }
  S.gemsUsed = (S.gemsUsed || 0) + n;   // 개발 버전에서도 얼마나 썼는지 센다 (밸런스 확인용)
  return true;
}
// 기억 떠올리기: 키(종목 id · 're:부동산 id' · 'idx:지수')마다 한 번에 한 달씩 더 멀리 본다
const revealedTo = key => Math.max(S.mi, S.reveal[key] || 0);
const revealAhead = key => revealedTo(key) - S.mi;
const revealCost = key => REVEAL_COST[revealAhead(key)];
const canReveal = key => revealAhead(key) < REVEAL_COST.length && revealedTo(key) < LAST_MI;
function revealNext(key, label) {
  if (!canReveal(key)) return fail(revealedTo(key) >= LAST_MI ? '더 먼 미래의 기억은 없습니다.' : '1년 뒤까지만 떠올릴 수 있습니다.');
  const c = revealCost(key);
  if (!spendGem(c)) return fail('');
  S.reveal[key] = revealedTo(key) + 1;
  log(`💎${c} ${label || key} · ${fmtYM(S.reveal[key])} 시세를 떠올렸습니다.`, 'blue');
  return ok(S.reveal[key]);
}
// 몇 달 뒤까지 한 번에 떠올린다. 비용은 아직 떠올리지 않은 달들의 비용을 모두 더한 값
function revealCostTo(key, months) {
  const target = Math.min(S.mi + months, LAST_MI);
  let c = 0;
  for (let mi = revealedTo(key) + 1; mi <= target; mi++) c += REVEAL_COST[mi - S.mi - 1];
  return c;
}
function revealUpTo(key, months, label) {
  const target = Math.min(S.mi + months, LAST_MI);
  if (months > REVEAL_COST.length) return fail('1년 뒤까지만 떠올릴 수 있습니다.');
  if (target <= revealedTo(key)) return fail(target >= LAST_MI ? '더 먼 미래의 기억은 없습니다.' : '이미 떠올렸습니다.');
  const c = revealCostTo(key, months);
  if (!spendGem(c)) return fail('');
  const from = revealedTo(key) + 1;
  S.reveal[key] = target;
  log(`💎${c} ${label || key} · ${fmtYM(from)}${from < target ? '~' + fmtYM(target) : ''} 시세를 떠올렸습니다.`, 'blue');
  return ok(target);
}
// 기억 더듬기: 앞으로 h개월 동안 가장 크게 오를·내릴 종목과 큰 사건
function recallFuture(h) {
  h = h || 12;
  const to = Math.min(LAST_MI, S.mi + h);
  const rows = [];
  for (const t of TICKERS) {
    if (!listed(t.id) || !listed(t.id, to)) continue;
    let f = 1; for (let mi = S.mi + 1; mi <= to; mi++) f *= splitRatio(t.id, mi);
    rows.push({ id: t.id, r: MARKET.s[t.id].c[to] * f / price(t.id) - 1 });
  }
  rows.sort((a, b) => b.r - a.r);
  const ev = HISTORY.filter(x => !x.memo && miOf(x.ym) > S.mi && miOf(x.ym) <= to);
  return { h, to, up: rows.slice(0, 5), down: rows.slice(-3).reverse(), ev, kospi: MARKET.m.kospi[to] / macro('kospi') - 1 };
}
function recall(h) {
  const c = RECALL_COST[h]; if (!c) return fail('');
  if (!spendGem(c)) return fail('');
  log(`💎${c} 앞으로 ${h}개월을 더듬어 기억해 냈습니다.`, 'blue');
  return ok(recallFuture(h));
}

// ---- 인연 ----
function meet(id, silent) {
  if (S.people[id] && S.people[id].met) return;
  const c = CH[id];
  S.people[id] = Object.assign({ aff: c.aff, met: true, ev: [], talkMi: -1, giftMi: -1, outMi: -1, lover: false, spouse: false, mem: false }, S.people[id] || {});
  if (!silent) log(`새 인연 · ${c.name} (${c.role})`, 'love');
}
const metList = () => CHARS.filter(c => S.people[c.id] && S.people[c.id].met);
const charAge = id => ageAt(CH[id].born, year());
const spouseId = () => Object.keys(S.people).find(id => S.people[id].spouse);
const loverId = () => Object.keys(S.people).find(id => S.people[id].lover);
function canRomance(id) { const c = CH[id]; return c.kind === 'romance' && age() >= 17 && charAge(id) >= 17 && !S.flags[id + 'Closed']; }
function addAff(id, n) {
  const p = S.people[id]; if (!p) return;
  const gain = n > 0 ? n * Math.max(0.25, 1 - p.aff / 130) : n;
  p.aff = Math.max(0, Math.min(100, p.aff + gain));
  return gain;
}
function relLabel(id) {
  const c = CH[id], p = S.people[id], a = p.aff;
  if (p.spouse) return '배우자';
  if (p.lover) return '연인';
  if (c.kind === 'family') return a >= 85 ? '든든함' : a >= 60 ? '화목함' : a >= 30 ? '보통' : '서먹함';
  if (c.kind === 'mentor') return a >= 70 ? '존경' : a >= 40 ? '신뢰' : '아는 사이';
  if (c.kind === 'rival') return a >= 60 ? '가까운 선배' : '경계 중';
  if (canRomance(id) && a >= 55) return '썸';
  return a >= 80 ? '단짝' : a >= 50 ? '친한 친구' : a >= 25 ? '친구' : '아는 사이';
}
function outingInfo(id) {
  const c = CH[id], a = age();
  const label = canRomance(id) ? '데이트' : c.kind === 'family' ? (a >= 20 ? '함께 외출' : '같이 놀기') : a <= 13 ? '같이 놀기' : '함께 놀러 가기';
  const cost = won100((a <= 13 ? 3000 : a <= 19 ? 10000 : 50000) * cpiF());
  return { label, cost, sta: OUTING_COST };
}
function talk(id) {
  const p = S.people[id]; if (!p) return fail('');
  if (S.queue.length) return fail('진행 중인 이야기가 있습니다.');
  if (p.talkMi === S.mi) return fail('이번 달에는 이미 이야기했습니다.');
  if (S.sta < TALK_COST) return fail('체력이 부족합니다.');
  S.sta -= TALK_COST; p.talkMi = S.mi;
  const g = addAff(id, 2 + cha() / 30);
  const pool = CH[id].talk[stageOfAge(age())] || CH[id].talk.adult || CH[id].talk.teen || CH[id].talk.kid;
  const line = pool[Math.floor(rand() * pool.length)].replace(/준호/g, S.name.slice(1));
  log(`${CH[id].name}와 이야기했습니다 · 호감 +${g.toFixed(1)}`, 'love');
  checkEvents();
  return ok(line);
}
function outing(id) {
  const p = S.people[id]; if (!p) return fail('');
  if (S.queue.length) return fail('진행 중인 이야기가 있습니다.');
  const o = outingInfo(id);
  if (p.outMi === S.mi) return fail('이번 달에는 이미 함께 시간을 보냈습니다.');
  if (canRomance(id) && p.aff < 30 && !p.lover) return fail('아직 데이트를 신청할 사이가 아닙니다. (호감 30)');
  if (S.sta < o.sta) return fail('체력이 부족합니다.');
  if (S.cash < o.cost) return fail('돈이 부족합니다.');
  S.sta -= o.sta; S.cash -= o.cost; p.outMi = S.mi;
  const g = addAff(id, 5 + cha() / 15);
  log(`${CH[id].name}와 ${o.label} · 호감 +${g.toFixed(1)} · -${fmtWon(o.cost)}`, 'love');
  checkEvents();
  return ok();
}
function giveGift(id, itemId) {
  const p = S.people[id]; if (!p) return fail('');
  if (p.giftMi === S.mi) return fail('이번 달에는 이미 선물했습니다.');
  const isLux = !!LUX[itemId], isGear = !!GR[itemId];
  if (isLux ? !S.lux[itemId] : isGear ? !S.gear[itemId] : !S.inv[itemId]) return fail('가진 물건이 아닙니다.');
  let v = isLux ? (LUX[itemId].gift || 15) : isGear ? GRADES[GR[itemId].g].gift : ITEM[itemId].gift;
  if (CH[id].likes.includes(itemId)) v *= 1.5;
  if (isLux) { const avg = S.luxCost[itemId] / S.lux[itemId]; S.lux[itemId]--; S.luxCost[itemId] -= avg; if (!S.lux[itemId]) { delete S.lux[itemId]; delete S.luxCost[itemId]; } }
  else if (isGear) loseGear(itemId);
  else { S.inv[itemId]--; if (!S.inv[itemId]) delete S.inv[itemId]; }
  p.giftMi = S.mi;
  const g = addAff(id, v);
  const name = isLux ? LUX[itemId].name : isGear ? GR[itemId].name : ITEM[itemId].name;
  log(`${CH[id].name}에게 ${name} 선물 · 호감 +${g.toFixed(1)}${CH[id].likes.includes(itemId) ? ' (좋아하는 것)' : ''}`, 'love');
  checkEvents();
  return ok();
}
function giveMoney(id) {
  const p = S.people[id]; if (!p || CH[id].kind !== 'family' || age() < 20) return fail('');
  if (p.giftMi === S.mi) return fail('이번 달에는 이미 드렸습니다.');
  const amt = won100(100000 * cpiF()); if (S.cash < amt) return fail('돈이 부족합니다.');
  S.cash -= amt; p.giftMi = S.mi; const g = addAff(id, 5);
  log(`${CH[id].name}에게 용돈 ${fmtWon(amt)} · 호감 +${g.toFixed(1)}`, 'love');
  return ok();
}
// 만나는 사람이 있어도 고백할 수 있다 (양다리). 대신 달마다 들킬 수 있다 — cheatRisk
function canConfess(id) { const p = S.people[id]; return canRomance(id) && !p.lover && !p.spouse && p.aff >= 75; }
function confess(id) {
  if (!canConfess(id)) return fail('');
  const p = S.people[id];
  const chance = Math.min(0.95, (p.aff - 60) / 40 + cha() / 200);
  if (rand() < chance) { p.lover = true; log(`${CH[id].name}에게 고백했습니다 · 연인이 되었습니다`, 'love'); enqueue('lover:' + id); return ok(true); }
  addAff(id, -10); log(`${CH[id].name}에게 고백했지만 거절당했습니다`, 'bad');
  return ok(false);
}
function canPropose(id) { const p = S.people[id]; return p && p.lover && !spouseId() && p.aff >= 90 && age() >= 27; }
function propose(id) {
  if (!canPropose(id)) return fail('');
  const p = S.people[id]; p.lover = false; p.spouse = true; S.flags.married = id;
  log(`${CH[id].name}와 결혼했습니다`, 'love'); enqueue('wedding:' + id);
  return ok();
}
function remember(id) {
  if (!spendGem(GEM_COST.person)) return fail('');
  S.people[id].mem = true; log(`💎 ${CH[id].name}에 대한 기억을 떠올렸습니다.`, 'blue');
  return ok();
}

// ---- 지성: 양다리 · 월초 기억 ----
const partners = () => Object.keys(S.people).filter(id => S.people[id].lover || S.people[id].spouse);
// 지성이 높을수록 덜, 인기가 높을수록 더 들킨다
function cheatRisk(n) {
  n = n == null ? partners().length : n; if (n < 2) return 0;
  return Math.max(CHEAT_MIN, Math.min(CHEAT_MAX, CHEAT_BASE * (n - 1) * (1 - stat('int') / 120) * (1 + stat('fame') / 200)));
}
// 들킨 뒤 한 사람을 붙잡으면 나머지는 떠난다. 배우자가 떠나면 이혼이다
function breakOthers(keep) {
  for (const id of partners()) {
    if (id === keep) continue;
    const p = S.people[id];
    if (p.spouse) { p.spouse = false; delete S.flags.married; log(`${CH[id].name}와 이혼했습니다`, 'bad'); }
    else log(`${CH[id].name}와 헤어졌습니다`, 'bad');
    p.lover = false; addAff(id, -35);
  }
  if (keep) addAff(keep, -10);
  scandal();
}
function scandal() { S.st.fame = Math.max(0, S.st.fame - 5 - S.st.fame * 0.1); }
// 받침에 맞는 조사. 한글로 끝나지 않으면 '이(가)' 꼴
function josa(w, a, b) {
  const c = String(w).charCodeAt(String(w).length - 1);
  return c >= 0xAC00 && c <= 0xD7A3 ? ((c - 0xAC00) % 28 ? a : b) : a + '(' + b + ')';
}
// 이번 달 종가 → 다음 달 종가로 크게 움직일 종목을 떠올린다. 지성이 높을수록 자주, 80부터는 두 개
function memoryHints() {
  const i = stat('int');
  if (i < HINT_MIN_INT || S.mi >= LAST_MI || rand() >= Math.min(0.9, (i - HINT_MIN_INT + 5) / 80)) return [];
  const cands = [];
  for (const t of TICKERS) {
    if (!listed(t.id) || !listed(t.id, S.mi + 1) || canTrade(t.id)) continue;
    const r = MARKET.s[t.id].c[S.mi + 1] * splitRatio(t.id, S.mi + 1) / price(t.id) - 1;
    if (Math.abs(r) >= (isCoin(t.id) ? HINT_MOVE.coin : HINT_MOVE.stock)) cands.push({ id: t.id, r });
  }
  const k = macroAt('kospi', S.mi + 1) / macro('kospi') - 1;
  if (Math.abs(k) >= HINT_MOVE.index) cands.push({ id: 'kospi', r: k });
  cands.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  const pool = cands.slice(0, 5), out = [];
  for (let n = i >= 80 ? 2 : 1; n > 0 && pool.length; n--) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return out.map(h => {
    const name = h.id === 'kospi' ? '코스피' : tkName(h.id), T = h.r > 0 ? HINT_UP : HINT_DOWN;
    return { id: h.id, up: h.r > 0, t: T[Math.floor(rand() * T.length)].replace('{N}', '「' + name + '」').replace('{이가}', josa(name, '이', '가')) };
  });
}
const hintFor = id => (S.hints || []).find(h => h.id === id);

// ---- 매력·인기 ----
const haggle = () => Math.max(0, Math.min(1, (cha() - 30) / 70)) * HAGGLE_MAX;
function snsIncome() {
  if (year() < SNS_INCOME_FROM || stat('fame') <= 20) return 0;
  const era = year() < 2015 ? 0.5 : year() < 2020 ? 1 : 1.5;   // 페이스북 → 인스타그램 → 유튜브
  return won100((stat('fame') - 20) ** 2 * SNS_INCOME_RATE * era * cpiF());
}

// ---- 로또 6/45 ----
// 달마다 한 회차. 추첨 번호는 달이 시작할 때 미리 정해 두고(기억해내기로 엿볼 수 있게), 월말에 맞춰 본다
function lottoDrawNo(mi) {   // 실제 회차 번호: 2002-12-07 부터 그달 마지막 토요일까지의 추첨 수
  const [y, m] = ymOf(mi).split('-').map(Number);
  return Math.floor((Date.UTC(y, m, 0) - Date.UTC(2002, 11, 7)) / 6048e5) + 1;
}
function lottoNums(n) { const a = []; while (a.length < n) { const k = 1 + Math.floor(rand() * 45); if (!a.includes(k)) a.push(k); } return a; }
function newLotto() {
  if (curYM() < LOTTO_OPEN) { S.lotto = null; return; }
  const seq = lottoNums(7);
  const pick = ([lo, hi]) => Math.round(lo * Math.pow(hi / lo, rand()) / 1000) * 1000;   // 범위 안에서 로그 균등
  S.lotto = { mi: S.mi, no: lottoDrawNo(S.mi), seq: seq.slice(0, 6), win: seq.slice(0, 6).sort((a, b) => a - b), bonus: seq[6], open: 0, tickets: [],
    prize: { 1: rand() < LOTTO_JACKPOT.p ? pick([LOTTO_PRIZE[1][1], LOTTO_JACKPOT.max]) : pick(LOTTO_PRIZE[1]), 2: pick(LOTTO_PRIZE[2]), 3: pick(LOTTO_PRIZE[3]), 4: LOTTO_PRIZE[4][0], 5: LOTTO_PRIZE[5][0] } };
}
const lottoAuto = () => lottoNums(6).sort((a, b) => a - b);
function buyLotto(nums) {
  const L = S.lotto;
  if (!L) return fail(`로또는 ${LOTTO_OPEN.replace('-', '년 ')}월에 시작합니다.`);
  if (S.ended) return fail('이야기가 끝났습니다.');
  nums = [...new Set((nums || []).map(Number))].filter(n => Number.isInteger(n) && n >= 1 && n <= 45);
  if (nums.length !== 6) return fail('번호 6개를 고르세요.');
  if (L.tickets.length >= LOTTO_MAX) return fail(`한 회차에 ${LOTTO_MAX}장까지 살 수 있습니다.`);
  if (S.cash < LOTTO_PRICE) return fail('현금이 부족합니다.');
  S.cash -= LOTTO_PRICE;
  L.tickets.push(nums.sort((a, b) => a - b));
  log(`로또 제${L.no}회 ${nums.join(' ')} 구입`, '');
  return ok();
}
const lottoRevealCost = () => S.lotto && S.lotto.open < 6 ? LOTTO_REVEAL_COST[S.lotto.open] : null;
function lottoReveal() {
  const L = S.lotto;
  if (!L) return fail(`로또는 ${LOTTO_OPEN.replace('-', '년 ')}월에 시작합니다.`);
  if (L.open >= 6) return fail('여섯 개를 모두 떠올렸습니다.');
  const c = LOTTO_REVEAL_COST[L.open];
  if (!spendGem(c)) return fail('');
  L.open++;
  log(`💎${c} 제${L.no}회 당첨 번호 하나를 떠올렸습니다 · ${L.seq[L.open - 1]}`, 'blue');
  return ok(L.seq[L.open - 1]);
}
function lottoRank(t, L) {
  const m = t.filter(n => L.win.includes(n)).length;
  return m === 6 ? 1 : m === 5 && t.includes(L.bonus) ? 2 : m === 5 ? 3 : m === 4 ? 4 : m === 3 ? 5 : 0;
}
function settleLotto() {
  const L = S.lotto; if (!L || L.mi !== S.mi) return;
  let won = 0, best = 0;
  const ranks = L.tickets.map(t => {
    const r = lottoRank(t, L);
    if (r) { won += L.prize[r] - lottoTax(L.prize[r]); if (!best || r < best) best = r; }
    return r;
  });
  S.cash += won;
  S.lottoLast = { no: L.no, mi: L.mi, win: L.win, bonus: L.bonus, tickets: L.tickets, ranks, won, best, prize: L.prize };
  if (L.tickets.length) log(`로또 제${L.no}회 추첨 ${L.win.join(' ')} + ${L.bonus} · ${best ? best + '등 당첨, 세후 ' + fmtWon(won) : '낙첨'}`, best ? 'good' : '');
  if (best && best <= 3) enqueue('lotto:' + L.no);
  S.lotto = null;
}

// ---- 배당 ----
// 그달에 배당락이 있으면 그달 말에 들고 있던 수량만큼 받는다 (세금을 떼고)
function divAt(id, mi) {
  const s = MARKET.s[id]; if (!s || !s.dv) return 0;
  const ym = ymOf(mi); let d = 0;
  for (const [m, v] of s.dv) if (m === ym) d += v;
  return d;
}
const divTax = id => DIV_TAX[TK[id].cur] || 0;
function payDividends() {
  let total = 0;
  for (const id of Object.keys(S.hold)) {
    const d = divAt(id, S.mi); if (!d || isCoin(id)) continue;
    const q = S.hold[id].q, gross = q * d * (TK[id].cur === 'USD' ? fxNow() : 1), tax = gross * divTax(id);
    S.cash += gross - tax; S.divTotal += gross - tax; S.taxPaid += tax; total += gross - tax;
    log(`배당금 · ${tkName(id)} 1주당 ${fmtPrice(id, d)} × ${fmtQty(id, q)} · +${fmtWon(gross - tax)} (세금 ${fmtWon(tax)})`, 'good');
  }
  return total;
}
// 최근 1년 1주당 배당 (지금 주식 수 기준). 미래 배당은 보이지 않는다
function trailingDiv(id) {
  const s = MARKET.s[id]; if (!s || !s.dv) return 0;
  let sum = 0;
  for (let mi = Math.max(0, S.mi - 11); mi <= S.mi; mi++) {
    const d = divAt(id, mi); if (!d) continue;
    let f = 1; for (const [m, r] of s.sp) { const k = miOf(m); if (k > mi && k <= S.mi) f *= r; }
    sum += d / f;
  }
  return sum;
}
function divMonths(id) {   // 최근 2년 동안 배당이 나온 달
  const s = MARKET.s[id]; if (!s || !s.dv) return [];
  return [...new Set(s.dv.filter(([m]) => miOf(m) > S.mi - 24 && miOf(m) <= S.mi).map(([m]) => +m.slice(5)))].sort((a, b) => a - b);
}

// ---- 장비 ----
function gearList() {   // 지금 살 수 있는 옷·장신구
  const ym = curYM();
  return GEAR.filter(g => (!g.from || ym >= g.from) && (!g.to || ym <= g.to) && (!g.minAge || age() >= g.minAge));
}
const gearPrice = id => won100(GR[id].won * cpiF());
const slotsFor = id => GR[id].hand ? ['rhand', 'lhand'] : [GR[id].slot];
function buyGear(id) {
  const g = GR[id]; if (!g || !gearList().includes(g)) return fail('지금은 살 수 없습니다.');
  const p = gearPrice(id); if (p > S.cash) return fail('현금이 부족합니다.');
  S.cash -= p; S.gear[id] = (S.gear[id] || 0) + 1;
  const empty = slotsFor(id).find(s => !S.equip[s]);
  if (empty) S.equip[empty] = id;   // 빈 칸이면 바로 입는다
  log(`${g.name}(${g.g}) 구입 · ${fmtWon(p)}${empty ? ' · 장착' : ''}`, '');
  return ok(empty || null);
}
function equip(slot, id) {
  if (!S.gear[id]) return fail('가진 물건이 아닙니다.');
  if (!slotsFor(id).includes(slot)) return fail('이 칸에는 맞지 않습니다.');
  const worn = Object.entries(S.equip).filter(([s, v]) => v === id && s !== slot).length;
  if (worn >= S.gear[id]) return fail('하나밖에 없어서 이미 다른 손에 들고 있습니다.');
  S.equip[slot] = id; S.sta = Math.min(S.sta, maxSta());
  return ok();
}
function unequip(slot) { delete S.equip[slot]; S.sta = Math.min(S.sta, maxSta()); return ok(); }
function loseGear(id) {   // 선물하거나 잃으면 하나 줄이고, 입고 있던 것이 모자라면 벗는다
  S.gear[id]--; if (!S.gear[id]) delete S.gear[id];
  const worn = Object.keys(S.equip).filter(s => S.equip[s] === id);
  for (const s of worn.slice(S.gear[id] || 0)) unequip(s);
}
function gearBonus(k) { let b = 0; for (const id of Object.values(S.equip)) if (GR[id]) b += GR[id].fx[k] || 0; return b; }
const hasPerk = p => Object.values(S.equip).some(id => GR[id] && GR[id].perk === p);

// ---- 그 시절 특별 이벤트 (스포츠 배당) ----
const betKind = () => age() < 20 ? BET_KINDS[0] : BET_KINDS[1];
const betFull = () => { const bk = betKind(); return Math.floor(bk.full * cpiF() / bk.unit) * bk.unit; };
// 실제 배당: 기준 금액까지는 그대로, 넘으면 이익 몫이 √(기준 ÷ 건 금액)만큼 줄어든다. 1배 아래로는 내려가지 않는다
function betOdds(q, k, stake) {
  const base = q.opts[k][1], full = betFull();
  const d = stake <= full ? 1 : Math.sqrt(full / stake);
  return Math.max(1, Math.floor((1 + (base - 1) * d) * 100) / 100);
}
// 내기 결과 떠올리기: 그 문항의 정답이 또렷해진다
function betRemember(qid) {
  const q = SPORT[qid]; if (!q) return fail('');
  if (S.betMem[qid]) return fail('이미 떠올렸습니다.');
  if (!spendGem(GEM_COST.bet)) return fail('');
  S.betMem[qid] = true;
  log(`💎${GEM_COST.bet} ${q.title} · 「${q.opts[q.win][0]}」${josa(q.opts[q.win][0], '이었다는', '였다는')} 기억이 또렷해졌습니다.`, 'blue');
  return ok(q.win);
}
function placeBet(qid, k, stake) {
  const q = SPORT[qid]; if (!q || S.bets.some(b => b.id === qid)) return fail('이미 걸었습니다.');
  if (!q.opts[k]) return fail('보기를 고르세요.');
  const unit = betKind().unit;
  stake = Math.floor(stake / unit) * unit;
  if (!(stake >= unit)) return fail('걸 금액을 정하세요.');
  if (stake > S.cash) return fail('현금이 부족합니다.');
  const odds = betOdds(q, k, stake);
  S.cash -= stake; S.bets.push({ id: qid, k, stake, odds });
  log(`${q.title} · ${q.opts[k][0]}에 ${fmtWon(stake)} (배당 ${odds}배)`, 'blue');
  return ok(odds);
}
function settleBets() {
  const ym = curYM();
  for (const q of SPORTS.filter(x => x.end === ym)) {
    const b = S.bets.find(x => x.id === q.id);
    if (!b) { log('📣 ' + q.res, ''); continue; }
    const pay = b.k === q.win ? Math.round(b.stake * (b.odds || q.opts[b.k][1])) : 0;
    S.cash += pay; b.pay = pay;
    log(`${q.title} · ${pay ? '맞혔습니다 +' + fmtWon(pay) : '틀렸습니다 -' + fmtWon(b.stake)}`, pay ? 'good' : 'bad');
    enqueue('sportres:' + q.id);
  }
  S.betsDone = (S.betsDone || []).concat(S.bets.filter(b => SPORT[b.id].end === ym)).slice(-20);
  S.bets = S.bets.filter(b => SPORT[b.id].end !== ym);
}

// ---- 결과 ----
function ok(v) { return { ok: true, v }; }
function fail(msg) { if (msg) toast(msg); return { ok: false, msg }; }
let toast = () => {};   // ui.js 에서 교체

// ---- 숫자 표기 ----
function fmtWon(n, full) {
  if (n == null || !isFinite(n)) return '-';
  const s = n < 0 ? '-' : '', a = Math.abs(n);
  if (full) return s + Math.round(a).toLocaleString('ko-KR') + '원';
  const t = (x, d) => (+x.toFixed(d)).toLocaleString('ko-KR', { maximumFractionDigits: d });
  if (a < 1e4) return s + Math.round(a).toLocaleString('ko-KR') + '원';
  if (a < 1e8) return s + t(a / 1e4, a < 1e5 ? 1 : 0) + '만';
  if (a < 1e12) return s + t(a / 1e8, a < 1e10 ? 2 : 1) + '억';
  if (a < 1e16) return s + t(a / 1e12, a < 1e14 ? 2 : 0) + '조';
  return s + t(a / 1e16, 2) + '경';
}
const fmtSigned = n => (n > 0 ? '+' : '') + fmtWon(n);
function fmtPrice(id, p) {
  if (p == null) return '-';
  if (TK[id] && TK[id].cur === 'USD') return '$' + (p >= 100 ? p.toLocaleString('en-US', { maximumFractionDigits: 2 }) : p >= 1 ? p.toFixed(2) : p.toPrecision(3));
  return Math.round(p).toLocaleString('ko-KR') + '원';
}
function fmtQty(id, q) {
  if (isCoin(id)) return (+q.toFixed(4)).toLocaleString('ko-KR', { maximumFractionDigits: 4 }) + '개';
  return (Number.isInteger(q) ? q.toLocaleString('ko-KR') : (+q.toFixed(2)).toLocaleString('ko-KR')) + '주';
}
const fmtPct = (x, d) => (x > 0 ? '+' : '') + x.toFixed(d == null ? 1 : d) + '%';
const fmtYM = (mi) => { const ym = ymOf(mi); return ym.slice(0, 4) + '.' + ym.slice(5); };
