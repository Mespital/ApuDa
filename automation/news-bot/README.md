# ApuDa News Bot

ApuDa.app 뉴스 자동화용 VPS 수집기입니다.

## 역할

1. 데일리팜, 의학신문, 메디파나뉴스, 약사공론 후보 기사 탐색
2. 원문 페이지에서 게시일시를 직접 확인
3. 전일 09:00 초과 ~ 당일 09:00 미만(KST)만 통과
4. 중복 이슈 통합
5. 정책·급여·허가·임상·사업개발 중심 중요도 점수화
6. 항암 관련 기사 자동 태깅
7. public-site/news/data/YYYY-MM-DD.json 및 latest.json 생성

## 안전 규칙

- 검색엔진/RSS 시간만으로 게시시각을 확정하지 않습니다.
- 원문에서 정확한 게시시각을 확인하지 못한 기사는 TOP 후보에서 제외합니다.
- 원문 URL과 썸네일(og:image)을 함께 저장합니다.
- 기사 전문을 복제하지 않고 제목·메타데이터·짧은 설명만 사용합니다.

## 로컬/VPS 실행

```bash
cd /srv/apuda-news
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python news_bot.py --repo-root /srv/apuda-repo
```

## Systemd

`install-vps.sh`는 매일 09:03 KST에 실행되는 systemd timer를 설치합니다.
실행 후 생성된 파일을 GitHub로 올리는 단계는 `publish.sh`가 담당합니다.

필요 환경변수:

- `APUDA_REPO_DIR=/srv/apuda-repo`
- `APUDA_NEWS_BRANCH=main`
- `APUDA_GITHUB_TOKEN` : fine-grained token, Contents read/write 권한
- `APUDA_GITHUB_REPO=Mespital/ApuDa`

토큰은 코드나 Git 저장소에 저장하지 않습니다.
