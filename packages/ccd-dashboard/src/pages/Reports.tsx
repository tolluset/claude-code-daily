import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format, startOfMonth } from 'date-fns';
import { useDailyStats } from '../lib/api';
import { Card } from '../components/ui/Card';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { FileText, Calendar, ChevronRight } from 'lucide-react';
import { formatNumber } from '../lib/utils';

export function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = new Date();

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
    dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
  );

  const stats = dailyStats || [];

  const sortedStats = [...stats].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error loading reports</div>
      </div>
    );
  }

  if (!dailyStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Daily Reports</h1>
          <p className="text-muted-foreground mt-1">
            {stats.length} days of activity data
          </p>
        </div>

        <DateRangePicker
          value={dateRange}
          onChange={(value) => {
            if (value.from && value.to) {
              setDateRange({ from: value.from, to: value.to });
              const newSearchParams = new URLSearchParams(searchParams);
              newSearchParams.set('from', format(value.from, 'yyyy-MM-dd'));
              newSearchParams.set('to', format(value.to, 'yyyy-MM-dd'));
              setSearchParams(newSearchParams, { replace: true });
            }
          }}
        />
      </div>

      {sortedStats.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
    </div>
  );
}
