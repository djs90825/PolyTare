import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string | null;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PolyTare Architecture Error:', error, errorInfo);
  }

  public componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // The core fix: If the engine provides a new file URL, reset the error state automatically.
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  private forceReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-300 z-50">
          <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-lg text-center max-w-sm shadow-xl">
            <h2 className="text-red-400 font-bold mb-2 tracking-wide uppercase text-sm">Viewport Engine Error</h2>
            <p className="text-sm text-slate-400 mb-4">
              The 3D model failed to render during the initial pass.
            </p>
            <p className="text-xs text-red-500/80 bg-red-500/5 p-3 rounded font-mono break-words mb-4">
              {this.state.errorMessage}
            </p>
            <button
              onClick={this.forceReset}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors font-medium border border-slate-700 hover:border-slate-500"
            >
              Force Reload Viewport
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}