import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center">
          <div className="mb-6 rounded-full bg-red-500/10 p-4 text-red-400 ring-1 ring-red-500/20">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <h1 className="mb-3 text-2xl font-bold text-zinc-100">
            Что-то пошло не так
          </h1>
          <p className="mb-8 max-w-md text-zinc-400">
            Произошла непредвиденная ошибка. Пожалуйста, попробуйте перезагрузить страницу или вернуться на главную.
          </p>
          {this.state.error && (
            <div className="mb-8 max-w-2xl rounded-lg bg-zinc-900 p-4 text-left">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Ошибка
              </p>
              <p className="font-mono text-sm text-red-400">
                {this.state.error.message}
              </p>
            </div>
          )}
          <div className="flex gap-4">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              <RefreshCw className="h-4 w-4" />
              Попробовать снова
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg bg-zinc-800 px-6 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-700"
            >
              <Home className="h-4 w-4" />
              На главную
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for async error handling
export function useAsyncError() {
  const [, setError] = React.useState<Error | null>(null);
  
  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}
