import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("PolyTare Viewport Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-8">
          <h2 className="text-lg font-bold text-white mb-2">Viewport Context Lost</h2>
          <p className="text-xs mb-6 text-center">The WebGL engine encountered an error.</p>
          <button 
            className="bg-emerald-500 text-slate-950 px-4 py-2 rounded font-bold text-xs uppercase"
            onClick={() => window.location.reload()}
          >
            Retry Viewport
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}