import { useTodayStats, useDailyStats } from '../../lib/api';
import { formatNumber } from '../../lib/utils';
import { useMemo } from 'react';
import { getTokenBreakdown, calculateTotalTokens } from '../../lib/token-utils';

export function TokenUsageBadge() {
  const { data: todayData } = useTodayStats();
  const { data: weeklyData } = useDailyStats(undefined, undefined, 7);
  const { data: monthlyData } = useDailyStats(undefined, undefined, 30);

  if (!todayData) {
    return (
      <div className="group relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 animate-pulse">
        <span className="text-lg">⚡</span>
        <div className="flex flex-col">
          <span className="text-sm text-gray-400">-</span>
        </div>
      </div>
    );
  }

  const todayTokens = useMemo(() => getTokenBreakdown(todayData.stats), [todayData]);
  const weekTokens = useMemo(() => calculateTotalTokens(weeklyData || []), [weeklyData]);
  const monthTokens = useMemo(() => calculateTotalTokens(monthlyData || []), [monthlyData]);

  return (
    <div
      className="group relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 transition-all"
    >
      <span className="text-lg">⚡</span>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
          {formatNumber(todayTokens.total)}
        </span>
        <span className="text-xs text-gray-500 hidden md:block">
          tokens
        </span>
      </div>

      <div className="
        absolute bottom-full left-1/2 -translate-x-1/2 mb-2
        opacity-0 invisible group-hover:opacity-100 group-hover:visible
        transition-all duration-200 z-50
      ">
        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
          <div className="flex flex-col gap-1">
            <div className="font-bold text-blue-400 mb-1">Token Usage</div>

            <div className="flex justify-between gap-3">
              <span className="text-gray-400">Today:</span>
              <span className="font-bold">{formatNumber(todayTokens.total)}</span>
            </div>
            <div className="pl-4 text-gray-500 text-[10px]">
              In: {formatNumber(todayTokens.input)} / Out: {formatNumber(todayTokens.output)}
            </div>

            <div className="flex justify-between gap-3 mt-1">
              <span className="text-gray-400">Week:</span>
              <span className="font-bold">{formatNumber(weekTokens.total)}</span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-gray-400">Month:</span>
              <span className="font-bold">{formatNumber(monthTokens.total)}</span>
            </div>
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      </div>
    </div>
  );
}
