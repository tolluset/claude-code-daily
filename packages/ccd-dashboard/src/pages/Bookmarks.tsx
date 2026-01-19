import { useBookmarks, useSessions } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { formatDateForApi, extractProjectList } from '@/lib/utils';
import { Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useSessionActions } from '@/hooks/useSessionActions';
import { SessionItem } from './Sessions';

export function Bookmarks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProject, setSelectedProject] = useState<string>(() => {
    return searchParams.get('project') || '';
  });
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    if (fromParam && toParam) {
      return {
        from: new Date(fromParam),
        to: new Date(toParam)
      };
    }

    return {};
  });

  const { handleBookmark, handleCopyId, handleDelete, copiedId } = useSessionActions();
  const { data, error } = useBookmarks(
    dateRange.from ? formatDateForApi(dateRange.from) : undefined,
    dateRange.to ? formatDateForApi(dateRange.to) : undefined,
    selectedProject || undefined
  );

  const { data: allData } = useSessions();
  const allSessions = allData?.sessions || [];
  const projects = extractProjectList(allSessions);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-destructive">Cannot connect to server</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
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
              setDateRange(value);
              const newSearchParams = new URLSearchParams(searchParams);
              if (value.from && value.to) {
                newSearchParams.set('from', formatDateForApi(value.from));
                newSearchParams.set('to', formatDateForApi(value.to));
              } else {
                newSearchParams.delete('from');
                newSearchParams.delete('to');
              }
              if (selectedProject) {
                newSearchParams.set('project', selectedProject);
              } else {
                newSearchParams.delete('project');
              }
              setSearchParams(newSearchParams, { replace: true });
            }}
          />
          {projects.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  const newSearchParams = new URLSearchParams(searchParams);
                  if (dateRange.from && dateRange.to) {
                    newSearchParams.set('from', formatDateForApi(dateRange.from));
                    newSearchParams.set('to', formatDateForApi(dateRange.to));
                  } else {
                    newSearchParams.delete('from');
                    newSearchParams.delete('to');
                  }
                  if (e.target.value) {
                    newSearchParams.set('project', e.target.value);
                  } else {
                    newSearchParams.delete('project');
                  }
                  setSearchParams(newSearchParams, { replace: true });
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
