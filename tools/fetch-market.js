// 실제 시세를 받아 src/market-data.js 로 저장한다. 실행: node tools/fetch-market.js
// 종목 월봉과 배당·분할: 야후 파이낸스 · 환율·금리·주택가격: 미국 세인트루이스 연준(FRED)
// 인터넷이 필요하다. 받은 결과는 파일로 남으므로 게임은 오프라인으로 돈다.
const fs = require('fs');
const path = require('path');
const { TICKERS, MACRO_SRC, KOSDAQ_PRE } = require('../src/tickers.js');

const OUT = path.join(__dirname, '..', 'src', 'market-data.js');
const START = '1995-12';
const P1 = Date.UTC(1995, 11, 1) / 1000;
const P2 = Math.floor(Date.now() / 1000) + 86400;

const ym = t => new Date(t * 1000 + 9 * 3600e3).toISOString().slice(0, 7); // 한국 시간 기준 월
const addM = (s, k) => { let [y, m] = s.split('-').map(Number); m += k; y += Math.floor((m - 1) / 12); m = ((m - 1) % 12 + 12) % 12 + 1; return y + '-' + String(m).padStart(2, '0'); };
const diffM = (a, b) => { const [y1, m1] = a.split('-').map(Number), [y2, m2] = b.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sig = v => v == null || !isFinite(v) ? null : Number(v.toPrecision(v >= 1000 ? 6 : 5));

async function get(url) {
  for (let k = 0; k < 4; k++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
      if (r.ok) return await r.text();
      if (r.status === 404) throw new Error('404 ' + url);
    } catch (e) { if (String(e.message).startsWith('404')) throw e; }
    await sleep(1500 * (k + 1));
  }
  throw new Error('받기 실패: ' + url);
}

// 야후 월봉 → {map: 년월→종가(분할 반영된 값), splits: [[년월, 비율]]}
async function yahoo(sym) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1mo&period1=${P1}&period2=${P2}&events=split,div`;
  const j = JSON.parse(await get(url));
  const r = j.chart.result && j.chart.result[0];
  if (!r || !r.timestamp) throw new Error('기록 없음: ' + sym);
  const map = {};
  const close = r.indicators.quote[0].close;
  // 0 이하 종가는 기록이 없는 것으로 본다 (아주 싼 코인은 초기에 0으로 찍혀 나온다)
  r.timestamp.forEach((t, i) => { if (close[i] != null && close[i] > 0) map[ym(t)] = close[i]; });
  const splits = r.events && r.events.splits ? Object.values(r.events.splits).map(s => [ym(s.date), s.numerator / s.denominator]) : [];
  // 배당: 분할을 반영한 1주당 금액. 같은 달 두 번이면 더한다
  const divs = {};
  if (r.events && r.events.dividends) for (const d of Object.values(r.events.dividends)) divs[ym(d.date)] = (divs[ym(d.date)] || 0) + d.amount;
  return { map, splits, divs };
}
async function fred(id) {
  const txt = await get(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`);
  const map = {};
  for (const line of txt.trim().split('\n').slice(1)) {
    const [d, v] = line.split(',');
    if (v && v !== '.' && !isNaN(+v)) map[d.slice(0, 7)] = +v;
  }
  return map;
}
// 년월 키 맵 → START..END 배열 (빈 달은 앞 값으로 채운다. 첫 기록 이전은 null)
function toArr(map, months, ffill = true) {
  let last = null;
  return months.map(m => { if (map[m] != null) last = map[m]; return map[m] != null ? map[m] : (ffill ? last : null); });
}
// 앵커 {년월:값} 사이를 등비로 잇는다
function geoFill(anchors, months) {
  const keys = Object.keys(anchors).sort();
  return months.map(m => {
    if (m < keys[0] || m > keys[keys.length - 1]) return null;
    let i = keys.findIndex(k => k >= m);
    if (keys[i] === m) return anchors[m];
    const a = keys[i - 1], b = keys[i], t = diffM(a, m) / diffM(a, b);
    return anchors[a] * Math.pow(anchors[b] / anchors[a], t);
  });
}

