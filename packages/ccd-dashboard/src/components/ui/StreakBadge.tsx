import { useStreakStats } from '../../lib/api';

export function StreakBadge() {
  const { data: streak, isLoading } = useStreakStats();

  if (isLoading || !streak) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg animate-pulse">
        <span className="text-gray-400">🔥</span>
        <span className="text-sm text-gray-400">-</span>
      </div>
    );
  }

  const hasStreak = streak.current_streak > 0;

  return (
    <div
      className={`
        group relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all
        ${hasStreak
          ? 'bg-orange-50 hover:bg-orange-100'
          : 'bg-gray-100 hover:bg-gray-200'
        }
      `}
      aria-label={`Current streak: ${streak.current_streak} days`}
    >
      {/* Fire icon */}
      <span className={`text-lg transition-transform group-hover:scale-110 ${hasStreak ? '' : 'grayscale opacity-50'}`}>
        🔥
      </span>

      {/* Streak count */}
      <div className="flex flex-col">
        <span className={`text-sm font-bold ${hasStreak ? 'text-orange-600' : 'text-gray-500'}`}>
          {streak.current_streak}
        </span>
        <span className="text-xs text-gray-500">
          {streak.current_streak === 1 ? 'day' : 'days'}
        </span>
      </div>

      {/* Hover tooltip */}
      <div className="
        absolute top-full left-1/2 -translate-x-1/2 mt-2
        opacity-0 invisible group-hover:opacity-100 group-hover:visible
        transition-all duration-200 z-50
      ">
        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-400">Current Streak:</span>
              <span className="font-bold text-orange-400">{streak.current_streak} days</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-400">Longest Streak:</span>
              <span className="font-bold">{streak.longest_streak} days</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-400">Total Active Days:</span>
              <span className="font-bold">{streak.total_active_days} days</span>
            </div>
            {streak.streak_start_date && (
              <div className="flex items-center justify-between gap-3 pt-1 mt-1 border-t border-gray-700">
                <span className="text-gray-400">Started:</span>
                <span className="font-bold">{new Date(streak.streak_start_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      </div>
    </div>
  );
}
