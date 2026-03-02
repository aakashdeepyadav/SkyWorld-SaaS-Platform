import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { formatINR } from '../../utils/currency';

const NewRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isClient = user?.role === 'client';
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [formData, setFormData] = useState({
    serviceId: '',
    title: '',
    description: '',
    requirements: ''
  });
  const [errors, setErrors] = useState({});
  const hasServices = services.length > 0;

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/services');
        setServices(res.data.services || []);
      } catch {
        toast.error('Failed to load services');
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, []);

  const validate = () => {
    const errs = {};
    if (!formData.serviceId) errs.serviceId = 'Please select a service';

    if (!isClient) {
      if (!formData.title.trim()) errs.title = 'Title is required';
      else if (formData.title.trim().length < 5) errs.title = 'Title must be at least 5 characters';
      else if (formData.title.trim().length > 200) errs.title = 'Title must be under 200 characters';

      if (!formData.description.trim()) errs.description = 'Description is required';
      else if (formData.description.trim().length < 10) errs.description = 'Description must be at least 10 characters';

      if (formData.requirements.length > 10000) errs.requirements = 'Requirements must be under 10000 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasServices) {
      toast.error('No active services available right now. Please use custom request.');
      return;
    }

    if (!validate()) return;

    if (isClient) {
      const service = services.find((s) => s._id === formData.serviceId);
      const serviceSlug = service?.category;

      if (!serviceSlug) {
        toast.error('Selected service is invalid. Please try again.');
        return;
      }

      navigate(
        `/checkout?service=${encodeURIComponent(serviceSlug)}&serviceId=${encodeURIComponent(formData.serviceId)}&plan=starter`
      );
      return;
    }

    setLoading(true);
    try {
      await api.post('/requests', {
        serviceId: formData.serviceId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements.trim()
      });
      toast.success('Service request submitted successfully');
      navigate('/requests');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const selectedService = services.find((s) => s._id === formData.serviceId);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">New Service Request</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {isClient
              ? 'Select a service and continue to secure payment checkout.'
              : 'Describe your project and we will match you with the right team.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Service Type</label>
              {servicesLoading ? (
                <div className="h-12 bg-gray-100 dark:bg-surface-700 rounded-xl animate-pulse" />
              ) : !hasServices ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  No active services are available right now.
                  <Link to="/custom-request" className="ml-1 font-semibold underline underline-offset-2">
                    Submit a custom request instead
                  </Link>
                  .
                </div>
              ) : (
                <select
                  id="serviceId"
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={handleChange}
                  className={`input-field ${errors.serviceId ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                >
                  <option value="">Select a service...</option>
                  {services.map((service) => (
                    <option key={service._id} value={service._id}>{service.name} - {service.category}</option>
                  ))}
                </select>
              )}
              {errors.serviceId && <p className="mt-1 text-xs text-red-500">{errors.serviceId}</p>}
            </div>

            {!isClient && (
              <>
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Project Title</label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., E-commerce mobile app for organic products"
                    className={`input-field ${errors.title ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                    maxLength={200}
                  />
                  {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Outline your goals, target audience, and must-have features."
                    className={`input-field resize-none ${errors.description ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                    maxLength={5000}
                  />
                  {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{formData.description.length}/5000</p>
                </div>

                <div>
                  <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Technical Requirements <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Preferred stack, integrations, deadlines, budget range, competitors..."
                    className={`input-field resize-none ${errors.requirements ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                    maxLength={10000}
                  />
                  {errors.requirements && <p className="mt-1 text-xs text-red-500">{errors.requirements}</p>}
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{formData.requirements.length}/10000</p>
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-surface-700">
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={loading || !hasServices} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Submitting...' : isClient ? 'Continue to Payment' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Selected Service</h2>
            {selectedService ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedService.name}</p>
                  <span className="badge-primary capitalize">{selectedService.category?.replace('-', ' ')}</span>
                </div>
                {selectedService.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedService.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-surface-700">
                  <span>Starting at</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedService.basePrice > 0 ? formatINR(selectedService.basePrice) : 'Custom Quote'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">Choose a service to see details.</p>
            )}
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Request Checklist</h2>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li>Describe the business goal and target users</li>
              <li>List must-have features and integrations</li>
              <li>Share any brand assets or references</li>
              <li>Add timelines or critical dates if any</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewRequest;
