# OpenCode Plugin Compatibility Fix - 2026-01-19

**Date**: 2026-01-19  
**Issue**: OpenCode 플러그인이 로드되지 않고 세션이 저장되지 않음  
**Status**: ✅ Resolved

---

## Problem Analysis

### 1. 디렉토리 구조 오류

**Issue**: 플러그인 디렉토리 구조가 OpenCode의 플러그인 로딩 패턴과 일치하지 않음

**Before (Wrong)**:
```
.opencode/
├── package.json
└── plugins/              # ❌ 복수형 - OpenCode가 인식하지 못함
    └── ccd-tracker.ts
```

**After (Correct)**:
```
.opencode/
├── package.json
└── plugin/               # ✅ 단수형 - OpenCode가 자동 로드
    └── ccd-tracker.ts
```

**Root Cause**: OpenCode는 `~/.config/opencode/plugin/*.{js,ts}` 패턴으로 플러그인을 탐색합니다.

---

### 2. 플러그인 설치 누락

**Issue**: 플러그인 파일이 `~/.config/opencode/plugin/`에 설치되지 않음

**Diagnosis**:
```bash
$ ls ~/.config/opencode/plugin/
ls: No such file or directory
```

**Verification**:
```sql
-- 데이터베이스에 OpenCode 세션이 없음
SELECT id, source FROM sessions ORDER BY started_at DESC LIMIT 5;

-- 결과: 모든 세션이 'claude' source
d58dbac0|claude
9ee86fb5|claude
8c4c9363|claude
```

**Solution**: 플러그인 파일 수동 설치
```bash
mkdir -p ~/.config/opencode/plugin/
cp /path/to/ccd/packages/ccd-plugin/.opencode/plugin/ccd-tracker.ts ~/.config/opencode/plugin/
```

---

### 3. 의존성 누락

**Issue**: `~/.config/opencode/package.json`에 `@opencode-ai/plugin` 의존성이 없음

**Before**:
```json
{
  "dependencies": {
    "@opencode-ai/plugin": "1.1.25"
  }
}
```

**Impact**: OpenCode는 이 의존성을 사용하여 플러그인을 로드합니다.

---

### 4. 하드코딩된 경로

**Issue**: 개발 환경 경로가 플러그인에 하드코딩됨

```typescript
// ❌ Bad
const serverPath = '/Users/bh/workspaces/ccd/packages/ccd-server/src/index.ts'
```

**Impact**: 다른 환경에서 작동하지 않음

**Solution**: 설치된 명령어 사용
```typescript
// ✅ Good
await shell.shell('nohup ccd-server > ~/.ccd/server.log 2>&1 &')
```

---

### 5. API 엔드포인트 불일치 (Critical)

**Issue**: 플러그인이 존재하지 않는 엔드포인트를 호출

**Error Message**: `failed to update session memory` (OpenCode UI 표시)

**Root Cause**:
```typescript
// ❌ 플러그인 코드
async function updateSessionSummary(sessionId: string, summary: string): Promise<void> {
  const response = await fetch(`${SERVER_URL}/api/v1/sessions/${sessionId}`, {
    method: 'PUT',  // ❌ 이 엔드포인트는 존재하지 않음
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary })
  })
}
```

**Server Actual Endpoint**:
```typescript
// packages/ccd-server/src/routes/sessions.ts
// ✅ 올바른 엔드포인트
sessions.post('/:id/summary', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ summary?: string }>();
  const session = SessionService.updateSessionSummary(id, body.summary || '');
  return c.json(successResponse(session));
});
```

**Debug Process**:
```bash
# 1. API 테스트
$ curl -X PUT http://localhost:3847/api/v1/sessions/ses_... -H "Content-Type: application/json" -d '{"summary":"test"}'
404 Not Found  # ❌

# 2. 서버 코드 확인
# sessions.ts 라인 87-99 참고

# 3. 올바른 엔드포인트 테스트
$ curl -X POST http://localhost:3847/api/v1/sessions/ses_.../summary -H "Content-Type: application/json" -d '{"summary":"test"}'
{"success":true,...}  # ✅
```

