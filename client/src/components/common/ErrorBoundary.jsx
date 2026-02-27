import { Component } from 'react';
import { Link } from 'react-router-dom';

/**
 * Top-level error boundary — catches React render errors
 * and shows a clean fallback UI instead of a white screen.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // TODO: Send to Sentry / external error tracker
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
                fontFamily: "'Inter', system-ui, sans-serif",
                padding: '24px',
            }}>
                <div style={{ textAlign: 'center', maxWidth: 440 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 14,
                        background: '#fef2f2', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px', fontSize: 24,
                    }}>
                        ⚠️
                    </div>
                    <h1 style={{
                        fontSize: 22, fontWeight: 700,
                        color: '#0f172a', margin: '0 0 8px',
                        letterSpacing: '-0.02em',
                    }}>
                        Something went wrong
                    </h1>
                    <p style={{
                        fontSize: 14, lineHeight: 1.6,
                        color: '#64748b', margin: '0 0 28px',
                    }}>
                        An unexpected error occurred. This has been logged and we'll look into it.
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button
                            onClick={() => {
                                this.handleReset();
                                window.location.reload();
                            }}
                            style={{
                                fontSize: 14, fontWeight: 600,
                                padding: '10px 20px', borderRadius: 8,
                                background: '#0ea5e9', color: '#fff',
                                border: 'none', cursor: 'pointer',
                            }}
                        >
                            Reload page
                        </button>
                        <Link
                            to="/"
                            onClick={this.handleReset}
                            style={{
                                fontSize: 14, fontWeight: 600,
                                padding: '10px 20px', borderRadius: 8,
                                background: 'transparent', color: '#64748b',
                                border: '1px solid #e2e8f0', textDecoration: 'none',
                            }}
                        >
                            Go home
                        </Link>
                    </div>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre style={{
                            marginTop: 32, padding: 16, borderRadius: 8,
                            background: '#1e293b', color: '#f87171',
                            fontSize: 12, textAlign: 'left',
                            overflow: 'auto', maxHeight: 200,
                        }}>
                            {this.state.error.toString()}
                        </pre>
                    )}
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
