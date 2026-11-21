#!/usr/bin/env python3
"""ApuDa 첫 30일 PDF 자동 QC.
사용: python3 -I tools/qc_pdf.py <pdf> <권코드> [출력폴더]
출력: <출력폴더>/<코드>_qc.md (지표), <코드>_sheet_NN.jpg (만화 컷 검수용 접촉 시트)
판정 기준(총괄작업지시서 2-5): 판본 표기 1종 · HTML 태그 0 · 쪽번호 불일치 0 · 그림 재사용 0
"""
import sys, re, io, os, hashlib, collections
import pypdf
from PIL import Image, ImageDraw, ImageFont

pdf, code = sys.argv[1], sys.argv[2]
out = sys.argv[3] if len(sys.argv) > 3 else "qc_out"
os.makedirs(out, exist_ok=True)
r = pypdf.PdfReader(pdf)
N = len(r.pages)

vers = collections.Counter(); tags = []; pg_mis = []; ep_pages = []
imgs = []  # (page, idx, Image)
for i, p in enumerate(r.pages, 1):
    t = p.extract_text() or ""
    for m in re.findall(r"\bv\d+(?:\.\d+)*\b", t):
        vers[m] += 1
    if re.search(r"</?(b|i|br|span|strong|div|p)\b[^>]*>", t):
        tags.append(i)
    words = t.strip().split()
    if words and words[-1].isdigit():
        n = int(words[-1])
        if abs(n - i) > 1 and n < N + 5:
            pg_mis.append((i, n))
    if re.search(r"EP\s?\d\d", t[:200]):
        ep_pages.append(i)
    try:
        for j, im in enumerate(p.images):
            try:
                img = Image.open(io.BytesIO(im.data)).convert("RGB")
            except Exception:
                continue
            if img.width >= 200:
                imgs.append((i, j, img))
    except Exception:
        pass

# 재사용 탐지: 완전 동일 + 유사(평균 해시)
def ahash(img):
    g = img.convert("L").resize((16, 16)); px = list(g.getdata()); m = sum(px) / 256
    return [1 if x > m else 0 for x in px]
seen = {}; exact = []; hs = []
for (pg, j, img) in imgs:
    d = hashlib.md5(img.tobytes()).hexdigest()
    if d in seen and img.width >= 500:  # 작은 장식 아이콘 반복은 제외
        exact.append((pg, seen[d]))
    elif d in seen:
        continue
    else:
        seen[d] = pg; hs.append((pg, j, img, ahash(img)))
near = []
for a in range(len(hs)):
    for b in range(a + 1, len(hs)):
        dist = sum(x != y for x, y in zip(hs[a][3], hs[b][3]))
        if dist < 30 and hs[a][0] != hs[b][0]:
            near.append((hs[a][0], hs[b][0], dist))
lowres = [(pg, img.size) for (pg, j, img, h) in hs if min(img.size) < 600]

# 접촉 시트 (고유 그림만, 9장/시트)
try:
    font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", 22, index=1)
except Exception:
    font = ImageFont.load_default()
W = 520
for s in range(0, len(hs), 9):
    sh = Image.new("RGB", (W * 3, W * 3), "white"); dr = ImageDraw.Draw(sh)
    for k, (pg, j, img, h) in enumerate(hs[s:s + 9]):
        x = (k % 3) * W; y = (k // 3) * W
        im = img.copy(); im.thumbnail((W - 10, W - 40)); sh.paste(im, (x + 5, y + 35))
        dr.rectangle([x, y, x + W, y + 32], fill="black")
        dr.text((x + 6, y + 3), f"#{s+k:03d} p{pg} img{j}", fill="yellow", font=font)
    sh.save(f"{out}/{code}_sheet_{s//9:02d}.jpg", quality=85)

ok = lambda c: "✅" if c else "❌"
rep = [f"# {code} 자동 QC — {os.path.basename(pdf)}", "",
       f"- 총 쪽수: {N}", f"- 만화(EP) 표기 쪽: {len(ep_pages)}",
       f"- 그림: 배치 {len(imgs)} / 고유 {len(hs)}", "",
       "| 검사 | 결과 | 판정 |", "|---|---|---|",
       f"| 판본 표기 종류 | {len(vers)}종 {dict(vers.most_common(6))} | {ok(len(vers) <= 1)} |",
       f"| HTML 태그 노출 | {tags[:20]} | {ok(not tags)} |",
       f"| 쪽번호 불일치(±1 초과) | {len(pg_mis)}쪽 {pg_mis[:10]} | {ok(not pg_mis)} |",
       f"| 그림 완전 재사용 | {len(exact)}건 {exact[:10]} | {ok(not exact)} |",
       f"| 그림 유사 재사용 | {len(near)}건 {near[:10]} | {ok(not near)} |",
       f"| 저해상도 그림(<600px) | {len(lowres)}건 {lowres[:10]} | {ok(not lowres)} |",
       "", f"접촉 시트: {code}_sheet_00.jpg ~ (눈으로 검수: 화풍 이탈·아이콘 대체·인물 불일치·장면 오류·이미지 속 글자)"]
open(f"{out}/{code}_qc.md", "w", encoding="utf-8").write("\n".join(rep))
print("\n".join(rep))