**Solution**:
```typescript
// ✅ 수정된 코드
async function updateSessionSummary(sessionId: string, summary: string): Promise<void> {
  const response = await fetch(`${SERVER_URL}/api/v1/sessions/${sessionId}/summary`, {
    method: 'POST',  // ✅ 올바른 엔드포인트
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary })
  })
}
```

---

## Solution Implementation

### 1. 디렉토리 구조 수정

```bash
# 디렉토리 이름 변경
mv packages/ccd-plugin/.opencode/plugins packages/ccd-plugin/.opencode/plugin
```

### 2. 플러그인 설치

```bash
# 디렉토리 생성
mkdir -p ~/.config/opencode/plugin/

# 플러그인 파일 복사
cp /Users/bh/workspaces/ccd/packages/ccd-plugin/.opencode/plugin/ccd-tracker.ts ~/.config/opencode/plugin/

# package.json 복사 (의존성)
cp /Users/bh/workspaces/ccd/packages/ccd-plugin/.opencode/package.json ~/.config/opencode/
```

### 3. 플러그인 코드 수정

**File**: `packages/ccd-plugin/.opencode/plugin/ccd-tracker.ts`

**Changes**:
1. 하드코딩된 경로 제거
2. API 엔드포인트 수정 (`PUT /sessions/:id` → `POST /sessions/:id/summary`)
3. 타입 캐스팅 개선 (`any` → 구체적인 타입)

### 4. 문서 업데이트

**Files Updated**:
- `packages/ccd-plugin/README.md` - 설치 가이드 수정
- `docs/ARCHITECTURE.md` - 플러그인 경로 수정
- `docs/STATUS.md` - 상태 업데이트

---

## Verification

### 1. 플러그인 로딩 확인

```bash
$ ls ~/.config/opencode/plugin/
ccd-tracker.ts  # ✅ 플러그인 파일 존재
```

### 2. API 엔드포인트 테스트

```bash
$ curl -X POST http://localhost:3847/api/v1/sessions/ses_.../summary \
  -H "Content-Type: application/json" \
  -d '{"summary":"test"}'

{"success":true,"data":{"summary":"test",...}}  # ✅
```

### 3. 데이터베이스 확인

```sql
-- OpenCode 세션 생성 확인
SELECT id, source, summary FROM sessions WHERE source = 'opencode';

-- 결과: OpenCode 세션이 저장됨
ses_42c9e193...|opencode|test summary updated  # ✅
```

### 4. OpenCode 세션 테스트

1. OpenCode 재시작
2. 새 세션 시작
3. 메시지 전송
4. 데이터베이스 확인

**Expected Result**:
- ✅ 세션이 `source='opencode'`로 저장됨
- ✅ 메시지가 실시간으로 저장됨
- ✅ 첫 번째 사용자 메시지가 요약으로 저장됨
- ✅ 토큰 사용량이 추적됨

---

## Key Insights

### 1. 플러그인 디스커버리 패턴

OpenCode는 단수형 `plugin/` 디렉토리를 사용합니다:
- ✅ `~/.config/opencode/plugin/*.ts`
- ❌ `~/.config/opencode/plugins/*.ts`

### 2. 의존성 관리

`~/.config/opencode/package.json`은 필수적입니다:
- OpenCode는 이 파일을 사용하여 의존성을 로드합니다
- `@opencode-ai/plugin`이 반드시 필요합니다

### 3. API 엔드포인트 검증

플러그인 개발 시 엔드포인트 확인 필수:
- 서버 소스 코드 확인 (`packages/ccd-server/src/routes/`)
- curl로 테스트
- 문서화된 엔드포인트 사용

### 4. 타입 안전성

