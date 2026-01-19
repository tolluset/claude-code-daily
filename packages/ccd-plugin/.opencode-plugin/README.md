# CCD OpenCode Plugin

OpenCode용 플러그인 - 세션, 메시지, 사용 통계 자동 추적

## Features

- **Automatic server startup** - CCD 서버 자동 시작
- **Session tracking** - 세션 시작/종료 기록
- **Message capture** - 모든 사용자/어시스턴트 메시지 저장
- **Tool output logging** - bash 명령 결과 캡처
- **Git integration** - git 브랜치 자동 감지
- **Project metadata** - 프로젝트 이름과 디렉토리 캡처
- **Session summary** - 첫 번째 메시지로 세션 요약 업데이트

## Installation

```bash
# 빌드 및 설치
cd packages/ccd-plugin/.opencode-plugin
bun run install-global
```

또는 수동:
```bash
cd packages/ccd-plugin/.opencode-plugin
bun run build
cp dist/index.js ~/.config/opencode/plugins/ccd.js
```

## How It Works

1. **플러그인 초기화** - CCD 서버 시작 및 로깅 초기화
2. **세션 생성** - 프로젝트 이름, git 브랜치, 작업 디렉토리 캡처
3. **메시지 추적** - 사용자 메시지와 도구 출력 기록
4. **세션 업데이트** - 세션 요약 동기화 및 종료 마크

## Debugging

```bash
# 플러그인 로그 확인
tail -f ~/.ccd/opencode-plugin.log

# CCD 서버 로그 확인
tail -f ~/.ccd/server.log

# 서버 상태 확인
curl http://localhost:3847/api/v1/health

# 최근 세션 조회
sqlite3 ~/.ccd/ccd.db "
  SELECT id, project_name, git_branch, source, summary
  FROM sessions
  WHERE source='opencode'
  ORDER BY started_at DESC LIMIT 5;
"
```

## Development

```bash
cd packages/ccd-plugin/.opencode-plugin
bun run build          # 빌드
bun run dev           # 개발 모드
bun run install-global # 설치
```
