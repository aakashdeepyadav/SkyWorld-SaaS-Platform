import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';
import { useCatalog } from '../context/CatalogContext';
import {
  Seo,
  absoluteUrl,
  buildOrganizationSchema,
  buildWebsiteSchema,
} from '../components/seo/Seo';
import './PremiumHome.css';

/* ─── Scroll-triggered entrance ─── */
const FadeIn = ({ children, className = '', delay = 0, as: Tag = 'div' }) => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      className={`_fi ${vis ? '_fi-in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
};

/* ─── Animated number ─── */
const Num = ({ end, suffix = '' }) => {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  const [go, setGo] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setGo(true);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!go) return;
    let s = null;
    const tick = (t) => {
      if (!s) s = t;
      const p = Math.min((t - s) / 1600, 1);
      setVal(Math.floor((1 - (1 - p) ** 4) * end));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [go, end]);
  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
};

/* ─── SVG Icons ─── */
const ICONS = {
  web: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8"
    />
  ),
  brand: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
    />
  ),
  app: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  ),
  check: <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />,
  arrow: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
  ),
  clock: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  sparkle: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
    />
  ),
  star: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
    />
  ),
};

const Icon = ({ name, size = 22, strokeWidth = 1.5, className = '' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    viewBox="0 0 24 24"
    className={className}
  >
    {ICONS[name]}
  </svg>
);

/* ─── Process steps ─── */
const STEPS = [
  {
    n: '01',
    t: 'Brief',
    d: 'Share your vision. We scope, price, and assign your dedicated team within 24 hours.',
  },
  {
    n: '02',
    t: 'Build',
    d: 'Track milestones in real-time. Review work, iterate with direct feedback loops.',
  },
  {
    n: '03',
    t: 'Launch',
    d: 'Production-ready delivery with full handover and documentation. Pay only on approval.',
  },
];

/* ─── Portfolio projects ─── */
const PROJECTS = [
  {
    title: 'Spice Garden — Restaurant Platform',
    desc: 'Full-stack ordering system with digital menu in ₹, table reservations, and Google Business integration for an Indian restaurant.',
    img: '/portfolio-restaurant.png',
    tags: ['Web Development', 'Branding', 'SEO'],
  },
  {
    title: 'MedCare Plus — Clinic Suite',
    desc: 'Patient portal with appointment booking, doctor profiles across specialties, and integrated health service management.',
    img: '/portfolio-medical.png',
    tags: ['App Development', 'UI/UX Design'],
  },
  {
    title: 'Desi Threads — Fashion E-Commerce',
    desc: 'Modern e-commerce storefront for Indo-western fashion with catalog, cart, ₹ pricing, and payment gateway integration.',
    img: '/portfolio-ecommerce.png',
    tags: ['Web Development', 'E-Commerce'],
  },
  {
    title: 'GharDekho — Real Estate Portal',
    desc: 'Property listing platform with city-based search, ₹ Lakhs/Cr pricing, map integration, and mobile-first design for Indian buyers.',
    img: '/portfolio-realestate.png',
    tags: ['Full Stack', 'App Development'],
  },
];

/* ─── Testimonials ─── */
const TESTIMONIALS = [
  {
    quote: 'SkyWorld delivered our website faster than we expected. The quality of design and the attention to detail was impressive. Our online bookings increased by 40% in the first month.',
    name: 'Priya Sharma',
    role: 'Owner, Saffron Kitchen',
    initials: 'PS',
  },
  {
    quote: 'Professional, responsive, and genuinely invested in our success. The combo package saved us time and money while giving us everything we needed to launch our clinic online.',
    name: 'Dr. Rahul Mehta',
    role: 'Founder, MedCare Clinic',
    initials: 'RM',
  },
  {
    quote: 'The monthly maintenance plan has been a game-changer. We never worry about our site going down or falling behind on updates. Highly recommended for any growing business.',
    name: 'Ankit Verma',
    role: 'CEO, UrbanNest Properties',
    initials: 'AV',
  },
];

/* ─── Marquee items ─── */
const MARQUEE_ITEMS = [
  'Restaurants', 'Healthcare', 'E-Commerce', 'Real Estate',
  'Education', 'SaaS Products', 'Startups', 'Small Business',
  'Local Services', 'Professional Services', 'Hospitality', 'Retail',
];

/* ─── Social SVGs ─── */
const SocialIcons = {
  linkedin: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />,
  youtube: <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />,
  instagram: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />,
  twitter: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
  facebook: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
};

const SocialLink = ({ href, label, icon, size = 17 }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">{icon}</svg>
  </a>
);

/* ─── SkyWorld Immersive Hero Canvas ─── */
const SkyWorldCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let mouse = { x: -1000, y: -1000 };
    let smoothMouse = { x: -1000, y: -1000 };
    let stars = [];
    let shootingStars = [];
    let globeAngle = 0;
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
      initStars();
    };

    /* ── Deep-space star field ── */
    const initStars = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const count = Math.min(280, Math.floor((w * h) / 3200));
      stars = [];
      for (let i = 0; i < count; i++) {
        const z = Math.random();
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z,
          size: 0.3 + z * 2.2,
          twinkleSpeed: 0.01 + Math.random() * 0.03,
          twinklePhase: Math.random() * Math.PI * 2,
          color: z > 0.85
            ? { r: 56, g: 189, b: 248 }    // bright sky-blue stars
            : z > 0.7
            ? { r: 125, g: 211, b: 252 }   // lighter blue
            : z > 0.5
            ? { r: 199, g: 210, b: 254 }   // lavender
            : { r: 220, g: 230, b: 245 },  // white-ish
        });
      }
    };

    /* ── Shooting star spawner ── */
    const spawnShootingStar = (w, h) => {
      if (shootingStars.length >= 3) return;
      shootingStars.push({
        x: Math.random() * w * 0.7,
        y: Math.random() * h * 0.4,
        vx: 4 + Math.random() * 6,
        vy: 2 + Math.random() * 3,
        life: 1,
        decay: 0.012 + Math.random() * 0.01,
        len: 40 + Math.random() * 60,
      });
    };

    /* ── Globe wireframe geometry ── */
    const projectPoint = (lat, lon, radius, cx, cy, angle) => {
      const phi = (lat * Math.PI) / 180;
      const theta = ((lon + angle) * Math.PI) / 180;
      const x3d = radius * Math.cos(phi) * Math.sin(theta);
      const y3d = -radius * Math.sin(phi);
      const z3d = radius * Math.cos(phi) * Math.cos(theta);
      // Simple perspective
      const perspective = 600;
      const scale = perspective / (perspective + z3d);
      return {
        x: cx + x3d * scale,
        y: cy + y3d * scale,
        z: z3d,
        scale,
      };
    };

    const drawGlobe = (w, h) => {
      const isMobile = w < 600;
      const radius = isMobile ? Math.min(w * 0.32, 130) : Math.min(w * 0.22, 240);
      const cx = isMobile ? w * 0.5 : w * 0.72;
      const cy = h * 0.48;

      // Glow behind globe
      const glowGrd = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.8);
      glowGrd.addColorStop(0, 'rgba(0,191,255,.06)');
      glowGrd.addColorStop(0.3, 'rgba(14,165,233,.03)');
      glowGrd.addColorStop(0.6, 'rgba(99,102,241,.015)');
      glowGrd.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrd;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Latitude lines
      for (let lat = -75; lat <= 75; lat += 15) {
        ctx.beginPath();
        let started = false;
        for (let lon = 0; lon <= 360; lon += 3) {
          const p = projectPoint(lat, lon, radius, cx, cy, globeAngle);
          if (p.z < -radius * 0.15) continue;
          const alpha = 0.04 + (p.z / radius) * 0.08;
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
          ctx.strokeStyle = `rgba(56,189,248,${alpha})`;
        }
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // Longitude lines
      for (let lon = 0; lon < 360; lon += 20) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 3) {
          const p = projectPoint(lat, lon, radius, cx, cy, globeAngle);
          if (p.z < -radius * 0.15) continue;
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
        ctx.strokeStyle = 'rgba(56,189,248,.05)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Highlighted meridians — thicker, brighter
      [0, 90, 180, 270].forEach((lon) => {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 2) {
          const p = projectPoint(lat, lon, radius, cx, cy, globeAngle);
          if (p.z < -radius * 0.1) continue;
          const alpha = 0.06 + (p.z / radius) * 0.12;
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
          ctx.strokeStyle = `rgba(0,191,255,${alpha})`;
        }
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Equator — most prominent
      ctx.beginPath();
      let eqStarted = false;
      for (let lon = 0; lon <= 360; lon += 2) {
        const p = projectPoint(0, lon, radius, cx, cy, globeAngle);
        if (p.z < -radius * 0.1) continue;
        const alpha = 0.1 + (p.z / radius) * 0.2;
        if (!eqStarted) {
          ctx.moveTo(p.x, p.y);
          eqStarted = true;
        } else {
          ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = `rgba(0,191,255,${alpha})`;
      }
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Glowing dots at intersections
      for (let lat = -60; lat <= 60; lat += 30) {
        for (let lon = 0; lon < 360; lon += 40) {
          const p = projectPoint(lat, lon, radius, cx, cy, globeAngle);
          if (p.z < 0) continue;
          const alpha = (p.z / radius) * 0.5;
          const dotRadius = 1 + p.scale * 1.5;

          // Glow
          const dg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, dotRadius * 4);
          dg.addColorStop(0, `rgba(56,189,248,${alpha * 0.4})`);
          dg.addColorStop(1, 'transparent');
          ctx.fillStyle = dg;
          ctx.beginPath();
          ctx.arc(p.x, p.y, dotRadius * 4, 0, Math.PI * 2);
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(125,211,252,${alpha})`;
          ctx.fill();
        }
      }

      // Orbiting ring around globe
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius * 1.35, radius * 0.35, -0.35, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,191,255,.04)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Orbiting dot on the ring
      const orbitAngle = time * 0.4;
      const orbitX = cx + radius * 1.35 * Math.cos(orbitAngle) * Math.cos(-0.35) - radius * 0.35 * Math.sin(orbitAngle) * Math.sin(-0.35);
      const orbitY = cy + radius * 1.35 * Math.cos(orbitAngle) * Math.sin(-0.35) + radius * 0.35 * Math.sin(orbitAngle) * Math.cos(-0.35);
      const og = ctx.createRadialGradient(orbitX, orbitY, 0, orbitX, orbitY, 12);
      og.addColorStop(0, 'rgba(0,191,255,.8)');
      og.addColorStop(0.3, 'rgba(56,189,248,.3)');
      og.addColorStop(1, 'transparent');
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(orbitX, orbitY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(orbitX, orbitY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#7dd3fc';
      ctx.fill();
    };

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      time += 0.016;
      globeAngle += 0.15;

      // Smooth mouse
      smoothMouse.x += (mouse.x - smoothMouse.x) * 0.06;
      smoothMouse.y += (mouse.y - smoothMouse.y) * 0.06;

      /* ── Aurora / horizon glow at bottom ── */
      const auroraY = h * 0.85;
      const ag = ctx.createRadialGradient(w * 0.5, auroraY, 0, w * 0.5, auroraY, w * 0.6);
      ag.addColorStop(0, `rgba(0,191,255,${0.04 + Math.sin(time * 0.5) * 0.015})`);
      ag.addColorStop(0.3, `rgba(14,165,233,${0.025 + Math.sin(time * 0.3) * 0.01})`);
      ag.addColorStop(0.6, 'rgba(99,102,241,.01)');
      ag.addColorStop(1, 'transparent');
      ctx.fillStyle = ag;
      ctx.fillRect(0, 0, w, h);

      // Secondary aurora pulse
      const ag2 = ctx.createRadialGradient(w * 0.3, auroraY, 0, w * 0.3, auroraY, w * 0.35);
      ag2.addColorStop(0, `rgba(99,102,241,${0.02 + Math.sin(time * 0.7 + 1) * 0.01})`);
      ag2.addColorStop(1, 'transparent');
      ctx.fillStyle = ag2;
      ctx.fillRect(0, 0, w, h);

      /* ── Mouse spotlight ── */
      if (mouse.x > 0 && mouse.y > 0) {
        const mg = ctx.createRadialGradient(smoothMouse.x, smoothMouse.y, 0, smoothMouse.x, smoothMouse.y, 250);
        mg.addColorStop(0, 'rgba(56,189,248,.04)');
        mg.addColorStop(0.5, 'rgba(99,102,241,.02)');
        mg.addColorStop(1, 'transparent');
        ctx.fillStyle = mg;
        ctx.fillRect(0, 0, w, h);
      }

      /* ── Stars with twinkling ── */
      stars.forEach(s => {
        s.twinklePhase += s.twinkleSpeed;
        const twinkle = 0.3 + Math.sin(s.twinklePhase) * 0.7;
        const alpha = (0.15 + s.z * 0.65) * Math.max(0.1, twinkle);

        // Mouse interaction — subtle push
        let sx = s.x, sy = s.y;
        if (mouse.x > 0 && mouse.y > 0) {
          const dx = s.x - smoothMouse.x;
          const dy = s.y - smoothMouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150 && dist > 0) {
            const force = (150 - dist) / 150;
            sx += (dx / dist) * force * 8 * s.z;
            sy += (dy / dist) * force * 8 * s.z;
          }
        }

        // Glow for brighter stars
        if (s.z > 0.5) {
          const glowR = s.size * (3 + s.z * 3);
          const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
          sg.addColorStop(0, `rgba(${s.color.r},${s.color.g},${s.color.b},${alpha * 0.15})`);
          sg.addColorStop(1, 'transparent');
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Star cross-sparkle for very bright ones
        if (s.z > 0.88 && twinkle > 0.8) {
          ctx.strokeStyle = `rgba(${s.color.r},${s.color.g},${s.color.b},${alpha * 0.3})`;
          ctx.lineWidth = 0.5;
          const sLen = s.size * 4;
          ctx.beginPath();
          ctx.moveTo(sx - sLen, sy); ctx.lineTo(sx + sLen, sy);
          ctx.moveTo(sx, sy - sLen); ctx.lineTo(sx, sy + sLen);
          ctx.stroke();
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color.r},${s.color.g},${s.color.b},${alpha})`;
        ctx.fill();
      });

      /* ── Mouse-star connection lines ── */
      if (mouse.x > 0 && mouse.y > 0) {
        stars.forEach(s => {
          if (s.z < 0.4) return;
          const dx = s.x - smoothMouse.x;
          const dy = s.y - smoothMouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const opacity = (1 - dist / 180) * 0.08 * s.z;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(smoothMouse.x, smoothMouse.y);
            ctx.strokeStyle = `rgba(56,189,248,${opacity})`;
            ctx.lineWidth = 0.3;
            ctx.stroke();
          }
        });
      }

      /* ── Shooting stars ── */
      if (Math.random() < 0.008) spawnShootingStar(w, h);
      shootingStars = shootingStars.filter(ss => ss.life > 0);
      shootingStars.forEach(ss => {
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life -= ss.decay;

        const tailX = ss.x - ss.vx * ss.len * 0.15;
        const tailY = ss.y - ss.vy * ss.len * 0.15;
        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, `rgba(125,211,252,${ss.life * 0.15})`);
        grad.addColorStop(1, `rgba(255,255,255,${ss.life * 0.6})`);
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Head glow
        const hg = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 6);
        hg.addColorStop(0, `rgba(255,255,255,${ss.life * 0.6})`);
        hg.addColorStop(1, 'transparent');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      /* ── Wireframe Globe ── */
      drawGlobe(w, h);

      animId = requestAnimationFrame(draw);
    };

    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => { mouse.x = -1000; mouse.y = -1000; };

    resize();
    animId = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', onMouse);
    canvas.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouse);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="hp-hero__canvas" />;
};

const Home = () => {
  const { PLAN_CATALOG, COMBO_PACKAGES, MONTHLY_PLANS, CATEGORY_ORDER } = useCatalog();
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('web-development');
  const [scrollProgress, setScrollProgress] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const authed = Boolean(user);

  const doLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 30);
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0);
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const activeCatalog = PLAN_CATALOG[activeTab];
  const homeStructuredData = [
    buildOrganizationSchema(),
    buildWebsiteSchema(),
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'SkyWorld service categories',
      itemListElement: CATEGORY_ORDER.map((slug, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: PLAN_CATALOG[slug]?.name || slug,
        url: absoluteUrl(`/services/${slug}`),
      })),
    },
  ];

  return (
    <div className="hp">
      <Seo
        title="SkyWorld Ventures | Web Development, Branding & App Services"
        description="SkyWorld Ventures helps growing businesses launch websites, branding systems, combo packages, app experiences, and monthly maintenance with transparent pricing."
        canonicalPath="/"
        keywords={[
          'website design for businesses',
          'branding and design services',
          'app development agency',
          'combo website packages',
          'website maintenance plans',
        ]}
        structuredData={homeStructuredData}
      />

      {/* ═══ SCROLL PROGRESS ═══ */}
      <div className="hp-progress" style={{ transform: `scaleX(${scrollProgress / 100})` }} />

      {/* ═══ NAV ═══ */}
      <nav className={`hp-nav ${scrolled ? 'hp-nav--s' : ''}`}>
        <div className="hp-nav__in">
          <Link to="/" className="hp-nav__brand">
            <img
              src="/wordmark_logo_white_.png"
              alt="SkyWorld"
              className="hp-nav__logo"
              style={{
                opacity: scrolled ? 0 : 1,
                position: scrolled ? 'absolute' : 'relative',
              }}
            />
            <img
              src="/wordmark_logo_coloured_.png"
              alt="SkyWorld"
              className="hp-nav__logo"
              style={{
                opacity: scrolled ? 1 : 0,
                position: scrolled ? 'relative' : 'absolute',
              }}
            />
          </Link>
          <div className="hp-nav__r">
            {authed ? (
              <>
                <Link
                  to={`/dashboard/${user?.role || 'client'}`}
                  className={`hp-nav__link hidden sm:block ${scrolled ? 'hp-nav__link--dark' : ''}`}
                >
                  Dashboard
                </Link>
                <button onClick={doLogout} className="hp-nav__cta">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`hp-nav__link hidden sm:block ${scrolled ? 'hp-nav__link--dark' : ''}`}
                >
                  Log in
                </Link>
                <Link to="/register" className="hp-nav__cta">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <header className="hp-hero">
        <SkyWorldCanvas />
        <div className="hp-hero__atmosphere" />
        <div className="hp-hero__horizon" />
        <div className="hp-hero__orb hp-hero__orb--1" />
        <div className="hp-hero__orb hp-hero__orb--2" />

        <div className="hp-hero__center">
          <h1 className="hp-hero__h1">
            We build products that <span className="hp-hero__h1-sky">drive</span> <span className="hp-hero__h1-world">growth.</span>
          </h1>

          <p className="hp-hero__sub">
            Websites, branding, and apps — with transparent pricing and milestone delivery.
          </p>

          <div className="hp-hero__btns">
            {authed ? (
              <>
                <Link to={`/dashboard/${user?.role || 'client'}`} className="hp-btn hp-btn--primary hp-btn--lg">
                  Open Dashboard <span className="hp-btn__arr">&rarr;</span>
                </Link>
                <Link to="/services/web-development" className="hp-btn hp-btn--dark-ghost hp-btn--lg">
                  Browse Services
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="hp-btn hp-btn--primary hp-btn--lg">
                  Start a project <span className="hp-btn__arr">&rarr;</span>
                </Link>
                <Link to="/contact" className="hp-btn hp-btn--dark-ghost hp-btn--lg">
                  Book a free call
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="hp-hero__stats">
          {[
            { v: 150, s: '+', l: 'Projects' },
            { v: 80, s: '+', l: 'Clients' },
            { v: 99, s: '%', l: 'Satisfaction' },
            { v: 24, s: 'hr', l: 'Response' },
          ].map((d) => (
            <div key={d.l} className="hp-st">
              <span className="hp-st__v">
                <Num end={d.v} suffix={d.s} />
              </span>
              <span className="hp-st__l">{d.l}</span>
            </div>
          ))}
        </div>
      </header>

      {/* ═══ LOGO MARQUEE ═══ */}
      <section className="hp-marquee">
        <div className="hp-marquee__label">Industries We Serve</div>
        <div className="hp-marquee__track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="hp-marquee__item">
              <span className="hp-marquee__dot" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ═══ SERVICES ═══ */}
      <section className="hp-svc">
        <div className="hp-wrap">
          <FadeIn>
            <div className="hp-svc__header">
              <span className="hp-sect-label">Services</span>
              <h2 className="hp-sect-h">What we build</h2>
              <p className="hp-sect-sub">
                End-to-end digital solutions for businesses ready to grow — from first pixel to final deploy.
              </p>
            </div>
          </FadeIn>

          <div className="hp-svc__grid">
            {CATEGORY_ORDER.map((slug, i) => {
              const cat = PLAN_CATALOG[slug];
              const low = Math.min(...cat.plans.map((p) => p.price));
              return (
                <FadeIn key={slug} delay={i * 100}>
                  <Link
                    to={`/services/${slug}`}
                    className="hp-svc__card"
                    style={{ '--c': cat.color, '--g': cat.gradientCSS }}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
                      e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
                    }}
                  >
                    <div className="hp-svc__bar" />
                    <div className="hp-svc__top">
                      <div className="hp-svc__icon">
                        <Icon name={cat.icon} size={22} />
                      </div>
                      <Icon name="arrow" size={16} strokeWidth={2} className="hp-svc__arr" />
                    </div>
                    <h3 className="hp-svc__name">{cat.name}</h3>
                    <p className="hp-svc__tagline">{cat.tagline}</p>
                    <div className="hp-svc__foot">
                      <span className="hp-svc__from">From {formatINR(low)}</span>
                      <span className="hp-svc__count">
                        {cat.plans.length} plan{cat.plans.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ PORTFOLIO SHOWCASE ═══ */}
      <section className="hp-portfolio">
        <div className="hp-wrap">
          <div className="hp-portfolio__header">
            <FadeIn>
              <div>
                <span className="hp-sect-label">Portfolio</span>
                <h2 className="hp-sect-h">Selected work</h2>
                <p className="hp-sect-sub">
                  Recent projects delivered for businesses across industries — each one built to perform.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={100}>
              <Link to="/services/web-development" className="hp-btn hp-btn--ghost">
                View All Services <span className="hp-btn__arr">&rarr;</span>
              </Link>
            </FadeIn>
          </div>

          <div className="hp-portfolio__grid">
            {PROJECTS.map((p, i) => (
              <FadeIn key={p.title} delay={i * 100}>
                <div className="hp-portfolio__card">
                  <img src={p.img} alt={p.title} className="hp-portfolio__img" loading="lazy" />
                  <div className="hp-portfolio__info">
                    <h3 className="hp-portfolio__title">{p.title}</h3>
                    <p className="hp-portfolio__desc">{p.desc}</p>
                    <div className="hp-portfolio__tags">
                      {p.tags.map((tag) => (
                        <span key={tag} className="hp-portfolio__tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="hp-proc">
        <div className="hp-wrap">
          <FadeIn>
            <span className="hp-sect-label" style={{ justifyContent: 'center' }}>Process</span>
            <h2 className="hp-sect-h">How we work</h2>
            <p className="hp-proc__sub">Three clear phases from idea to production. No surprises.</p>
          </FadeIn>

          <div className="hp-proc__timeline">
            {/* Horizontal animated connector */}
            <div className="hp-proc__connector">
              <div className="hp-proc__connector-line" />
              <div className="hp-proc__connector-glow" />
              <div className="hp-proc__connector-dot" />
            </div>

            {STEPS.map((s, i) => (
              <FadeIn key={s.n} delay={i * 180}>
                <div className={`hp-proc__card hp-proc__card--${s.n}`}>
                  {/* Ring indicator */}
                  <div className="hp-proc__indicator">
                    <div className="hp-proc__ring">
                      <svg viewBox="0 0 64 64" className="hp-proc__ring-svg">
                        <circle cx="32" cy="32" r="28" className="hp-proc__ring-bg" />
                        <circle cx="32" cy="32" r="28" className="hp-proc__ring-fill" />
                      </svg>
                      <span className="hp-proc__num">{s.n}</span>
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="hp-proc__icon">
                    {i === 0 && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        <path d="M8 9h8M8 13h5" />
                      </svg>
                    )}
                    {i === 1 && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8M12 17v4" />
                        <path d="M7 8h2M7 12h4" />
                        <circle cx="16" cy="10" r="2" />
                      </svg>
                    )}
                    {i === 2 && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    )}
                  </div>

                  <h3 className="hp-proc__title">{s.t}</h3>
                  <p className="hp-proc__desc">{s.d}</p>

                  <div className="hp-proc__tags">
                    {i === 0 && ['Free consultation', '24hr response'].map(t => (
                      <span key={t} className="hp-proc__tag">{t}</span>
                    ))}
                    {i === 1 && ['Live preview', 'Unlimited revisions'].map(t => (
                      <span key={t} className="hp-proc__tag">{t}</span>
                    ))}
                    {i === 2 && ['Full handover', 'Pay on approval'].map(t => (
                      <span key={t} className="hp-proc__tag">{t}</span>
                    ))}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="hp-pricing">
        <div className="hp-wrap">
          <FadeIn>
            <span className="hp-sect-label">Pricing</span>
            <h2 className="hp-sect-h">Transparent, fixed-price plans</h2>
          </FadeIn>

          <FadeIn>
            <div className="hp-tabs">
              {CATEGORY_ORDER.map((slug) => {
                const cat = PLAN_CATALOG[slug];
                return (
                  <button
                    key={slug}
                    className={`hp-tab ${activeTab === slug ? 'hp-tab--on' : ''}`}
                    onClick={() => setActiveTab(slug)}
                  >
                    <Icon name={cat.icon} size={15} strokeWidth={2} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </FadeIn>

          <div className="hp-plans" key={activeTab}>
            {activeCatalog?.plans.map((plan, i) => (
              <FadeIn key={plan.slug} delay={i * 70}>
                <div
                  className={`hp-plan ${plan.popular ? 'hp-plan--pop' : ''}`}
                  style={{ '--c': activeCatalog.color, '--g': activeCatalog.gradientCSS }}
                >
                  {plan.popular && <span className="hp-plan__badge">Popular</span>}
                  <h3 className="hp-plan__name">{plan.name}</h3>
                  <p className="hp-plan__for">{plan.bestFor}</p>

                  {plan.highlights?.length > 0 && (
                    <div className="hp-plan__highlights">
                      {plan.highlights.map((h) => (
                        <span key={h} className="hp-plan__hl">{h}</span>
                      ))}
                    </div>
                  )}

                  <div className="hp-plan__pricing">
                    {plan.offerPercent > 0 && (
                      <span className="hp-plan__was">{formatINR(plan.offerOriginalPrice)}</span>
                    )}
                    <span className="hp-plan__amount">{formatINR(plan.price)}</span>
                    {plan.offerPercent > 0 && (
                      <span className="hp-plan__off">{plan.offerPercent}% off</span>
                    )}
                    <span className="hp-plan__delivery">
                      <Icon name="clock" size={13} strokeWidth={2} /> {plan.delivery}
                    </span>
                  </div>
                  <ul className="hp-plan__list">
                    {plan.features.map((f) => (
                      <li key={f}>
                        <Icon name="check" size={15} strokeWidth={2.5} className="hp-plan__ck" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {plan.support && (
                    <div className="hp-plan__support">
                      <Icon name="sparkle" size={13} strokeWidth={2} />
                      {plan.support}
                    </div>
                  )}

                  <Link
                    to={`/services/${activeTab}/${plan.slug}`}
                    className={`hp-plan__cta ${plan.popular ? 'hp-plan__cta--pop' : ''}`}
                  >
                    View {plan.name} <span className="hp-btn__arr">&rarr;</span>
                  </Link>
                </div>
              </FadeIn>
            ))}

            {activeTab !== 'web-development' && (
              <FadeIn delay={(activeCatalog?.plans.length || 0) * 70}>
                <div
                  className="hp-plan hp-plan--custom"
                  style={{ '--c': activeCatalog.color, '--g': activeCatalog.gradientCSS }}
                >
                  <h3 className="hp-plan__name">Custom Plan</h3>
                  <p className="hp-plan__for">
                    Need something beyond our packages? We build to your exact requirements.
                  </p>
                  <div className="hp-plan__pricing">
                    <span className="hp-plan__amount">Tailored</span>
                    <span className="hp-plan__delivery">
                      <Icon name="sparkle" size={13} strokeWidth={2} /> Scope-based timeline
                    </span>
                  </div>
                  <ul className="hp-plan__list">
                    <li><Icon name="check" size={15} strokeWidth={2.5} className="hp-plan__ck" /> Custom design &amp; architecture</li>
                    <li><Icon name="check" size={15} strokeWidth={2.5} className="hp-plan__ck" /> Dedicated project manager</li>
                    <li><Icon name="check" size={15} strokeWidth={2.5} className="hp-plan__ck" /> Milestone-based billing</li>
                    <li><Icon name="check" size={15} strokeWidth={2.5} className="hp-plan__ck" /> Priority support</li>
                  </ul>
                  <Link
                    to={authed ? `/request?service=${activeTab}` : '/register'}
                    className="hp-plan__cta"
                  >
                    Request a Quote <span className="hp-btn__arr">&rarr;</span>
                  </Link>
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </section>

      {/* ═══ COMBOS ═══ */}
      <section className="hp-combos">
        <div className="hp-wrap">
          <FadeIn>
            <span className="hp-sect-label">Packages</span>
            <h2 className="hp-sect-h">Bundle &amp; save</h2>
          </FadeIn>

          <div className="hp-combos__grid">
            {COMBO_PACKAGES.map((combo, i) => (
              <FadeIn key={combo.slug} delay={i * 100}>
                <div className="hp-combo" style={{ '--c': combo.color }}>
                  <div className="hp-combo__save">Save {combo.discount}%</div>
                  <h3 className="hp-combo__name">{combo.name}</h3>
                  <p className="hp-combo__tagline">{combo.tagline}</p>
                  <div className="hp-combo__prices">
                    <span className="hp-combo__was">{formatINR(combo.originalPrice)}</span>
                    <span className="hp-combo__now">{formatINR(combo.price)}</span>
                    {combo.offerPercent > 0 && (
                      <span className="hp-combo__offer">{combo.offerPercent}% off</span>
                    )}
                  </div>
                  <ul className="hp-combo__list">
                    {combo.includes.map((item, j) => (
                      <li key={j}>
                        <Icon
                          name={item.addOn ? 'sparkle' : 'check'}
                          size={14}
                          strokeWidth={2.5}
                          className={item.addOn ? 'hp-combo__star' : 'hp-combo__ck'}
                        />
                        {item.label}
                      </li>
                    ))}
                  </ul>
                  <div className="hp-combo__meta">
                    <span>
                      <Icon name="clock" size={12} strokeWidth={2} /> {combo.delivery}
                    </span>
                    <span className="hp-combo__dot">&middot;</span>
                    <span>{combo.bestFor}</span>
                  </div>
                  <Link to={`/combos/${combo.slug}`} className="hp-combo__cta">
                    View Combo Details <span className="hp-btn__arr">&rarr;</span>
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="hp-testi">
        <div className="hp-wrap">
          <FadeIn>
            <div className="hp-testi__header">
              <span className="hp-sect-label" style={{ justifyContent: 'center' }}>Testimonials</span>
              <h2 className="hp-sect-h">What our clients say</h2>
              <p className="hp-sect-sub">
                Real feedback from businesses we’ve helped grow online.
              </p>
            </div>
          </FadeIn>

          <div className="hp-testi__grid">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={t.name} delay={i * 100}>
                <div className="hp-testi__card">
                  <p className="hp-testi__quote">{t.quote}</p>
                  <div className="hp-testi__author">
                    <div className="hp-testi__avatar">{t.initials}</div>
                    <div>
                      <div className="hp-testi__name">{t.name}</div>
                      <div className="hp-testi__role">{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MONTHLY PLANS ═══ */}
      <section className="hp-monthly">
        <div className="hp-wrap">
          <FadeIn>
            <span className="hp-sect-label" style={{ '--sky-deep': 'rgba(0,191,255,.7)' }}>Ongoing Support</span>
            <h2 className="hp-monthly__h2">Keep everything running smoothly</h2>
            <Link
              to="/plans/monthly"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                marginTop: 12,
                color: 'rgba(0,191,255,.6)',
                textDecoration: 'none',
              }}
            >
              Compare all plans <span>&rarr;</span>
            </Link>
          </FadeIn>

          <div className="hp-monthly__grid">
            {MONTHLY_PLANS.map((plan, i) => (
              <FadeIn key={plan.slug} delay={i * 80}>
                <div className={`hp-mplan ${plan.popular ? 'hp-mplan--pop' : ''}`}>
                  {plan.popular && <span className="hp-mplan__badge">Best Value</span>}
                  <h3 className="hp-mplan__name">{plan.name}</h3>

                  {plan.highlights?.length > 0 && (
                    <div className="hp-mplan__highlights">
                      {plan.highlights.map((h) => (
                        <span key={h} className="hp-mplan__hl">{h}</span>
                      ))}
                    </div>
                  )}

                  <div className="hp-mplan__price">
                    {plan.offerPercent > 0 && (
                      <span className="hp-mplan__was">{formatINR(plan.offerOriginalPrice)}</span>
                    )}
                    <span className="hp-mplan__amt">{formatINR(plan.price)}</span>
                    <span className="hp-mplan__per">/month</span>
                    {plan.offerPercent > 0 && (
                      <span className="hp-mplan__off">{plan.offerPercent}% off</span>
                    )}
                  </div>
                  <ul className="hp-mplan__list">
                    {plan.features.map((f) => (
                      <li key={f}>
                        <Icon name="check" size={14} strokeWidth={2.5} className="hp-mplan__ck" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={`/plans/monthly/${plan.slug}`}
                    className={`hp-mplan__cta ${plan.popular ? 'hp-mplan__cta--pop' : ''}`}
                  >
                    Get Started
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="hp-cta">
        <div className="hp-wrap">
          <FadeIn>
            <div className="hp-cta__inner">
              <h2 className="hp-cta__h2">
                Ready to get<br />started?
              </h2>
              <p className="hp-cta__sub">
                Plans from {formatINR(2499)}. Pay 50% to start, rest on your approval. No lock-ins.
              </p>
              <div className="hp-cta__actions">
                {authed ? (
                  <Link
                    to={`/dashboard/${user?.role || 'client'}`}
                    className="hp-btn hp-btn--primary hp-btn--lg"
                  >
                    Open Dashboard <span className="hp-btn__arr">&rarr;</span>
                  </Link>
                ) : (
                  <Link to="/register" className="hp-btn hp-btn--primary hp-btn--lg">
                    Create your account <span className="hp-btn__arr">&rarr;</span>
                  </Link>
                )}
                <Link to="/contact" className="hp-btn hp-btn--dark-ghost hp-btn--lg">
                  Get in touch
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ MEGA FOOTER ═══ */}
      <footer className="hp-ft">
        <div className="hp-wrap">
          <div className="hp-ft__top">
            <div className="hp-ft__grid">
              <div className="hp-ft__brand-col">
                <img src="/wordmark_logo_white_fullname.png" alt="SkyWorld Ventures" className="hp-ft__logo" />
                <p className="hp-ft__desc">
                  Professional web development, branding, and app services for businesses that mean business.
                </p>
                <div className="hp-ft__social">
                  <SocialLink href="https://www.linkedin.com/in/skyworld-ventures/" label="LinkedIn" icon={SocialIcons.linkedin} />
                  <SocialLink href="https://www.youtube.com/@SkyWorldVentures" label="YouTube" icon={SocialIcons.youtube} size={18} />
                  <SocialLink href="https://www.instagram.com/skyworld.ventures/" label="Instagram" icon={SocialIcons.instagram} />
                  <SocialLink href="https://x.com/SkyWorldVenture" label="X (Twitter)" icon={SocialIcons.twitter} size={16} />
                  <SocialLink href="https://www.facebook.com/profile.php?id=61585059613967" label="Facebook" icon={SocialIcons.facebook} />
                </div>
              </div>

              <div>
                <h4 className="hp-ft__col-title">Services</h4>
                <ul className="hp-ft__col-links">
                  <li><Link to="/services/web-development">Web Development</Link></li>
                  <li><Link to="/services/branding-design">Branding &amp; Design</Link></li>
                  <li><Link to="/services/app-development">App Development</Link></li>
                  <li><Link to="/plans/monthly">Monthly Plans</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="hp-ft__col-title">Company</h4>
                <ul className="hp-ft__col-links">
                  <li><Link to="/faq">FAQ</Link></li>
                  <li><Link to="/contact">Contact</Link></li>
                  <li><Link to="/privacy">Privacy Policy</Link></li>
                  <li><Link to="/terms">Terms of Service</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="hp-ft__col-title">Get in Touch</h4>
                <ul className="hp-ft__col-links">
                  <li><a href="mailto:support@skyworld.buzz">support@skyworld.buzz</a></li>
                  <li><a href="https://wa.me/918837679889" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="hp-ft__bottom">
            <span className="hp-ft__copy">&copy; 2026 SkyWorld Ventures. All rights reserved.</span>
            <div className="hp-ft__bottom-links">
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/faq">FAQ</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ FLOATING WHATSAPP WIDGET ═══ */}
      <div className="hp-wa">
        <div className="hp-wa__pulse" />
        <a
          href="https://wa.me/918837679889?text=Hi%20SkyWorld%2C%20I%27m%20interested%20in%20your%20services."
          target="_blank"
          rel="noopener noreferrer"
          className="hp-wa__btn"
          aria-label="Chat on WhatsApp"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default Home;
