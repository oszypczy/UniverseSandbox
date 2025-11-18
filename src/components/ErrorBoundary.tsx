import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#000011',
            color: '#ffffff',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️ Błąd Renderowania</h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', maxWidth: '600px' }}>
            Wystąpił błąd podczas renderowania symulacji. To może być spowodowane problemem z WebGL
            lub Three.js.
          </p>
          <details style={{ marginBottom: '2rem', maxWidth: '800px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>
              Szczegóły techniczne
            </summary>
            <pre
              style={{
                backgroundColor: '#1a1a2e',
                padding: '1rem',
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '0.9rem',
              }}
            >
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              backgroundColor: '#4488ff',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#5599ff')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#4488ff')}
          >
            🔄 Przeładuj Stronę
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
