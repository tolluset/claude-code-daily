import { formatDateForApi } from './utils';

export function buildQueryParams(
  current: URLSearchParams,
  updates: {
    from?: Date;
    to?: Date;
    project?: string;
    query?: string;
    bookmarked?: boolean;
  }
): URLSearchParams {
  const params = new URLSearchParams(current);

  if (updates.from && updates.to) {
    params.set('from', formatDateForApi(updates.from));
    params.set('to', formatDateForApi(updates.to));
  } else {
    params.delete('from');
    params.delete('to');
  }

  if (updates.project) {
    params.set('project', updates.project);
  } else if (updates.project === '') {
    params.delete('project');
  }

  if (updates.query) {
    params.set('query', updates.query);
  } else if (updates.query === '') {
    params.delete('query');
  }

  if (updates.bookmarked !== undefined) {
    params.set('bookmarked', String(updates.bookmarked));
  } else {
    params.delete('bookmarked');
  }

  return params;
}
