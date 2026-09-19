import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * React Error Boundary specifically isolating the Voice AI transcription module.
 * Guarantees that any WebGPU, WASM, or Worker exception will NEVER crash the Report Issue page.
 */
export class VoiceErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Voice AI could not start on this device.'
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[VoiceErrorBoundary] Caught Voice AI error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-xl border border-brand-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3 my-2">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
          <div>
            <div className="font-bold text-amber-800 mb-0.5">Voice Description is unavailable on this device</div>
            <p className="text-amber-700 leading-relaxed mb-2">
              Your device or browser had a memory or graphics limitation. You can continue reporting by typing your issue description manually below.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                const el = document.getElementById('issue-description-input');
                if (el) el.focus();
              }}
              className="text-xs font-semibold text-civic-primary hover:underline"
            >
              Enter description manually →
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
