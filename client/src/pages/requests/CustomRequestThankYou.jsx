import { Link } from 'react-router-dom';

const CustomRequestThankYou = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="card text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thank you for your request</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          Our team will review your requirements and contact you within 24 hours with a tailored proposal.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
          <Link to="/" className="btn-secondary">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default CustomRequestThankYou;
