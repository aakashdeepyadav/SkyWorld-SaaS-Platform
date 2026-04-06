import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Seo,
  buildBreadcrumbSchema,
  buildOrganizationSchema,
} from '../components/seo/Seo';

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

const Contact = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [countdown, setCountdown] = useState(5);
  const contactStructuredData = [
    buildOrganizationSchema(),
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Contact', path: '/contact' },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact SkyWorld Ventures',
      url: 'https://skyworld.buzz/contact',
      description:
        'Contact SkyWorld Ventures for website development, branding, app development, combo packages, or support.',
      mainEntity: {
        '@type': 'Organization',
        name: 'SkyWorld Ventures',
        email: 'support@skyworld.buzz',
      },
    },
  ];

  useEffect(() => {
    if (status !== 'success') return;
    if (countdown <= 0) {
      navigate('/');
      return;
    }
    const timer = setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate, status]);

  const handleChange = (event) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('sending');
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, timestamp: new Date().toISOString() }),
      });
      setStatus('success');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all duration-200';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Seo
        title="Contact SkyWorld Ventures"
        description="Contact SkyWorld Ventures for website development, branding, app development, maintenance plans, combo packages, or project support."
        path="/contact"
        keywords={['contact SkyWorld Ventures', 'website project inquiry', 'branding consultation', 'app development inquiry']}
        structuredData={contactStructuredData}
      />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 48, alignItems: 'start' }}>
        {/* ── Left: Info Column ── */}
        <div style={{ paddingTop: 16 }}>
          <Link
            to="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0891b2', textDecoration: 'none', marginBottom: 32 }}
          >
            &larr; Back to Home
          </Link>

          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, color: '#0b1120', letterSpacing: '-.03em', lineHeight: 1.1, margin: '0 0 16px' }}>
            Let&apos;s talk about<br />your project.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: '#64748b', maxWidth: 380, marginBottom: 40 }}>
            Have a question or ready to get started? Fill in the details and we&apos;ll get back to you within 24 hours.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #0891b2, #00bfff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0b1120' }}>Email</div>
                <a href="mailto:support@skyworld.buzz" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none' }}>support@skyworld.buzz</a>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #25d366, #128c7e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0b1120' }}>WhatsApp</div>
                <a href="https://wa.me/918837679889" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none' }}>+91 8837679889</a>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0b1120' }}>Response time</div>
                <span style={{ fontSize: 14, color: '#64748b' }}>Within 24 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Form Card ── */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', border: '1px solid rgba(0,0,0,.06)', boxShadow: '0 4px 24px rgba(0,0,0,.03)' }}>
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="28" height="28" fill="none" stroke="#059669" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#059669', marginBottom: 6 }}>Message sent successfully.</p>
              <p style={{ fontSize: 14, color: '#64748b' }}>Thank you for reaching out. We&apos;ll get back to you soon.</p>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 16 }}>Redirecting to homepage in {countdown}s.</p>
            </div>
          )}

          {status === 'error' && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 14, color: '#b91c1c' }}>
              Something went wrong. Please try again or email us directly at{' '}
              <a href="mailto:support@skyworld.buzz" style={{ textDecoration: 'underline' }}>support@skyworld.buzz</a>
            </div>
          )}

          {status !== 'success' && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label htmlFor="name" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input id="name" name="name" type="text" required value={form.name} onChange={handleChange} placeholder="John Doe" className={inputClass} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Email <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="phone" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Phone</label>
                  <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className={inputClass} />
                </div>
              </div>

              <div>
                <label htmlFor="subject" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Subject <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input id="subject" name="subject" type="text" required value={form.subject} onChange={handleChange} placeholder="Project inquiry, feedback, etc." className={inputClass} />
              </div>

              <div>
                <label htmlFor="message" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Message <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea id="message" name="message" rows={5} required value={form.message} onChange={handleChange} placeholder="Tell us about your project or question..." className={inputClass} style={{ resize: 'none' }} />
              </div>

              <button
                type="submit"
                disabled={status === 'sending'}
                style={{
                  width: '100%', height: 50, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #0891b2, #00bfff)', color: '#fff',
                  fontSize: 15, fontWeight: 700, transition: 'all .3s',
                  opacity: status === 'sending' ? 0.6 : 1,
                  boxShadow: '0 4px 16px rgba(0,191,255,.18)',
                }}
              >
                {status === 'sending' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Responsive: stack on mobile */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: '1fr 1.2fr'"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Contact;
