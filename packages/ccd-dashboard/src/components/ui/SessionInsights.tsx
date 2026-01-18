import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import type { SessionInsight } from '@ccd/types';

interface SessionInsightsProps {
  insight: SessionInsight;
  onNotesUpdate?: (notes: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

export function SessionInsights({ insight, onNotesUpdate, onDelete }: SessionInsightsProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(insight.user_notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNotes = async () => {
    if (!onNotesUpdate) return;

    setIsSaving(true);
    try {
      await onNotesUpdate(notes);
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('Delete this insight? This action cannot be undone.')) return;

    try {
      await onDelete();
    } catch (error) {
      console.error('Failed to delete insight:', error);
      alert('Failed to delete insight');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">💡 Session Insights</CardTitle>
          <div className="flex items-center gap-2">
            {insight.difficulty && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyColors[insight.difficulty]}`}>
                {insight.difficulty.toUpperCase()}
              </span>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Generated {new Date(insight.generated_at).toLocaleString()}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        {insight.summary && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Summary</h4>
            <p className="text-sm text-muted-foreground">{insight.summary}</p>
          </div>
        )}

        {/* Key Learnings */}
        {insight.key_learnings && insight.key_learnings.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">✨ Key Learnings</h4>
            <ul className="list-disc list-inside space-y-1">
              {insight.key_learnings.map((learning, i) => (
                <li key={i} className="text-sm text-muted-foreground">{learning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Problems Solved */}
        {insight.problems_solved && insight.problems_solved.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">✅ Problems Solved</h4>
            <ul className="list-disc list-inside space-y-1">
              {insight.problems_solved.map((problem, i) => (
                <li key={i} className="text-sm text-muted-foreground">{problem}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Code Patterns */}
        {insight.code_patterns && insight.code_patterns.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">🔧 Code Patterns</h4>
            <ul className="list-disc list-inside space-y-1">
              {insight.code_patterns.map((pattern, i) => (
                <li key={i} className="text-sm text-muted-foreground">{pattern}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Technologies */}
        {insight.technologies && insight.technologies.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">🛠️ Technologies</h4>
            <div className="flex flex-wrap gap-2">
              {insight.technologies.map((tech, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* User Notes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">📝 Your Notes</h4>
            {onNotesUpdate && !isEditingNotes && (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {insight.user_notes ? 'Edit' : 'Add notes'}
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border rounded text-sm min-h-[80px] bg-background"
                placeholder="Add your own notes about this session..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setNotes(insight.user_notes || '');
                    setIsEditingNotes(false);
                  }}
                  disabled={isSaving}
                  className="px-3 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {insight.user_notes || <span className="italic">No notes yet</span>}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
