# CCD 배포 가이드

이 문서는 Claude Code Daily (CCD)의 배포 절차와 체크리스트를 제공합니다.

---

## 배포 전 체크리스트

### 1. 코드 품질

- [ ] 모든 테스트 통과 (`pnpm test`)
- [ ] TypeScript 컴파일 에러 없음
- [ ] Lint 에러 없음 (`pnpm lint`)
- [ ] 빌드 성공 (`pnpm build`)

### 2. 버전 관리

- [ ] 모든 패키지 버전 일치
  - `package.json`
  - `packages/*/package.json`
  - `shared/types/package.json`
- [ ] README.md 버전 뱃지 업데이트
- [ ] CHANGELOG.md 업데이트 (배포 날짜 섹션)

### 3. 아티팩트 확인

- [ ] CCD Server 빌드: `packages/ccd-server/dist/index.js`
- [ ] MCP Server 빌드: `packages/ccd-mcp/dist/index.js`
- [ ] Dashboard 빌드: `packages/ccd-dashboard/dist/index.html`
- [ ] Claude Code 플러그인: `packages/ccd-claude-plugin/dist/index.js`
- [ ] OpenCode 플러그인: `packages/ccd-plugin/.opencode-plugin/dist/index.js`
- [ ] 플러그인 아티팩트: `packages/ccd-plugin/scripts/*`, `dashboard/dist/*`

### 4. 설치 스크립트

- [ ] `install-opencode.sh` 최신 버전
- [ ] `install-claude.sh` 최신 버전
- [ ] 실행 권한 설정 (`chmod +x install-*.sh`)

### 5. 기능 테스트

- [ ] CCD Server 정상 시작
- [ ] Health endpoint 작동 (`GET /health`)
- [ ] 세션 생성 API 작동 (`POST /api/v1/sessions`)
- [ ] 통계 API 작동 (`GET /api/v1/stats/today`)
- [ ] Dashboard 로드 확인 (`GET /`)
- [ ] 설치 스크립트 테스트 (`pnpm run test:plugin`)

---

## 배포 절차

### Step 1: 개발 브랜치에서 작업

```bash
git checkout -b release/v0.X.X
```

### Step 2: 버전 업데이트

모든 `package.json`의 버전 업데이트:

```bash
# 방법 1: 수동으로 각 파일 수정
vim package.json
vim packages/ccd-server/package.json
vim packages/ccd-dashboard/package.json
# ... 등

# 방법 2: 스크립트 사용 (추천)
find . -name "package.json" -not -path "*/node_modules/*" -exec sed -i '' 's/"version": "0.X.X"/"version": "0.Y.Y"/g' {} \;
```

### Step 3: 빌드 및 테스트

```bash
# 의존성 설치
pnpm install

# 전체 빌드
pnpm build

# 테스트 실행
cd packages/ccd-server && bun test

# 플러그인 설치 테스트
cd packages/ccd-plugin && pnpm run test:plugin
```

### Step 4: 아티팩트 확인

```bash
# 서버
ls -lh packages/ccd-server/dist/index.js

# 대시보드
ls -lh packages/ccd-dashboard/dist/index.html

# 플러그인
ls -lh packages/ccd-plugin/scripts/server.js
ls -lh packages/ccd-plugin/scripts/mcp-server.js
ls -lh packages/ccd-plugin/lib/hooks.js
ls -lh packages/ccd-plugin/dashboard/dist/index.html

# OpenCode 플러그인
ls -lh packages/ccd-plugin/.opencode-plugin/dist/index.js
```

### Step 5: 커밋 생성

```bash
git add .
git commit -m "chore: Prepare v0.X.X release

- Version bump to 0.X.X
- All tests passing
- Build artifacts verified"
```

### Step 6: 태그 생성

```bash
git tag -a v0.X.X -m "Release v0.X.X

New Features:
- Feature 1
- Feature 2

Bug Fixes:
- Bug fix 1
- Bug fix 2

Performance:
- Performance improvement 1

See CHANGELOG.md for full details."
```

### Step 7: 배포 테스트 보고서 작성

```bash
# 문서 작성
vim docs/deployment-test-v0.X.X.md

# 커밋
git add docs/deployment-test-v0.X.X.md
git commit -m "docs: Add v0.X.X deployment test report"
```

### Step 8: main 브랜치로 병합

```bash
git checkout main
git merge release/v0.X.X
```

### Step 9: 원격 저장소에 푸시

```bash
git push origin main
git push origin v0.X.X
```

### Step 10: GitHub Release 생성

```bash
gh release create v0.X.X \
  --title "Release v0.X.X" \
  --notes "See CHANGELOG.md for full details" \
  --draft
```

**참고**: 초안(draft)으로 생성 후 검증 후 공개(publish)

---

## GitHub Release 작성

### 제목

```
Release v0.X.X
```

### 본문 템플릿

