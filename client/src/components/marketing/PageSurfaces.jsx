import { Link } from 'react-router-dom';

const DEFAULT_RGB = '55, 187, 236';

const latticeMask =
  'radial-gradient(ellipse 85% 75% at 50% 35%, rgba(0,0,0,.65) 0%, rgba(0,0,0,.24) 56%, transparent 82%)';

export const PatternHero = ({ children, accent = DEFAULT_RGB, spotlight, className = '' }) => {
  const resolvedSpotlight =
    spotlight ||
    `radial-gradient(circle at 50% 18%, rgba(${accent}, .08) 0%, rgba(${accent}, .03) 28%, transparent 62%)`;

  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(45deg, rgba(${accent}, .10) 1px, transparent 1px), linear-gradient(-45deg, rgba(${accent}, .10) 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
          WebkitMaskImage: latticeMask,
          maskImage: latticeMask,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: resolvedSpotlight }}
      />
      <div className="relative">{children}</div>
    </div>
  );
};

export const PatternSection = ({
  children,
  accent = DEFAULT_RGB,
  background = 'rgba(248, 250, 252, 0.82)',
  borderColor = 'rgba(186, 230, 253, 0.7)',
  className = '',
}) => (
  <div
    className={`relative ${className}`}
    style={{ background, borderTop: `1px solid ${borderColor}` }}
  >
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(rgba(${accent}, .055) 1px, transparent 1px), linear-gradient(90deg, rgba(${accent}, .055) 1px, transparent 1px)`,
        backgroundSize: '44px 44px',
      }}
    />
    <div className="relative">{children}</div>
  </div>
);

export const BrandPatternSection = ({ children, className = '' }) => (
  <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: '#37BBEC' }}>
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          'radial-gradient(rgba(255,255,255,.16) 1.2px, transparent 1.2px), radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px)',
        backgroundSize: '26px 26px, 52px 52px',
        backgroundPosition: '0 0, 13px 13px',
      }}
    />
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'radial-gradient(circle at 18% 20%, rgba(255,255,255,.18) 0%, transparent 28%), radial-gradient(circle at 80% 78%, rgba(255,255,255,.12) 0%, transparent 24%)',
      }}
    />
    <div className="relative">{children}</div>
  </div>
);

export const AuthBrandPanel = ({ title, description }) => (
  <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-[#37BBEC] border-r border-sky-200/50">
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          'radial-gradient(rgba(255,255,255,.16) 1.2px, transparent 1.2px), radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px)',
        backgroundSize: '26px 26px, 52px 52px',
        backgroundPosition: '0 0, 13px 13px',
      }}
    />
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'radial-gradient(circle at 20% 24%, rgba(255,255,255,.18) 0%, transparent 30%), radial-gradient(circle at 82% 78%, rgba(255,255,255,.12) 0%, transparent 24%)',
      }}
    />
    <div className="flex flex-col justify-between p-12 xl:p-16 w-full relative z-10">
      <Link to="/" className="flex items-center w-fit" title="Go to Home">
        <img
          src="/wordmark_logo_white_fullname.png"
          alt="SkyWorld Ventures"
          className="h-9 w-auto object-contain"
        />
      </Link>

      <div>
        <h1 className="text-3xl xl:text-4xl font-bold text-white leading-snug">{title}</h1>
        <p className="text-white/78 mt-4 max-w-sm leading-relaxed">{description}</p>
      </div>

      <p className="text-white/55 text-sm">&copy; 2026 SkyWorld Ventures</p>
    </div>
  </div>
);
