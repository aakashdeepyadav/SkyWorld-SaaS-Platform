import { Link } from 'react-router-dom';
import './AuthLayout.css';

const AuthLayout = ({ children, heading, subtext, footerText, footerLink, footerLabel }) => {
  return (
    <div className="auth-page">
      {/* ── Left: Premium brand panel ── */}
      <div className="auth-brand">
        {/* Animated background layers */}
        <div className="auth-brand__dots" />
        <div className="auth-brand__glow auth-brand__glow--1" />
        <div className="auth-brand__glow auth-brand__glow--2" />
        <div className="auth-brand__orb auth-brand__orb--1" />
        <div className="auth-brand__orb auth-brand__orb--2" />
        <div className="auth-brand__orb auth-brand__orb--3" />

        {/* Globe silhouette */}
        <div className="auth-brand__globe">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" stroke="rgba(0,191,255,.08)" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="60" stroke="rgba(0,191,255,.06)" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="40" stroke="rgba(0,191,255,.04)" strokeWidth="0.5" />
            <ellipse cx="100" cy="100" rx="80" ry="30" stroke="rgba(0,191,255,.06)" strokeWidth="0.5" />
            <ellipse cx="100" cy="100" rx="80" ry="55" stroke="rgba(0,191,255,.05)" strokeWidth="0.5" />
            <line x1="100" y1="20" x2="100" y2="180" stroke="rgba(0,191,255,.05)" strokeWidth="0.5" />
            <line x1="20" y1="100" x2="180" y2="100" stroke="rgba(0,191,255,.05)" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Content */}
        <div className="auth-brand__content">
          <Link to="/" className="auth-brand__logo" title="Go to Home">
            <img src="/wordmark_logo_white_fullname.png" alt="SkyWorld Ventures" />
          </Link>

          <div className="auth-brand__copy">
            <h1 className="auth-brand__h1">{heading}</h1>
            <p className="auth-brand__sub">{subtext}</p>
          </div>

          <div className="auth-brand__footer">
            <p>&copy; 2026 SkyWorld Ventures</p>
            <div className="auth-brand__trust">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <span>256-bit SSL encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="auth-form">
        <div className="auth-form__inner">
          {/* Mobile logo */}
          <Link to="/" className="auth-form__mobile-logo" title="Go to Home">
            <img src="/wordmark_logo_coloured_.png" alt="SkyWorld" />
          </Link>

          {children}

          {footerText && (
            <p className="auth-form__switch">
              {footerText}{' '}
              <Link to={footerLink} className="auth-form__switch-link">{footerLabel}</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
