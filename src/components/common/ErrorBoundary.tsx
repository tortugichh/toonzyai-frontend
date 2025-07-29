import React from 'react';
import { ActionIcon } from '@/components/ui/icons';
import { toastError } from '@/utils/toast';
import { secureLogger, sanitizeApiError } from '@/utils/secureLogging';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error securely
    const sanitizedError = sanitizeApiError(error);
    secureLogger.error('Error caught by boundary:', {
      error: sanitizedError,
      errorInfo: {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'ErrorBoundary'
      }
    });

    // Show toast notification instead of error screen
    const errorCount = this.state.errorCount + 1;
    this.setState({ errorCount });

    // Only show toast for the first few errors to avoid spam
    if (errorCount <= 3) {
      toastError(error);
    }

    // Reset error state after a delay to allow recovery
    setTimeout(() => {
      this.setState({ hasError: false, error: null });
    }, 1000);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorCount: 0 });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      // Default minimal fallback - just show a loading state
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Recovering from error...</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom fallback component for critical errors
export const CriticalErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) => {
  return (
    <div className="error-fallback min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <div className="text-6xl mb-4">😵</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Critical Error
        </h2>
        <p className="text-gray-600 mb-6">
          A critical error occurred. Please try refreshing the page.
        </p>
        <div className="space-y-3">
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center"
          >
            <ActionIcon action="refresh" className="w-4 h-4 mr-2" />
            Reload Page
          </button>
          <button
            onClick={resetError}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded transition-colors"
          >
            🔙 Try Again
          </button>
        </div>
      </div>
    </div>
  );
};
