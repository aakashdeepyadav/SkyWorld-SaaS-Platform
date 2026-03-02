import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-900">
      <div className="text-center px-4">
        <p className="text-8xl font-bold text-primary-500 mb-2">404</p>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Page not found</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary inline-block">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
