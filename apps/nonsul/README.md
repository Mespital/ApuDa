# 논술 루틴 — apuda.app/nonsul/

서초고 고1의 기초 논술 학습을 위한 React 정적 앱입니다. 12개 자체 제작 문제, 개요 작성, 타이머, 답안 재작성, 근거 표현 점검, 학습 기록 및 JSON 백업을 제공합니다.

## 수정과 검증

```sh
cd apps/nonsul
npm ci
npm run check
node scripts/check-app.mjs
npm run build
cd ../../public-site
npm ci
node scripts/check-nonsul.mjs
```

빌드 결과는 `public-site/nonsul/`에 생성됩니다. 배포 환경에서 프런트엔드를 다시 빌드하지 않아도 되도록 결과물을 소스와 함께 관리합니다. 문제 또는 기록 스키마를 수정하면 `npm run build` 후 아래 명령으로 서버 검증 스키마도 갱신하세요.

```sh
node scripts/sync-schema.mjs
```

## Netlify 배포

- 기존 ApuDa 프로젝트의 게시 디렉터리 `public-site`와 해당 `netlify.toml`을 사용합니다. 기존 홈페이지·프록시·함수의 설정을 유지합니다.
- `/nonsul/`는 해시 경로를 사용하는 정적 앱입니다. 기본 저장은 브라우저 localStorage이며, 실제 계정 저장 성공과 구분해서 표시합니다. 브라우저 데이터 삭제 시 사라질 수 있으므로 ‘나의 기록 → 기록 내보내기’로 백업할 수 있습니다.
- `public-site/package.json`의 잠금 파일로 서버 의존성을 설치하고, `public-site/netlify/functions`의 두 함수를 함께 배포합니다. Node 22.13 이상이 필요합니다.
- 계정 동기화는 Netlify Identity가 활성화되어 있고 기존 사용자가 등록되어 있어야 사용할 수 있습니다. 앱에서 회원가입·초대·이메일 발송은 실행하지 않습니다. 관리자 계정 설정 후 로그인·로그아웃과 실제 계정 저장을 확인해야 합니다.
- Netlify Database의 연결과 `netlify/database/migrations`의 마이그레이션이 적용되어야 계정 기록이 저장됩니다. 새 DB의 실제 배포 연결 여부는 운영 환경에서 별도로 확인합니다. 설정되지 않으면 기기 저장과 JSON 백업을 계속 사용할 수 있습니다.
- 사용자 ID는 인증 컨텍스트에서만 가져옵니다. 저장 시 revision을 비교하여 다른 기기의 새 기록을 덮어쓰지 않습니다. 409 응답에서는 사용할 기록을 직접 고릅니다.
- 서비스워커는 `/nonsul/` 범위만 제어하고 개인정보 API 응답은 캐시하지 않습니다.

기존 ChatGPT Sites 앱의 학습 기록은 자동 이전되지 않습니다. 이전 앱에서 내보낸 JSON을 이 앱의 ‘나의 기록 → 백업 불러오기’로 옮길 수 있습니다. 실제 계정·DB 테스트 전까지는 계정 동기화가 운영 검증되었다고 표시하지 않습니다.

## 학습 피드백의 범위

피드백은 글자 수와 제시문 관련 표현을 확인하는 체크리스트입니다. AI 평가·교사 채점·합격 예측이 아닙니다. 목표 대학과 등급 합 시나리오는 개인 학습 계획이며, 실제 전형 기준은 해당 연도 공식 모집요강을 확인해야 합니다.
