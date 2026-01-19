import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { buildQueryParams } from '@/lib/query-params';

export function useDateRangeFilter(defaultRange?: { from: Date; to: Date }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const dateRange = useMemo(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    if (fromParam && toParam) {
      return {
        from: new Date(fromParam),
        to: new Date(toParam)
      };
    }

    return defaultRange || { from: undefined, to: undefined };
  }, [searchParams, defaultRange]);

  const updateDateRange = useCallback((range: { from?: Date; to?: Date }) => {
    const params = buildQueryParams(searchParams, range);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  return { dateRange, updateDateRange };
}
