# ApuDa 건물 모션 — 2026-10-15

- 옥상 간판: `ApuDa`와 `아프지만, 다행이다.`를 SVG 텍스트로 상시 표시. 다섯 글자는 0.16초 간격으로 최대 2.5px 떠오르며 6.8초 주기로 빛남. 한글은 고정.
- 원래 9명의 작은 동작은 기존 6초 영상으로 유지. 1층·4층에는 투명 보행 스프라이트를 추가. 6프레임/0.96초 보행 주기, 이동 경로는 각각 19초·16초 주기.
- 층 선택: 원본 이미지의 실측 좌표로 클릭 영역을 계산. 0.72초 카메라 확대 도중 0.58초부터 상세 창을 0.36초에 걸쳐 표시. 닫으면 0.55초에 원위치.
- 연속 선택/진입 도중 닫기: 이전 타임라인과 콜백을 취소. 화면 크기 변경은 열린 창을 다시 렌더하지 않고 위치만 계산.
- 모션 줄이기 설정: 확대·보행·글자 움직임 생략. 데이터 절약 설정: 보행 이미지와 주변 영상을 요청하지 않음. 탭이 숨겨지거나 상세 창을 읽을 때 주변 모션 정지.
- 기존 암종별 자료, 유튜브 링크, 다운로드 동작 유지.

## 생성 이미지

파일: `public-site/assets/image/apuda-walk-cycle-v1.png` (2,172 × 724, RGBA). 기본 이미지 생성 도구(image_gen) 사용. PNG를 수정하거나 배경을 다시 합성하지 않고 생성된 알파 채널을 그대로 사용.

최종 프롬프트:

> Use case: stylized-concept. Asset type: production CSS animation SPRITE SHEET with alpha transparency. The attached image is a STYLE REFERENCE ONLY for the small realistic 3D architectural-visualization people. Do not reproduce any building or background. Make ONE landscape transparent PNG sprite sheet with exactly SIX equal-width columns in ONE horizontal row. Total canvas aspect ratio 2:1. Each tile is 1:3, all six tiles fill the entire image height. NO gutters and NO gridlines. In each tile render the SAME small East Asian adult hospital staff member in a crisp ivory-white coat over pale-blue shirt, navy trousers and dark shoes, short dark hair, no bag or equipment. Full body in strict right-facing profile, viewed from slightly above to match an architectural dollhouse, restrained realistic 3D rendering, warm soft light from upper left. Exactly ONE person per tile, centered at exactly the horizontal center of that tile, soles aligned to the SAME baseline 92% of image height, head at 8% of image height. Keep head/body scale and horizontal center identical in every tile. Six poses show a seamless walk cycle progressing through right-leg-forward contact, down, passing, left-leg-forward contact, down, passing. Natural alternating bent elbows and legs, subtle differences in the walk cycle; do not move the character across the tiles. All complete bodies must fit comfortably inside their own tile with transparent margin. Anatomically correct, normal hands, one head two arms two legs, natural unexaggerated gait. Genuinely transparent alpha background with no white rectangle, checkerboard, shadows on a floor, props, scenery, text, captions, frame numbers, outlines, or watermark. Render only the six poses of the SAME person, clearly separated at exact equal tile centers, for use as a tiny walking person inside the reference building.

실제 생성 결과는 3:1 캔버스의 6개 동일 너비 타일이며, 런타임의 스프라이트 좌표는 실제 크기에 맞춤.
