# Development Guidelines

> Last Updated: 2026-01-19

This document provides guidelines and best practices for developing Claude Code Daily (CCD).

---

## OpenCode Plugin Development

### Problem: Plugin Loading and Event Handling

OpenCode plugins have specific requirements for loading and event structure that differ from Claude plugins.

**Common Issues:**
- Plugin not loading (no logs, no functionality)
- Events not firing as expected
- Incorrect event property access

**Solutions:**

#### Plugin Loading
- OpenCode loads plugins from `~/.config/opencode/plugin/` directory
- Plugin file must be named appropriately (e.g., `ccd-tracker.ts`)
- Dependencies must be installed in `~/.config/opencode/node_modules/`

#### Event Structure
OpenCode events have a different structure than Claude events:

```typescript
// Claude event structure (OLD)
event.properties.sessionID
event.properties.info.id

// OpenCode event structure (CORRECT)
event.properties.info.id                    // for session.created
event.properties.info.sessionID            // for message.updated
```

#### Debugging Plugins
Always add comprehensive logging for debugging:

```typescript
function log(message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? ` ${JSON.stringify(data)}` : ''}\n`;
  writeFileSync(LOG_FILE, logEntry, { flag: 'a' });
}
```

**Key Events to Handle:**
- `session.created` - Extract session ID from `properties.info.id`
- `message.updated` - Handle user messages, extract content from parts
- `session.idle` - Mark session as ended

---

## React Query Cache Invalidation

### Problem: Stale Data After Mutations

When you update data (e.g., bookmark a session, delete a message), other parts of the app may display stale cached data if you don't properly invalidate related queries.

**Example Bug:**
- User bookmarks a session on the detail page
- User navigates back to the sessions list
- The bookmark status is not updated (still shows old state)

### Solution: Invalidate All Related Queries

When performing mutations that affect data displayed in multiple places, you must invalidate **all related query keys**.

#### Query Keys in CCD

| Query Key Pattern | What It Caches | Where It's Used |
|------------------|----------------|-----------------|
| `['sessions']` | Session list | Sessions page, Dashboard |
| `['session', id]` | Single session detail | SessionDetail page |
| `['search', ...]` | Search results | Search page |
| `['stats', ...]` | Statistics data | Dashboard, stats pages |
| `['messages', id]` | Session messages | SessionDetail page |
| `['insight', id]` | Session insights | SessionDetail page |

#### Invalidation Rules

**Rule 1: Session Mutations**
When you create, update, bookmark, or delete a session:
```typescript
// ❌ BAD: Only invalidates one query
queryClient.invalidateQueries({ queryKey: ['session', id] });

// ✅ GOOD: Invalidates all affected queries
queryClient.invalidateQueries({ queryKey: ['session', id] });
queryClient.invalidateQueries({ queryKey: ['sessions'] });
queryClient.invalidateQueries({ queryKey: ['search'] });
```

**Rule 2: Message Mutations**
When you add or update messages:
```typescript
// ✅ Invalidate message list and related stats
queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
queryClient.invalidateQueries({ queryKey: ['session', sessionId] }); // May contain message counts
```

**Rule 3: Insight Mutations**
When you create, update, or delete insights:
```typescript
// ✅ Invalidate insight and session (may contain insight indicators)
queryClient.invalidateQueries({ queryKey: ['insight', sessionId] });
queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
```

**Rule 4: Prefix-Based Invalidation**
To invalidate all queries with a certain prefix:
```typescript
// Invalidates ['search', ...] with any parameters
queryClient.invalidateQueries({ queryKey: ['search'] });
```

### Checklist for New Mutations

When adding a new mutation (create, update, delete):

1. **Identify affected data**: What data does this mutation change?
2. **Find all query keys**: Where is this data displayed? What query keys are used?
3. **Invalidate all related queries**: Add `invalidateQueries` for each affected key
4. **Test navigation**: After mutation, navigate to other pages to verify data is fresh
5. **Document**: Update this guide if you add new query patterns

### Testing Cache Invalidation

To verify your invalidation works:

1. Open React Query DevTools (included in dev mode)
2. Perform the mutation
3. Check which queries are marked as "stale" (gray)
4. Navigate to related pages
5. Verify data is refetched and displays correctly

### Common Pitfalls

❌ **Pitfall 1: Forgetting Search Queries**
```typescript
// If search results include bookmarks, this is insufficient:
queryClient.invalidateQueries({ queryKey: ['sessions'] });

