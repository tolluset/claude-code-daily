# Claude Code 플러그인 조사 결과

> 조사일: 2026-01-19

## 공식 문서 출처

- [Create plugins - Claude Code Docs](https://code.claude.com/docs/en/plugins)
- [Hooks reference](https://code.claude.com/docs/en/hooks)
- [GitHub - plugins/README.md](https://github.com/anthropics/claude-code/blob/main/plugins/README.md)

## 플러그인 설치 방법

### 1. 개발/테스트용 (임시)

```bash
claude --plugin-dir ./my-plugin
```

여러 플러그인 동시 로드:
```bash
claude --plugin-dir ./plugin-one --plugin-dir ./plugin-two
```

### 2. 영구 설치

`~/.claude/settings.json`:
```json
{
  "pluginDirectories": [
    "/path/to/my-plugin"
  ]
}
```

### 3. 마켓플레이스 (공식 배포)

```bash
/plugin marketplace add user-or-org/repo-name
```

## 플러그인 디렉토리 구조

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json          # 필수: 플러그인 메타데이터
├── commands/                # 슬래시 커맨드 (선택)
├── agents/                  # 커스텀 에이전트 (선택)
├── skills/                  # 에이전트 스킬 (선택)
├── hooks/
│   ├── hooks.json           # 훅 설정 (선택)
│   └── scripts/             # 훅 스크립트
├── .mcp.json               # MCP 서버 설정 (선택)
└── README.md
```

**중요**: `commands/`, `agents/`, `skills/`, `hooks/`는 **플러그인 루트**에 있어야 함.
`.claude-plugin/` 안에 넣으면 안 됨!

## plugin.json 형식

```json
{
  "name": "plugin-name",
  "description": "플러그인 설명",
  "version": "1.0.0",
  "author": {
    "name": "Author Name"
  }
}
```

## hooks.json 형식

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          {
            "type": "command",
            "command": "bash $CLAUDE_PLUGIN_ROOT/hooks/scripts/my-script.sh",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

## 지원 Hook 이벤트

| 이벤트 | 설명 | Matcher |
|--------|------|---------|
| `SessionStart` | 세션 시작 | startup/resume/clear/compact |
| `SessionEnd` | 세션 종료 | - |
| `UserPromptSubmit` | 프롬프트 제출 | - |
| `Stop` | 응답 완료 | - |
| `PreToolUse` | 도구 호출 전 | 도구명 |
| `PostToolUse` | 도구 호출 후 | 도구명 |
| `Notification` | 알림 전송 | 알림 타입 |

## stdin으로 전달되는 Context

### 공통 필드

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/working/directory",
  "permission_mode": "default",
  "hook_event_name": "EventName"
}
```

### SessionStart

```json
{
  "source": "startup|resume|clear|compact"
}
```

### UserPromptSubmit

```json
{
  "prompt": "사용자가 입력한 프롬프트"
}
```

### PreToolUse/PostToolUse

```json
{
  "tool_name": "Bash",
  "tool_input": { ... },
  "tool_use_id": "toolu_xxx"
}
```

## Hook 출력 형식

### 간단한 방식 (Exit Code)

| Exit Code | 의미 |
|-----------|------|
| 0 | 성공 (stdout 표시) |
| 2 | 차단 (stderr만 표시) |
| 1, 3+ | 오류 (stderr만 표시) |

### 고급 방식 (JSON, exit 0)

```json
{
  "continue": true,
  "suppressOutput": false,
  "systemMessage": "경고 메시지"
}
```

## 환경 변수

- `$CLAUDE_PLUGIN_ROOT`: 플러그인 디렉토리 경로
- `$CLAUDE_PROJECT_DIR`: 현재 프로젝트 디렉토리

## 수정 내역 (2026-01-19)

### 변경 전 (잘못된 구조)
```
ccd-plugin/
├── settings.json  ← 잘못된 위치
└── hooks/scripts/
```

### 변경 후 (올바른 구조)
```
ccd-plugin/
├── hooks/
│   ├── hooks.json  ← 올바른 위치
│   └── scripts/
```
