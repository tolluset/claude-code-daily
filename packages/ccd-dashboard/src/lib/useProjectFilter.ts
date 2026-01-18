import { useMemo } from 'react';
import { useSessions } from './api';

export function useProjectFilter() {
  const { data: allData } = useSessions();

  const allSessions = allData?.sessions || [];

  const projects = useMemo(() => {
    const uniqueProjects = allSessions
      .map((s) => s.project_name)
      .filter((p): p is string => Boolean(p))
      .filter((p, index, arr) => arr.indexOf(p) === index);

    return uniqueProjects.sort();
  }, [allSessions]);

  return {
    allSessions,
    projects
  };
}
