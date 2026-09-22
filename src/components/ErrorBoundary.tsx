import React from 'react';
import { AlertTriangle, RotateCcw, Download } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  onExportBackup?: () => void;
}

interface State {
  error: Error | null;
}

/**
 * Keeps a render error in one tab from blanking the whole app — and, more
 * importantly, offers a backup download before the user tries anything drastic.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Render error:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900/60 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-rose-100 p-2 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                This section hit an error
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Your records are safe — they are stored separately from the screen that failed.
                Download a backup first, then reload.
              </p>

              <p className="mt-3 rounded-lg bg-slate-50 p-2.5 font-mono text-[11px] break-words text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {error.message || 'Unknown error'}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reload the app
                </button>
                {this.props.onExportBackup && (
                  <button
                    onClick={this.props.onExportBackup}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download backup
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
