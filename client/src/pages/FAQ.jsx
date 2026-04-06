import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Seo, buildBreadcrumbSchema, buildFaqSchema } from '../components/seo/Seo';

const FAQ_ITEMS = [
  {
    q: 'What services does SkyWorld offer?',
    a: 'We offer Web Development (Launch Page, Starter Website, Growth Website), Branding & Design (Starter Branding Kit, Branding Plus), App Development (Mini App / PWA, App Lite + Dashboard), Combo Packages (Restaurant Starter, Medical Growth, Premium Business), Monthly Maintenance Plans, and Add-On Services like Google Business Profile setup, SEO, and Chatbot integration.',
  },
  {
    q: 'How does SkyWorld pricing work?',
    a: 'Each service has transparent fixed-price plans starting from Rs. 2,499. Combo packages offer bundled discounts of 12-18%. Monthly maintenance plans start at Rs. 1,499/month. Custom work is quoted separately based on your scope and timeline.',
  },
  {
    q: 'How does the payment process work?',
    a: 'For fixed-price plans, you pay 50% advance to start and the remaining 50% after project delivery and your approval. Monthly plans are billed monthly with no long-term contracts. Add-ons are charged upfront in full. All payments are processed securely through Razorpay.',
  },
  {
    q: 'What are Combo Packages?',
    a: 'Combos bundle multiple services at a discounted price. For example, the Restaurant Starter package includes a Starter Website, Starter Branding Kit, and Google Business Profile setup, saving you compared to buying separately.',
  },
  {
    q: 'What are Monthly Maintenance Plans?',
    a: 'Optional recurring plans for ongoing website updates, monitoring, and support. We offer Care Plan Lite, Growth Plan, and Local Growth Plus. You can pause or cancel anytime with 7 days notice.',
  },
  {
    q: 'What Add-On Services are available?',
    a: 'You can add extras to any plan: Google Business Profile setup, extra pages, extra revision rounds, product upload support, basic local SEO, priority 48-hour updates, chatbot integration, WhatsApp Business API setup, and social media starter kits.',
  },
  {
    q: 'Do I get unlimited revisions?',
    a: 'Yes, all our fixed-price plans include unlimited revisions until you are satisfied with the result. We work with you until the deliverables meet your expectations.',
  },
  {
    q: 'Can I book a meeting before paying?',
    a: 'Yes. Before checkout, you can book a free 30-minute Google Meet call with our team to discuss your requirements, scope, and timeline before committing to payment.',
  },
  {
    q: 'Do I need to be signed in to pay?',
    a: 'Yes. You must be signed in to start checkout so your payment can be linked to your request, project records, and dashboard.',
  },
  {
    q: 'Can I submit a custom request instead of a fixed plan?',
    a: 'Absolutely. Use the Custom Request flow for projects that need tailored scope, advanced features, or phased delivery. We will review your requirements and provide a personalized quote.',
  },
  {
    q: 'What happens after I pay?',
    a: 'Your project is automatically created and visible in your dashboard. You can track progress, milestones, and communicate with the assigned developer directly through the platform.',
  },
  {
    q: 'How do I contact support?',
    a: 'Email support@skyworld.buzz and include your account email, request ID, and a short issue summary. For urgent matters, you can also reach us through live chat on the platform.',
  },
  {
    q: 'Where can I read legal policies?',
    a: 'You can review our Privacy Policy at /privacy and Terms of Service at /terms.',
  },
];

const AccordionItem = ({ item, isOpen, toggle }) => (
  <div
    style={{
      background: isOpen ? '#fff' : '#fff',
      borderRadius: 16,
      border: `1px solid ${isOpen ? 'rgba(0,191,255,.2)' : 'rgba(0,0,0,.06)'}`,
      overflow: 'hidden',
      transition: 'all .3s cubic-bezier(.16,1,.3,1)',
      boxShadow: isOpen ? '0 8px 32px rgba(0,191,255,.06)' : '0 2px 8px rgba(0,0,0,.02)',
    }}
  >
    <button
      onClick={toggle}
      style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        padding: '20px 24px', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 700, color: '#0b1120', lineHeight: 1.4 }}>{item.q}</span>
      <span
        style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: isOpen ? 'linear-gradient(135deg, #0891b2, #00bfff)' : '#f1f5f9',
          color: isOpen ? '#fff' : '#64748b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, transition: 'all .3s',
          transform: isOpen ? 'rotate(45deg)' : 'none',
        }}
      >
        +
      </span>
    </button>
    <div
      style={{
        maxHeight: isOpen ? 300 : 0,
        opacity: isOpen ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height .4s cubic-bezier(.16,1,.3,1), opacity .3s',
      }}
    >
      <p style={{ padding: '0 24px 20px', fontSize: 14, lineHeight: 1.7, color: '#64748b', margin: 0 }}>
        {item.a}
      </p>
    </div>
  </div>
);

const FAQ = () => {
  const [openIdx, setOpenIdx] = useState(null);
  const [search, setSearch] = useState('');

  const faqStructuredData = [
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'FAQ', path: '/faq' },
    ]),
    buildFaqSchema(FAQ_ITEMS),
  ];

  const filtered = search.trim()
    ? FAQ_ITEMS.filter(
        (item) =>
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase())
      )
    : FAQ_ITEMS;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Seo
        title="FAQ | SkyWorld Ventures"
        description="Find answers about SkyWorld Ventures pricing, website packages, combo offers, monthly maintenance plans, payments, revisions, meetings, and support."
        path="/faq"
        keywords={['SkyWorld FAQ', 'website pricing FAQ', 'combo package FAQ', 'monthly plan FAQ']}
        structuredData={faqStructuredData}
      />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px 80px' }}>
        <Link
          to="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0891b2', textDecoration: 'none', marginBottom: 32 }}
        >
          &larr; Back to Home
        </Link>

        <div style={{ marginBottom: 48 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#0891b2', marginBottom: 16 }}>
            <span style={{ width: 24, height: 2, background: 'linear-gradient(90deg, #0891b2, #6366f1)', borderRadius: 2 }} />
            Support
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, color: '#0b1120', letterSpacing: '-.03em', lineHeight: 1.1, margin: '0 0 12px' }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6, marginBottom: 28 }}>
            Everything you need to know about our services and how we work.
          </p>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 420 }}>
            <svg
              width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', height: 48, paddingLeft: 44, paddingRight: 16,
                borderRadius: 12, border: '1px solid rgba(0,0,0,.08)',
                background: '#fff', fontSize: 14, color: '#0b1120',
                outline: 'none', transition: 'border-color .2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(0,191,255,.4)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(0,0,0,.08)')}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 && (
            <p style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', padding: 32 }}>
              No questions match your search.
            </p>
          )}
          {filtered.map((item, i) => (
            <AccordionItem
              key={item.q}
              item={item}
              isOpen={openIdx === i}
              toggle={() => setOpenIdx(openIdx === i ? null : i)}
            />
          ))}
        </div>

        <div style={{ marginTop: 48, padding: '24px 28px', background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0b1120', margin: '0 0 4px' }}>Still have questions?</p>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>We&apos;re here to help. Reach out anytime.</p>
          </div>
          <a
            href="mailto:support@skyworld.buzz"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 10,
              background: 'linear-gradient(135deg, #0891b2, #00bfff)', color: '#fff',
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(0,191,255,.18)',
              transition: 'transform .2s, box-shadow .2s',
            }}
          >
            Contact Support &rarr;
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
