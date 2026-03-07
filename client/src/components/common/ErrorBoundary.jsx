import { Component } from 'react';

/**
 * Top-level error boundary — catches React render errors
 * and shows a polished, branded fallback UI instead of a white screen.
 *
 * Uses inline styles exclusively because Tailwind / CSS may not have loaded
 * when this boundary catches errors during initial render.
 */

const isDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

/* ── colour tokens (light / dark) ── */
const t = (light, dark) => (isDark() ? dark : light);

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null, showStack: false };
  }

  static getDerivedStateFromError(error) {
    // Generate a short reference ID for support
    const errorId = `ERR-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorId: null, showStack: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const bg = t('#f8fafc', '#0f172a');
    const cardBg = t('#ffffff', '#1e293b');
    const cardBorder = t('#e2e8f0', '#334155');
    const headingColor = t('#0f172a', '#f1f5f9');
    const textColor = t('#64748b', '#94a3b8');
    const subtleText = t('#94a3b8', '#64748b');
    const accentColor = '#37BBEC';
    const iconBg = t('#eff6ff', '#1e3a5f');
    const iconStroke = t('#3b82f6', '#60a5fa');
    const btnPrimaryBg = accentColor;
    const btnSecBg = t('#f1f5f9', '#334155');
    const btnSecColor = t('#475569', '#cbd5e1');
    const btnSecBorder = t('#e2e8f0', '#475569');
    const dividerColor = t('#f1f5f9', '#334155');
    const preBg = t('#0f172a', '#020617');

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bg,
          fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
          padding: '24px',
          margin: 0,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 480,
            background: cardBg,
            borderRadius: 20,
            border: `1px solid ${cardBorder}`,
            boxShadow: isDark()
              ? '0 25px 50px -12px rgba(0,0,0,0.5)'
              : '0 25px 50px -12px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Accent bar */}
          <div style={{ height: 4, background: accentColor }} />

          <div style={{ padding: '40px 36px 36px' }}>
            {/* Icon */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 28px',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke={iconStroke}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            {/* Heading */}
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: headingColor,
                margin: '0 0 10px',
                letterSpacing: '-0.025em',
                lineHeight: 1.3,
                textAlign: 'center',
              }}
            >
              Something went wrong
            </h1>

            {/* Description */}
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.65,
                color: textColor,
                margin: '0 0 8px',
                textAlign: 'center',
              }}
            >
              We encountered an unexpected error while loading this page. Our team has been notified
              and is looking into it.
            </p>

            {/* Error reference */}
            {this.state.errorId && (
              <p
                style={{
                  fontSize: 12,
                  color: subtleText,
                  textAlign: 'center',
                  margin: '0 0 28px',
                  fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                  letterSpacing: '0.02em',
                }}
              >
                Reference: {this.state.errorId}
              </p>
            )}

            {/* Action buttons */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                marginBottom: 0,
              }}
            >
              <button
                onClick={() => {
                  this.handleReset();
                  window.location.reload();
                }}
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '11px 24px',
                  borderRadius: 10,
                  background: btnPrimaryBg,
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  boxShadow: '0 4px 14px -3px rgba(55,187,236,0.4)',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px -3px rgba(55,187,236,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px -3px rgba(55,187,236,0.4)';
                }}
              >
                Reload Page
              </button>
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  this.handleReset();
                  window.location.href = '/';
                }}
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '11px 24px',
                  borderRadius: 10,
                  background: btnSecBg,
                  color: btnSecColor,
                  border: `1px solid ${btnSecBorder}`,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  letterSpacing: '0.01em',
                }}
              >
                Go Home
              </a>
            </div>
          </div>

          {/* Footer / support link */}
          <div
            style={{
              borderTop: `1px solid ${dividerColor}`,
              padding: '16px 36px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 13, color: subtleText, margin: 0 }}>
              Need help?{' '}
              <a
                href="mailto:support@skyworld.buzz"
                style={{
                  color: '#0ea5e9',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Contact Support
              </a>
            </p>
          </div>

          {/* Dev-only stack trace */}
          {import.meta.env?.DEV && this.state.error && (
            <div style={{ padding: '0 36px 24px' }}>
              <button
                onClick={() => this.setState((s) => ({ showStack: !s.showStack }))}
                style={{
                  fontSize: 12,
                  color: subtleText,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                  marginBottom: 8,
                  fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                }}
              >
                {this.state.showStack ? '▾ Hide' : '▸ Show'} error details
              </button>
              {this.state.showStack && (
                <pre
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    background: preBg,
                    color: '#f87171',
                    fontSize: 12,
                    lineHeight: 1.6,
                    textAlign: 'left',
                    overflow: 'auto',
                    maxHeight: 220,
                    margin: 0,
                    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                    border: '1px solid #1e293b',
                  }}
                >
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
