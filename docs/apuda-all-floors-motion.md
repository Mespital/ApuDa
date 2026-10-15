# ApuDa 전 층 인물·모니터 모션

적용 범위: 1~5층에 보행 → 멈춤 → 착석 → 앉아서 대기 → 기립 → 퇴장 동작을 추가한다. 기존 건물 이미지, 9명 인물의 작은 동작, 옥상 간판, 층별 카메라 진입과 자료 창은 유지한다.

## 인물

- 기존 6프레임 보행 이미지와 새 4프레임 착석 이미지를 연결한다.
- 각 층에 의자와 인물 레이어를 하나씩 배치한다. 전체 동작은 층마다 22~26초 주기와 서로 다른 시작 지연을 사용한다.
- 상세 창·숨겨진 탭에서는 모든 보행과 착석을 정지한다. 모션 줄이기/데이터 절약 설정에서는 새 이미지 요청을 생략한다.
- 파일: `public-site/assets/image/apuda-sit-cycle-v1.png` (1774×887, RGBA, 756305 bytes). 기본 image_gen 도구로 생성한 알파 PNG를 그대로 사용한다.

최종 이미지 프롬프트:

> Use case: stylized-concept. Asset: precise 4-frame transparent CSS sprite sheet for a person sitting down. Image 1 is an IDENTITY AND STYLE REFERENCE ONLY, a six-frame walking doctor. Create a NEW transparent sprite sheet of the EXACT SAME East Asian male doctor, short black hair, white jacket, pale-blue shirt, navy trousers and black shoes, strict RIGHT-FACING PROFILE. Exactly FOUR equally wide tiles in ONE horizontal row; total canvas aspect ratio exactly 2:1, so each tile is 1:2. No gutters, labels or grid. All tiles have the same world ground line at 92% of tile height and same hip horizontal position at 42% of tile width. All four poses must remain ENTIRELY inside their own tile, including knees and feet. Pose 1: standing naturally, feet together, head at 8% height, hands relaxed. Pose 2: knees bending, torso leaning slightly forward, lowering toward an invisible chair. Pose 3: hips lower almost seated, knees bent further, hands move forward toward thighs. Pose 4: completely seated UPRIGHT on an INVISIBLE chair facing right, thighs horizontal, knees at about 74% height, lower legs vertical, feet on the same ground line, head at about 29% height, hips at 64% height and 42% width. Head and hip progressively lower from tiles 1 to 4, anatomically natural motion. The person should look like the reference in all four poses, with exactly the same scale and clothing. Soft warm architectural-visualization lighting, realistic human proportions. IMPORTANT: draw the person ONLY, absolutely NO chair, no desk or other furniture, no floor, no shadow on a floor, no motion trails, no duplicate limbs. The chair will be supplied separately in the application. Preserve truly transparent alpha around all four isolated full-body poses; no white background or checkerboard. Render four poses only, in precise equal-width cells, with consistent profile and ground baseline.

## 모니터

- `public-site/assets/video/apuda-monitor-atlas-98ff1ff3beaa.mp4`: 24초, H.264, 1600×180, 12fps, 음성 없음, 728768 bytes.
- 기존 암종별 책자 표지 12종으로 제작한 안내 몽타주다. 유튜브 원본에서 추출한 영상은 아니다.
- 재생기 1개가 320×180 타일 5개를 각 층의 캔버스로 전송한다. 화면은 4초씩 시차를 두어 서로 다른 암종을 보여준다.
- 모니터 앞의 인물이 가려지지 않도록 실루엣 마스크를 적용한다.
- 모니터를 누르면 당시 표시 중인 암종의 기존 ApuDa 유튜브 영상이 새 창에서 열린다. 담도암 표지는 기존에 제공된 담관암 영상으로 연결한다.
- 자동재생 실패 시 원래 모니터 이미지를 유지한다. 상세 창과 숨겨진 탭에서는 디코딩·그리기 콜백을 정지한다. 모션 줄이기와 데이터 절약 설정은 영상 요청을 생략한다.

## 검증

- 인물 5개 층의 보행·착석 레이어, 간판 문구, 초기 점등 순서.
- 모니터 캔버스 5개/재생기 1개, 12암종 링크 매핑, 영상 규격 및 무음.
- 탭 숨김/재개, 상세 창 정지/재개, 오래된 재생 약속과 프레임 콜백 취소, 자동재생 거절, RAF 대체 경로.
- 기존 상세 자료 내용과 층 카메라 전환 코드 유지.

테스트: `node tools/tests/apuda-building-life.cjs`, `node tools/tests/apuda-building-monitors.cjs`.
