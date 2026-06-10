import React from 'react';

/**
 * ErrorBoundary - Catches and displays component errors gracefully
 * Prevents entire app from crashing on component errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: '#fef2f2',
            border: '2px solid #fecaca',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            margin: '40px auto'
          }}>
            <h1 style={{ color: '#991b1b', marginTop: 0 }}>Something went wrong</h1>
            <p style={{ color: '#7f1d1d', marginBottom: '16px' }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details style={{
                background: 'rgba(0,0,0,0.05)',
                padding: '12px',
                borderRadius: '6px',
                textAlign: 'left',
                fontSize: '12px',
                color: '#475569',
                cursor: 'pointer'
              }}>
                <summary style={{ fontWeight: 600, cursor: 'pointer' }}>Error Details</summary>
                <pre style={{ overflow: 'auto', marginTop: '8px' }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
