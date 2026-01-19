# Layout & Navigation Changes - 2026-01-19

## Changes Made

### 1. Sidebar Navigation (Header → Sidebar)
- Changed from top header navigation to left sidebar navigation
- Fixed sidebar width of 256px (w-64), collapsed to 64px (w-16)
- Navigation items:
  - Dashboard (/)
  - Sessions (/sessions)
  - Search (/search)
  - Reports (/reports)
  - Statistics (/statistics)
- Main content now has ml-64 margin (ml-16 when collapsed) to account for sidebar
- Token usage badge and theme toggle moved to bottom of sidebar
- **Collapse/Expand functionality**:
  - Toggle button in header
  - Keyboard shortcut: Ctrl/Cmd + B
  - Edge click: Click right edge (12px from right) to collapse
  - Escape key: Press Escape to collapse when sidebar is open

### 2. Page Reorganization
- **Reports** (`/reports`): Now shows daily reports list with calendar view
- **Statistics** (`/statistics`): Moved from Reports, shows detailed charts and analytics
- **Daily Report** (`/daily-report`): Enhanced to insights/diary format

### 3. Reports Page (Daily Reports List)
- Displays list of daily reports with date filtering
- Shows streak stats in header
- Each report card shows:
  - Date (with "Today" badge for current day)
  - Session count, message count, token count, cost
  - Clickable card navigates to detailed daily report
- Empty state when no reports available

### 4. Statistics Page
- Comprehensive analytics dashboard
- Features:
  - Date range picker
  - Project filter dropdown
  - 5 metric cards: Total Sessions, Total Messages, Input Tokens, Output Tokens, Avg Sessions/Day
  - 3 charts: Token Usage Trend, Sessions per Day, Project Distribution
  - Daily statistics table

### 5. Daily Report Page (Enhanced)
- **Format**: Changed from statistics to insights/diary format
- **Structure**:
  - Header with date navigation (prev/next/today buttons)
  - Coding streak card with gradient background
  - Highlights section (bookmarked sessions)
  - Key learnings section
  - Problems solved section
  - Session timeline with numbered circles
  - Projects worked on footer
- **Timezone Fix**: Changed from `toISOString().split('T')[0]` to local date string using `getLocalDateString()`

### 6. Routing Updates
```tsx
- Route path="reports" element={<Reports />} // Daily reports list
+ Route path="statistics" element={<Statistics />} // Analytics dashboard
+ Route path="daily-report" element={<DailyReport />} // Individual daily report (insights/diary)
```

### 7. Timezone Handling
- Created `getLocalDateString()` function in DailyReport page
- Converts Date object to local timezone string (YYYY-MM-DD)
- Fixed issue where UTC date was used for initial date selection

### 8. Layout Improvements
- Fixed unwanted full page scroll by adding `overflow-hidden` to parent container
- Main content now has `overflow-auto` for proper scrolling
- Fixed layout shift during sidebar collapse/expand transitions
- Added `flex-shrink-0` to prevent unwanted shrinking
- Added `truncate` classes to prevent text overflow
- Used `min-w-0` containers to properly truncate text
- All navigation items now have `w-full` for consistent sizing

### 9. Active Menu Persistence
- Sidebar menu items now maintain active state when navigating to sub-pages
- `/sessions` stays active when viewing `/sessions/:id`
- `/reports` stays active when viewing `/reports/:date` (individual reports)
- `/search` stays active when viewing search results
- Implemented `isActivePath()` helper function for smart path matching
- Root path `/` only matches exactly (not `/other-page`)

### 10. URL Structure Refactoring
- Changed from query parameter to path parameter for Daily Report
- Old: `/daily-report?date=2026-01-19`
- New: `/reports/2026-01-19`
- RESTful URL structure consistent with Sessions (`/sessions`, `/sessions/:id`)
- Reports: `/reports` (list), `/reports/:date` (detail)
- Simplified `isActivePath()` function - no special cases needed
- Daily Report now uses `useParams` instead of `useSearchParams`
- Updated routing in App.tsx
- Added navigation buttons (prev/next/today) with proper URL navigation

