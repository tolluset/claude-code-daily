# Search Display Bug Fix - 2026-01-19

## Problem

검색 API는 정상적으로 6개의 결과를 반환했지만, 프론트엔드에서 빈 배열(`[]`)로 표시되는 문제가 발생했습니다.

### Symptoms
- ✅ API 호출 성공 (네트워크 탭에서 200 OK 확인)
- ✅ 응답 데이터: `{ success: true, data: [6 items] }`
- ❌ 프론트엔드 `results`: `[]` (빈 배열)

## Root Cause

### Type Double Wrapping Issue

`fetchApi` 함수는 `ApiResponse<T>` 구조를 언래핑하여 `T`만 반환합니다:

```typescript
// shared/types/src/api.ts
export async function fetchApi<T>(...): Promise<T> {
  const data = await response.json() as ApiResponse<T>;
  return data.data!;  // ← ApiResponse의 data 필드만 반환
}
```

그런데 세 개의 훅에서 잘못된 타입 지정을 사용하고 있었습니다:

**1. useSearchResults (api.ts:128, 133줄)**
```typescript
// ❌ 잘못된 코드
const response = await fetchApi<ApiResponse<SearchResult[]>>(...);
return response.data ?? [];  // response는 SearchResult[]인데 .data 접근 → undefined
```

**2. useDailyStats (api.ts:38-39줄)**
```typescript
// ❌ 잘못된 코드
const response = await fetchApi<ApiResponse<DailyStats[]>>(...);
return response.data || [];  // 동일한 문제
```

**3. useStreakStats (api.ts:157-158줄)**
```typescript
// ❌ 잘못된 코드
const response = await fetchApi<ApiResponse<StreakStats>>(...);
return response.data;  // 동일한 문제
```

### Data Flow

```
API 응답: { success: true, data: [6 items] }
  ↓
fetchApi 함수: data.data! 반환 → SearchResult[] (6 items)
  ↓
useSearchResults: response.data 접근 → undefined
  ↓
return response.data ?? [] → []
  ↓
프론트엔드: 빈 배열 표시
```

## Solution

### 1. Fixed useSearchResults Hook

**File**: `packages/ccd-dashboard/src/lib/api.ts`

```typescript
// BEFORE
const response = await fetchApi<ApiResponse<SearchResult[]>>(`/search?${params}`, undefined, DASHBOARD_API_BASE);
return response.data ?? [];

// AFTER
const response = await fetchApi<SearchResult[]>(`/search?${params}`, undefined, DASHBOARD_API_BASE);
return response ?? [];
```

### 2. Fixed useDailyStats Hook

**File**: `packages/ccd-dashboard/src/lib/api.ts`

```typescript
// BEFORE
const response = await fetchApi<ApiResponse<DailyStats[]>>(`/stats/daily${queryString ? `?${queryString}` : ''}`, undefined, DASHBOARD_API_BASE);
return response.data || [];

// AFTER
const response = await fetchApi<DailyStats[]>(`/stats/daily${queryString ? `?${queryString}` : ''}`, undefined, DASHBOARD_API_BASE);
return response ?? [];
```

### 3. Fixed useStreakStats Hook

**File**: `packages/ccd-dashboard/src/lib/api.ts`

```typescript
// BEFORE
const response = await fetchApi<ApiResponse<StreakStats>>('/stats/streak', undefined, DASHBOARD_API_BASE);
return response.data;

// AFTER
const response = await fetchApi<StreakStats>('/stats/streak', undefined, DASHBOARD_API_BASE);
return response;
```

### 4. Added JSDoc Documentation

**File**: `shared/types/src/api.ts`

올바른 사용법을 명확히 하기 위해 JSDoc 주석을 추가했습니다:

