# Development Guidelines

> Last Updated: 2026-01-19

This document provides guidelines and best practices for developing Claude Code Daily (CCD).

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
