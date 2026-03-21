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

const FAQ = () => {
  const faqStructuredData = [
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'FAQ', path: '/faq' },
    ]),
    buildFaqSchema(FAQ_ITEMS),
  ];

  return (
    <div className="min-h-screen bg-surface-50 py-12 px-4 sm:px-6 lg:px-8">
      <Seo
        title="FAQ | SkyWorld Ventures"
        description="Find answers about SkyWorld Ventures pricing, website packages, combo offers, monthly maintenance plans, payments, revisions, meetings, and support."
        path="/faq"
        keywords={[
          'SkyWorld FAQ',
          'website pricing FAQ',
          'combo package FAQ',
          'monthly plan FAQ',
        ]}
        structuredData={faqStructuredData}
      />

      <div className="max-w-3xl mx-auto card sm:p-12 animate-fade-in">
        <Link
          to="/"
          className="text-primary-500 hover:text-primary-600 text-sm font-medium mb-6 inline-flex items-center"
        >
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 7, 2026</p>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-gray-200 bg-white p-4 open:border-primary-200:border-primary-500/30 open:bg-primary-50/20:bg-primary-500/5"
            >
              <summary className="cursor-pointer list-none text-sm sm:text-base font-semibold text-gray-900 flex items-center justify-between gap-3">
                <span>{item.q}</span>
                <span className="text-primary-500 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 text-sm text-gray-500">
          Still need help?{' '}
          <a href="mailto:support@skyworld.buzz" className="text-primary-500 hover:underline">
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
