Claude Code Daily (CCD)

Dashboard for tracking daily Claude Code usage data

---

## 설정

- 내 이름은 "tolluset"

## 개발

- 프로덕션 주석은 영어로
- 필요하다면 로그 파일 확인
- 플랜은 마크다운으로 로그로써 남겨
- 중요한 인사이트나 정보는 로그로써 남겨 (tmp 말고 프로젝트 관련)
- 작업 후에 문서 갱신

## 문서 구조

### 핵심 문서 (4개)

1. **[README.md](README.md)** - 사용자용 문서 (설치, 사용법, 기능 소개)
2. **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** - 개발자용 가이드 (개발 설정, API, 가이드라인)
3. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - 시스템 아키텍처 (DB 스키마, 데이터 플로우)
4. **[docs/CHANGELOG.md](docs/CHANGELOG.md)** - 변경 이력 (날짜별 통합)

### 기술상세 로그

**docs/development-log/** - 상세한 기술 구현 로그 (최신 30일 유지)
- 최근 변경사항은 CHANGELOG.md를 참고
- 디버깅 및 세부 구현 정보 필요시 development-log 참고

---

## 작업 시 체크리스트

- [ ] README.md 갱신 (새 기능/변경사항)
- [ ] docs/CHANGELOG.md에 변경사항 추가
- [ ] docs/DEVELOPMENT.md 갱신 (상태/가이드라인)
- [ ] docs/development-log/에 기술상세 로그 작성 (필요시)
- [ ] TypeScript 컴파일 에러 체크: `pnpm typecheck`
- [ ] 테스트 통과: `pnpm test`
- [ ] Lint 통과: `pnpm lint`

---

## 최근 변경사항

### 2026-01-20

- Phase 1.1: N+1 쿼리 제거 (10x 성능 개선)
- OpenCode 플러그인 지원 (TypeScript 기반)
- 플러그인 배포 자동화 (Bun 자동설치, MCP 자동등록)
- 주기적 세션 정리 시스템 (이중 메커니즘)

자세한 내용은 [CHANGELOG.md](docs/CHANGELOG.md) 참고.
