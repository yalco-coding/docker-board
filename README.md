# docker-board 1.0 — GitHub 준비용 소스

05-05 제공 MySQL 게시판의 소스·Dockerfile·잠금 파일·가상 초기 자료를 그대로 사용합니다. Git 제외 규칙과 비밀값 없는 설정 예시를 추가했습니다. 운영 서버의 디렉터리 전체나 DB 백업을 복사한 자료가 아닙니다.

ZIP 안 docker-board 폴더의 **내용**을 본인 실습 저장소 루트에 둡니다. Dockerfile, package.json, package-lock.json, src/, public/, scripts/, config/, data/, .gitignore, .dockerignore, .env.example을 포함합니다. 기존 같은 파일이 있으면 내용을 비교하고 본인 작업을 덮어쓰지 마세요. 저장소 이름은 docker-board, 기본 브랜치는 main을 강의 기준으로 사용합니다. 실제 저장소 주소는 본인 계정의 주소입니다.

Git·GitHub 사용법은 별도 Git & GitHub 강의를 참고하세요. 이 자료 자체는 저장소 생성·commit·push를 수행하지 않습니다. GitHub에서 기본 브랜치의 파일들이 보이고 실제 .env·비밀번호·토큰·개인키·백업이 없는 상태까지 준비합니다. 이미 추적·게시한 비밀값은 .gitignore 추가만으로 제거되지 않습니다.

.env.example은 항목을 보여주는 예시이며 비밀번호는 교체용 문자열입니다. 실제 .env는 올리지 않습니다. data/notes.json은 가상의 초기 게시글 3건이며 운영 DB의 사용자 자료가 아닙니다. DB 실행·이미지 빌드·GHCR 인증과 게시 실습은 관련 차시에서 진행합니다. 현재 서버·컨테이너·운영 볼륨은 변경하지 마세요.

앱 구성: Node.js ES modules, Express, MySQL, esbuild. 기존 Dockerfile로 npm ci → npm run build → npm ci --omit=dev 후 실행하는 다단계 이미지입니다. 실행에는 별도로 준비한 DB와 DB_HOST/DB_NAME/DB_USER/DB_PASSWORD 설정이 필요합니다. .env 파일은 앱에서 자동 로딩하지 않으므로 기존 Compose의 env_file 또는 컨테이너 환경변수 전달을 사용합니다.
