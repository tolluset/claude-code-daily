import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSession, useSessionMessages, useSessionInsight, updateInsightNotes, deleteInsight } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { SessionInsights } from '@/components/ui/SessionInsights';
import { MessageContent } from '@/components/MessageContent';
import { formatDateTime, formatNumber } from '@/lib/utils';
import { Bookmark, ArrowLeft, Copy, Check, User, Bot, GitBranch, Folder, Trash2, Sparkles, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSessionActions } from '@/hooks/useSessionActions';
import { ResumeHelpTooltip } from '@/components/ui/ResumeHelpTooltip';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-destructive">Session ID not found</div>
        <Link to="/sessions" className="text-primary hover:underline">
          Back to sessions
        </Link>
      </div>
    );
  }

  const queryClient = useQueryClient();
  const { data: session } = useSession(id);
  const { data: messages } = useSessionMessages(id);
  const { data: insight, refetch: refetchInsight } = useSessionInsight(id);
  const { handleBookmark, handleCopyId, handleDelete, copiedId } = useSessionActions();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    setNotes(insight?.user_notes || '');
  }, [insight]);

  if (!session) {
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

  const handleDeleteWithNav = async () => {
    const sessionId = session.id;
    await handleDelete(session);
    // Cancel any ongoing queries for this session to prevent 404 errors
    queryClient.cancelQueries({ queryKey: ['session', sessionId] });
    queryClient.removeQueries({ queryKey: ['session', sessionId] });
    navigate('/sessions');
  };

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    try {
      // Copy the full claude command to clipboard
      const claudeCommand = `claude --resume ${session.id} -p "Analyze session ${session.id} and extract insights"`;
      await navigator.clipboard.writeText(claudeCommand);

      toast.success('Command copied to clipboard!', {
        description: (
          <div className="space-y-2 text-sm">
            <div className="font-mono text-xs bg-black/10 dark:bg-white/10 p-2 rounded break-all">
              {claudeCommand}
            </div>
            <div className="text-xs">
              Paste this command in your terminal to generate insights
            </div>
          </div>
        ),
        duration: 6000,
      });
    } catch (error) {
      console.error('Failed to copy command:', error);
      toast.error('Failed to copy command', {
        description: 'Please try again',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const handleUpdateNotes = async (notes: string) => {
    await updateInsightNotes(session.id, notes);
    await refetchInsight();
  };

  const handleDeleteInsight = async () => {
    await deleteInsight(session.id);
    await refetchInsight();
  };

  const handleSaveNotes = async () => {
    if (!session?.id) return;

    setIsSavingNotes(true);
    try {
      await updateInsightNotes(session.id, notes);
      setIsEditingNotes(false);
      await refetchInsight();
      toast.success('Notes saved successfully');
    } catch (error) {
      console.error('Failed to save notes:', error);
      toast.error('Failed to save notes', {
        description: 'Please try again',
      });
    } finally {
      setIsSavingNotes(false);
    }
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
            <span className={`px-2 py-0.5 text-xs rounded-full ${isActive
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
          onClick={() => handleBookmark(session)}
          title="Toggle bookmark"
        >
          <Bookmark
            className={`h-6 w-6 ${session.is_bookmarked
              ? 'text-yellow-500 fill-yellow-500'
              : 'text-muted-foreground'
              }`}
          />
        </IconButton>
        <IconButton
          variant="destructive"
          size="lg"
          type="button"
          onClick={handleDeleteWithNav}
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
              onClick={() => handleCopyId(session.id)}
              title="Copy session ID"
            >
              {copiedId === session.id ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </IconButton>
            <ResumeHelpTooltip position="left" />
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
      {!insight ? (
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
        <>
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
                  type="button"
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                📝 Session Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isEditingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-3 border rounded text-sm min-h-[120px] bg-background"
                      placeholder="Add your notes about this session..."
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSavingNotes ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingNotes(false);
                        }}
                        disabled={isSavingNotes}
                        className="px-4 py-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="p-3 bg-muted/50 rounded text-sm min-h-[80px]">
                      {notes || <span className="italic text-muted-foreground">No notes yet</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingNotes(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-2"
                    >
                      {notes ? 'Edit notes' : 'Add notes'}
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Conversation History {messages && `(${messages.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!messages ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !messages || !Array.isArray(messages) || messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 p-4 rounded-lg ${message.type === 'user'
                    ? 'bg-primary/10 dark:bg-primary/5'
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
                    <MessageContent
                      content={message.content || '(no content)'}
                      className="text-sm"
                    />
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
