// 인물 일러스트를 상위 프로젝트(../assets/portrait)에서 가져와 절반 크기로 줄여 저장한다.
// 모바일에서 장당 2MB 를 받지 않도록 1024×1536 → 512×768 로 줄인다. 외부 라이브러리 없이 PNG 를 직접 읽고 쓴다.
// 실행: node tools/prep-portraits.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SRC = process.env.PORTRAIT_SRC || path.join(__dirname, '..', '..', 'assets', 'portrait');
const DST = path.join(__dirname, '..', 'assets', 'portrait');
const PLAYER = ['h1021.png', 'h1037.png'];   // 주인공 20대·30대 (art.js 의 playerFigure)

// characters.js 에서 쓰는 파일만 고른다
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'characters.js'), 'utf8');
const CHARS = new Function(src + ';return CHARS')();
const files = [...new Set([...CHARS.map(c => c.asset).filter(Boolean), ...PLAYER])];

// ---- PNG ----
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
function crc32(buf) { let c = -1; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function paeth(a, b, c) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }

function decode(buf) {
  let p = 8, w, h, depth, type, inter; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), t = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; type = d[9]; inter = d[12]; }
    else if (t === 'IDAT') idat.push(d);
    else if (t === 'IEND') break;
    p += 12 + len;
  }
  if (depth !== 8 || inter !== 0 || (type !== 6 && type !== 2)) throw new Error(`지원하지 않는 PNG (깊이 ${depth}, 색 ${type}, 인터레이스 ${inter})`);
  const bpp = type === 6 ? 4 : 3, stride = w * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      cur[x] = (row[x] + (f === 0 ? 0 : f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : paeth(a, b, c))) & 255;
    }
    for (let x = 0; x < w; x++) {
      out[(y * w + x) * 4] = cur[x * bpp]; out[(y * w + x) * 4 + 1] = cur[x * bpp + 1]; out[(y * w + x) * 4 + 2] = cur[x * bpp + 2];
      out[(y * w + x) * 4 + 3] = bpp === 4 ? cur[x * bpp + 3] : 255;
    }
    [prev, cur] = [cur, prev];
  }
  return { w, h, px: out };
}
// 2×2 평균 (투명도를 곱해서 섞어야 가장자리가 검게 번지지 않는다)
function half(img) {
  const w = img.w >> 1, h = img.h >> 1, px = Buffer.alloc(w * h * 4), s = img.px;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const i = ((y * 2 + dy) * img.w + x * 2 + dx) * 4, al = s[i + 3];
      r += s[i] * al; g += s[i + 1] * al; b += s[i + 2] * al; a += al;
    }
    const o = (y * w + x) * 4;
    if (a) { px[o] = Math.round(r / a); px[o + 1] = Math.round(g / a); px[o + 2] = Math.round(b / a); }
    px[o + 3] = Math.round(a / 4);
  }
  return { w, h, px };
}
function encode(img) {
  const { w, h, px } = img, stride = w * 4, raw = Buffer.alloc(h * (stride + 1));
  const prev = Buffer.alloc(stride), cand = [Buffer.alloc(stride), Buffer.alloc(stride), Buffer.alloc(stride)];
  for (let y = 0; y < h; y++) {
    const cur = px.subarray(y * stride, (y + 1) * stride);
    let best = 0, bestSum = Infinity;
    [1, 2, 4].forEach((f, k) => {   // 줄마다 Sub·Up·Paeth 중 가장 작게 나오는 필터를 고른다
      let sum = 0;
      for (let x = 0; x < stride; x++) {
        const a = x >= 4 ? cur[x - 4] : 0, b = prev[x], c = x >= 4 ? prev[x - 4] : 0;
        const v = (cur[x] - (f === 1 ? a : f === 2 ? b : paeth(a, b, c))) & 255;
        cand[k][x] = v; sum += v < 128 ? v : 256 - v;
      }
      if (sum < bestSum) { bestSum = sum; best = k; }
    });
    raw[y * (stride + 1)] = [1, 2, 4][best];
    cand[best].copy(raw, y * (stride + 1) + 1);
    cur.copy(prev);
  }
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t, 'ascii'), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

if (!fs.existsSync(SRC)) { console.error('원본 폴더가 없습니다: ' + SRC); process.exit(1); }
fs.mkdirSync(DST, { recursive: true });
let before = 0, after = 0;
for (const f of files) {
  const buf = fs.readFileSync(path.join(SRC, f));
  const out = encode(half(decode(buf)));
  fs.writeFileSync(path.join(DST, f), out);
  before += buf.length; after += out.length;
  console.log(`${f}  ${(buf.length / 1024).toFixed(0)}KB → ${(out.length / 1024).toFixed(0)}KB`);
}
console.log(`${files.length}장 · ${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(1)}MB · ${DST}`);
