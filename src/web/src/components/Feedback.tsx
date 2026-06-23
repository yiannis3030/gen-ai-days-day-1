interface AlertProps {
  readonly message: string;
  readonly tone?: 'error' | 'success';
}

export function Alert({ message, tone = 'error' }: AlertProps): JSX.Element {
  const styles =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${styles}`} role="alert">
      {message}
    </div>
  );
}

export function Spinner(): JSX.Element {
  return (
    <div className="flex items-center justify-center py-12 text-slate-400">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      <span className="ml-3 text-sm">Loading…</span>
    </div>
  );
}

export function EmptyState({ message }: { readonly message: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}

