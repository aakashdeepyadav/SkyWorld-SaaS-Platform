import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';

const SERVICE_CONTENT = {
  'web-development': {
    name: 'Web Development',
    subtitle: 'High-converting websites built for speed and clarity.',
    starterPrice: 1499,
    starterTimeline: '5-7 days',
    starterIncludes: [
      '1-3 pages',
      'Template-based design',
      'Mobile responsive layout',
      'Basic contact form',
      'Performance and SEO basics'
    ],
    starterExcludes: [
      'Custom animations',
      'Advanced integrations',
      'E-commerce features',
      'Complex backend workflows'
    ],
    customIncludes: [
      'Custom UX and UI design',
      'CMS or admin panel',
      'Advanced integrations',
      'Scalable architecture planning'
    ],
    customExcludes: [
      'Hosting fees',
      'Ongoing content updates',
      'Third-party subscription costs'
    ],
    process: ['Discovery and brief', 'Design and layout', 'Build and QA', 'Launch and handoff'],
    delivery: ['Starter: 5-7 days', 'Custom: 3-6 weeks depending on scope']
  },
  'app-development': {
    name: 'App Development',
    subtitle: 'Clean, intuitive apps that feel effortless to use.',
    starterPrice: 2999,
    starterTimeline: '10-14 days',
    starterIncludes: [
      'Basic UI screens',
      'Simple functionality',
      'No complex backend',
      'Lightweight data storage',
      'App handoff package'
    ],
    starterExcludes: [
      'Complex backend systems',
      'Third-party integrations',
      'Real-time features',
      'Multi-role dashboards'
    ],
    customIncludes: [
      'Product strategy workshop',
      'Custom design system',
      'Robust backend and APIs',
      'App store deployment support'
    ],
    customExcludes: [
      'App store fees',
      'Ongoing maintenance plans',
      'Third-party licensing fees'
    ],
    process: ['Product discovery', 'UX and UI design', 'Development and testing', 'Launch support'],
    delivery: ['Starter: 10-14 days', 'Custom: 4-10 weeks depending on scope']
  },
  'branding-creative': {
    name: 'Branding',
    subtitle: 'Identity systems that make your business unforgettable.',
    starterPrice: 799,
    starterTimeline: '4-6 days',
    starterIncludes: [
      '1 logo concept',
      '2 revisions',
      'Social media kit',
      'Basic brand guide'
    ],
    starterExcludes: [
      'Multiple logo directions',
      'Packaging design',
      'Full brand strategy',
      'Extended collateral design'
    ],
    customIncludes: [
      'Brand strategy workshop',
      'Multiple logo directions',
      'Comprehensive brand guidelines',
      'Collateral templates'
    ],
    customExcludes: [
      'Print production costs',
      'Photography or video shoots',
      'Trademark registration'
    ],
    process: ['Brand discovery', 'Concept exploration', 'Refinements', 'Delivery kit'],
    delivery: ['Starter: 4-6 days', 'Custom: 2-4 weeks depending on scope']
  }
};

const ServiceDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const content = useMemo(() => SERVICE_CONTENT[slug], [slug]);

  const { data: services = [] } = useQuery(
    ['services-for-detail'],
    async () => {
      const response = await api.get('/services');
      return response.data?.services || [];
    },
    { staleTime: 30 * 1000 }
  );

  const dbService = useMemo(
    () => [...services]
      .filter((item) => item.category === slug)
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0],
    [services, slug]
  );

  if (!content) {
    return (
      <div className="min-h-screen bg-surface-50 px-6 py-20">
        <div className="max-w-3xl mx-auto card text-center">
          <h1 className="text-2xl font-bold text-gray-900">Service not found</h1>
          <p className="text-sm text-gray-500 mt-2">The service you are looking for does not exist.</p>
          <Link to="/" className="btn-primary mt-6 inline-flex">Back to Home</Link>
        </div>
      </div>
    );
  }

  const serviceName = dbService?.name || content.name;
  const serviceSubtitle = dbService?.description || content.subtitle;
  const starterPrice = Number(dbService?.basePrice ?? content.starterPrice ?? 0);

  const handleStarter = () => {
    const params = new URLSearchParams({
      service: slug,
      plan: 'starter'
    });
    if (dbService?._id) {
      params.set('serviceId', dbService._id);
    }
    const target = `/checkout?${params.toString()}`;
    if (!user) {
      navigate('/login', { state: { from: target } });
      return;
    }
    navigate(target);
  };

  const handleCustom = () => {
    const target = `/custom-request?service=${slug}`;
    if (!user) {
      navigate('/login', { state: { from: target } });
      return;
    }
    navigate(target);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-10">
          <Link to="/" className="text-sm text-primary-600 hover:text-primary-500">Back to Home</Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3">{serviceName}</h1>
          <p className="text-gray-500 mt-2 max-w-2xl">{serviceSubtitle}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          <div className="card lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">What's included</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {content.starterIncludes.map((item) => (
                <div key={item} className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600">{item}</div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Not included</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              {content.starterExcludes.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Process</h2>
            <div className="space-y-3">
              {content.process.map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-600">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery timeline</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              {content.delivery.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card border border-primary-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Starter Plan</h3>
              <span className="text-xl font-bold text-gray-900">{formatINR(starterPrice)}</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">Delivery in {content.starterTimeline}</p>
            <div className="space-y-2 text-sm text-gray-600 mb-6">
              {content.starterIncludes.map((item) => (
                <div key={item}>- {item}</div>
              ))}
            </div>
            <button onClick={handleStarter} disabled={starterPrice <= 0} className="btn-primary w-full disabled:opacity-50">Choose Starter</button>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Custom Plan</h3>
              <span className="text-sm text-gray-400">Tailored quote</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">Best for complex or multi-phase work.</p>
            <div className="space-y-2 text-sm text-gray-600 mb-6">
              {content.customIncludes.map((item) => (
                <div key={item}>- {item}</div>
              ))}
            </div>
            <button onClick={handleCustom} className="btn-secondary w-full">Request Custom Plan</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