// Must also invalidate search:
queryClient.invalidateQueries({ queryKey: ['search'] });
```

❌ **Pitfall 2: Only Invalidating Local State**
```typescript
// This only updates the detail page:
queryClient.invalidateQueries({ queryKey: ['session', id] });

// Always consider where else this data appears:
queryClient.invalidateQueries({ queryKey: ['sessions'] }); // List pages
queryClient.invalidateQueries({ queryKey: ['search'] });   // Search results
```

❌ **Pitfall 3: Optimistic Updates Without Rollback**
```typescript
// If using optimistic updates, always handle errors:
const { mutate } = useMutation({
  mutationFn: toggleBookmark,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['sessions'] });
    const previousData = queryClient.getQueryData(['sessions']);
    queryClient.setQueryData(['sessions'], newData);
    return { previousData };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['sessions'], context?.previousData);
  },
  onSettled: () => {
    // Always refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
  }
});
```

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - API endpoints and implementation details
- [CODE_STYLE.md](../CLAUDE.md) - Code style conventions

---

## Dark Mode Best Practices

### Color Mapping Pattern

All UI elements must support both light and dark modes using Tailwind's `dark:` prefix. Follow this established color mapping pattern:

#### Text Colors

| Light Mode | Dark Mode | Use Case |
|------------|-----------|----------|
| `text-gray-900` | `dark:text-gray-100` | Primary text, headings, important values |
| `text-gray-700` | `dark:text-gray-300` | Secondary text, labels |
| `text-gray-500` | `dark:text-gray-400` | Tertiary text, placeholders |
| `text-gray-400` | `dark:text-gray-500` | Muted icons, less prominent elements |

#### Background Colors

| Light Mode | Dark Mode | Use Case |
|------------|-----------|----------|
| `bg-white` | `dark:bg-gray-800` | Cards, dropdowns, panels |
| `bg-gray-50` | `dark:bg-gray-900` | Page background, sections |
| `bg-gray-100` | `dark:bg-gray-800` | Hover states |

#### Border Colors

| Light Mode | Dark Mode | Use Case |
|------------|-----------|----------|
| `border-gray-300` | `dark:border-gray-600` | Primary borders, inputs |
| `border-gray-200` | `dark:border-gray-700` | Secondary borders, dividers |

### Implementation Examples

#### Example 1: Card Component
```tsx
<Card className="p-6">
  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Sessions</p>
  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{total}</p>
</Card>
```

#### Example 2: Table Row
```tsx
<tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
  <td className="py-2 px-4 text-sm text-gray-900 dark:text-gray-100">{data}</td>
</tr>
```

#### Example 3: Dropdown/Select
```tsx
<select className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
  <option>All Projects</option>
</select>
```

### Reference Implementations

Use these files as reference for dark mode patterns:
- `packages/ccd-dashboard/src/pages/SessionDetail.tsx` - Session detail with dark mode
- `packages/ccd-dashboard/src/components/ui/SessionInsights.tsx` - Insights display with dark mode
- `packages/ccd-dashboard/src/pages/Reports.tsx` - Reports page (updated 2026-01-19)
- `packages/ccd-dashboard/src/components/ui/DateRangePicker.tsx` - Date picker (updated 2026-01-19)

### Testing Checklist

When adding or modifying UI components:

1. **Test both modes**: Toggle between light and dark in the header
2. **Check all text**: Ensure all text elements have appropriate contrast
3. **Verify backgrounds**: Backgrounds should be clearly different from text
4. **Test hover states**: All interactive elements should have visible hover states in both modes
5. **Check borders**: Borders should be visible but not distracting
6. **Test all pages**: Navigate through all pages in both modes

### Common Pitfalls

❌ **Pitfall 1: Hardcoded Light Mode Colors**
```tsx
// BAD: Only works in light mode
<p className="text-gray-900">{title}</p>
<p className="text-gray-500">{description}</p>