```typescript
/**
 * Fetches data from the API with standardized error handling.
 *
 * IMPORTANT: This function unwraps ApiResponse<T> and returns only the data (T).
 *
 * @example
 * // Correct: fetchApi<ActualDataType>()
 * const sessions = await fetchApi<Session[]>('/sessions');
 *
 * // Incorrect: fetchApi<ApiResponse<ActualDataType>>()
 * const response = await fetchApi<ApiResponse<Session[]>>('/sessions');
 * // This will cause type mismatch! response is already Session[], not ApiResponse<Session[]>
 */
export async function fetchApi<T>(...): Promise<T>
```

### 5. Cleaned Up Debug Logs

**File**: `packages/ccd-dashboard/src/lib/api.ts`

개발 환경에서만 디버그 로그를 활성화하도록 수정:

```typescript
if (import.meta.env.DEV) {
  console.log('Calling search API with URL:', `${DASHBOARD_API_BASE}/search?${params}`);
}
```

## Additional UX Improvements

### 1. Added "No Results Found" Message

**File**: `packages/ccd-dashboard/src/pages/Search.tsx`

검색 결과가 없을 때 명확한 메시지를 표시하도록 개선:

```typescript
{query && !isLoading && displayResults.length === 0 && (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <p className="text-lg text-gray-600">No results found for "{query}"</p>
      <p className="text-sm mt-2 text-gray-500">Try different keywords or adjust your filters</p>
    </div>
  </div>
)}
```

### 2. Fixed Back Button UX

**File**: `packages/ccd-dashboard/src/pages/Search.tsx`

검색 시 히스토리 스택에 쌓이지 않도록 `{ replace: true }` 옵션 추가:

```typescript
// Before: 검색할 때마다 히스토리에 추가
setSearchParams(params);
// → Home → Search(q1) → Search(q2) → Back → Search(q1) (혼란스러움)

// After: 현재 엔트리를 교체
setSearchParams(params, { replace: true });
// → Home → Search(q1) → Search(q2) → Back → Home (예상된 동작)
```

### 3. Removed Debug Logs

**File**: `packages/ccd-dashboard/src/pages/Search.tsx`

프로덕션에 불필요한 디버그 로그를 모두 제거:
- SearchPage 진입 시 로그
- API 응답 상세 로그
- useEffect 디버그 로그
- 검색 파라미터 로그

## Pattern Guide

### ✅ Correct Pattern

다른 훅들이 사용하는 올바른 패턴:

```typescript
// useSessions, useSession, useSessionMessages 등
const response = await fetchApi<Session[]>('/sessions');
return response;  // 또는 response ?? []
```

### ❌ Incorrect Pattern

수정이 필요했던 잘못된 패턴:

```typescript
// useDailyStats, useSearchResults, useStreakStats (수정 완료)
const response = await fetchApi<ApiResponse<Session[]>>('/sessions');
return response.data;  // response.data는 undefined!
```

## Key Insight

**핵심**: `fetchApi<T>`의 `T`는 API 응답의 `data` 필드 타입이지, 전체 `ApiResponse<T>` 타입이 아닙니다.

## Files Modified

1. ✅ `packages/ccd-dashboard/src/lib/api.ts`
   - useSearchResults 타입 수정 (128, 133줄)
   - useDailyStats 타입 수정 (38-39줄)
   - useStreakStats 타입 수정 및 import 추가 (157-158줄)
   - 디버그 로그 정리

2. ✅ `shared/types/src/api.ts`
   - fetchApi 함수 JSDoc 주석 추가

3. ✅ `packages/ccd-dashboard/src/pages/Search.tsx`
   - "검색 결과 없음" UI 추가
   - 뒤로가기 UX 개선 (replace: true)
   - 디버그 로그 제거

4. ✅ `docs/STATUS.md`
   - 버그 수정 및 UX 개선 내역 기록

## Testing

### Expected Behavior After Fix

1. **검색 기능**
   - 검색어 입력 → 결과 정상 표시
   - 검색 결과 없음 → "No results found" 메시지 표시

2. **뒤로가기**
   - Home → Search 페이지 진입 → 여러 번 검색
   - 뒤로가기 → Home으로 이동 (이전 검색이 아님)

3. **Statistics 페이지**
   - Daily Stats 차트 정상 표시
   - Streak 통계 정상 표시
