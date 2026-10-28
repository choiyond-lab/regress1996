// 게임 로직 검사. 실행: node test/bughunt.js  (먼저 node build.js)
const { run, STORY_HELPERS } = require('./_load');

const code = STORY_HELPERS + String.raw`
const errs = []; let checks = 0;
const expect = (c, m) => { checks++; if (!c) errs.push('FAIL: ' + m); };
const near = (a, b, tol) => Math.abs(a - b) <= (tol == null ? 1e-6 : tol) * Math.max(1, Math.abs(b));
function fresh(seed, all) { UI.sheet = null; UI.sel = null; RUN = null; newGame({ seed: seed || 7 }); playStory(); if (all !== false) for (const c of CHARS) meet(c.id, true); }
function at(ym) { S.mi = miOf(ym); S.mo = {}; S.sta = maxSta(); S.monthStartNW = netWorth(); }
const draw = (label, f) => { try { f(); render(); expect(els.phone.innerHTML.length > 300, label); return els.phone.innerHTML; } catch (e) { expect(false, label + ': ' + e.message); return ''; } };
let h = '';
function next(n) { for (let k = 0; k < (n || 1); k++) { playStory(); nextMonth(); } playStory(); }
// 한 달 동안 체력이 허락하는 만큼 행동한다
function spendMonth(order) {
  let guard = 0;
  for (const k of order || ['gym', 'work', 'study', 'work', 'gym', 'work', 'study', 'work']) {
    if (guard++ > 30) break;
    doAction(k);
  }
}

// ---------- 1. 시세 데이터 ----------
expect(MARKET.m.kospi.length === LAST_MI + 1, '1-1 지수 길이');
for (const t of TICKERS) {
  const s = MARKET.s[t.id];
  expect(s && s.c.length === LAST_MI + 1, '1-2 종목 기록 있음 ' + t.id);
  if (s) expect(s.c.every(v => v == null || (isFinite(v) && v > 0)), '1-3 가격이 양수 ' + t.id);
}
expect(MARKET.m.kospi[miOf('1998-06')] < 330, '1-4 1998년 6월 코스피 300 근처');
expect(MARKET.m.kospi[miOf('2007-10')] > 1900, '1-5 2007년 10월 코스피 2000 근처');
expect(MARKET.m.fx[miOf('1997-12')] > 1300, '1-6 외환위기 환율 급등');
for (const k of ['kospi', 'ndx', 'fx', 'cd', 'ktb', 'ust', 'house']) expect(MARKET.m[k].every(v => v != null && isFinite(v)), '1-7 거시 지표 빈칸 없음 ' + k);
for (const c of CHARS) {
  if (c.asset) expect(fs.existsSync(path.join(ROOT, 'assets', 'portrait', c.asset)), '1-8 일러스트 파일 ' + c.asset);
  for (const k of c.likes) expect(ITEM[k] || LUX[k] || GR[k], '1-9 좋아하는 물건 id ' + c.id + ':' + k);
}
for (const f of ['h1021.png', 'h1037.png']) expect(fs.existsSync(path.join(ROOT, 'assets', 'portrait', f)), '1-10 주인공 일러스트 ' + f);
for (const l of REL_LINKS) expect(CH[l.a] && CH[l.b], '1-11 관계도 인물 id ' + l.a + '-' + l.b);
expect(HISTORY.every(h => h.w === undefined) && Object.values(STORY).every(e => typeof e.at === 'string' || typeof e.cond === 'function'), '1-12 사건에 주 표기 없음');

// ---------- 2. 새 게임과 프롤로그 ----------
expect(typeof allowance === 'undefined' && typeof ALLOWANCE === 'undefined', '2-0 용돈 없음');
newGame({ seed: 1 });
expect(curYM() === '1996-01', '2-1 1996년 1월 시작');
expect(age() === 11, '2-2 세는나이 11살');
expect(schoolLabel() === '초등학교 4학년', '2-3 초4');
expect(S.cash === 30000, '2-4 초기자금 3만원');
expect(maxSta() === 40 && S.sta === 40, '2-5 초반 최대 체력 40');
expect(S.queue[0] === 'story:prologue' && S.queue.includes('story:account'), '2-6 프롤로그와 계좌 개설 대기');
expect(canTrade('ss'), '2-7 계좌 전에는 거래 불가');
playStory();
expect(S.flags.account === true && S.people.broker && S.people.broker.met, '2-8 계좌 개설 · 증권사 대리');
expect(S.queue.length === 0 && RUN === null, '2-9 이야기 큐 비움');

// ---------- 3. 월 단위 시세 ----------
fresh();
at('2000-03');
expect(price('ss') === MARKET.s.ss.c[miOf('2000-03')], '3-1 가격 = 그달 월말 종가');
expect(priceAt('naver', miOf('2002-09')) === null, '3-2 상장 전 가격 없음');
at('2018-05');
expect(near(prevPrice('ss'), MARKET.s.ss.c[miOf('2018-04')] / 50), '3-3 분할 달의 지난달 가격은 분할 반영');
expect(Math.abs(changePct('ss')) < 30, '3-4 분할 달 등락률이 분할로 튀지 않음');
expect(near(macro('ks200'), MARKET.m.kospi[S.mi] * ks200Ratio(S.mi)), '3-5 코스피200');

// ---------- 4. 매수·매도 ----------
fresh(); at('1996-02'); S.cash = 10000000;
const p0 = unitKRW('ss'), c0 = S.cash;
expect(buy('ss', 3).ok, '4-1 삼성전자 3주 매수');
expect(near(S.cash, c0 - p0 * 3 * (1 + feeRate('ss')), 1e-9) && feeRate('ss') === 0.005, '4-2 수수료 포함 차감 (1996년 객장 0.5%)');
expect(!buy('ss', 1e6).ok && S.hold.ss.q === 3, '4-3 현금 부족 매수 거절');
expect(sell('ss', 1).ok && S.hold.ss.q === 2, '4-4 1주 매도');
expect(sell('ss', 99).ok && !S.hold.ss, '4-5 넘치는 수량은 전량 매도');
expect(S.realized < 0 && S.realized > -p0 * 3 * 0.02 && S.feePaid > 0 && S.taxPaid > 0, '4-6 같은 값 사고팔면 비용만큼 손실 (수수료·거래세 누계)');
expect(!buy('ss', 0).ok && !buy('ss', -3).ok, '4-7 0·음수 수량 거절');
expect(!buy('btc', 1).ok, '4-8 코인 시장은 2010년 전 닫힘');
at('2013-01'); S.cash = 1e8;
expect(buy('btc', 0.5).ok && near(S.hold.btc.q, 0.5), '4-9 코인 소수 수량');
expect(buy('aapl', 2).ok && near(S.hold.aapl.cost, price('aapl') * fxNow() * 2 * (1 + feeRate('aapl')), 1e-9), '4-10 해외 주식 환율 적용');
expect(maxBuy('ss') > 0 && !buy('ss', maxBuy('ss') + 1).ok, '4-11 최대 수량 경계');
const t0 = S.mi; buy('ss', 1); sell('ss', 1);
expect(S.mi === t0, '4-12 매매는 시간이 안 흐름');

// ---------- 5. 액면분할 ----------
fresh(); at('2018-04'); S.cash = 1e8;
buy('ss', 2);
const vBefore = holdValue('ss');
next();
expect(curYM() === '2018-05', '5-1 5월로 넘어감');
expect(near(S.hold.ss.q, 100), '5-2 50대 1 분할로 100주');
expect(Math.abs(holdValue('ss') / vBefore - 1) < 0.15, '5-3 분할 전후 평가액 연속');

// ---------- 6. 선물 ----------
fresh(); at('2008-08'); S.cash = 3e8;
expect(openFut('kf', 1, 2).ok, '6-1 코스피200 선물 매수');
expect(!openFut('kf', -1, 1).ok, '6-2 반대 포지션 거절');
expect(near(S.cash, 3e8 - S.fut.kf.margin - S.feePaid), '6-3 증거금·수수료 차감');
for (let k = 0; k < 4 && S.fut.kf; k++) next();
expect(!S.fut.kf && S.log.some(l => /강제 청산/.test(l.t)), '6-4 2008년 폭락에 롱 포지션 강제 청산');
fresh(); at('1996-02'); S.cash = 1e9;
expect(!openFut('kf', 1, 1).ok, '6-5 상장 전 선물 거절');
at('2008-09');
expect(openFut('kf', -1, 3).ok, '6-6 선물 매도');
next();
expect(futPL('kf') > 0, '6-7 하락장 매도 포지션 이익');
expect(closeFut('kf').ok && !S.fut.kf, '6-8 청산');

// ---------- 7. 옵션 (9·11) ----------
fresh(); at('2001-08'); S.cash = 1e8;
expect(HISTORY.some(h => h.ym === '2001-08' && h.memo), '7-1 9·11 전달에 전생의 기억');
const chain = optChain();
expect(chain.length >= 4, '7-2 행사가 목록');
const K = chain[1].K;   // 5% 외가격 풋
expect(optPremium('P', K) > 0.01, '7-3 외가격 옵션도 값이 있음');
const before7 = S.cash;
expect(buyOpt('P', K, 10).ok, '7-4 풋 매수');
const cost7 = before7 - S.cash;
next();
expect(S.opt.length === 0, '7-5 다음 달로 넘어가며 만기 정산');
expect(S.cash - (before7 - cost7) > cost7, '7-6 9·11 풋이 원금 이상 이익');
at('1997-05');
expect(!buyOpt('C', 100, 1).ok, '7-7 옵션 상장 전 거절');

// ---------- 8. 채권·은행 ----------
fresh(); at('1998-01'); S.cash = 1e8;
expect(buyBond('corp3', 5e7).ok && S.bonds[0].y > 20, '8-1 IMF 회사채 금리 20% 넘음');
const c8 = S.cash; next();
expect(S.cash > c8, '8-2 월 이자 입금');
for (let k = 0; k < 40 && S.bonds.length; k++) next();
expect(S.bonds.length === 0, '8-3 3년 만기 상환');
fresh(); at('1996-03'); S.cash = 1e7;
expect(deposit(5e6).ok && S.bank.dep === 5e6, '8-4 예금');
next();
expect(S.bank.dep > 5e6, '8-5 예금 이자');
expect(!borrow(1e6).ok, '8-6 미성년 대출 거절');
at('2006-03');
expect(borrow(1e6).ok && S.bank.loan === 1e6, '8-7 성인 대출');
expect(!borrow(1e12).ok, '8-8 한도 초과 거절');
expect(repay(1e6).ok && S.bank.loan === 0, '8-9 상환');

// ---------- 9. 부동산 ----------
fresh(); at('1998-06'); S.cash = 1e9;
S.people.mom.aff = 40;
expect(!buyEstate('eunma').ok, '9-1 미성년·엄마 호감 부족 거절');
S.people.mom.aff = 70;
expect(buyEstate('eunma').ok && S.re.eunma.q === 1, '9-2 엄마 명의 매입');
expect(!buyEstate('arcro').ok, '9-3 준공 전 거절');
expect(S.re.eunma.mode === 'empty' && setLease('eunma', 'wolse').ok, '9-4a 처음 산 집은 빈 집 · 월세 놓기');
const c9 = S.cash; next();
expect(S.cash > c9, '9-4 월세 수익');
at('2021-06');
expect(sellEstate('eunma').ok && !S.re.eunma && S.realized > 1e9, '9-5 강남 아파트 시세 차익');

// ---------- 10. 명품·쇼핑·선물 ----------
fresh(); at('2016-01'); S.cash = 1e9;
expect(buyLux('rolex').ok && luxCha() === LUX.rolex.cha, '10-1 롤렉스 구입 · 매력');
at('2022-03');
expect(luxValue('rolex') > S.luxCost.rolex && sellLux('rolex').ok, '10-2 2022년 롤렉스 차익');
expect(buyShop('flower').ok && S.inv.flower === 1, '10-3 꽃다발 구입');
const a0 = S.people.seoyun.aff;
expect(giveGift('seoyun', 'flower').ok && S.people.seoyun.aff > a0, '10-4 선물로 호감 상승');
buyShop('flower');
expect(!giveGift('seoyun', 'flower').ok, '10-5 한 달에 한 번만 선물');
next();
expect(giveGift('seoyun', 'flower').ok, '10-6 다음 달엔 다시 선물');
expect(!buyGear('gameboy').ok, '10-7 시기 지난 물건은 못 삼');

// ---------- 11. 체력과 행동 ----------
fresh();
const mo0 = S.mi, i0 = S.st.int;
expect(doAction('study').ok && S.st.int > i0 && S.sta === 30, '11-1 공부 → 지성, 체력 -10');
expect(S.mi === mo0, '11-2 행동은 시간이 안 흐름');
expect(doAction('work').ok && S.sta === 15, '11-3 일 → 체력 -15');
expect(doAction('work').ok && S.sta === 0, '11-4 체력 0');
expect(!doAction('study').ok, '11-5 체력 부족 거절');
expect(!ACTIONS.rest && !doAction('rest').ok, '11-6 휴식 행동은 없음');
S.sta = 20;
expect(doAction('sns').ok && !doAction('sns').ok, '11-8 SNS 한 달에 한 번');
S.sta = 100;
doAction('work'); doAction('work');
expect(!doAction('work').ok, '11-9 일은 한 달에 네 번');
const hp0 = S.st.hp, max0 = maxSta();
expect(doAction('gym').ok && S.st.hp > hp0 && maxSta() > max0, '11-10 운동하면 최대 체력 상승');
next();
expect(S.mi === mo0 + 1 && S.sta === maxSta() && !S.mo.work, '11-11 다음 달 체력 회복 · 횟수 초기화');
S.st.hp = 99.9;
const g99 = maxSta(); doAction('gym');
expect(maxSta() - g99 <= 1, '11-12 건강이 높으면 덜 오름');
expect(maxSta() <= STA_BASE + 100, '11-13 최대 체력 상한');
at('2011-02'); S.job = 'office'; S.edu = 'A'; S.jobSince = S.mi;
expect(jobInfo().pay > 500000, '11-14 회사원 급여');

// ---------- 12. 다음 달과 이달 수익 ----------
fresh(); at('1999-01'); S.cash = 1e7; buy('ss', 10);
const nw12 = netWorth(); next();
expect(near(S.monthStartNW, nw12), '12-1 이달 수익은 넘기기 직전 자산부터');
UI.confirmNext = false; S.sta = maxSta();
const m12 = S.mi; ACT.next();
expect(S.mi === m12 && UI.confirmNext, '12-2 체력이 남았으면 한 번 더 눌러야 넘어감');
ACT.next(); playStory();
expect(S.mi === m12 + 1 && !UI.confirmNext, '12-3 두 번째에 넘어감');
S.sta = 0; S.mo = { rest: 1, sns: 1 }; const m13 = S.mi; ACT.next(); playStory();
expect(S.mi === m13 + 1, '12-4 할 일이 없으면 바로 넘어감');

// ---------- 13. 기억 떠올리기 ----------
fresh(); at('2009-12');
expect(gemCount() === Infinity, '13-1 개발 버전 보석 무한');
let used = S.gemsUsed;
expect(revealNext('ss').ok && S.reveal.ss === S.mi + 1 && S.gemsUsed - used === REVEAL_COST[0], '13-2 첫 기억은 다음 달 하나');
for (let k = 1; k < 12; k++) revealNext('ss');
expect(S.reveal.ss === S.mi + 12, '13-3 최대 1년 뒤');
expect(S.gemsUsed - used === REVEAL_COST.reduce((s, c) => s + c, 0), '13-4 멀리 볼수록 비싸게 누적');
expect(REVEAL_COST.every((c, i) => i === 0 || c >= REVEAL_COST[i - 1]) && REVEAL_COST[11] > REVEAL_COST[0], '13-5 비용이 점점 늘어남');
expect(!revealNext('ss').ok, '13-6 13개월째는 거절');
next();
expect(revealAhead('ss') === 11 && revealCost('ss') === REVEAL_COST[11], '13-7 한 달 지나면 남은 기억 11개월');
expect(revealNext('re:eunma').ok && S.reveal['re:eunma'] === S.mi + 1, '13-8 부동산 기억');
expect(revealNext('idx:ks200').ok, '13-9 지수 기억');
used = S.gemsUsed;
const rc = recall(3);
expect(rc.ok && rc.v.h === 3 && rc.v.up.length === 5 && S.gemsUsed - used === RECALL_COST[3], '13-10 기억 더듬기 3개월');
expect(remember('mom').ok && S.people.mom.mem, '13-11 인물 기억');
at(MARKET.end); S.reveal = {};
expect(!revealNext('ss').ok, '13-12 마지막 달 뒤는 기억 없음');

// 1·6·12개월 한꺼번에 떠올리기 (비용은 아직 안 떠올린 달들의 합)
fresh(); at('2009-12'); used = S.gemsUsed;
expect(revealCostTo('kakao', 6) === REVEAL_COST.slice(0, 6).reduce((s, c) => s + c, 0), '13-13 6개월 비용 = 1~6개월 합');
expect(revealUpTo('kakao', 6).ok && S.reveal.kakao === S.mi + 6 && S.gemsUsed - used === 12, '13-14 6개월 기억 💎12');
expect(revealCostTo('kakao', 12) === REVEAL_COST.slice(6).reduce((s, c) => s + c, 0) && revealUpTo('kakao', 12).ok && S.gemsUsed - used === 42, '13-15 이어서 12개월은 남은 달만 (모두 💎42)');
expect(!revealUpTo('kakao', 6).ok && !revealUpTo('kakao', 12).ok, '13-16 이미 떠올린 범위는 거절');
UI.sheet = 'stocks'; UI.sel = 'hmc'; h = draw('13 기억 버튼', () => {});
expect((h.match(/data-act="revealN"/g) || []).length === 3 && /6개월/.test(h) && /12개월/.test(h), '13-17 1·6·12개월 버튼');
ACT.revealN('hmc|12'); expect(S.reveal.hmc === S.mi + 12, '13-18 12개월 버튼');
UI.sheet = null; UI.sel = null;

// ---------- 14. 인연 ----------
fresh(); at('1996-05');
const t14 = S.people.seoyun.aff, s14 = S.sta;
expect(talk('seoyun').ok && S.people.seoyun.aff > t14 && S.sta === s14 - TALK_COST, '14-1 대화 호감 · 체력');
expect(!talk('seoyun').ok, '14-2 대화 한 달에 한 번');
S.cash = 1e6; const m14 = S.mi;
expect(outing('taeho').ok && S.mi === m14, '14-3 같이 놀기는 시간이 안 흐름');
expect(!outing('taeho').ok, '14-4 같이 놀기 한 달에 한 번');
expect(!canRomance('seoyun'), '14-5 초등학생은 연애 불가');
at('2006-03'); S.people.seoyun.aff = 80;
expect(canConfess('seoyun'), '14-6 성인 호감 80 고백 가능');
S.rng = 5; let tries = 0;
while (!S.people.seoyun.lover && tries++ < 20) { S.people.seoyun.aff = 95; confess('seoyun'); }
playStory();
expect(S.people.seoyun.lover && !canPropose('seoyun'), '14-7 연인 · 27살 전 청혼 불가');
at('2013-03'); S.people.seoyun.aff = 95;
expect(propose('seoyun').ok && spouseId() === 'seoyun', '14-8 결혼');
playStory();

// ---------- 15. 저장·불러오기 ----------
fresh(); at('2000-01'); S.cash = 12345678; buy('ss', 2); S.flags.test = true; revealNext('ss'); save();
const snap = JSON.stringify(S);
S = null;
expect(load() && JSON.stringify(S) === snap, '15-1 불러오면 상태 그대로');
localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign(JSON.parse(snap), { v: 1 })));
expect(!load(), '15-2 주 단위 v1 저장은 버림');
localStorage.setItem(SAVE_KEY, '{망가진');
expect(!load(), '15-3 망가진 저장 무시');

// ---------- 16. 이벤트가 모두 끝까지 돈다 ----------
const keys = [...Object.keys(STORY).map(k => 'story:' + k), ...HISTORY.map((_, i) => 'news:' + i),
  ...CHARS.flatMap(c => c.ev.map(e => 'char:' + c.id + ':' + e.id)), 'lover:seoyun', 'wedding:jisu', 'finale'];
for (const k of keys) {
  for (const pickIdx of [0, 1, 2, 3]) {
    fresh(); at('2015-06'); S.cash = 1e10;
    for (const c of CHARS) S.people[c.id].aff = 90;
    S.st.int = 90;
    S.queue = [k];
    try { playStory((cs, ok) => ok[Math.min(pickIdx, ok.length - 1)]); expect(true, ''); }
    catch (e) { expect(false, '16 ' + k + ' 선택 ' + pickIdx + ': ' + e.message); }
  }
  expect(resolveEvent(k), '16-1 사건 찾기 ' + k);
}
fresh(); at('1996-02'); next();
expect(S.done['story:school'], '16-2 3월이 되면 새 학기 사건');

// ---------- 17. 화면 그리기 ----------
fresh(); at('2012-06'); S.cash = 1e9;
buy('ss', 3); buyOpt('C', optChain()[2].K, 1); openFut('kf', 1, 1); buyBond('ktb3', 1e6); buyLux('chanel');
revealNext('ss'); revealNext('ss'); revealNext('re:eunma'); revealNext('idx:ks200');
for (const t of ['main', 'invest', 'people', 'status']) draw('17 탭 ' + t, () => { UI.tab = t; UI.sheet = null; });
h = draw('17 하단 다음 달 버튼', () => { UI.tab = 'main'; });
expect(/data-act="next"/.test(h) && /다음 달/.test(h), '17-1 다음 달 버튼');
expect((h.match(/class="act[ "]/g) || []).length === 8 && (h.match(/act empty/g) || []).length === 3 && !/data-arg="rest"/.test(h), '17-1b 행동 4칸×2줄, 빈 칸 셋, 휴식 없음');
h = draw('17 관계도', () => { UI.tab = 'people'; UI.pview = 'map'; });
expect(/class="relmap"/.test(h) && /map-me/.test(h) && (h.match(/class="map-node"/g) || []).length === CHARS.length, '17-2 관계도 노드 ' + CHARS.length + '명');
expect(/전생의 불륜/.test(h) && /부부/.test(h), '17-3 인물끼리의 관계 선');
h = draw('17 리스트', () => { UI.pview = 'list'; });
expect(/class="person"/.test(h) && !/relmap/.test(h), '17-4 리스트 보기');
for (const sh of ['stocks', 'bank', 'estate', 'lux', 'shop', 'log', 'settings', 'gemshop', 'ending', 'recall']) draw('17 시트 ' + sh, () => { UI.sheet = sh; UI.sel = null; UI.recall = null; });
for (const ft of TABS.map(t => t.id)) draw('17 매매 탭 ' + ft, () => { UI.sheet = 'stocks'; UI.ftab = ft; });
h = draw('17 옵션', () => { UI.sheet = 'stocks'; UI.ftab = 'OPT'; });
expect(/memo-box/.test(h), '17-5 옵션 화면 지수 기억');
for (const r of ['1y', '5y', 'all']) { h = draw('17 종목 차트 ' + r, () => { UI.sheet = 'stocks'; UI.sel = 'ss'; UI.range = r; }); expect(/<svg class="chart"/.test(h) && /fut-list/.test(h), '17-6 종목 차트와 떠올린 달 ' + r); }
h = draw('17 부동산 펼침', () => { UI.sheet = 'estate'; UI.sel = null; UI.estSel = 'eunma'; });
expect(/fut-list/.test(h) && /<svg class="chart"/.test(h), '17-7 부동산 기억');
UI.estSel = null;
for (const c of CHARS) draw('17 인물 ' + c.id, () => { UI.sheet = 'person'; UI.sel = c.id; S.people[c.id].mem = true; UI.giftOpen = true; });
h = draw('17 기억 더듬기 결과', () => { UI.sheet = 'recall'; UI.recall = recallFuture(6); });
expect(/크게 오를 것/.test(h), '17-8 기억 더듬기 결과');
draw('17 이벤트 팝업', () => { UI.sheet = null; S.queue = ['story:prologue']; storyStart(); });
expect(/story-card/.test(els.phone.innerHTML), '17-9 이벤트 팝업 카드');
for (const y of [1996, 2003, 2010, 2020]) { h = draw('17 메인 방 ' + y, () => { RUN = null; S.queue = []; at(y + '-03'); UI.tab = 'main'; }); expect(/class="room"/.test(h), '17-10 방 그림 ' + y); }
S = null; render(); expect(/새로 시작/.test(els.phone.innerHTML), '17-11 시작 화면');

// ---------- 19. 지성: 양다리 · 월초 기억 ----------
fresh(); at('2010-03'); S.cash = 1e7;
S.people.seoyun.lover = true; S.people.haeun.aff = 90;
expect(canConfess('haeun'), '19-1 연인이 있어도 고백 가능 (양다리)');
S.people.haeun.lover = true;
S.st.int = 20; const rLow = cheatRisk(); S.st.int = 100; const rHigh = cheatRisk();
expect(rLow > rHigh * 3 && rHigh >= CHEAT_MIN, '19-2 지성이 높을수록 덜 들킴 (' + Math.round(rLow * 100) + '% → ' + Math.round(rHigh * 100) + '%)');
S.st.fame = 100; expect(cheatRisk() > rHigh, '19-3 인기가 높으면 더 들킴');
S.st.fame = 50; const fame19 = S.st.fame;
S.queue = ['caught:' + S.mi];
playStory((cs, ok) => ok[0]);
expect(S.people.seoyun.lover && !S.people.haeun.lover && S.st.fame < fame19, '19-4 들키면 한 명만 남고 소문');
expect(partners().length === 1 && cheatRisk() === 0, '19-5 한 명이면 위험 없음');
fresh(); at('2014-03'); S.people.jisu.spouse = true; S.flags.married = 'jisu'; S.people.minji.lover = true;
S.queue = ['caught:' + S.mi]; playStory((cs, ok) => ok.find(i => cs[i].t.includes(CH.minji.name)));
expect(!spouseId() && !S.flags.married && S.people.minji.lover, '19-6 배우자를 놓치면 이혼');
fresh(); S.st.int = 20; at('2020-01');
let got = 0; for (let k = 0; k < 6; k++) { next(); got += S.hints.length; }
expect(got === 0, '19-7 지성 낮으면 월초 기억 없음');
fresh(); S.st.int = 100; at('2019-10');
got = 0; let ok19 = true;
for (let k = 0; k < 8; k++) {
  next();
  for (const hh of S.hints) {
    got++;
    const r = hh.id === 'kospi' ? macroAt('kospi', S.mi + 1) / macro('kospi') - 1 : MARKET.s[hh.id].c[S.mi + 1] * splitRatio(hh.id, S.mi + 1) / price(hh.id) - 1;
    if ((r > 0) !== hh.up || Math.abs(r) < HINT_MOVE.index) ok19 = false;
    if (!/기억이 났다|떠올랐다|기억이 난다/.test(hh.t)) ok19 = false;
  }
}
expect(got >= 4 && ok19, '19-8 지성 높으면 실제 다음 달 폭등·폭락을 떠올림 (' + got + '번)');
expect(S.log.some(l => l.k === 'memo'), '19-9 월초 기억은 기록에 남음');
expect(josa('삼성전자', '이', '가') === '가' && josa('셀트리온', '이', '가') === '이' && josa('NAVER', '이', '가') === '이(가)', '19-10 조사');

// ---------- 20. 매력·인기 ----------
fresh(); at('2010-06'); S.cash = 5e9;
S.st.cha = 30; const cLow = estateBuyCost('eunma'); S.st.cha = 100; const cHigh = estateBuyCost('eunma');
expect(near(cHigh / cLow, 1 - HAGGLE_MAX, 1e-9), '20-1 매력 100이면 부동산 3% 싸게');
buyLux('rolex'); const v20 = luxValue('rolex') * (1 + haggle()), c20 = S.cash;
sellLux('rolex'); expect(near(S.cash - c20, v20), '20-2 명품 되팔기 협상');
S.st.fame = 80; S.mo = {};
monthEnd();
expect(S.log[0].t.includes('SNS 수입') && snsIncome() > 0, '20-3 인기 → SNS 월 수입');
at('2005-06'); S.st.fame = 80; expect(snsIncome() === 0, '20-4 2010년 전에는 SNS 수입 없음');
S.st.fame = 50; S.mo = {}; monthEnd(); expect(S.st.fame === 50 - FAME_DECAY, '20-5 SNS 안 하면 인기 감소');
S.mo = { sns: 1 }; monthEnd(); expect(S.st.fame === 50 - FAME_DECAY, '20-6 SNS 하면 유지');
const f20 = S.st.fame; S.sta = 50; S.mo = {}; doAction('sns'); expect(S.st.fame > f20, '20-7 SNS 로 인기 상승');
fresh(3, false); at('2011-05'); S.st.cha = 50; S.st.fame = 30;
next(); expect(S.done['story:blindDate'] && S.people.suyeon && S.people.suyeon.met, '20-8 매력·인기로 소개팅 인연');
at('2012-05'); S.st.fame = 60; next();
expect(S.done['story:snsMeet'] && S.people.gaeun && S.people.gaeun.met, '20-9 인기로 SNS 인연');
fresh(); at('2015-05'); S.st.fame = 40; next(); expect(!S.done['sponsor:2015'], '20-10 인기 낮으면 광고 없음');
at('2016-05'); S.st.fame = 90; const c21 = S.cash; next();
expect(S.done['sponsor:2016'] && S.cash > c21, '20-11 인기 70 넘으면 6월 광고 제안');
fresh(5, false); at('2009-06'); S.st.cha = 20; S.st.fame = 0; next(); expect(!S.done['story:blindDate'], '20-12 조건 미달이면 소개팅 없음');

// ---------- 21. 로또 ----------
fresh(); at('2002-11'); newLotto();
expect(!S.lotto && !buyLotto([1, 2, 3, 4, 5, 6]).ok, '21-1 2002년 12월 전에는 로또 없음');
next();
const L = S.lotto;
expect(L && L.no === 4 && curYM() === '2002-12', '21-2 첫 달 회차 = 실제 회차 (2002-12 마지막 추첨 4회)');
expect(new Set([...L.win, L.bonus]).size === 7 && [...L.win, L.bonus].every(n => n >= 1 && n <= 45), '21-3 번호 7개 서로 다름 1~45');
expect(L.prize[1] >= 4e8 && L.prize[4] === 50000 && L.prize[5] === 5000, '21-4 등수별 당첨금');
S.cash = 1e6;
expect(!buyLotto([1, 2, 3]).ok && !buyLotto([1, 1, 2, 3, 4, 5]).ok && !buyLotto([0, 2, 3, 4, 5, 6]).ok, '21-5 잘못된 번호 거절');
const cl = S.cash;
for (let k = 0; k < LOTTO_MAX; k++) buyLotto(lottoAuto());
expect(L.tickets.length === LOTTO_MAX && near(cl - S.cash, LOTTO_PRICE * LOTTO_MAX), '21-6 장당 천원, 열 장');
expect(!buyLotto(lottoAuto()).ok, '21-7 열한 번째는 거절');
const g21 = S.gemsUsed;
for (let k = 0; k < 6; k++) lottoReveal();
expect(L.open === 6 && S.gemsUsed - g21 === LOTTO_REVEAL_COST.reduce((s, c) => s + c, 0) && !lottoReveal().ok, '21-8 번호 여섯 개 떠올리기 5·10·15·20·30·40');
expect(LOTTO_REVEAL_COST.reduce((s, c) => s + c, 0) * GEM_WON === 36000, '21-9 보석 300원 기준 36,000원');
L.tickets.pop(); buyLotto(L.seq);
const p1 = L.prize[1], cBefore = S.cash; next();
expect(S.lottoLast.best === 1 && S.cash - cBefore >= S.lottoLast.won && S.lottoLast.won >= p1 - lottoTax(p1), '21-10 떠올린 번호로 1등');
expect(S.done['lotto:' + S.lottoLast.no], '21-11 1등 이벤트');
expect(lottoTax(2e6) === 0 && near(lottoTax(1e8), 2.2e7) && near(lottoTax(1e9), 3e8 * 0.22 + 7e8 * 0.33), '21-12 복권 세금');
const fake = { win: [1, 2, 3, 4, 5, 6], bonus: 7 };
expect(lottoRank([1, 2, 3, 4, 5, 6], fake) === 1 && lottoRank([1, 2, 3, 4, 5, 7], fake) === 2 && lottoRank([1, 2, 3, 4, 5, 9], fake) === 3 && lottoRank([1, 2, 3, 4, 8, 9], fake) === 4 && lottoRank([1, 2, 3, 10, 8, 9], fake) === 5 && lottoRank([1, 2, 30, 10, 8, 9], fake) === 0, '21-13 등수 판정');
expect(S.lotto && S.lotto.no === lottoDrawNo(S.mi) && S.lotto.no > S.lottoLast.no, '21-14 다음 달 새 회차');
UI.sheet = 'lotto'; UI.lottoPick = [3, 7]; h = draw('21 로또 시트', () => {});
expect(/class="lgrid"/.test(h) && /번호 하나 떠올리기/.test(h) && /지난 회차/.test(h), '21-15 로또 화면');
UI.tab = 'invest'; UI.sheet = null; h = draw('21 투자 로또 칸', () => {});
expect(/로또 6\/45/.test(h), '21-16 투자 탭 로또 칸');
fresh(); at('1999-01'); S.lotto = null; UI.sheet = 'lotto'; h = draw('21 로또 시트 잠김', () => {}); expect(/2002년 12월/.test(h), '21-17 출시 전 안내');
UI.sheet = null;

// ---------- 22. 종목 수 · 매수·매도창 ----------
expect(TICKERS.length >= 140, '22-1 종목 140개 이상 (' + TICKERS.length + ')');
for (const tab of ['KS', 'KQ', 'US', 'ETF', 'COIN']) expect(TICKERS.filter(t => (Array.isArray(t.tab) ? t.tab[t.tab.length - 1][1] : t.tab) === tab).length >= 15, '22-2 탭별 15개 이상 ' + tab);
fresh(); at('1996-06');
expect(TICKERS.filter(t => listed(t.id) && tkTab(t.id) === 'KS').length >= 15, '22-3 1996년에도 코스피 종목 15개 이상');
at('2005-06'); S.cash = 1e7; UI.sheet = 'stocks'; ACT.sel('ss');
expect(UI.side === 'buy' && UI.qty === 0, '22-4 종목을 고르면 매수·수량 0');
const mx = orderMax('ss');
ACT.pct(0.25); expect(UI.qty === Math.floor(mx * 0.25), '22-5 25% 버튼');
ACT.pct(1); expect(UI.qty === mx, '22-6 최대 버튼');
h = draw('22 매수창', () => {});
expect(/type="range"/.test(h) && /data-act="pct"/.test(h) && /매수하기/.test(h), '22-7 드래그 막대와 비율 버튼');
onInput('qty', '3'); expect(UI.qty === 3, '22-8 막대 끌기 = 수량');
ACT.trade('ss'); expect(S.hold.ss && S.hold.ss.q === 3 && UI.qty === 0, '22-9 매수하기');
ACT.side('sell'); expect(orderMax('ss') === 3, '22-10 매도는 보유 수량이 최대');
ACT.pct(0.5); expect(UI.qty === 1, '22-11 매도 50% (내림)');
ACT.pct(1); ACT.trade('ss'); expect(!S.hold.ss, '22-12 매도 최대 = 전량');
h = draw('22 매도창 빈 보유', () => {}); expect(/보유 수량이 없습니다/.test(h), '22-13 보유 없으면 안내');
ACT.side('buy'); S.cash = 0; h = draw('22 현금 없음', () => {}); expect(/현금이 부족/.test(h), '22-14 현금 없으면 안내');
UI.sheet = null; UI.sel = null;

// ---------- 23. 장비 ----------
fresh(); at('1998-06'); S.cash = 1e8;
const max23 = maxSta(), cha23 = cha();
expect(buyGear('jordan').ok && S.equip.shoes === 'jordan', '23-1 사면 빈 칸에 바로 장착');
expect(maxSta() === max23 + GR.jordan.fx.hp && cha() === cha23 + GR.jordan.fx.cha, '23-2 장착 보너스 (건강 → 최대 체력, 매력)');
expect(!buyGear('smartphone').ok, '23-3 시기 전 물건은 못 삼');
expect(!buyGear('suit').ok, '23-4 나이 제한');
buyGear('gameboy'); buyGear('phone');
expect(S.equip.rhand === 'gameboy' && S.equip.lhand === 'phone', '23-5 손에 드는 물건은 양손 어디든');
expect(hasPerk('phone') && !hasPerk('rest'), '23-6 장착 중인 물건의 효과');
expect(gearBonus('hp') === GR.jordan.fx.hp + GR.gameboy.fx.hp, '23-7 게임기는 건강 +3');
buyGear('sneaker'); expect(S.equip.shoes === 'jordan' && S.gear.sneaker === 1, '23-8 칸이 차 있으면 가방으로');
expect(equip('shoes', 'sneaker').ok && S.equip.shoes === 'sneaker', '23-9 바꿔 입기');
expect(!equip('top', 'sneaker').ok, '23-10 맞지 않는 칸 거절');
expect(!equip('rhand', 'phone').ok, '23-11 하나뿐인 물건은 두 손에 못 듦');
unequip('lhand'); expect(!hasPerk('phone'), '23-12 벗으면 효과 사라짐');
S.people.seoyun.aff = 30; const ag = S.people.seoyun.aff;
expect(giveGift('seoyun', 'jordan').ok && !S.gear.jordan && S.people.seoyun.aff > ag, '23-13 장비 선물');
S.people.taeho.giftMi = -1; buyGear('jordan'); equip('shoes', 'jordan');
expect(giveGift('taeho', 'jordan').ok && S.equip.shoes !== 'jordan', '23-14 입고 있던 것을 선물하면 벗는다');
S.st.cha = 100; buyGear('check'); expect(cha() <= STAT_CAP, '23-15 능력치 상한');
expect(GEAR.every(g => SLOTS.some(s => s[0] === g.slot) && GRADES[g.g]), '23-16 장비 칸·등급');
for (const [s] of SLOTS) for (const gd of ['N', 'R', 'SR', 'SSR']) expect(GEAR.some(g => g.slot === s && g.g === gd), '23-17 칸마다 등급별 물건 ' + s + ' ' + gd);
UI.sheet = 'shop'; UI.shopTab = 'gear'; h = draw('23 쇼핑 옷', () => {}); expect(/class="grade g-SSR"/.test(h), '23-18 쇼핑 등급 표시');
UI.shopTab = 'item'; draw('23 쇼핑 소모품', () => {});
UI.sheet = 'slot'; UI.slot = 'shoes'; h = draw('23 장착 시트', () => {}); expect(/입기|벗기/.test(h), '23-19 장착 시트');
UI.sheet = null; UI.tab = 'status'; h = draw('23 상태 장착', () => {}); expect(/class="equip"/.test(h) && (h.match(/class="eslot/g) || []).length === 7, '23-20 상태 탭 장착 7칸');
fresh(); at('1996-02'); S.cash = 1e6; buyGear('check'); h = draw('23 상의 색', () => { UI.tab = 'main'; });
expect(h.includes(shade(GR.check.color, 1.08)), '23-21 어린 시절 그림에 상의 색');

// ---------- 24. 스탯 점감 ----------
fresh();
expect(grow(20, 3) > grow(50, 3) * 2 && grow(50, 3) > grow(80, 3) * 3, '24-1 높을수록 덜 오름');
S.st.int = 25; S.sta = 999; S.mo = {}; let n24 = 0;
while (S.st.int < 85 && n24 < 2000) { S.sta = 100; doAction('study'); n24++; }
expect(n24 > 100 && n24 < 600, '24-2 지성 25→85 공부 ' + n24 + '번');
const gr90 = grow(90, 3), gr99 = grow(99, 3); expect(gr90 < 0.07 && gr99 >= 3 * GROW_FLOOR - 1e-9, '24-3 90 넘으면 거의 안 오름');

// ---------- 25. 로또 당첨금 범위 ----------
fresh(); at('2005-01'); const ps = [];
for (let k = 0; k < 200; k++) { newLotto(); ps.push(S.lotto.prize); }
const p1s = ps.map(p => p[1]);
expect(p1s.every(v => v >= LOTTO_PRIZE[1][0] && v <= LOTTO_JACKPOT.max), '25-1 1등 범위');
expect(new Set(p1s).size > 150, '25-2 회차마다 1등 당첨금이 다름');
expect(p1s.filter(v => v > LOTTO_PRIZE[1][1]).length >= 1 && p1s.filter(v => v > LOTTO_PRIZE[1][1]).length < 20, '25-3 가끔 큰 회차');
expect(ps.every(p => p[2] >= LOTTO_PRIZE[2][0] && p[2] <= LOTTO_PRIZE[2][1] && p[3] >= LOTTO_PRIZE[3][0] && p[3] <= LOTTO_PRIZE[3][1] && p[4] === 50000 && p[5] === 5000), '25-4 2~5등 범위');

// ---------- 26. 그 시절 특별 이벤트 ----------
expect(SPORTS.every(q => q.opts[q.win] && q.ask < q.end && q.opts.every(o => o[1] > 1)), '26-1 문항 정답·배당·시기');
expect(SPORTS.every(q => q.opts.length >= 4), '26-2 보기 네 개 이상');
for (let y = 1996; y <= 2025; y++) expect(SPORTS.some(q => q.ask.startsWith(y + '-')), '26-3 해마다 문항 ' + y);
expect(SPORT.kor2002.opts[SPORT.kor2002.win][0] === '4강' && SPORT.wc2022.opts[SPORT.wc2022.win][0] === '아르헨티나' && SPORT.ks2009.opts[SPORT.ks2009.win][0] === 'KIA 타이거즈', '26-4 실제 결과');
expect(SPORTS.filter(q => q.id.startsWith('ks')).every(q => new Set(q.opts.map(o => o[0])).size === 4), '26-5 한국시리즈 보기 네 팀이 서로 다름');
fresh(); at('2002-05'); S.cash = 1e6; S.queue = ['sport:kor2002']; storyStart();
expect(RUN && RUN.cur && RUN.cur.bet === 'kor2002', '26-6 내기 창 하나');
UI.bet = null; render(); h = els.phone.innerHTML;
expect(/data-input="bet"/.test(h) && (h.match(/class="bet-opt /g) || []).length === 5 && h.indexOf('data-input="bet"') < h.indexOf('bet-opt'), '26-7 위에 금액 막대, 아래에 보기');
ACT.storyTap(); expect(RUN && RUN.cur.bet, '26-8 화면을 눌러도 넘어가지 않음');
ACT.betPick(3); ACT.betPct(1);
expect(UI.bet.stake === 1e6, '26-9 전액 버튼 = 현금 전부');
onInput('bet', '1000000'); ACT.betPlace();
const b26 = S.bets[0];
expect(b26 && b26.k === 3 && b26.stake === 1e6 && S.cash === 0, '26-10 현금 전부 걸기');
expect(b26.odds < 30 && b26.odds > 1, '26-11 친구 내기 기준을 넘어서 배당이 줄어듦 (' + b26.odds + '배)');
playStory();
const c26 = S.cash; next(); next();
expect(curYM() === '2002-07' && S.cash - c26 >= Math.round(1e6 * b26.odds) && S.done['sportres:kor2002'] && !S.bets.length, '26-12 맞히면 줄어든 배당으로 지급');
fresh(); at('2009-03'); const q26 = SPORT.wbc2009;
expect(betKind().label === '지인들과 큰 내기' && betFull() >= BET_KINDS[1].full, '26-13 20살부터 지인들과 큰 내기');
expect(betOdds(q26, 1, betFull()) === q26.opts[1][1], '26-14 기준 금액까지는 기본 배당');
expect(Math.abs(betOdds(q26, 1, betFull() * 4) - (1 + (q26.opts[1][1] - 1) / 2)) < 0.011, '26-15 네 배를 걸면 이익 몫이 절반');
expect(betOdds(q26, 5, 1e15) >= 1, '26-16 아무리 커도 1배 아래로는 안 내려감');
S.cash = 1e9; expect(placeBet('wbc2009', 5, 1e9).ok && S.cash === 0, '26-17 성인도 현금 전부 걸기');
expect(!placeBet('wbc2009', 1, 10000).ok, '26-18 한 문항에 한 번');
const c27 = S.cash; next(); expect(!S.bets.length && S.log.some(l => /틀렸습니다/.test(l.t)) && S.cash < c27 + 1e9, '26-19 틀리면 잃음');
S.cash = 1e6; S.queue = ['sport:kor2010']; storyStart(); ACT.betSkip(); playStory();
expect(!S.bets.length && S.done['sport:kor2010'], '26-20 넘기기');
for (const q of SPORTS.slice(0, 3)) { S.queue = ['sport:' + q.id]; try { playStory(); expect(true, ''); } catch (e) { expect(false, '26-21 ' + q.id + ': ' + e.message); } }
fresh(); at('2018-06'); S.cash = 1e7; S.queue = ['sport:kor2018']; storyStart(); UI.bet = null; render();
const g26 = S.gemsUsed; ACT.betRemember();
expect(S.betMem.kor2018 && S.gemsUsed - g26 === GEM_COST.bet && GEM_COST.bet === 10, '26-23 내기 결과 떠올리기 💎10');
h = els.phone.innerHTML;
expect(/bet-opt[^"]*known/.test(h) && /분명히 기억난다/.test(h) && UI.bet.k === SPORT.kor2018.win, '26-24 정답 표시 · 정답 보기 선택');
expect(!betRemember('kor2018').ok && S.gemsUsed - g26 === GEM_COST.bet, '26-25 두 번 떠올려도 보석은 한 번');
ACT.betSkip(); playStory();
UI.tab = 'status'; S.bets = [{ id: 'ks2009', k: 0, stake: 10000, odds: 2 }]; h = draw('26 진행 중인 내기', () => {}); expect(/진행 중인 내기/.test(h), '26-22 상태 탭 내기 현황'); S.bets = [];

// ---------- 27. 배당 · 금융 비용 ----------
expect(Object.values(MARKET.s).filter(s => s.dv && s.dv.length).length >= 80, '27-1 배당 기록 있는 종목 80개 이상');
fresh(); at('1997-06'); expect(feeRate('ss') === 0.005, '27-2 1997년 국내 수수료 0.5%');
at('2001-06'); expect(feeRate('ss') === 0.001, '27-3 2001년 HTS 0.1%');
at('2012-06'); expect(feeRate('ss') === 0.00015 && near(feeRate('aapl'), 0.0025 + 0.0025), '27-4 2012년 국내 0.015% · 해외 0.25%+환전 0.25%');
at('2005-06'); expect(near(feeRate('aapl'), 0.0025 + 0.01), '27-5 2010년 전 환전 1%');
at('2015-06'); expect(feeRate('btc') === 0.0025, '27-6 초기 코인 거래소 0.25%'); at('2019-06'); expect(feeRate('btc') === 0.0005, '27-7 2017년 10월 뒤 0.05%');
const ssDiv = MARKET.s.ss.dv.find(([m]) => m >= '2015-01');
expect(ssDiv && ssDiv[1] > 0, '27-8 삼성전자 배당 기록');
fresh(); at(ssDiv[0]); S.cash = 1e9; buy('ss', 100);
const cd = S.divTotal; monthEnd();
expect(near(S.divTotal - cd, 100 * ssDiv[1] * (1 - DIV_TAX.KRW), 1e-6) && S.divTotal > 0 && S.log.some(l => /배당금/.test(l.t)), '27-9 들고 있으면 세후 배당 (15.4%)');
const koDiv = MARKET.s.ko.dv.find(([m]) => m >= '2010-01');
fresh(); at(koDiv[0]); S.cash = 1e9; buy('ko', 100); const ck = S.divTotal; monthEnd();
expect(near(S.divTotal - ck, 100 * koDiv[1] * fxNow() * (1 - DIV_TAX.USD), 1e-6), '27-10 미국 주식 배당 (15% 원천징수, 환율 적용)');
at('2012-06'); expect(trailingDiv('ko') > 0 && trailingDiv('ko') / price('ko') < 0.1 && divMonths('ko').length >= 3, '27-11 최근 1년 배당·배당 달');
expect(trailingDiv('btc') === 0, '27-12 코인은 배당 없음');
fresh(); S.usGain[2010] = 1e7; at('2011-04'); const cu = S.taxPaid; next();
expect(curYM() === '2011-05' && near(S.taxPaid - cu, (1e7 - US_GAIN_TAX.free) * US_GAIN_TAX.rate, 1e-6) && !S.usGain[2010], '27-13 해외 주식 양도소득세 5월 (250만원 공제 뒤 22%)');
fresh(); at('2012-06'); S.cash = 1e8; buy('aapl', 10); at('2012-12'); sell('aapl', 10);
expect(S.usGain[2012] != null, '27-14 해외 주식 차익 기록');
fresh(); at('2009-06'); S.cash = 1e9; const cf = S.cash; openFut('kf', 1, 1);
expect(near(cf - S.cash, S.fut.kf.margin + futPrice('kf') * futMultKRW('kf') * FUT_FEE, 1e-9), '27-15 선물 수수료');
const fp = S.feePaid; buyOpt('C', optChain()[2].K, 1); expect(S.feePaid > fp, '27-16 옵션 수수료');
UI.sheet = 'stocks'; UI.sel = 'ss'; h = draw('27 배당·비용 카드', () => {}); expect(/배당·비용/.test(h) && /매매 수수료/.test(h), '27-17 종목 화면에 배당·비용');
UI.sheet = null; UI.sel = null; UI.tab = 'status'; h = draw('27 상태 누계', () => {}); expect(/받은 배당 누계/.test(h) && /낸 세금 누계/.test(h), '27-18 상태 탭 누계');

// ---------- 28. 종목 정렬 ----------
expect(Object.values(MARKET.s).filter(s => s.so || s.cs || s.na).length >= 120, '28-1 주식 수·유통량·순자산 정보 120개 이상');
fresh(); at('2020-06');
const ks28 = TICKERS.filter(t => listed(t.id) && tkTab(t.id) === 'KS');
expect(sortTickers(ks28, 'cap')[0].id === 'ss', '28-2 2020년 코스피 시총 1위 삼성전자');
const up28 = sortTickers(ks28, 'up'), dn28 = sortTickers(ks28, 'down');
expect(changePct(up28[0].id) === Math.max(...ks28.map(t => changePct(t.id))) && changePct(dn28[0].id) === Math.min(...ks28.map(t => changePct(t.id))), '28-3 상승률·하락률 정렬');
expect(sortTickers(ks28, 'base').map(t => t.id).join() === ks28.map(t => t.id).join(), '28-4 기본 정렬은 원래 순서');
at('2015-06'); expect(sortTickers(TICKERS.filter(t => listed(t.id) && t.tab === 'US'), 'cap')[0].id === 'aapl', '28-5 2015년 해외 시총 1위 애플');
at('2013-11'); const btc28 = mcap('btc') / fxNow(); expect(btc28 > 5e9 && btc28 < 3e10, '28-6 2013년 11월 비트코인 시총 약 130억 달러 (' + (btc28 / 1e9).toFixed(1) + 'B)');
at('2010-06'); expect(mcap('ss') > 7e13 && mcap('ss') < 2e14, '28-7 2010년 삼성전자 시총 근사 (실제 약 110조, 이후 소각분만큼 작게 나옴: ' + fmtWon(mcap('ss')) + ')');
UI.sheet = 'stocks'; UI.ftab = 'KS'; UI.sel = null; UI.sort = 'cap'; h = draw('28 시총 정렬 목록', () => {});
expect(/data-act="sort"/.test(h) && /시총 /.test(h) && /class="rank/.test(h), '28-8 정렬 버튼 · 시총 · 순위');
UI.sort = 'base'; UI.sheet = null;

// ---------- 29. 부촌 매물 · 두 열 카드 · 폭등·폭락 종목 ----------
expect(ESTATES.length >= 20 && ['tower', 'hannamhill', 'seongbuk', 'pyeongchang', 'onebailey'].every(id => EST[id]), '29-1 서울 부촌 매물 20곳 이상');
expect(ESTATES.every(e => Object.values(e.p).every(v => v > 0)), '29-2 매물 시세 양수');
fresh(); at('2012-06'); UI.sheet = 'estate'; UI.estSel = null; h = draw('29 부동산 두 열', () => {});
expect(/class="est-grid"/.test(h) && (h.match(/class="est-card/g) || []).length === ESTATES.length && /assets\/estate\//.test(h), '29-3 두 열 카드 · 매물 이미지');
expect(estateImg('nope') === 'assets/estate/_default.svg' && fs.existsSync(path.join(ROOT, 'assets', 'estate', '_default.svg')), '29-4 이미지가 없으면 기본 이미지');
UI.estSel = 'tower'; h = draw('29 펼친 카드', () => {}); expect(/est-card open/.test(h) && /est-detail/.test(h), '29-5 펼치면 두 칸에 시세·기억');
UI.estSel = null; UI.sheet = null;
for (const id of ['gme', 'shinpoong', 'hmm', 'aig', 'ftt', 'sillajen']) expect(TK[id] && MARKET.s[id] && MARKET.s[id].c.some(v => v != null), '29-6 폭등·폭락 종목 시세 ' + id);
const swing = (id, a, b) => MARKET.s[id].c[miOf(b)] / MARKET.s[id].c[miOf(a)];
expect(swing('gme', '2020-12', '2021-01') > 5, '29-7 게임스탑 2021년 1월 폭등 ×' + swing('gme', '2020-12', '2021-01').toFixed(1));
expect(swing('shinpoong', '2020-01', '2020-09') > 10, '29-8 신풍제약 2020년 폭등 ×' + swing('shinpoong', '2020-01', '2020-09').toFixed(1));
expect(swing('aig', '2007-12', '2009-03') < 0.1, '29-9 AIG 2008년 폭락');

// ---------- 33. 가운데 주문창: 주식 리스트 · 선물 롱/숏 · 옵션 콜/풋 · 채권 ----------
fresh(); at('2006-06'); S.cash = 5e9; S.flags.account = true; UI.pops = []; UI.order = null;
buy('ss', 10);
UI.sheet = 'stocks'; UI.ftab = 'KS'; UI.sel = null; UI.sort = 'base';
h = draw('33 주식 리스트', () => {});
expect(/data-act="ordOpen" data-arg="stock:ss:buy"/.test(h) && /data-arg="stock:ss:sell"(?! disabled)/.test(h) && /보유 [+-]?\d/.test(h), '33-1 리스트에 매수·매도 버튼과 보유 수익률');
expect(/data-arg="stock:hmc:sell" disabled/.test(h), '33-2 없는 종목은 매도 버튼 꺼짐');
h = draw('33 주식 주문창', () => ACT.ordOpen('stock:ss:sell'));
expect(UI.order && UI.side === 'sell' && /pop-card order/.test(h) && /매도하기/.test(h) && /data-act="ordClose"/.test(h), '33-3 매도 버튼 → 가운데 주문창');
onInput('qty', '4'); ACT.trade('ss');
expect(!UI.order && S.hold.ss.q === 6 && UI.pops.length === 1 && UI.pops[0].kind === 'sold', '33-4 주문창에서 매도 → 결과 창');
UI.pops = [];
ACT.ordOpen('stock:hmc:buy'); onInput('qty', '3'); ACT.trade('hmc');
expect(!UI.order && S.hold.hmc && S.hold.hmc.q === 3 && !UI.pops.length, '33-5 주문창에서 매수');
ACT.ordOpen('stock:ss:buy'); ACT.ordDetail();
expect(!UI.order && UI.sel === 'ss', '33-6 차트·상세 보기');
UI.sel = null;
// 선물: 수량 고르고 롱/숏
UI.ftab = 'FUT'; h = draw('33 선물 목록', () => {});
expect(/data-arg="fut:kf"/.test(h) && !/class="qty"/.test(h), '33-7 선물 목록은 주문하기 버튼만');
h = draw('33 선물 주문창', () => ACT.ordOpen('fut:kf'));
expect(/롱 ▲/.test(h) && /숏 ▼/.test(h) && /data-act="ordGo" data-arg="1"/.test(h), '33-8 선물 주문창 롱·숏');
ACT.pct(1); expect(UI.qty === futMax('kf') && UI.qty > 0, '33-9 최대 계약');
onInput('qty', '2'); ACT.ordGo('1');
expect(S.fut.kf && S.fut.kf.dir === 1 && S.fut.kf.q === 2 && !UI.order, '33-10 롱 2계약');
h = draw('33 선물 포지션', () => ACT.ordOpen('fut:kf'));
expect(/data-arg="-1" data-unit="[\d.e+]+" data-lock="1" disabled/.test(h) && /청산/.test(h), '33-11 롱이 있으면 숏은 잠김 · 청산 버튼');
onInput('qty', '1'); ACT.ordGo('-1');
expect(S.fut.kf.q === 2, '33-12 반대 방향 주문 거절');
ACT.futClose('kf');
expect(!S.fut.kf && !UI.order && UI.pops.length === 1 && UI.pops[0].title === '청산 체결', '33-13 청산 → 결과 창');
UI.pops = [];
// 옵션: 행사가·수량 고르고 콜/풋
UI.ftab = 'OPT'; h = draw('33 옵션 목록', () => {});
expect(/data-arg="opt:\d/.test(h) && /콜 1계약/.test(h), '33-14 옵션 목록');
h = draw('33 옵션 주문창', () => ACT.ordOpen('opt:'));
const K33 = UI.order.K;
expect(K33 > 0 && /콜 ▲/.test(h) && /풋 ▼/.test(h) && /data-act="ordK"/.test(h), '33-15 옵션 주문창 콜·풋 · 처음엔 지금 지수 근처 행사가');
const K33b = optChain()[0].K; ACT.ordK(K33b);
expect(UI.order.K === K33b, '33-16 행사가 바꾸기');
onInput('qty', '3'); ACT.ordGo('P');
expect(S.opt.length === 1 && S.opt[0].type === 'P' && S.opt[0].K === K33b && S.opt[0].q === 3 && !UI.order, '33-17 풋 3계약');
h = draw('33 보유 옵션', () => {});
expect(/data-act="optSell"/.test(h), '33-18 보유 옵션 매도 버튼');
ACT.optSell('0'); expect(!S.opt.length && UI.pops.length === 1, '33-19 옵션 매도 → 결과 창');
UI.pops = [];
// 채권: 금액 고르고 매수
UI.ftab = 'BOND'; h = draw('33 채권 목록', () => {});
expect(/data-arg="bond:ktb3"/.test(h) && !/data-input="amt"/.test(h), '33-20 채권 목록');
h = draw('33 채권 주문창', () => ACT.ordOpen('bond:ktb3'));
expect(/data-input="amt"/.test(h) && /매수하기/.test(h), '33-21 채권 주문창');
ACT.apct(0.1); const amt33 = UI.amt; ACT.ordGo('buy');
expect(S.bonds.length === 1 && Math.abs(bondCost(S.bonds[0]) - amt33) < 1 && !UI.order, '33-22 채권 매수');
ACT.bondSell(String(S.bonds[0].u)); expect(!S.bonds.length && UI.pops.length === 1, '33-23 채권 매도 → 결과 창');
UI.pops = []; UI.sheet = null; UI.ftab = 'KS';

// ---------- 32. 매도 결과 창 · 결산 · 고정 주문창 · 상세 재무 ----------
fresh(); at('2005-06'); S.cash = 1e10; S.flags.account = true;
buy('ss', 10);
let r32 = sell('ss', 4);
expect(r32.ok && r32.v.kind === 'sold' && Math.abs(r32.v.pl - (r32.v.rows.find(x => x[0] === '받은 돈')[1] - r32.v.cost)) < 1, '32-1 주식 매도 결과 (손익 = 받은 돈 - 산 금액)');
UI.pops = []; UI.sheet = 'stocks'; UI.ftab = 'KS'; UI.sel = 'ss'; UI.side = 'sell'; UI.qty = 2;
h = draw('32 고정 주문창', () => {});
expect(/class="sheet-foot"/.test(h) && h.indexOf('data-act="trade"') > h.indexOf('class="sheet-foot"'), '32-2 주문창이 시트 아래 고정 영역에');
h = draw('32 매도 결과 창', () => ACT.trade('ss'));
expect(UI.pops.length === 1 && /class="pop"/.test(h) && /매도 체결/.test(h) && /data-act="popClose"/.test(h), '32-3 매도하면 가운데 결과 창');
ACT.popClose(); h = els.phone.innerHTML;
expect(!UI.pops.length && !/class="pop"/.test(h), '32-4 확인을 누르면 닫힘');
buyEstate('eunma'); buyLux(LUXURY[0].id);
expect(sellEstate('eunma').v.kind === 'sold' && sellLux(LUXURY[0].id).v.kind === 'sold', '32-5 부동산·명품 판매 결과');
// 분기·연간 결산
fresh(); S.flags.account = true; S.cash = 1e7;
while (ymOf(S.mi) !== '1996-12') next();
const nw32 = histAt(S.mi - 2);
next();
let rep32 = periodDue();
expect(ymOf(S.mi) === '1997-01' && rep32 && rep32.period === 'year' && rep32.steps.length === 4 && rep32.title === '1996년 결산', '32-6 해가 바뀌면 연간 결산');
expect(Math.abs(rep32.parts.reduce((s, x) => s + (x[1] || 0), 0) - rep32.chg) < 5, '32-7 결산의 갈래 합 = 순자산 변화');
next(); next(); next();
rep32 = periodDue();
expect(ymOf(S.mi) === '1997-04' && rep32.period === 'q' && rep32.title === '1997년 1분기 결산' && rep32.steps.length === 3, '32-8 분기 결산');
next(); expect(periodDue() === null, '32-9 분기 중간에는 결산 없음');
// 다음 달 버튼으로 넘기면 결산 창이 이야기보다 먼저
while (month() !== 6) next();
S.sta = 0; UI.confirmNext = true; UI.pops = []; UI.sheet = null; RUN = null;
h = draw('32 결산 창', () => ACT.next());
expect(UI.pops.length === 1 && UI.pops[0].kind === 'report' && /1997년 2분기 결산/.test(h) && /class="bars"/.test(h), '32-10 다음 달 버튼 → 결산 창');
ACT.popClose(); playStory();
// 상세 재무 내역
UI.tab = 'invest'; UI.sheet = null; h = draw('32 투자 탭', () => {});
expect(/data-arg="finance"/.test(h) && /상세 재무 내역/.test(h), '32-11 투자 평가액 → 상세 재무');
UI.sheet = 'finance'; h = draw('32 상세 재무', () => {});
expect(/순자산/.test(h) && /투자 손익/.test(h) && /이번 달 현금 흐름/.test(h) && /data-act="report"/.test(h), '32-12 상세 재무 내역 화면');
h = draw('32 연도별', () => ACT.finP('y'));
expect(/1996년/.test(h) && /data-act="report" data-arg="\d+:\d+:year"/.test(h), '32-13 연도별 재산 변화');
const a32 = /data-act="report" data-arg="([^"]+)"/.exec(h)[1];
h = draw('32 지난 결산 다시 보기', () => ACT.report(a32));
expect(UI.pops.length === 1 && /결산/.test(h), '32-14 지난 기간을 누르면 결산 창');
UI.pops = []; UI.sheet = null; UI.tab = 'main'; UI.finP = 'q';
// 옛 기록(갈래 없음)도 결산이 깨지지 않는다
for (const x of S.hist) { delete x.liq; delete x.inv; }
expect(periodReport(S.mi - 3, S.mi, 'q').parts[0][1] === null, '32-15 옛 기록도 결산');

// ---------- 31. 부동산 관리: 거주·월세·전세 ----------
fresh(); at('2016-06'); S.cash = 5e10; S.st.hp = 20; S.st.cha = 20;
buyEstate('sanggye'); buyEstate('apgu'); buyEstate('apgu'); buyEstate('apgu');
expect(S.re.apgu.mode === 'empty' && leaseMonth().empty > 0 && leaseMonth().rent === 0, '31-1 빈 집은 관리비만');
let nw31 = netWorth(), cash31 = S.cash;
expect(setLease('apgu', 'jeonse').ok && S.re.apgu.dep > 0, '31-2 전세 놓기');
expect(Math.abs(S.cash - cash31 - S.re.apgu.dep * (1 - LEASE_FEE)) < 1, '31-3 보증금을 현금으로 받음 (수수료 뺀)');
expect(Math.abs(netWorth() - nw31 + S.re.apgu.dep * LEASE_FEE) < 1, '31-4 보증금은 빚이라 순자산은 수수료만큼만 준다');
expect(Math.abs(S.re.apgu.dep - jeonseDep('apgu') * 3) < 1 && jeonseDep('apgu') < estatePrice('apgu') * 0.8, '31-5 세 채 보증금 · 전세가율');
const hp31 = stat('hp'), cha31 = stat('cha');
expect(moveIn('apgu').ok && S.home === 'apgu' && rentN('apgu') === 2, '31-6 압구정에 들어가 살기');
expect(Math.abs(S.re.apgu.dep - jeonseDep('apgu') * 2) < 1, '31-7 들어간 집 세입자 보증금 돌려줌');
expect(stat('hp') > hp31 && stat('cha') > cha31 && homeTier().name === '부촌', '31-8 부촌에 살면 건강·매력 +');
expect(!moveIn('sanggye').ok, '31-9 이사는 한 달에 한 번');
const lc31 = livingCost(); S.home = null; const lc31b = livingCost(); S.home = 'apgu';
expect(age() >= 20 && lc31 < lc31b, '31-10 내 집에 살면 생활비가 준다');
setLease('sanggye', 'wolse');
const cash31b = S.cash; next();
expect(leaseMonth().rent > 0 && S.log.slice(0, 12).some(l => /월세 \+/.test(l.t)), '31-11 월세 정산');
const dep31 = S.re.apgu.dep, cash31c = S.cash;
expect(sellEstate('apgu').ok && S.home === 'apgu' && S.re.apgu.q === 2 && Math.abs(S.re.apgu.dep - dep31 / 2) < 1, '31-12 세 놓은 집부터 팔고 보증금은 산 사람이 떠안음');
expect(S.cash - cash31c < estatePrice('apgu') * 1.03 - dep31 / 2, '31-13 받은 돈에서 보증금 몫이 빠짐');
const lease31 = S.re.apgu.lease, dep31b = S.re.apgu.dep;
for (let i = 0; i < JEONSE_TERM && S.re.apgu.lease === lease31; i++) { S.cash = 5e10; next(); }
expect(S.re.apgu.lease !== lease31 && S.re.apgu.dep !== dep31b, '31-14 2년 뒤 전세 재계약');
S.cash = 0;
expect(!setLease('apgu', 'wolse').ok && S.re.apgu.mode === 'jeonse', '31-15 돌려줄 보증금이 없으면 전세를 못 뺀다');
S.cash = 5e10; S.mo.move = 0;
expect(moveOut().ok && S.home === null && rentN('apgu') === 2, '31-16 나가면 그 집도 세를 놓는다');
while (S.re.apgu) sellEstate('apgu');
expect(!S.re.apgu && jeonseTotal() === 0, '31-17 다 팔면 보증금도 정리');
// 관리 기능 전 저장은 월세로
S.re.sanggye.mode = undefined; S.re.sanggye.dep = undefined; save(); load();
expect(S.re.sanggye.mode === 'wolse' && S.re.sanggye.dep === 0, '31-18 옛 저장은 월세로');
UI.sheet = 'estMgr'; h = draw('31 부동산 관리', () => {});
expect(/부동산 관리/.test(h) && /data-act="lease"/.test(h) && /data-act="live"/.test(h), '31-19 관리 화면');
S.re = {}; S.home = null; h = draw('31 빈 관리', () => {});
expect(/가진 집이 없습니다/.test(h), '31-20 집이 없을 때 안내');
UI.sheet = null; UI.tab = 'invest'; h = draw('31 투자 탭', () => {});
const order31 = ['data-arg="estate"', 'data-arg="estMgr"', 'data-arg="lux"', 'data-arg="lotto"'].map(s => h.indexOf(s));
expect(order31.every((v, i) => v > 0 && (!i || v > order31[i - 1])) && !/tile wide/.test(h), '31-21 투자 탭: 부동산·관리 / 명품·로또');
UI.tab = 'main';

// ---------- 30. 홈 화면 설치 ----------
const mf = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
expect(mf.display === 'standalone' && mf.start_url === './' && mf.icons.length >= 3, '30-1 manifest');
expect(mf.icons.every(i => fs.existsSync(path.join(ROOT, i.src))) && fs.existsSync(path.join(ROOT, 'assets', 'icon', 'apple-touch-icon.png')), '30-2 아이콘 파일');
expect(fs.existsSync(path.join(ROOT, 'sw.js')), '30-3 서비스 워커');
fresh(); UI.sheet = 'settings'; h = draw('30 설정 설치 카드', () => {});
expect(/홈 화면에 설치/.test(h) && /앱 설치|홈 화면에 추가/.test(h), '30-4 설정에 설치 안내');
INSTALL.evt = { prompt() {}, userChoice: Promise.resolve({ outcome: 'accepted' }) }; h = draw('30 설치 버튼', () => {});
expect(/data-act="install"/.test(h), '30-5 설치 창을 띄울 수 있으면 설치 버튼');
INSTALL.evt = null; UI.sheet = null;

// ---------- 18. 끝까지 진행 ----------
fresh(9, false);
let months = 0;
while (!S.ended && months < 500) { playStory(); spendMonth(); nextMonth(); months++; }
playStory();
expect(S.ended && curYM() === MARKET.end, '18-1 마지막 달에 엔딩 (' + months + '개월)');
expect(months === LAST_MI - miOf(START_YM) + 1, '18-2 한 달에 한 턴');
expect(isFinite(netWorth()) && S.done.finale, '18-3 순자산 숫자 · 마지막 이야기');
expect(S.hist.length > 300 && S.edu && S.flags.account, '18-4 월별 기록 · 수능 · 계좌');
expect(S.st.hp > 50 && maxSta() > 80, '18-5 꾸준히 운동하면 최대 체력이 오름 (' + maxSta() + ')');
expect(!doAction('work').ok && !nextMonth().ok, '18-6 엔딩 뒤 행동·넘기기 막힘');

console.log(errs.length ? errs.join('\n') : '');
console.log((errs.length ? '실패 ' + errs.length + '건 / ' : '모두 통과 · ') + checks + '개 검사');
if (errs.length) process.exitCode = 1;
`;
run(code, { process });