// GOOD: Works in both modes
<p className="text-gray-900 dark:text-gray-100">{title}</p>
<p className="text-gray-500 dark:text-gray-400">{description}</p>
```

❌ **Pitfall 2: Missing Dark Mode on Borders**
```tsx
// BAD: Border invisible in dark mode
<div className="border border-gray-300">{content}</div>

// GOOD: Border visible in both modes
<div className="border border-gray-300 dark:border-gray-600">{content}</div>
```

❌ **Pitfall 3: Background Color Mismatch**
```tsx
// BAD: White background in dark mode
<div className="bg-white">{content}</div>

// GOOD: Dark background in dark mode
<div className="bg-white dark:bg-gray-800">{content}</div>
```

---

## TypeScript Best Practices

### 1. Avoid Non-Null Assertions

**❌ WRONG (Runtime Error Risk):**
```typescript
const { data: session } = useSession(id!);  // Crashes if id is undefined
```

**✅ CORRECT (Safe Null Check):**
```typescript
if (!id) {
  return <SessionNotFound />;
}

const { data: session } = useSession(id);
```

### 2. Explicit Generic Types in Hooks

**❌ WRONG (Type Inference Issues):**
```typescript
// TypeScript may infer wrong type
export function useSessionInsight(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['insight', sessionId],
    queryFn: () => fetchInsight(sessionId),
  });
}
```

**✅ CORRECT (Explicit Type):**
```typescript
export function useSessionInsight(sessionId: string | undefined) {
  return useQuery<SessionInsight | null>({
    queryKey: ['insight', sessionId],
    queryFn: () => fetchInsight(sessionId),
  });
}
```

### 3. Map Function Type Annotations

**❌ WRONG (Implicit Any Type):**
```typescript
sessions.filter(s => s.is_bookmarked).length
sessions.map(s => <SessionCard key={s.id} session={s} />)
```

**✅ CORRECT (Explicit Type):**
```typescript
import type { Session } from '@ccd/types';

sessions.filter((s: Session) => s.is_bookmarked).length
sessions.map((s: Session) => <SessionCard key={s.id} session={s} />)
```

### 4. State Initialization with Complex Types

**❌ WRONG (Type Inference Issues):**
```typescript
const [notes, setNotes] = useState(insight?.user_notes || '');
// TypeScript infers `notes` as never[] because `insight` could be null
```

**✅ CORRECT (Explicit Type and Proper Initialization):**
```typescript
const [notes, setNotes] = useState('');

useEffect(() => {
  if (insight?.user_notes) {
    setNotes(insight.user_notes);
  }
}, [insight]);
```

### 5. Select Functions with Defensive Coding

**✅ GOOD (Defensive Type Checking):**
```typescript
export function useSession(id: string) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => fetchApi<Session>(`/sessions/${id}`),
    enabled: !!id,
    select: (data) => {
      if (!data || typeof data !== 'object') {
        console.error('Invalid session data:', data);
        return null;
      }
      return data;
    }
  });
}
```

---

## Testing Checklist

### Type Safety
- [ ] No non-null assertions (`!`) unless absolutely necessary
- [ ] All map/filter functions have explicit types
- [ ] All hooks have explicit generic types
- [ ] `npx tsc --noEmit` passes without errors

### Loading States
- [ ] Empty states display correctly when truly no data
- [ ] Error states display when API fails

---
