import { useSessions, toggleBookmark, deleteSession } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { formatDate, formatTime } from '@/lib/utils';
import { Star, GitBranch, Clock, Copy, Check, Trash2, HelpCircle, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@ccd/types';

export function Sessions() {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const { data: allData } = useSessions();
  const { data, isLoading, error } = useSessions(
    undefined,
    dateRange.from ? formatDate(dateRange.from.toISOString()) : undefined,
    dateRange.to ? formatDate(dateRange.to.toISOString()) : undefined,
    selectedProject || undefined
  );

  const allSessions = allData?.sessions || [];
  const projects = Array.from(new Set(allSessions.map(s => s.project_name).filter((p): p is string => Boolean(p)))).sort();

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

  const handleBookmark = async (session: Session, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleBookmark(session.id);
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`/resume ${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (session: Session, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = window.confirm(
      `Delete session "${session.project_name || session.id.slice(0, 8)}"?\nThis will also delete all messages in this session.`
    );
    if (confirmed) {
      await deleteSession(session.id);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  };

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

function SessionItem({ session, onBookmark, onCopyId, onDelete, copiedId }: SessionItemProps) {
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
        <div className="relative group">
          <IconButton
            type="button"
            size="sm"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            title="Resume help"
          >
            <HelpCircle className="h-4 w-4" />
          </IconButton>
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-72 p-3 rounded-lg border bg-popover text-popover-foreground shadow-md text-xs">
            <div className="font-medium mb-2">Resume this session:</div>
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground">Terminal:</span>
                <code className="ml-1 bg-muted px-1.5 py-0.5 rounded">claude --resume &lt;session_id&gt;</code>
              </div>
              <div>
                <span className="text-muted-foreground">Claude Code:</span>
                <code className="ml-1 bg-muted px-1.5 py-0.5 rounded">/resume &lt;session_id&gt;</code>
              </div>
            </div>
          </div>
        </div>
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
}
