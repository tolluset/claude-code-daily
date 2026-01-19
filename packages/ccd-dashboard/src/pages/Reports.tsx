import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format, startOfMonth } from 'date-fns';
import { useDailyStats, useAIReports, generateAIReport, type AIReport } from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { FileText, Calendar, ChevronRight, Sparkles, TrendingUp, Activity } from 'lucide-react';
import { formatNumber } from '../lib/utils';
import { buildQueryParams } from '../lib/query-params';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';

type TabType = 'daily' | 'ai';

export function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const today = new Date();

  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [selectedReport, setSelectedReport] = useState<AIReport | null>(null);

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    if (fromParam && toParam) {
      return {
        from: new Date(fromParam),
        to: new Date(toParam)
      };
    }

    return {
      from: startOfMonth(today),
      to: today
    };
  });

  const { data: dailyStats, error } = useDailyStats(
    activeTab === 'daily'
      ? (dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined)
      : undefined,
    activeTab === 'daily'
      ? (dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined)
      : undefined
  );

  const { data: aiReports = [], isLoading: aiLoading, error: aiError } = useAIReports(
    activeTab === 'ai' ? 'daily' : undefined
  );

  const generateMutation = useMutation({
    mutationFn: async () => {
      return generateAIReport('daily');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-reports'] });
    }
  });

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const stats = dailyStats || [];
  const sortedStats = [...stats].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (error && activeTab === 'daily') {
    return <ErrorState title="Error loading reports" minHeight="min-h-screen" />;
  }

  if (aiError && activeTab === 'ai') {
    return <ErrorState title="Error loading AI reports" minHeight="min-h-screen" />;
  }

  if (!dailyStats && activeTab === 'daily') {
    return <LoadingState minHeight="min-h-screen" />;
  }

  if (aiLoading && activeTab === 'ai') {
    return <LoadingState minHeight="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
          <p className="text-muted-foreground mt-1">
            {activeTab === 'daily' ? `${stats.length} days of activity` : `${aiReports.length} AI reports`}
          </p>
        </div>

        {activeTab === 'daily' && (
          <DateRangePicker
            value={dateRange}
            onChange={(value) => {
              if (value.from && value.to) {
                setDateRange({ from: value.from, to: value.to });
                const params = buildQueryParams(searchParams, {
                  from: value.from,
                  to: value.to
                });
                setSearchParams(params, { replace: true });
              }
            }}
          />
        )}

        {activeTab === 'ai' && (
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {generateMutation.isPending ? 'Generating...' : 'Generate Report'}
          </button>
        )}
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'daily'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Daily Stats
            </div>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Reports
            </div>
          </button>
        </nav>
      </div>

      {activeTab === 'daily' && (
        <>
          {sortedStats.length === 0 ? (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No daily reports available for this period</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedStats.map((stat) => {
                const dateObj = new Date(stat.date);
                const isToday = format(dateObj, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                const totalCost = ((stat.total_input_cost || 0) + (stat.total_output_cost || 0)).toFixed(2);

                return (
                  <Link
                    key={stat.date}
                    to={`/reports/${stat.date}`}
                    className="block"
                  >
                    <Card className="p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <h3 className="text-lg font-semibold">
                              {isToday ? 'Today' : format(dateObj, 'EEEE, MMMM d, yyyy')}
                            </h3>
                            {isToday && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Today
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-4 gap-4 mt-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Sessions</p>
                              <p className="text-lg font-semibold">{stat.session_count || 0}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Messages</p>
                              <p className="text-lg font-semibold">
                                {formatNumber(stat.message_count || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Tokens</p>
                              <p className="text-lg font-semibold">
                                {formatNumber((stat.total_input_tokens || 0) + (stat.total_output_tokens || 0))}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Cost</p>
                              <p className="text-lg font-semibold">${totalCost}</p>
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-muted-foreground ml-4" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {aiReports.length === 0 ? (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No AI reports available</p>
                  <p className="text-sm mt-2">Generate your first report to get started</p>
                </div>
              </Card>
            ) : (
              aiReports.map((report) => (
                <Card
                  key={report.id}
                  className="p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(report.report_date), 'MMM d, yyyy')}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                          {report.report_type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.content.slice(0, 100)}...
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
                  </div>
                </Card>
              ))
            )}
          </div>

          <div>
            {selectedReport ? (
              <Card className="p-6 h-fit">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {format(new Date(selectedReport.report_date), 'MMMM d, yyyy')}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Generated: {selectedReport.generated_at
                      ? format(new Date(selectedReport.generated_at), 'HH:mm')
                      : 'Unknown'}
                  </p>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                  {renderMarkdown(selectedReport.content)}
                </div>
              </Card>
            ) : (
              <Card className="p-12 h-fit">
                <div className="text-center text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a report to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function renderMarkdown(content: string) {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];

  for (const line of lines) {
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={line} className="text-2xl font-bold mt-6 mb-3">
          {line.slice(2)}
        </h2>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={line} className="text-xl font-semibold mt-5 mb-2">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h4 key={line} className="text-lg font-medium mt-4 mb-2">
          {line.slice(4)}
        </h4>
      );
    } else if (line.startsWith('- ')) {
      elements.push(
        <li key={line} className="ml-4 mb-1">
          {line.slice(2)}
        </li>
      );
    } else if (line.startsWith('| ') && line.endsWith(' |')) {
      const cells = line.split('|').filter(c => c.trim());
      elements.push(
        <tr key={line}>
          {cells.map((cell, idx) => (
            <td key={idx} className="border border-gray-300 dark:border-gray-600 px-3 py-1">
              {cell.trim()}
            </td>
          ))}
        </tr>
      );
    } else if (line.startsWith('---')) {
      elements.push(<hr key={line} className="my-4 border-gray-300 dark:border-gray-600" />);
    } else if (line.trim() === '') {
      elements.push(<br key={line} />);
    } else {
      elements.push(
        <p key={line} className="mb-2">
          {line}
        </p>
      );
    }
  }

  return <div>{elements}</div>;
}
