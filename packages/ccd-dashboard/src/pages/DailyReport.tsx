import { useParams, useNavigate } from 'react-router-dom';
import { useDailyReport } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { formatNumber, formatDate } from '../lib/utils';
import { Calendar, Clock, Lightbulb, Target, BookOpen, ArrowLeft, ArrowRight } from 'lucide-react';

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DailyReport() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const today = getLocalDateString(new Date());
  const selectedDate = date || today;

  const { data, error } = useDailyReport(selectedDate);

  const handlePrevDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    const prevDate = getLocalDateString(currentDate);
    navigate(`/reports/${prevDate}`);
  };

  const handleNextDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDate = getLocalDateString(currentDate);
    const todayDate = getLocalDateString(new Date());
    if (nextDate <= todayDate) {
      navigate(`/reports/${nextDate}`);
    }
  };

  const handleToday = () => {
    navigate(`/reports/${today}`);
  };

  if (error) return <div className="text-center py-8 text-red-500">에러 발생</div>;
  if (!data) return <div className="text-center py-8">로딩 중...</div>;

  const { sessions, summary } = data;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const sessionsArray = [...(sessions || [])].sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
  const bookmarkedSessions = [...sessionsArray].filter(s => s.is_bookmarked);
  const sessionsWithInsights = sessionsArray.filter(s => s.insight && (s.insight?.key_learnings?.length > 0 || s.insight?.problems_solved?.length > 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Calendar className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold">오늘의 활동 일지</h1>
          </div>
          <p className="text-muted-foreground text-lg">{formatDate(selectedDate)}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            aria-label="Previous day"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={handleNextDay}
            className="p-2 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
            disabled={selectedDate >= today}
            aria-label="Next day"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {sessionsArray.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">이 날짜에는 활동 기록이 없습니다</p>
            <p className="text-sm mt-2">코딩을 시작해보세요!</p>
          </div>
        </Card>
      )}

      {sessionsArray.length > 0 && (
        <>
          <Card className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{summary.total_sessions}</p>
                <p className="text-xs text-muted-foreground">세션</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{summary.total_messages}</p>
                <p className="text-xs text-muted-foreground">메시지</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{formatNumber(summary.total_tokens)}</p>
                <p className="text-xs text-muted-foreground">토큰</p>
              </div>
            </div>
          </Card>

          {bookmarkedSessions.length > 0 && (
            <Card className="p-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  오늘의 하이라이트
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookmarkedSessions.map((session) => (
                    <div key={session.id} className="border-l-4 border-amber-400 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatTime(session.started_at)}
                        </span>
                        <span className="text-sm font-medium">
                          {session.project_name || '프로젝트'}
                        </span>
                      </div>
                      {session.summary && (
                        <p className="text-sm mt-1">{session.summary}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {sessionsWithInsights.length > 0 && (
            <Card className="p-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  오늘 배운 것
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {sessionsWithInsights.flatMap(session =>
                    session.insight?.key_learnings.map((learning, idx) => ({
                      id: `${session.id}-${idx}`,
                      learning,
                      session
                    })) || []
                  ).slice(0, 6).map(({ id, learning, session }) => (
                    <div key={id} className="flex gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <span className="text-xs">✨</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{learning}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          from {session.project_name || session.id}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {sessionsWithInsights.some(s => s.insight?.problems_solved && s.insight.problems_solved.length > 0) && (
            <Card className="p-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  해결한 문제
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessionsWithInsights.flatMap(session =>
                    session.insight?.problems_solved?.map((problem, idx) => ({
                      id: `${session.id}-${idx}`,
                      problem,
                      session
                    })) || []
                  ).slice(0, 5).map(({ id, problem, session }) => (
                    <div key={id} className="flex gap-2 items-start">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                        <span className="text-xs">✅</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{problem}</p>
                        <a
                          href={`/sessions/${session.id}`}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 inline-block"
                        >
                          상세보기 →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

           <Card className="p-6">
             <CardHeader className="pb-3">
               <CardTitle>시간 순 활동 기록</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-6">
                 {sessionsArray.map((session, idx) => (
                  <div key={session.id} className="relative">
                    {idx > 0 && (
                      <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
                    )}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 relative">
                        <div className="w-6 h-6 rounded-full bg-slate-600 dark:bg-slate-500 flex items-center justify-center text-xs text-white">
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {formatTime(session.started_at)}
                          </span>
                          {session.is_bookmarked && (
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs rounded">
                              ⭐ 하이라이트
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-2">
                          <span className="font-medium">{session.project_name || '프로젝트'}</span>
                          {session.git_branch && (
                            <span className="text-muted-foreground"> ({session.git_branch})</span>
                          )}
                        </p>
                        {session.summary && (
                          <p className="text-sm text-muted-foreground mb-2">{session.summary}</p>
                        )}
                        {session.insight && session.insight.key_learnings.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {session.insight.key_learnings.map((learning, learningIdx) => (
                              <span
                                key={`${session.id}-learning-${learningIdx}`}
                                className="px-2 py-1 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs rounded"
                              >
                                ✨ {learning}
                              </span>
                            ))}
                          </div>
                        )}
                        <a
                          href={`/sessions/${session.id}`}
                          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block"
                        >
                          상세보기 →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
