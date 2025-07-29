import React from 'react';
import { toastError } from '@/utils/toast';
import { secureLogger, sanitizeApiError } from '@/utils/secureLogging';

interface WithErrorHandlingProps {
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  options: WithErrorHandlingProps = {}
) {
  return class ErrorHandlingWrapper extends React.Component<P, { hasError: boolean; error: Error | null }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      // Log the error securely
      const sanitizedError = sanitizeApiError(error);
      secureLogger.error('Component error:', {
        error: sanitizedError,
        errorInfo: {
          componentStack: errorInfo.componentStack,
          componentName: Component.name
        }
      });

      // Show toast notification
      toastError(error);

      // Call custom error handler if provided
      if (options.onError) {
        options.onError(error, errorInfo);
      }

      // Reset error state after a delay
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 1000);
    }

    render() {
      if (this.state.hasError) {
        // Use custom fallback if provided
        if (options.fallback) {
          const FallbackComponent = options.fallback;
          return (
            <FallbackComponent 
              error={this.state.error!} 
              resetError={() => this.setState({ hasError: false, error: null })} 
            />
          );
        }

        // Default minimal fallback
        return (
          <div className="flex items-center justify-center p-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Recovering...</p>
            </div>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
}

// Hook-based error boundary for functional components
export function useErrorBoundary() {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    // Log the error securely
    const sanitizedError = sanitizeApiError(error);
    secureLogger.error('Hook error boundary:', {
      error: sanitizedError,
      errorInfo: {
        componentStack: errorInfo.componentStack
      }
    });

    // Show toast notification
    toastError(error);

    // Set error state
    setError(error);
    setHasError(true);

    // Reset after delay
    setTimeout(() => {
      setHasError(false);
      setError(null);
    }, 1000);
  }, []);

  const resetError = React.useCallback(() => {
    setHasError(false);
    setError(null);
  }, []);

  return {
    hasError,
    error,
    handleError,
    resetError,
  };
}

// Error boundary component for functional components
export const ErrorBoundaryHook: React.FC<{
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}> = ({ children, fallback }) => {
  const { hasError, error, handleError, resetError } = useErrorBoundary();

  if (hasError) {
    if (fallback) {
      const FallbackComponent = fallback;
      return <FallbackComponent error={error!} resetError={resetError} />;
    }

    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Recovering from error...</p>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onError: handleError,
          } as any);
        }
        return child;
      })}
    </React.Fragment>
  );
}; 