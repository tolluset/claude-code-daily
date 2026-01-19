import { useTodayStats } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatNumber, formatDate } from '@/lib/utils';
import { MessageSquare, Zap, Bookmark, Activity, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  // 캐시에서 직접 데이터를 읽어서 초기 표시
  const getCachedData = () => {
    try {
      const cached = localStorage.getItem('ccd-query-cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        const todayData = parsed.clientState?.queries?.find((q: { queryKey: string[] }) =>
          JSON.stringify(q.queryKey) === JSON.stringify(['stats', 'today'])
        );
        return todayData?.state?.data;
      }
    } catch (e) {
      console.error('Failed to parse cached data:', e);
    }
    return undefined;
  };

  const cachedData = getCachedData();
  const { data, error } = useTodayStats();
  const displayData = data || (cachedData?.stats ? cachedData : undefined);

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

  if (!displayData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const { stats, sessions } = displayData;

  const today = formatDate(new Date().toISOString());
  const bookmarkedCount = sessions?.filter((s: { is_bookmarked: boolean }) => s.is_bookmarked).length || 0;
  const recentSessions = sessions?.slice(0, 5) || [];
  const totalTokens = (stats?.total_input_tokens || 0) + (stats?.total_output_tokens || 0);
  const totalCost = (stats?.total_input_cost || 0) + (stats?.total_output_cost || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">{today}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.session_count || 0}</div>
            <p className="text-xs text-muted-foreground">Sessions today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.message_count || 0}</div>
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
              Input {formatNumber(stats.total_input_tokens || 0)} / Output {formatNumber(stats.total_output_tokens || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookmarks</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookmarkedCount}</div>
            <p className="text-xs text-muted-foreground">Bookmarked sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              In ${(stats.total_input_cost || 0).toFixed(3)} / Out ${(stats.total_output_cost || 0).toFixed(3)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSessions.length > 0 && (
            <div className="space-y-2">
              {recentSessions.map((session: { id: string; is_bookmarked: boolean; summary: string | null; project_name: string | null; git_branch: string | null; started_at: string }) => (
                <Link
                  key={session.id}
                  to={`/sessions/${session.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors gap-2"
                >
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                    {session.is_bookmarked && (
                      <Bookmark className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-1" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">
                        {session.project_name || '(unknown)'}
                      </div>
                      {session.summary && (
                        <div className="text-sm text-foreground/80 truncate">
                          {session.summary}
                        </div>
                      )}
                      {session.git_branch && (
                        <div className="text-xs text-muted-foreground truncate">
                          {session.git_branch}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground flex-shrink-0 whitespace-nowrap">
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