`any` 타입 사용은 디버깅을 어렵게 만듭니다:
- ✅ 구체적인 인터페이스 정의
- ✅ 타입 캐스팅 사용 (`unknown` → 구체적 타입)
- ❌ `any` 사용 회피

### 5. 환경 독립성

하드코딩된 경로 사용 회피:
- ✅ 설치된 명령어 사용 (`ccd-server`)
- ✅ 환경 변수 사용
- ❌ 절대 경로 사용 회피

---

## Troubleshooting Guide

### Problem: "failed to update session memory"

**Diagnosis**:
```bash
# 1. 서버 로그 확인
$ tail -f ~/.ccd/server.log

# 2. API 테스트
$ curl -X POST http://localhost:3847/api/v1/sessions/{id}/summary \
  -H "Content-Type: application/json" \
  -d '{"summary":"test"}'

# 3. 플러그인 파일 확인
$ cat ~/.config/opencode/plugin/ccd-tracker.ts | grep "method: 'PUT'"
```

**Solution**: 플러그인 코드의 `method: 'PUT'`를 `method: 'POST'`로 변경하고 엔드포인트를 `/sessions/:id/summary`로 수정

---

### Problem: OpenCode sessions not appearing in dashboard

**Diagnosis**:
```bash
# 1. 플러그인 설치 확인
$ ls ~/.config/opencode/plugin/

# 2. 데이터베이스 확인
$ sqlite3 ~/.ccd/ccd.db "SELECT source FROM sessions GROUP BY source;"

# 3. OpenCode 로그 확인
# OpenCode 콘솔에서 에러 확인
```

**Solution**: 플러그인을 `~/.config/opencode/plugin/`에 설치하고 OpenCode 재시작

---

### Problem: Server not starting from plugin

**Diagnosis**:
```bash
# 1. 서버 수동 시작 테스트
$ ccd-server

# 2. 로그 확인
$ cat ~/.ccd/server.log

# 3. 프로세스 확인
$ ps aux | grep ccd-server
```

**Solution**: `ccd-server` 명령어가 PATH에 있는지 확인하고, 설치되어 있지 않으면 설치

---

## Files Modified

### Modified Files

1. **`packages/ccd-plugin/.opencode/plugin/ccd-tracker.ts`**
   - 하드코딩된 경로 제거
   - API 엔드포인트 수정
   - 타입 캐스팅 개선

2. **`packages/ccd-plugin/.opencode/package.json`**
   - `type: "module"` 추가
   - `@opencode-ai/plugin` 의존성 명시

3. **`packages/ccd-plugin/README.md`**
   - 설치 가이드 수정
   - 트러블슈팅 섹션 추가

4. **`docs/ARCHITECTURE.md`**
   - 플러그인 경로 수정 (`plugins/` → `plugin/`)

5. **`docs/STATUS.md`**
   - OpenCode 플러그인 상태 업데이트

---

## Action Items for Future

### Short-term

- [ ] 플러그인 자동 설치 스크립트 작성
- [ ] API 엔드포인트 검증 도구 추가
- [ ] 타입 정의 파일 분리 (`@opencode-ai/plugin`에서 타입 가져오기)

### Medium-term

- [ ] 플러그인 개발 가이드 작성
- [ ] 테스트 시나리오 작성
- [ ] CI/CD 파이프라인에 플러그인 테스트 추가

### Long-term

- [ ] 플러그인 버전 관리 시스템 구축
- [ ] 플러그인 마켓플레이스 고려
- [ ] 다른 AI 도구 플러그인 지원 확장

---

## References

- **OpenCode Plugin System**: https://deepwiki.com/sst/opencode/7.3-plugin-system
- **OpenCode Installation**: https://deepwiki.com/sst/opencode/1.3-installation-and-setup
- **API Endpoints**: `packages/ccd-server/src/routes/sessions.ts`
- **Plugin Directory**: `packages/ccd-plugin/.opencode/plugin/`

---

**Last Updated**: 2026-01-19  
**Next Review**: 2026-01-20