### 9. Sidebar Interaction Improvements
- Click right edge of sidebar (12px from right border) to collapse
- Escape key to collapse sidebar
- Toggle button repositioned for better UX
- Proper keyboard focus handling
- Tooltips on collapsed items for accessibility

## File Changes

### Modified Files
- `packages/ccd-dashboard/src/App.tsx` - Updated routes
- `packages/ccd-dashboard/src/components/Layout.tsx` - Changed from header to sidebar, added collapse/expand functionality
- `packages/ccd-dashboard/src/pages/Reports.tsx` - Converted to daily reports list
- `packages/ccd-dashboard/src/pages/DailyReport.tsx` - Enhanced to insights/diary format with timezone fix

### New Files
- `packages/ccd-dashboard/src/pages/Statistics.tsx` - New analytics page (copied from old Reports)

## Design Decisions

### Sidebar vs Header
**Decision**: Chose sidebar over header navigation
**Reasoning**:
- Better scalability for growing number of features
- More space for navigation items without horizontal scrolling
- Standard pattern for analytics/dashboard applications
- Clearer visual hierarchy

### Reports vs Statistics
**Decision**: Split into two separate pages
**Reports** - Daily reports list (calendar view of daily activities)
**Statistics** - Analytics dashboard (charts, trends, comprehensive metrics)
**Reasoning**:
- Different use cases: browsing history vs analyzing patterns
- Reports = narrative/journal format
- Statistics = analytical/data-focused format

### Daily Report Format
**Decision**: Insights/diary format instead of statistics summary
**Reasoning**:
- More personal and engaging
- Highlights achievements (streak, key learnings, problems solved)
- Narrative timeline tells a story of the day
- Less overlap with Statistics page

### Timezone Handling
**Decision**: Use local timezone for all date operations
**Reasoning**:
- Users expect local time in UI
- Avoids confusion with UTC-based dates
- Consistent with other time displays (toLocaleTimeString)

### Sidebar Collapse Behavior
**Decision**: Multiple ways to collapse sidebar
**Reasoning**:
- Toggle button: Explicit, discoverable action
- Keyboard shortcut (Ctrl/Cmd + B): Power user feature
- Edge click: Fast, intuitive interaction
- Escape key: Standard pattern for dismissing panels

### Layout Stability
**Decision**: Fixed overflow and layout shift issues
**Reasoning**:
- `overflow-hidden` on parent prevents page-level scroll
- `overflow-auto` on main enables proper content scrolling
- `flex-shrink-0` prevents unexpected size changes
- `truncate` and `min-w-0` ensure text doesn't overflow
- Consistent spacing prevents layout jump during transitions

## Next Steps

1. Add date range filter to Reports page
2. Implement keyboard navigation for date picker
3. Add export functionality for statistics
4. Consider adding month/week view to Reports
5. Add search/filter to Reports page
6. Enhance statistics with more chart types
7. Add comparison features (compare days/weeks)
8. Add responsive design for mobile/tablet
9. Consider sidebar state persistence in localStorage
10. Add breadcrumb navigation for better context

## Testing Recommendations

1. Test sidebar navigation on mobile (consider responsive design)
2. Verify timezone handling across different regions
3. Test empty states for all pages
4. Verify date navigation in Daily Report
5. Test filtering in Statistics page
6. Test all sidebar collapse methods (button, edge click, keyboard)
7. Verify no layout shift during sidebar transitions
8. Test overflow behavior on different screen sizes
9. Test active menu persistence:
   - Navigate from Sessions to session detail page - Sessions should stay highlighted
   - Navigate from Reports to daily report - Reports should stay highlighted
   - Navigate from Dashboard - Dashboard should only be highlighted on root path
10. Test edge cases for path matching (e.g., `/sessions/123/abc`)
