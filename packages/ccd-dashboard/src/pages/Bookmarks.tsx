import { useBookmarks, useSessions } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { extractProjectList } from '@/lib/utils';
import { buildQueryParams } from '@/lib/query-params';
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter';
import { Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useSessionActions } from '@/hooks/useSessionActions';
import { SessionItem } from './Sessions';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';

export function Bookmarks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProject, setSelectedProject] = useState<string>(() => {
    return searchParams.get('project') || '';
  });
  const { dateRange, updateDateRange } = useDateRangeFilter();

  const { handleBookmark, handleCopyId, handleDelete, copiedId } = useSessionActions();
  const { data, error } = useBookmarks(
    dateRange.from?.toISOString().split('T')[0],
    dateRange.to?.toISOString().split('T')[0],
    selectedProject || undefined
  );

  const { data: allData } = useSessions();
  const allSessions = allData?.sessions || [];
  const projects = extractProjectList(allSessions);

  if (error) {
    return <ErrorState />;
  }

  if (!data) {
    return <LoadingState />;
  }

  const { sessions } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
          <p className="text-muted-foreground">{sessions.length} bookmarked sessions</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={(value) => {
              updateDateRange(value);
            }}
          />
          {projects.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  const params = buildQueryParams(searchParams, {
                    from: dateRange.from,
                    to: dateRange.to,
                    project: e.target.value
                  });
                  setSearchParams(params, { replace: true });
                }}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bookmarked Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bookmarks
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  onBookmark={handleBookmark}
                  onCopyId={handleCopyId}
                  onDelete={handleDelete}
                  copiedId={copiedId}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
