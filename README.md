# 🟡 Kakao API Everything

카카오 디벨로퍼스의 주요 API를 브라우저에서 바로 테스트하고, 그대로 배포해서 실제 도메인 환경에서 동작을 검증할 수 있는 **정적 웹 플레이그라운드**입니다.

빌드 과정 없이 HTML/CSS/JS 3개 파일로 구성되어 GitHub Pages, Netlify, Vercel, Cloudflare Pages 어디든 바로 배포됩니다.

## 지원 기능

| 탭 | API | 내용 |
|---|---|---|
| ⚙️ 설정 | Kakao JS SDK v2 | JavaScript 키 입력 → SDK 초기화 (키는 localStorage에만 저장) |
| 🔐 카카오 로그인 | Kakao Login | 로그인(authorize), 추가 동의(scope), 사용자 정보/토큰 조회, 로그아웃, 연결 끊기 |
| 📤 카카오톡 공유 | Kakao Share | Feed / List / Location / Commerce / Text 템플릿 공유 |
| 🗺️ 카카오맵 | Kakao Maps JS API | 지도 표시, 키워드 장소 검색, 주소→좌표 지오코딩, 마커, 내 위치 |
| 📮 우편번호 | Daum Postcode | 키 발급 없이 사용하는 주소 검색 위젯 |
| 💬 채널 | Kakao Channel | 채널 추가, 1:1 채팅 |
| 🔧 REST API | Kakao REST | 로컬(장소/주소/좌표), 나에게 메시지 보내기, 사용자 정보, 친구 목록 — 실행 가능한 curl 명령 생성 |
| 🚀 배포 가이드 | — | GitHub Pages 배포 및 카카오 플랫폼 도메인 등록 절차 |

## 시작하기

### 1. 카카오 앱 준비
1. [카카오 디벨로퍼스](https://developers.kakao.com/console/app)에서 애플리케이션 생성
2. **앱 설정 → 플랫폼 → Web**에 사용할 도메인 등록
   - 로컬 테스트: `http://localhost:8000`
   - 배포: `https://<계정>.github.io`
3. **제품 설정 → 카카오 로그인** 활성화 + Redirect URI 등록 (예: `https://<계정>.github.io/kakaoapi_everything/`)
4. 동의항목(닉네임, 프로필 사진 등) 설정

### 2. 로컬 실행
```bash
python3 -m http.server 8000
# http://localhost:8000 접속
```

### 3. 배포 (CI/CD 자동 배포)
GitHub Actions 파이프라인(`.github/workflows/ci-cd.yml`)이 포함되어 있습니다.

- **CI**: PR/푸시 시 JS 문법 검사, HTML 필수 요소 검사, 키 노출 검사 자동 실행
- **CD**: `main` 브랜치에서 GitHub Pages가 직접 서빙 (머지하면 자동 갱신)

최초 1회만 저장소 **Settings → Pages**에서 Source를 **Deploy from a branch**,
브랜치를 **main / (root)**로 설정하세요. 이후에는 main에 머지될 때마다 자동 반영됩니다.

배포 후:
1. 배포 URL 도메인을 카카오 앱의 플랫폼(Web)과 Redirect URI에 등록
2. 배포된 페이지의 **설정** 탭에서 JavaScript 키 입력 후 테스트

## 주의사항

- **키 보안**: JavaScript 키는 도메인 제한으로 보호되지만, REST API 키와 액세스 토큰은 절대 프론트엔드 코드에 넣지 마세요. 이 앱은 키를 서버로 전송하지 않고 브라우저 localStorage에만 저장합니다.
- **CORS**: 카카오 REST API는 브라우저 직접 호출을 허용하지 않는 경우가 많아, REST 탭은 터미널에서 실행할 curl 명령을 생성하는 방식입니다.
- **로그인 토큰 교환**: JS SDK v2의 `authorize()`는 인가 코드를 반환하며, 토큰 교환은 서버가 필요합니다. 테스트 절차는 로그인 탭에 안내되어 있습니다.

## 파일 구성

```
index.html  # UI (탭 8개)
app.js      # 모든 API 호출 로직
style.css   # 스타일
```
