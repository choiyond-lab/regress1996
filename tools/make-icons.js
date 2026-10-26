// 홈 화면 설치용 앱 아이콘(PNG)을 그린다. 실행: node tools/make-icons.js
// 짙은 남색 바탕에 금색 시계와 거꾸로 도는 화살표 (회귀). 외부 라이브러리 없이 픽셀을 직접 칠한다
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'assets', 'icon');
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = b => { let c = -1; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function png(w, h, px) {
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
// 선분까지의 거리
function segDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(px - ax - vx * t, py - ay - vy * t);
}
function draw(S, round) {
  const px = Buffer.alloc(S * S * 4), c = S / 2;
  const R = S * 0.30, T = S * 0.045;                       // 시계 테 반지름·두께
  const gapA = -Math.PI * 0.42, gapB = -Math.PI * 0.18;    // 테가 끊긴 곳 (오른쪽 위)
  const ax = c + R * Math.cos(gapB), ay = c + R * Math.sin(gapB);   // 화살촉 자리: 끊긴 곳의 오른쪽 끝
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4, dx = x + 0.5 - c, dy = y + 0.5 - c, r = Math.hypot(dx, dy);
    // 바탕: 가운데가 밝은 남색. 둥근 아이콘이면 모서리를 둥글게 비운다
    const g = Math.min(1, r / (S * 0.7));
    let col = [Math.round(43 - 29 * g), Math.round(58 - 38 * g), Math.round(115 - 79 * g)], a = 1;
    if (round) { const k = S * 0.22, qx = Math.max(Math.abs(dx) - (c - k), 0), qy = Math.max(Math.abs(dy) - (c - k), 0); a = Math.max(0, Math.min(1, k - Math.hypot(qx, qy) + 0.5)); }
    // 금색 도형의 거리 (픽셀)
    const ang = Math.atan2(dy, dx);
    const inGap = ang > gapA && ang < gapB;
    let d = inGap ? Infinity : Math.abs(r - R) - T / 2;                                // 테
    // 화살촉: 테 끝에서 시계 반대 방향을 가리키는 삼각형
    const tx = Math.sin(gapB), ty = -Math.cos(gapB), nx = Math.cos(gapB), ny = Math.sin(gapB);
    const hx = ax + tx * S * 0.07, hy = ay + ty * S * 0.07;                         // 촉 끝 (시계 반대 방향)
    const bx1 = ax + nx * S * 0.06, by1 = ay + ny * S * 0.06, bx2 = ax - nx * S * 0.06, by2 = ay - ny * S * 0.06;
    const inTri = (() => { const s = (x1, y1, x2, y2) => (x + 0.5 - x2) * (y1 - y2) - (x1 - x2) * (y + 0.5 - y2); const d1 = s(hx, hy, bx1, by1), d2 = s(bx1, by1, bx2, by2), d3 = s(bx2, by2, hx, hy); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); })();
    if (inTri) d = Math.min(d, -1);
    else d = Math.min(d, Math.min(segDist(x + 0.5, y + 0.5, hx, hy, bx1, by1), segDist(x + 0.5, y + 0.5, bx1, by1, bx2, by2), segDist(x + 0.5, y + 0.5, bx2, by2, hx, hy)) - 0.5);
    // 시곗바늘 (10시 · 12시) 과 가운데 점
    d = Math.min(d, segDist(x + 0.5, y + 0.5, c, c, c - S * 0.12, c - S * 0.07) - S * 0.022);
    d = Math.min(d, segDist(x + 0.5, y + 0.5, c, c, c, c - S * 0.19) - S * 0.018);
    d = Math.min(d, r - S * 0.035);
    const cov = Math.max(0, Math.min(1, 0.5 - d));
    const gold = [240, 180, 60];
    col = col.map((v, k) => Math.round(v * (1 - cov) + gold[k] * cov));
    px[i] = col[0]; px[i + 1] = col[1]; px[i + 2] = col[2]; px[i + 3] = Math.round(a * 255);
  }
  return png(S, S, px);
}

fs.mkdirSync(OUT, { recursive: true });
for (const [name, size, round] of [['icon-192.png', 192, true], ['icon-512.png', 512, true], ['icon-maskable-512.png', 512, false], ['apple-touch-icon.png', 180, false]]) {
  const buf = draw(size, round);
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log(name, size + 'px', (buf.length / 1024).toFixed(0) + 'KB');
}
