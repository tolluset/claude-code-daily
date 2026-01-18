import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSession, useSessionMessages, toggleBookmark, deleteSession, useSessionInsight, updateInsightNotes, deleteInsight } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { SessionInsights } from '@/components/ui/SessionInsights';
import { formatDateTime, formatNumber } from '@/lib/utils';
import { Star, ArrowLeft, Copy, Check, User, Bot, GitBranch, Folder, HelpCircle, Trash2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading: sessionLoading } = useSession(id!);
  const { data: messages, isLoading: messagesLoading } = useSessionMessages(id!);
  const { data: insight, isLoading: insightLoading, refetch: refetchInsight } = useSessionInsight(id);
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-destructive">Session not found</div>
        <Link to="/sessions" className="text-primary hover:underline">
          Back to sessions
        </Link>
      </div>
    );
  }

  const handleBookmark = async () => {
    await toggleBookmark(session.id);
    queryClient.invalidateQueries({ queryKey: ['session', id] });
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(`/resume ${session.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete session "${session.project_name || session.id.slice(0, 8)}"?\nThis will also delete all messages in this session.`
    );
    if (confirmed) {
      await deleteSession(session.id);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      navigate('/sessions');
    }
  };

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    try {
      // Copy the session ID and show instructions
      await navigator.clipboard.writeText(session.id);
      alert(
        `Session ID copied to clipboard!\n\n` +
        `To generate insights:\n` +
        `1. Open Claude Code\n` +
        `2. Ask: "Analyze session ${session.id} and extract insights"\n` +
        `3. Claude will use MCP tools to analyze and save insights\n` +
        `4. Refresh this page to see the results`
      );
    } catch (error) {
      console.error('Failed to copy session ID:', error);
      alert('Failed to copy session ID');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    await updateInsightNotes(session.id, notes);
    await refetchInsight();
  };

  const handleDeleteInsight = async () => {
    await deleteInsight(session.id);
    await refetchInsight();
  };

  const isActive = !session.ended_at;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/sessions"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {session.project_name || '(unknown)'}
            </h1>
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-muted text-muted-foreground'
            }`}>
              {isActive ? 'Active' : 'Ended'}
            </span>
          </div>
          <p className="text-muted-foreground">{formatDateTime(session.started_at)}</p>
        </div>
        <IconButton
          type="button"
          size="lg"
          onClick={handleBookmark}
          title="Toggle bookmark"
        >
          <Star
            className={`h-6 w-6 ${
              session.is_bookmarked
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-muted-foreground'
            }`}
          />
        </IconButton>
        <IconButton
          variant="destructive"
          size="lg"
          type="button"
          onClick={handleDelete}
          title="Delete session"
        >
          <Trash2 className="h-6 w-6" />
        </IconButton>
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{session.cwd}</span>
            </div>
            {session.git_branch && (
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{session.git_branch}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Session ID:</div>
            <code className="text-sm bg-muted px-2 py-1 rounded">{session.id}</code>
            <IconButton
              type="button"
              size="sm"
              onClick={handleCopyId}
              title="Copy session ID"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </IconButton>
            <div className="relative group">
              <IconButton type="button" size="sm" title="Resume help">
                <HelpCircle className="h-4 w-4" />
              </IconButton>
              <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 w-72 p-3 rounded-lg border bg-popover text-popover-foreground shadow-md text-xs">
                <div className="font-medium mb-2">Resume this session:</div>
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Terminal:</span>
                    <code className="ml-1 bg-muted px-1.5 py-0.5 rounded">claude --resume &lt;session_id&gt;</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Claude Code:</span>
                    <code className="ml-1 bg-muted px-1.5 py-0.5 rounded">/resume &lt;session_id&gt;</code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {session.bookmark_note && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Bookmark Note</div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">{session.bookmark_note}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Insights */}
      {insightLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading insights...
          </CardContent>
        </Card>
      ) : insight ? (
        <SessionInsights
          insight={insight}
          onNotesUpdate={handleUpdateNotes}
          onDelete={handleDeleteInsight}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💡 Session Insights</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                No insights generated yet for this session.
              </p>
              <button
                onClick={handleGenerateInsights}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                {isGenerating ? 'Preparing...' : 'Generate Insights'}
              </button>
              <p className="text-xs text-muted-foreground">
                Uses Claude Code's built-in AI to analyze this session
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Conversation History {messages && `(${messages.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messagesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !messages || messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 p-4 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-primary/5'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {message.type === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {message.type === 'user' ? 'User' : 'Claude'}
                      </span>
                      {message.model && (
                        <span className="text-xs text-muted-foreground">
                          {message.model}
                        </span>
                      )}
                      {(message.input_tokens || message.output_tokens) && (
                        <span className="text-xs text-muted-foreground">
                          {formatNumber(message.input_tokens || 0)} / {formatNumber(message.output_tokens || 0)} tokens
                        </span>
                      )}
                    </div>
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {message.content || '(no content)'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
