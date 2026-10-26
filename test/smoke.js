// 여러 전략으로 1996년부터 끝까지 자동 플레이한다. 실행: node test/smoke.js  (먼저 node build.js)
// 매달 불변식(숫자가 유한, 보유 수량 양수, 체력 범위)을 검사하고 전략별 결과를 표로 보여 준다.
const { run, STORY_HELPERS } = require('./_load');

const code = STORY_HELPERS + String.raw`
const errs = [];
function inv(tag) {
  const nw = netWorth();
  if (!isFinite(nw) || !isFinite(S.cash)) errs.push(tag + ' 숫자가 아님 ' + curYM());
  for (const [id, h] of Object.entries(S.hold)) if (!(h.q > 0) || !isFinite(h.cost)) errs.push(tag + ' 보유 이상 ' + id + ' ' + curYM());
  if (S.sta < -1e-9 || S.sta > maxSta() + 1e-9) errs.push(tag + ' 체력 범위 ' + S.sta);
  for (const k of ['int', 'hp', 'cha', 'fame']) if (!(S.st[k] >= 0 && S.st[k] <= 100)) errs.push(tag + ' 능력치 ' + k);
  if (S.lotto && S.lotto.tickets.length > LOTTO_MAX) errs.push(tag + ' 로또 장 수');
  for (const [s, id] of Object.entries(S.equip)) if (!S.gear[id] || !slotsFor(id).includes(s)) errs.push(tag + ' 장착 이상 ' + s);
  if (S.bets.some(b => !SPORT[b.id])) errs.push(tag + ' 내기 이상');
  if (partners().filter(id => S.people[id].spouse).length > 1) errs.push(tag + ' 배우자 둘');
}
function life() { // 기본 생활: 한 달 동안 체력이 허락하는 만큼 운동·일·공부
  for (const k of ['gym', 'work', 'study', 'work', 'work', 'gym', 'study', 'work', 'study']) doAction(k);
}
const STRATS = {
  // 아무 투자도 하지 않는다
  '저축만': () => { if (S.cash > 2e6) deposit(S.cash - 1e6); },
  // 삼성전자만 산다
  '삼성 장기보유': () => { if (S.flags.account && listed('ss')) { const q = maxBuy('ss'); if (q >= 1) buy('ss', q); } },
  // 기억을 쓰는 회귀자: 매달 1년 뒤 가장 크게 오를 종목으로 갈아탄다
  '기억 활용': () => {
    if (!S.flags.account) return;
    const r = recallFuture(12); const best = r.up[0];
    for (const id of Object.keys(S.hold)) if (!best || id !== best.id) sell(id, S.hold[id].q);
    if (best && best.r > 0.1) { const q = maxBuy(best.id); if (q > 0) buy(best.id, q); }
    if (age() >= 20 && S.cash > 5e8) { const e = ESTATES.find(x => estateAvailable(x.id) && estatePrice(x.id) * 1.1 < S.cash * 0.3); if (e && buyEstate(e.id).ok) setLease(e.id, 'wolse'); }
  },
  // 무작위 매매꾼: 아무 종목이나 사고팔고, 선물·옵션·채권·명품도 건드린다
  '무작위': () => {
    if (!S.flags.account) return;
    const ids = TICKERS.filter(t => listed(t.id) && !canTrade(t.id)).map(t => t.id);
    const x = rand();
    if (x < 0.25 && ids.length) { const id = ids[Math.floor(rand() * ids.length)]; buy(id, Math.max(qtyStep(id), roundQty(id, maxBuy(id) * rand() * 0.3))); }
    else if (x < 0.45) { const h = Object.keys(S.hold); if (h.length) { const id = h[Math.floor(rand() * h.length)]; sell(id, S.hold[id].q * rand()); } }
    else if (x < 0.5 && tabOpen('FUT')) { if (S.fut.kf) closeFut('kf'); else openFut('kf', rand() < 0.5 ? 1 : -1, 1); }
    else if (x < 0.55 && tabOpen('OPT')) { const ch = optChain(); buyOpt(rand() < 0.5 ? 'C' : 'P', ch[Math.floor(rand() * ch.length)].K, 1); }
    else if (x < 0.58 && tabOpen('BOND')) buyBond(BONDS[Math.floor(rand() * BONDS.length)].id, S.cash * 0.1);
    else if (x < 0.6) { const l = LUXURY[Math.floor(rand() * LUXURY.length)]; if (luxAvailable(l.id)) buyLux(l.id); }
    else if (x < 0.62 && S.bonds.length) sellBond(S.bonds[0].u);
    else if (x < 0.64 && age() >= 20) borrow(loanLimit() * 0.2);
    else if (x < 0.66 && S.bank.loan) repay(S.bank.loan);
    if (rand() < 0.1) { const m = metList(); const c = m[Math.floor(rand() * m.length)]; if (c) { talk(c.id); if (rand() < 0.3) outing(c.id); } }
    if (rand() < 0.05) doAction('sns');
    if (S.lotto && rand() < 0.3) buyLotto(lottoAuto());
    if (rand() < 0.05) { const g = gearList(); if (g.length) buyGear(g[Math.floor(rand() * g.length)].id); }
    if (rand() < 0.05) { const ks = Object.keys(S.gear); if (ks.length) { const id = ks[Math.floor(rand() * ks.length)]; equip(slotsFor(id)[0], id); } }
    if (rand() < 0.05) { for (const c of metList()) { S.people[c.id].aff = Math.max(S.people[c.id].aff, 80); if (canConfess(c.id)) { confess(c.id); break; } } }   // 양다리도 해 본다
  },
};
const rows = [];
for (const [name, strat] of Object.entries(STRATS)) {
  const t0 = Date.now();
  newGame({ seed: 4242 });
  let months = 0;
  while (!S.ended && months < 500) {
    if (name === '무작위') for (const k of S.queue) if (k.startsWith('sport:')) { const q = SPORT[k.slice(6)]; placeBet(q.id, Math.floor(rand() * q.opts.length), S.cash * rand() * 0.5); }   // 내기 창 대신 바로 건다
    playStory((cs, ok) => ok[Math.floor(rand() * ok.length)]);
    strat(); inv(name);
    life(); inv(name);
    nextMonth(); inv(name); months++;
  }
  playStory();
  if (!S.ended) errs.push(name + ' 엔딩에 못 감');
  const g = endingGrade();
  rows.push([name, months, fmtWon(netWorth()), g.money, Object.keys(S.done).length, maxSta(), (Date.now() - t0) + 'ms']);
}
console.log('전략          개월    순자산        등급  사건 최대체력  시간');
for (const r of rows) console.log(r[0].padEnd(10), String(r[1]).padStart(5), r[2].padStart(12), r[3].padStart(4), String(r[4]).padStart(5), String(r[5]).padStart(5), r[6].padStart(7));
console.log(errs.length ? '실패 ' + errs.length + '건\n' + [...new Set(errs)].slice(0, 20).join('\n') : '불변식 모두 통과');
if (errs.length) process.exitCode = 1;
`;
run(code, { process, Date });
