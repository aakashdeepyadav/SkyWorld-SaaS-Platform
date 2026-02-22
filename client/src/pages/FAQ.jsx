import { Link } from 'react-router-dom';

const FAQ_ITEMS = [
  {
    q: 'How does SkyWorld pricing work?',
    a: 'Starter plan prices come from the active service pricing in the admin panel. Custom work is quoted separately based on scope and timeline.'
  },
  {
    q: 'Why can the amount in checkout change?',
    a: 'If admin updates a service price, new checkout sessions use the latest active price. Existing already-created payment orders keep their original amount.'
  },
  {
    q: 'What payment methods are supported?',
    a: 'Payments are processed through Razorpay. Available payment methods depend on Razorpay support for your region and account setup.'
  },
  {
    q: 'Do I need to be signed in to pay?',
    a: 'Yes. You must be signed in to start checkout so your payment can be linked to your request and dashboard records.'
  },
  {
    q: 'Can I submit a custom request instead of a starter plan?',
    a: 'Yes. Use the Custom Request flow for projects that need tailored scope, advanced features, or phased delivery.'
  },
  {
    q: 'How is my payment verified?',
    a: 'After payment, the platform verifies Razorpay signature and marks payment as completed only when verification succeeds.'
  },
  {
    q: 'Will my project appear automatically after payment?',
    a: 'Yes. Successful payment is linked to your request and project records, then visible in your dashboard.'
  },
  {
    q: 'Can I change my role?',
    a: 'Normal users cannot change their own role. Role updates are controlled by admin permissions.'
  },
  {
    q: 'Why is my profile image not updating everywhere?',
    a: 'Usually this is temporary cache delay. Refresh your session and ensure Cloudinary environment variables are correctly configured in backend.'
  },
  {
    q: 'What does "Refused to get unsafe header" mean in browser console?',
    a: 'That warning is typically from third-party scripts in checkout and does not usually block your app logic. Focus on API response codes for real errors.'
  },
  {
    q: 'How do I contact support?',
    a: 'Email ventures.skyworld@gmail.com and include your account email, request ID, and a short issue summary.'
  },
  {
    q: 'Where can I read legal policies?',
    a: 'You can review Privacy Policy at /privacy and Terms of Service at /terms.'
  }
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-surface-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto card sm:p-12 animate-fade-in">
        <Link to="/" className="text-primary-500 hover:text-primary-600 text-sm font-medium mb-6 inline-flex items-center">
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: February 22, 2026</p>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="group rounded-xl border border-gray-200 bg-white p-4 open:border-primary-200 open:bg-primary-50/20">
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
          <a href="mailto:ventures.skyworld@gmail.com" className="text-primary-500 hover:underline">
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
