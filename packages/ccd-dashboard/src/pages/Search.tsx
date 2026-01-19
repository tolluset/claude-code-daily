import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Calendar, Clock, FileText, Bookmark, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { MessageContent } from '../components/MessageContent';
import { useDebounce } from '../hooks/useDebounce';
import { useSearchResults } from '../lib/api';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [project, setProject] = useState(searchParams.get('project') || '');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(searchParams.get('bookmarked') === 'true');
  const MAX_SEARCH_LENGTH = 200;
  const DEBOUNCE_DELAY = 300;

  useEffect(() => {
    const currentQuery = searchParams.get('q') || '';
    setSearchInput(currentQuery);
    setProject(searchParams.get('project') || '');
    setBookmarkedOnly(searchParams.get('bookmarked') === 'true');
  }, [searchParams]);

  const performSearch = useCallback((value: string) => {
    const trimmedQuery = value.trim();
    if (trimmedQuery.length > MAX_SEARCH_LENGTH) {
      return;
    }
    if (trimmedQuery) {
      const params = new URLSearchParams();
      params.set('q', trimmedQuery);
      if (project) params.set('project', project);
      if (bookmarkedOnly) params.set('bookmarked', 'true');
      setSearchParams(params, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [project, bookmarkedOnly, setSearchParams]);

  const debouncedSearch = useDebounce<(value: string) => void>(performSearch, DEBOUNCE_DELAY);

  const handleInputChange = (value: string) => {
    setSearchInput(value);
    debouncedSearch(value);
  };

  const { data: results } = useSearchResults(
    query,
    searchParams.get('from') || undefined,
    searchParams.get('to') || undefined,
    project.trim() || undefined,
    bookmarkedOnly,
    20
  );

  const displayResults = Array.isArray(results) ? results : [];
  if (import.meta.env.DEV && !Array.isArray(results)) {
    console.error('Search results is not an array:', results);
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleFilterChange = (key: string, value: string | boolean) => {
    const params = new URLSearchParams(searchParams);
    if (value && (typeof value === 'string' ? value.trim() : value)) {
      params.set(key, String(value));
    } else {
      params.delete(key);
    }
    setSearchParams(params, { replace: true });
  };

  const handleClear = () => {
    setSearchParams({}, { replace: true });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'session_summary':
        return <Clock className="h-4 w-4 text-green-500" />;
      case 'bookmark_note':
        return <Bookmark className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              maxLength={MAX_SEARCH_LENGTH}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Search sessions and messages..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            {searchInput.length > 0 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {searchInput.length}/{MAX_SEARCH_LENGTH}
              </div>
            )}
          </div>
        </form>

        {query && (
          <div className="flex flex-wrap gap-4 mb-4">
            <input
              type="text"
              placeholder="Filter by project..."
              value={project}
              onChange={(e) => setProject(e.target.value)}
              onBlur={(e) => handleFilterChange('project', e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={bookmarkedOnly}
                onChange={(e) => {
                  setBookmarkedOnly(e.target.checked);
                  handleFilterChange('bookmarked', e.target.checked);
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Bookmarked only</span>
            </label>
          </div>
        )}
      </div>

        {query && !results && (
          <div className="flex items-center justify-center py-12">
             <div className="flex items-center gap-3">
               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
               <div className="text-gray-500">Searching...</div>
             </div>
          </div>
        )}

      {query && results && displayResults.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg text-gray-600">No results found for "{query}"</p>
            <p className="text-sm mt-2 text-gray-500">Try different keywords or adjust your filters</p>
          </div>
        </div>
      )}

      {query && results && displayResults.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {displayResults.length === 0 ? (
                <span>No results found for "{query}"</span>
              ) : (
                <span>{displayResults.length} result{displayResults.length !== 1 ? 's' : ''} found for "{query}"</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors px-2 py-1 rounded hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>

          <div className="space-y-4">
            {displayResults.map((result, index) => (
              <Card key={`${result.session_id}-${result.message_id}-${index}`} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getTypeIcon(result.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {result.is_bookmarked && (
                        <span className="text-yellow-500">⭐</span>
                      )}
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Bookmark className="h-3 w-3" />
                        {result.project_name || 'Unknown Project'}
                      </span>
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(result.timestamp)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Score: {result.score.toFixed(2)}
                      </span>
                    </div>

                     <MessageContent
                       content={result.snippet || result.content}
                       className="text-gray-900 mb-3"
                     />

                     <a
                       href={`/sessions/${result.session_id}`}
                       className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                       aria-label="View session details"
                     >
                       View Session
                       <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                       </svg>
                     </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!query && (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <div className="text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">Enter a search query to find sessions and messages</p>
            <p className="text-sm mt-2">Search across session summaries, bookmark notes, and message content</p>
          </div>
        </div>
      )}
    </div>
  );
}
