type ErrorPanelProps = {
  title: string;
  error: Error | null;
  onRetry?: () => void;
};

export function ErrorPanel({ title, error, onRetry }: ErrorPanelProps) {
  if (!error) {
    return null;
  }

  return (
    <div className="rounded-md border border-red-400/30 bg-red-950/30 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-red-200">{title}</p>
          <p className="mt-1 text-sm text-red-100/80">{error.message}</p>
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded border border-red-300/30 px-3 py-1.5 text-sm font-medium text-red-100"
          >
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}
