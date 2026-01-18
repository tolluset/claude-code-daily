import { useTodayStats } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatNumber, formatDate } from '@/lib/utils';
import { MessageSquare, Zap, Star, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { data, isLoading, error } = useTodayStats();

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

  const { stats, sessions } = data!;
  const today = formatDate(new Date().toISOString());
  const bookmarkedCount = sessions.filter(s => s.is_bookmarked).length;
  const totalTokens = stats.total_input_tokens + stats.total_output_tokens;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">{today}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.session_count}</div>
            <p className="text-xs text-muted-foreground">Sessions today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.message_count}</div>
            <p className="text-xs text-muted-foreground">Total messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalTokens)}</div>
            <p className="text-xs text-muted-foreground">
              Input {formatNumber(stats.total_input_tokens)} / Output {formatNumber(stats.total_output_tokens)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookmarks</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookmarkedCount}</div>
            <p className="text-xs text-muted-foreground">Bookmarked sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sessions today
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 5).map((session) => (
                <Link
                  key={session.id}
                  to={`/sessions/${session.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {session.is_bookmarked && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        {session.project_name || '(unknown)'}
                      </div>
                      {session.summary && (
                        <div className="text-sm text-foreground/80 truncate">
                          {session.summary}
                        </div>
                      )}
                      {session.git_branch && (
                        <div className="text-xs text-muted-foreground">
                          {session.git_branch}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(session.started_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
