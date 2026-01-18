# React Compiler Setup - CCD

> Date: 2026-01-19
> Phase: P12-001, P12-002

## Overview

React Compiler has been added to the Claude Code Daily (CCD) dashboard to enable automatic memoization and performance optimization for React components.

## Implementation Details

### Installation

```bash
pnpm install -D babel-plugin-react-compiler@latest
```

### Configuration

**File:** `packages/ccd-dashboard/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3847',
        changeOrigin: true
      }
    }
  }
});
```

### Dependencies Updated

**File:** `packages/ccd-dashboard/package.json`

```json
{
  "devDependencies": {
    "babel-plugin-react-compiler": "^1.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "react": "^19.0.0"
  }
}
```

## Benefits

1. **Automatic Memoization**: Components and values are automatically memoized without manual `useMemo`/`useCallback`
2. **Reduced Re-renders**: Unnecessary re-renders are prevented through intelligent dependency tracking
3. **Cleaner Code**: Less boilerplate optimization code needed
4. **Performance Gains**: Better rendering performance, especially for complex component trees
5. **React 19 Compatible**: Designed to work best with React 19.0.0+

## Verification

### React DevTools

Components optimized by React Compiler will show a **"Memo ✨"** badge in React DevTools:

1. Install [React Developer Tools](https://react.dev/learn/react-developer-tools)
2. Open your app in development mode
3. Open React DevTools
4. Look for the ✨ emoji next to component names

### Build Output

The compiled code includes automatic memoization logic:

```javascript
import { c as _c } from "react/compiler-runtime";

export default function MyApp() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div>Hello World</div>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}
```

## Usage Notes

### Code Cleanup

Existing `useMemo` and `useCallback` hooks can be removed as React Compiler handles this automatically:

**Before:**
```typescript
const expensiveValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
const handleClick = useCallback(() => doSomething(a, b), [a, b]);
```

**After:**
```typescript
const expensiveValue = computeExpensiveValue(a, b);
const handleClick = () => doSomething(a, b);
```

### Opting Out Components

If a component causes issues after compilation, use the `"use no memo"` directive:

```typescript
function ProblematicComponent() {
  "use no memo";
  // Component code here
}
```

## Known Limitations

1. **ESLint Integration**: Currently not configured (optional)
   - Can be added with `eslint-plugin-react-hooks@latest`
   - Would help identify code that can't be optimized

2. **TypeScript Build Errors**: Some TypeScript errors exist in `SessionDetail.tsx`
   - Unread imports (`FileText`, `isSavingNotes`, `handleSaveNotes`)
   - Missing `SessionNotesCard` and `setIsSaving`
   - Need cleanup to enable production builds

## Testing

### Dev Server

The dev server runs successfully with React Compiler enabled:

```bash
pnpm run dev
# Server: http://localhost:3848
```

### Build Status

```bash
pnpm run build
# Currently: Failing due to TypeScript errors (unrelated to React Compiler)
```

## Performance Impact

### Expected Improvements

- **Reduced Re-renders**: Components won't re-render unnecessarily
- **Better Response Time**: UI updates should be faster
- **Lower CPU Usage**: Few unnecessary computations

### Components to Monitor

Watch for "Memo ✨" badges in React DevTools on these components:

- `Dashboard.tsx` - Complex stats display
- `SessionDetail.tsx` - Large conversation timeline
- `Reports.tsx` - Chart rendering
- `Sessions.tsx` - Filtered list rendering

## References

- [React Compiler Installation](https://react.dev/learn/react-compiler/installation)
- [React Compiler Configuration](https://react.dev/reference/react-compiler/configuration)
- [React Compiler Rules](https://react.dev/reference/rules)

## Next Steps

1. Fix TypeScript errors in `SessionDetail.tsx`
2. Test production build performance
3. Consider adding ESLint integration for optimization detection
4. Monitor performance improvements in real usage
5. Remove manual `useMemo`/`useCallback` from codebase (gradual cleanup)

---

**Status**: ✅ Complete  
**Phase**: Phase 12 - Performance Optimization  
**Tasks**: P12-001 (Install), P12-002 (Configure)
