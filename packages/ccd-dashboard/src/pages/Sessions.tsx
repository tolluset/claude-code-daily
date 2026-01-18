import { useSessions } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { formatDate, formatTime, extractProjectList } from '@/lib/utils';
import { Star, GitBranch, Clock, Copy, Check, Trash2, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, memo } from 'react';
import { useSessionActions } from '@/hooks/useSessionActions';
import { ResumeHelpTooltip } from '@/components/ui/ResumeHelpTooltip';
import type { Session } from '@ccd/types';

export function Sessions() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const { data: allData } = useSessions();
  const { handleBookmark, handleCopyId, handleDelete, copiedId } = useSessionActions();
  const { data, isLoading, error } = useSessions(
    undefined,
    dateRange.from ? formatDate(dateRange.from.toISOString()) : undefined,
    dateRange.to ? formatDate(dateRange.to.toISOString()) : undefined,
    selectedProject || undefined
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-destructive">Cannot connect to server</div>
        <div className="text-sm text-muted-foreground">
          The server will start automatically when you start a Claude Code session.
        </div>
      </div>
    );
  }

  const { sessions } = data!;
  const today = formatDate(new Date().toISOString());
  const bookmarked = sessions.filter(s => s.is_bookmarked);
  const regular = sessions.filter(s => !s.is_bookmarked);

  const allSessions = allData?.sessions || [];
  const projects = extractProjectList(allSessions);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground">{today} · {sessions.length} sessions</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          {projects.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

      {bookmarked.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              Bookmarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bookmarked.map((session) => (
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
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {regular.length === 0 && bookmarked.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sessions today
            </div>
          ) : regular.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No unbookmarked sessions
            </div>
          ) : (
            <div className="space-y-2">
              {regular.map((session) => (
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

      <div className="text-sm text-muted-foreground">
        Use <code className="bg-muted px-2 py-1 rounded">claude --resume &lt;session_id&gt;</code> to resume a session
      </div>
    </div>
  );
}

interface SessionItemProps {
  session: Session;
  onBookmark: (session: Session, e: React.MouseEvent) => void;
  onCopyId: (id: string, e: React.MouseEvent) => void;
  onDelete: (session: Session, e: React.MouseEvent) => void;
  copiedId: string | null;
}

const SessionItem = memo(function SessionItem({ session, onBookmark, onCopyId, onDelete, copiedId }: SessionItemProps) {
  const isActive = !session.ended_at;

  return (
    <Link
      to={`/sessions/${session.id}`}
      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors"
    >
      <div className="flex items-center gap-4">
        <IconButton
          type="button"
          size="sm"
          onClick={(e) => onBookmark(session, e)}
          className="p-1"
        >
          <Star
            className={`h-5 w-5 ${
              session.is_bookmarked
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-muted-foreground'
            }`}
          />
        </IconButton>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
            <span className="font-medium">{session.project_name || '(unknown)'}</span>
          </div>
          {session.summary && (
            <p className="text-sm text-foreground/80 mt-1 truncate max-w-md">
              {session.summary}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            {session.git_branch && (
              <span className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                {session.git_branch}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(session.started_at)}
            </span>
            {session.bookmark_note && (
              <span className="text-yellow-600">{session.bookmark_note}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={(e) => onCopyId(session.id, e)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground p-2"
          title="Copy session ID"
        >
          {copiedId === session.id ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <code className="text-xs">{session.id.slice(0, 8)}</code>
        </button>
        <ResumeHelpTooltip position="right" />
        <IconButton
          variant="destructive"
          size="sm"
          onClick={(e) => onDelete(session, e)}
          title="Delete session"
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    </Link>
  );
});

