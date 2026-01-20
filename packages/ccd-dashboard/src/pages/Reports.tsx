import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format, startOfMonth } from 'date-fns';
import { useDailyStats /* , useAIReports, generateAIReport, type AIReport */ } from '../lib/api';
// import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { /* FileText, */ Calendar, ChevronRight, /* Sparkles, TrendingUp, */ Activity } from 'lucide-react';
import { formatNumber } from '../lib/utils';
import { buildQueryParams } from '../lib/query-params';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';

type TabType = 'daily' /* | 'ai' */;

export function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  // const queryClient = useQueryClient();
  const today = new Date();

  const [activeTab/* , setActiveTab */] = useState<TabType>('daily');
  // const [selectedReport, setSelectedReport] = useState<AIReport | null>(null);

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

  /* AI Reports hooks - temporarily disabled
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
  */

  const stats = dailyStats || [];
  const sortedStats = [...stats].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (error && activeTab === 'daily') {
    return <ErrorState title="Error loading reports" minHeight="min-h-screen" />;
  }

  /* AI Reports error handling - temporarily disabled
  if (aiError && activeTab === 'ai') {
    return <ErrorState title="Error loading AI reports" minHeight="min-h-screen" />;
  }
  */

  if (!dailyStats && activeTab === 'daily') {
    return <LoadingState minHeight="min-h-screen" />;
  }

  /* AI Reports loading state - temporarily disabled
  if (aiLoading && activeTab === 'ai') {
    return <LoadingState minHeight="min-h-screen" />;
  }
  */

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
          <p className="text-muted-foreground mt-1">
            {stats.length} days of activity
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

        {/* Generate Report button - temporarily disabled
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
        */}
      </div>

      {/* Tabs temporarily hidden - AI Reports tab disabled until API key setup is simplified */}
      {/* <div className="border-b border-gray-200 dark:border-gray-700">
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
      </div> */}

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

      {/* AI Reports tab content - temporarily disabled */}
      {/* {activeTab === 'ai' && (
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
      )} */}
    </div>
  );
}

function renderMarkdown(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactElement[] = [];
  let listItems: React.ReactElement[] = [];
  let tableRows: React.ReactElement[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc ml-6 mb-4">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <table key={`table-${elements.length}`} className="min-w-full border-collapse mb-4">
          <tbody>{tableRows}</tbody>
        </table>
      );
      tableRows = [];
    }
  };

  const flushCodeBlock = () => {
    if (codeLines.length > 0) {
      elements.push(
        <pre key={`code-${elements.length}`} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 overflow-x-auto">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      codeLines = [];
    }
  };

  lines.forEach((line, index) => {
    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    // Handle headings
    if (line.startsWith('# ')) {
      flushList();
      flushTable();
      elements.push(
        <h2 key={`h2-${index}`} className="text-2xl font-bold mt-6 mb-3">
          {line.slice(2)}
        </h2>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      flushTable();
      elements.push(
        <h3 key={`h3-${index}`} className="text-xl font-semibold mt-5 mb-2">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith('### ')) {
      flushList();
      flushTable();
      elements.push(
        <h4 key={`h4-${index}`} className="text-lg font-medium mt-4 mb-2">
          {line.slice(4)}
        </h4>
      );
    } else if (line.startsWith('- ')) {
      flushTable();
      listItems.push(
        <li key={`li-${index}`} className="mb-1">
          {line.slice(2)}
        </li>
      );
    } else if (line.startsWith('| ') && line.endsWith(' |')) {
      flushList();
      const cells = line.split('|').filter(c => c.trim());
      // Skip separator rows like |---|---|
      if (!cells.every(cell => cell.trim().match(/^-+$/))) {
        tableRows.push(
          <tr key={`tr-${index}`}>
            {cells.map((cell, idx) => (
              <td key={`td-${index}-${idx}`} className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                {cell.trim()}
              </td>
            ))}
          </tr>
        );
      }
    } else if (line.startsWith('---')) {
      flushList();
      flushTable();
      elements.push(<hr key={`hr-${index}`} className="my-4 border-gray-300 dark:border-gray-600" />);
    } else if (line.trim() === '') {
      flushList();
      flushTable();
      elements.push(<div key={`space-${index}`} className="h-2" />);
    } else {
      flushList();
      flushTable();
      // Handle bold and inline code
      const formattedLine = formatInlineMarkdown(line);
      elements.push(
        <p key={`p-${index}`} className="mb-2">
          {formattedLine}
        </p>
      );
    }
  });

  // Flush any remaining items
  flushList();
  flushTable();
  flushCodeBlock();

  return <div>{elements}</div>;
}

// Helper function to format inline markdown (bold, code, etc.)
function formatInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  let key = 0;

  // Match **bold**, `code`, and [links](url)
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\))/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > currentIndex) {
      parts.push(text.substring(currentIndex, match.index));
    }

    const matched = match[0];
    if (matched.startsWith('**') && matched.endsWith('**')) {
      // Bold
      parts.push(
        <strong key={`bold-${key++}`} className="font-semibold">
          {matched.slice(2, -2)}
        </strong>
      );
    } else if (matched.startsWith('`') && matched.endsWith('`')) {
      // Inline code
      parts.push(
        <code key={`code-${key++}`} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">
          {matched.slice(1, -1)}
        </code>
      );
    } else if (match[2] && match[3]) {
      // Link
      parts.push(
        <a key={`link-${key++}`} href={match[3]} className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
          {match[2]}
        </a>
      );
    }

    currentIndex = match.index + matched.length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }

  return parts.length > 0 ? parts : text;
}