// 지금 상장 주식 수 · 코인 유통량 · ETF 순자산 (시가총액 정렬용). 야후 quote 는 쿠키와 crumb 이 필요하다
async function quoteSizes(syms) {
  const ua = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36' };
  const r1 = await fetch('https://fc.yahoo.com', { headers: ua, redirect: 'manual' });
  const cookie = (r1.headers.getSetCookie ? r1.headers.getSetCookie() : []).map(c => c.split(';')[0]).join('; ');
  const crumb = await (await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', { headers: { ...ua, cookie } })).text();
  const out = {};
  for (let i = 0; i < syms.length; i += 40) {
    const part = syms.slice(i, i + 40);
    const j = await (await fetch('https://query1.finance.yahoo.com/v7/finance/quote?symbols=' + part.map(encodeURIComponent).join(',') + '&crumb=' + encodeURIComponent(crumb), { headers: { ...ua, cookie } })).json();
    for (const q of (j.quoteResponse && j.quoteResponse.result) || []) out[q.symbol] = { so: q.sharesOutstanding, cs: q.circulatingSupply, na: q.netAssets || q.totalAssets };
    await sleep(300);
  }
  return out;
}

(async () => {
  // ---- 지수와 거시 지표 ----
  const ks = await yahoo(MACRO_SRC.kospi.y);
  const end = Object.keys(ks.map).sort().pop();
  const months = [];
  for (let m = START; m <= end; m = addM(m, 1)) months.push(m);
  console.log(`기간 ${START} ~ ${end} (${months.length}개월)`);

  const M = {};
  // 코스피: 야후 기록 이전은 OECD 월평균 주가지수를 겹치는 6개월 비율로 맞춰 잇는다
  const oecd = await fred(MACRO_SRC.kospi.fred);
  const ksFirst = Object.keys(ks.map).sort()[0];
  const ov = [0, 1, 2, 3, 4, 5].map(k => addM(ksFirst, k)).filter(m => ks.map[m] && oecd[m]);
  const scale = ov.reduce((s, m) => s + ks.map[m] / oecd[m], 0) / ov.length;
  M.kospi = months.map(m => ks.map[m] != null ? ks.map[m] : (m < ksFirst && oecd[m] ? oecd[m] * scale : null));
  M.kospi = toArr(Object.fromEntries(months.map((m, i) => [m, M.kospi[i]])), months);

  const kq = await yahoo(MACRO_SRC.kosdaq.y);
  const kqPre = geoFill(KOSDAQ_PRE, months);
  M.kosdaq = toArr(Object.fromEntries(months.map((m, i) => [m, kq.map[m] != null ? kq.map[m] : kqPre[i]])), months, true);
  M.kosdaq = M.kosdaq.map((v, i) => months[i] < '1996-07' ? null : v);
  M.ndx = toArr((await yahoo(MACRO_SRC.ndx.y)).map, months);

  for (const k of ['fx', 'cd', 'ktb', 'ust', 'house']) {
    let map = await fred(MACRO_SRC[k].fred);
    if (k === 'house') { // 분기 → 월 (분기 첫 달 기준 등비 보간)
      const q = Object.fromEntries(Object.entries(map).filter(([m]) => m >= '1994-01'));
      const filled = geoFill(q, months);
      map = Object.fromEntries(months.map((m, i) => [m, filled[i]]));
    }
    M[k] = toArr(map, months);
    await sleep(300);
  }
  // 국고채 10년은 2000-10 부터 있다. 그 전은 3개월 금리 + 0.8%p 로 둔다
  M.ktb = M.ktb.map((v, i) => v != null ? v : (M.cd[i] != null ? M.cd[i] + 0.8 : null));
  // 앞쪽이 비면 첫 값으로, 끝이 비면 마지막 값으로 채운다
  for (const k of Object.keys(M)) {
    if (k === 'kosdaq') continue;
    const a = M[k]; const f = a.find(v => v != null);
    for (let i = 0; i < a.length && a[i] == null; i++) a[i] = f;
  }

  // ---- 종목 ----
  let sizes = {};
  try { sizes = await quoteSizes(TICKERS.map(t => t.y)); } catch (e) { console.warn('주식 수를 못 받음 (시가총액 정렬은 기본 순서로)', e.message); }
  const S = {};
  const report = [];
  for (const t of TICKERS) {
    let y;
    try { y = await yahoo(t.y); } catch (e) { console.warn('건너뜀', t.id, e.message); continue; }
    const keys = Object.keys(y.map).sort();
    const first = keys[0];
    // 분할 이전 값을 당시 실제 가격으로 되돌린다. 무상증자·분사 조정처럼 정수가 아닌 비율도 그대로 쓴다
    // (게임에서는 그 달에 보유 수량을 같은 비율로 곱하므로 평가액은 이어진다)
    const sp = y.splits.map(([m, r]) => [m, +r.toPrecision(6)]);
    const nominal = {};
    for (const m of keys) {
      let f = 1;
      for (const [sm, r] of sp) if (m < sm) f *= r;
      nominal[m] = y.map[m] * f;
    }
    let arr = toArr(nominal, months, true).map((v, i) => months[i] < first ? null : v);
    // 기록 이전 구간
    const from = t.from || first;
    if (from < first) {
      const fi = months.indexOf(first);
      if (t.pre) {
        const anchors = Object.assign({}, t.pre, { [first]: arr[fi] });
        const g = geoFill(anchors, months);
        arr = arr.map((v, i) => months[i] >= from && months[i] < first ? g[i] : v);
      } else {
        const idx = M[t.idx || 'kospi'];
        const beta = t.beta || 1.2;
        arr = arr.map((v, i) => months[i] >= from && months[i] < first && idx[i] != null ? arr[fi] * Math.pow(idx[i] / idx[fi], beta) : v);
      }
    }
    // 배당도 가격처럼 그때의 주식 수 기준으로 되돌린다 (그 달 뒤의 분할 비율을 곱한다)
    const dv = Object.keys(y.divs).sort().filter(m => m >= START).map(m => { let f = 1; for (const [sm, r] of sp) if (m < sm) f *= r; return [m, sig(y.divs[m] * f)]; }).filter(d => d[1] > 0);
    S[t.id] = { c: arr.map(sig), sp: sp.filter(([m]) => m > START), dv };
    const z = sizes[t.y] || {};   // so: 지금 주식 수 · cs: 코인 유통량 · na: ETF 순자산(달러)
    if (z.so) S[t.id].so = Math.round(z.so); else if (z.cs) S[t.id].cs = Math.round(z.cs); else if (z.na) S[t.id].na = Math.round(z.na);
    report.push(`${t.id.padEnd(9)} ${from} 기록 ${first} 분할 ${sp.map(s => s[0] + '×' + +s[1].toFixed(3)).join(',') || '-'}  마지막 ${sig(arr[arr.length - 1])}`);
    await sleep(250);
  }

  const out = '// 자동 생성 파일 — tools/fetch-market.js 로 다시 만든다. 직접 고치지 않는다.\n' +
    `// 받은 날 ${new Date().toISOString().slice(0, 10)} · 출처: Yahoo Finance(종목·지수 월말 종가), FRED(환율·금리·주택가격)\n` +
    '// 상장 이전 구간 중 from/pre 로 정한 부분과 코스닥 2000-09 이전은 추정치다.\n' +
    'const MARKET = ' + JSON.stringify({
      start: START, end, fetched: new Date().toISOString().slice(0, 10),
      m: Object.fromEntries(Object.entries(M).map(([k, a]) => [k, a.map(sig)])), s: S,
    }) + ';\nif (typeof module !== \'undefined\') module.exports = MARKET;\n';
  fs.writeFileSync(OUT, out, 'utf8');
  console.log(report.join('\n'));
  console.log(`저장: ${OUT} (${(out.length / 1024).toFixed(0)}KB, 종목 ${Object.keys(S).length}개)`);
})().catch(e => { console.error(e); process.exit(1); });