```markdown
## v0.X.X Release

### New Features

- **Feature 1**: Description
- **Feature 2**: Description

### Bug Fixes

- **Bug Fix 1**: Description
- **Bug Fix 2**: Description

### Performance Improvements

- **Performance 1**: Description

### Documentation

- **Doc 1**: Description

### Installation

#### OpenCode Users

```bash
curl -fsSL https://raw.githubusercontent.com/tolluset/claude-code-daily/main/install-opencode.sh | bash
```

#### Claude Code Users

```bash
curl -fsSL https://raw.githubusercontent.com/tolluset/claude-code-daily/main/install-claude.sh | bash
```

### Upgrading

If you're already using CCD, follow these steps:

1. **Update to latest version**:
   ```bash
   cd ~/.ccd-src  # or your installation directory
   git pull
   pnpm build
   ```

2. **Restart CCD Server**:
   ```bash
   pkill -f ccd-server
   bun x ccd-server
   ```

3. **Verify Dashboard**: Open http://localhost:3847

### Known Issues

- Issue 1 (if any)
- Issue 2 (if any)

### Full Changelog

See [CHANGELOG.md](https://github.com/tolluset/claude-code-daily/blob/main/docs/CHANGELOG.md) for complete changes.
```

---

## 배포 후 절차

### 1. 검증

- [ ] GitHub Release가 공개되었는지 확인
- [ ] 설치 스크립트가 실제로 동작하는지 확인 (새 환경에서 테스트)
- [ ] 버전 정보가 올바른지 확인 (`curl http://localhost:3847/api/v1/export | jq .version`)

### 2. 공지

- [ ] 사용자에게 릴리스 공지
- [ ] README.md의 Quick Start 섹션 업데이트 (필요 시)
- [ ] CHANGELOG.md 최신화

### 3. 다음 개발 준비

```bash
# 릴리스 브랜치 삭제
git branch -d release/v0.X.X
git push origin --delete release/v0.X.X  # 원격 브랜치 삭제 (필요 시)

# 다음 개발 브랜치 생성
git checkout -b feature/next-feature
```

---

## 문제 해결

### 1. 빌드 실패

**증상**: `pnpm build` 실패

**해결**:
```bash
# 캐시 정리
pnpm clean

# 의존성 재설치
rm -rf node_modules packages/*/node_modules
pnpm install

# 재빌드
pnpm build
```

### 2. 테스트 실패

**증상**: `bun test` 실패

**해결**:
```bash
# 개별 테스트 실행
cd packages/ccd-server
bun test src/routes/__tests__/sessions.test.ts

# 디버그 모드
bun test --bail
```

### 3. 설치 스크립트 실패

**증상**: `install-opencode.sh` 실행 실패

**해결**:
```bash
# 실행 권한 확인
chmod +x install-opencode.sh

# 디버깅 모드로 실행
bash -x install-opencode.sh
```

### 4. OpenCode 플러그인 빌드 실패

**증상**: `bun build src/index.ts` 실패

**해결**:
```bash
# 외부 의존성 명시
bun build src/index.ts --outdir dist --target node --external @ccd/client --external @opencode-ai/plugin
```

---

## 체크리스트 템플릿

다음 템플릿을 복사하여 배포 시 사용하세요:

```markdown
## 배포 체크리스트: v0.X.X

### 사전 준비
- [ ] 버전 업데이트 완료 (모든 package.json)
- [ ] CHANGELOG.md 업데이트
- [ ] README.md 버전 뱃지 업데이트

### 빌드 및 테스트
- [ ] pnpm build 성공
- [ ] bun test 통과 (X개/Y개)
- [ ] pnpm lint 통과
- [ ] pnpm run test:plugin 통과

### 아티팩트 확인
- [ ] ccd-server/dist/index.js 존재
- [ ] ccd-mcp/dist/index.js 존재
- [ ] ccd-dashboard/dist/index.html 존재
- [ ] ccd-claude-plugin/dist/index.js 존재
- [ ] ccd-plugin/scripts/server.js 존재
- [ ] ccd-plugin/scripts/mcp-server.js 존재
- [ ] ccd-plugin/lib/hooks.js 존재
- [ ] ccd-plugin/dashboard/dist/index.html 존재
- [ ] ccd-plugin/.opencode-plugin/dist/index.js 존재

### 설치 스크립트
- [ ] install-opencode.sh 최신 버전
- [ ] install-claude.sh 최신 버전
- [ ] 실행 권한 설정 완료

### 기능 테스트
- [ ] CCD Server 정상 시작
- [ ] Health endpoint 작동
- [ ] 세션 생성 API 작동
- [ ] 통계 API 작동
- [ ] Dashboard 로드 확인

### Git 작업
- [ ] git commit 생성
- [ ] git tag v0.X.X 생성
- [ ] git push origin main
- [ ] git push origin v0.X.X

### GitHub Release
- [ ] Release 생성 (초안)
- [ ] Release 본문 작성
- [ ] 공개 (Publish)

### 배포 후
- [ ] 설치 스크립트 테스트 (새 환경)
- [ ] 사용자 공지
- [ ] 다음 개발 준비
```

---

## 참고 자료

- [CHANGELOG.md](./CHANGELOG.md) - 변경 이력
- [DEVELOPMENT.md](./DEVELOPMENT.md) - 개발 가이드
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 아키텍처 문서
- [GitHub Releases](https://github.com/tolluset/claude-code-daily/releases) - 릴리스 히스토리

---

**마지막 업데이트**: 2026-01-21
**버전**: v0.1.1
