export interface ErrorStateProps {
  title?: string;
  message?: string;
  minHeight?: string;
}

export function ErrorState({
  title = 'Cannot connect to server',
  message = 'The server will start automatically when you start a Claude Code session.',
  minHeight = '400px'
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight }}>
      <div className="text-destructive">{title}</div>
      <div className="text-sm text-muted-foreground">{message}</div>
    </div>
  );
}
