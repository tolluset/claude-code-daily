import { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { useDailyStats, useSessions } from '../lib/api';
import type { DailyStats } from '@ccd/types';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { TokenTrendChart } from '../components/ui/TokenTrendChart';
import { SessionBarChart } from '../components/ui/SessionBarChart';
import { ProjectPieChart } from '../components/ui/ProjectPieChart';
import { Card } from '../components/ui/Card';
import { Filter } from 'lucide-react';
import { extractProjectList } from '../lib/utils';

export function Reports() {
  const [dateRange, setDateRange] = useState(() => ({
    from: subDays(new Date(), 6),
    to: new Date()
  }));
  const [selectedProject, setSelectedProject] = useState<string>('');

  const { data: allData } = useSessions();
  const { data: dailyStats, isLoading, error } = useDailyStats(
    dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    undefined,
    selectedProject || undefined
  );

  const allSessions = allData?.sessions || [];
  const projects = extractProjectList(allSessions);

  const stats = dailyStats || [];

  const totalSessions = stats.reduce((sum: number, s: DailyStats) => sum + s.session_count, 0);
  const totalMessages = stats.reduce((sum: number, s: DailyStats) => sum + s.message_count, 0);
  const totalInputTokens = stats.reduce((sum: number, s: DailyStats) => sum + s.total_input_tokens, 0);
  const totalOutputTokens = stats.reduce((sum: number, s: DailyStats) => sum + s.total_output_tokens, 0);
  const avgSessionsPerDay = stats.length > 0 ? (totalSessions / stats.length).toFixed(1) : '0';

  const projectData = useMemo(() => {
    const filteredSessions = selectedProject
      ? allSessions.filter((s) => s.project_name === selectedProject)
      : allSessions.filter((s) => {
          const sessionDate = new Date(s.started_at);
          return sessionDate >= dateRange.from && sessionDate <= dateRange.to;
        });

    const projectCounts: Record<string, number> = {};
    for (const session of filteredSessions) {
      const project = session.project_name || 'Unknown';
      projectCounts[project] = (projectCounts[project] || 0) + 1;
    }

    const total = Object.values(projectCounts).reduce((sum, count) => sum + count, 0);

    return Object.entries(projectCounts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / total) * 100
      }))
      .sort((a, b) => b.value - a.value);
  }, [allSessions, selectedProject, dateRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error loading reports</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <div className="flex items-center gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={(value) => {
              if (value.from && value.to) {
                setDateRange({ from: value.from, to: value.to });
              }
            }}
          />
          {projects.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card className="p-6">
          <p className="text-sm text-gray-500 mb-1">Total Sessions</p>
          <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500 mb-1">Total Messages</p>
          <p className="text-2xl font-bold text-gray-900">{totalMessages.toLocaleString()}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500 mb-1">Input Tokens</p>
          <p className="text-2xl font-bold text-gray-900">{totalInputTokens.toLocaleString()}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500 mb-1">Output Tokens</p>
          <p className="text-2xl font-bold text-gray-900">{totalOutputTokens.toLocaleString()}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500 mb-1">Avg Sessions/Day</p>
          <p className="text-2xl font-bold text-gray-900">{avgSessionsPerDay}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Token Usage Trend</h2>
          {stats.length > 0 ? (
            <TokenTrendChart data={stats} height={250} />
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              No data available
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sessions per Day</h2>
          {stats.length > 0 ? (
            <SessionBarChart data={stats} height={250} />
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              No data available
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Distribution</h2>
          {projectData.length > 0 ? (
            <ProjectPieChart data={projectData} height={250} />
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              No project data available
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Statistics</h2>
        {stats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-right py-2 px-4 text-sm font-medium text-gray-500">Sessions</th>
                  <th className="text-right py-2 px-4 text-sm font-medium text-gray-500">Messages</th>
                  <th className="text-right py-2 px-4 text-sm font-medium text-gray-500">Input Tokens</th>
                  <th className="text-right py-2 px-4 text-sm font-medium text-gray-500">Output Tokens</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => (
                  <tr key={stat.date} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 text-sm text-gray-900">{stat.date}</td>
                    <td className="py-2 px-4 text-sm text-gray-900 text-right">{stat.session_count}</td>
                    <td className="py-2 px-4 text-sm text-gray-900 text-right">{stat.message_count.toLocaleString()}</td>
                    <td className="py-2 px-4 text-sm text-gray-900 text-right">{stat.total_input_tokens.toLocaleString()}</td>
                    <td className="py-2 px-4 text-sm text-gray-900 text-right">{stat.total_output_tokens.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            No data available
          </div>
        )}
      </Card>
    </div>
  );
}
