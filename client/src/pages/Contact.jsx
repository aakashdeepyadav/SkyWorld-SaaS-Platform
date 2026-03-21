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

  return (
    <div className="min-h-screen bg-surface-50 py-12 px-4 sm:px-6 lg:px-8">
      <Seo
        title="Contact SkyWorld Ventures"
        description="Contact SkyWorld Ventures for website development, branding, app development, maintenance plans, combo packages, or project support."
        path="/contact"
        keywords={[
          'contact SkyWorld Ventures',
          'website project inquiry',
          'branding consultation',
          'app development inquiry',
        ]}
        structuredData={contactStructuredData}
      />

      <div className="max-w-2xl mx-auto card sm:p-12 animate-fade-in">
        <Link
          to="/"
          className="text-primary-500 hover:text-primary-600 text-sm font-medium mb-6 inline-flex items-center"
        >
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
        <p className="text-sm text-gray-500 mb-8">
          Have a question or project in mind? Fill in the details below and we&apos;ll get back to
          you shortly.
        </p>

        {status === 'success' && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5 text-center">
            <svg
              className="mx-auto mb-3 h-10 w-10 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-base font-semibold text-green-700 mb-1">Message sent successfully.</p>
            <p className="text-sm text-green-600">
              Thank you for reaching out. We&apos;ll get back to you soon.
            </p>
            <p className="text-xs text-green-500/70 mt-3">Redirecting to homepage in {countdown}s.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Something went wrong. Please try again or email us directly at{' '}
            <a href="mailto:support@skyworld.buzz" className="underline">
              support@skyworld.buzz
            </a>
          </div>
        )}

        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject <span className="text-red-400">*</span>
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                value={form.subject}
                onChange={handleChange}
                placeholder="Project inquiry, feedback, etc."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us about your project or question..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'sending' ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}

        {status !== 'success' && (
          <div className="mt-10 text-sm text-gray-500">
            Or email us directly at{' '}
            <a href="mailto:support@skyworld.buzz" className="text-primary-500 hover:underline">
              support@skyworld.buzz
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact;
