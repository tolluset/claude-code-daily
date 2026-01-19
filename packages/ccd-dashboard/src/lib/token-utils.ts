import type { DailyStats } from '@ccd/types';

export function calculateTotalTokens(stats: DailyStats[] | undefined): {
  total: number;
  input: number;
  output: number;
} {
  if (!Array.isArray(stats)) {
    return { total: 0, input: 0, output: 0 };
  }
  return stats.reduce((acc, day) => ({
    total: acc.total + day.total_input_tokens + day.total_output_tokens,
    input: acc.input + day.total_input_tokens,
    output: acc.output + day.total_output_tokens
  }), { total: 0, input: 0, output: 0 });
}

export function getTokenBreakdown(stats: DailyStats | undefined) {
  if (!stats) {
    return { total: 0, input: 0, output: 0 };
  }
  return {
    total: stats.total_input_tokens + stats.total_output_tokens,
    input: stats.total_input_tokens,
    output: stats.total_output_tokens
  };
}
