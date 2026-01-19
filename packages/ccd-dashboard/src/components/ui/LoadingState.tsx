export interface LoadingStateProps {
  message?: string;
  minHeight?: string;
}

export function LoadingState({
  message = 'Loading...',
  minHeight = '400px'
}: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight }}>
      <div className="animate-pulse text-muted-foreground">{message}</div>
    </div>
  );
}
