import { Component, type ReactNode } from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

/* ==========================================
   Route-level ErrorElement (for react-router errorElement)
   ========================================== */
export function RouteErrorBoundary() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred. Please try refreshing the page.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} — ${error.statusText}`;
    message = typeof error.data === 'string' ? error.data : 'Page not found or server error.';
  } else if (error instanceof Error) {
    title = error.name || 'Application Error';
    message = error.message;
  }

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        fontFamily: 'var(--sans, Inter, system-ui, sans-serif)',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#FEE2E2',
          display: 'grid',
          placeItems: 'center',
          fontSize: 28,
          marginBottom: 20,
        }}
      >
        ⚠️
      </div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#0B1220',
          margin: '0 0 10px',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: 14,
          color: '#64748B',
          maxWidth: 440,
          lineHeight: 1.6,
          margin: '0 0 28px',
        }}
      >
        {message}
      </p>
      <button
        onClick={() => window.location.href = '/'}
        style={{
          background: '#1F4FFF',
          color: 'white',
          border: 'none',
          padding: '10px 22px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Back to home
      </button>
    </div>
  );
}

/* ==========================================
   Class-based ErrorBoundary (for wrapping any component tree)
   ========================================== */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            padding: '24px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 12,
            fontSize: 13,
            color: '#DC2626',
            margin: '16px 0',
          }}
        >
          <strong>Component Error:</strong> {this.state.error?.message || 'Unknown error'}
          <br />
          <button
            style={{
              marginTop: 10,
              fontSize: 12,
              color: '#1F4FFF',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
            }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
