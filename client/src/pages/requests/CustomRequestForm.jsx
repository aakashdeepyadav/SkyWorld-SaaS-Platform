import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const SERVICE_OPTIONS = [
  { value: 'web-development', label: 'Web Development' },
  { value: 'app-development', label: 'App Development' },
  { value: 'branding-creative', label: 'Branding' }
];

const CustomRequestForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultService = searchParams.get('service') || 'web-development';
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    serviceType: defaultService,
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    businessName: '',
    projectDescription: '',
    requiredFeatures: '',
    deadline: '',
    budgetRange: ''
  });
  const [file, setFile] = useState(null);

  const selectedServiceLabel = useMemo(
    () => SERVICE_OPTIONS.find((opt) => opt.value === formData.serviceType)?.label || 'Service',
    [formData.serviceType]
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
      if (file) payload.append('file', file);

      await api.post('/custom-requests', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Request submitted');
      navigate('/custom-request/thanks');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link to={`/services/${formData.serviceType}`} className="text-sm text-primary-600 hover:text-primary-500">
          Back to {selectedServiceLabel}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">Custom Plan Request</h1>
        <p className="text-sm text-gray-500 mt-1">Tell us about your project and we will send a tailored proposal.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <select name="serviceType" value={formData.serviceType} onChange={handleChange} className="input-field">
              {SERVICE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input name="fullName" value={formData.fullName} onChange={handleChange} className="input-field" required />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input name="phone" value={formData.phone} onChange={handleChange} className="input-field" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
          <input name="businessName" value={formData.businessName} onChange={handleChange} className="input-field" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project description</label>
          <textarea name="projectDescription" value={formData.projectDescription} onChange={handleChange} className="input-field min-h-[120px]" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Required features</label>
          <textarea name="requiredFeatures" value={formData.requiredFeatures} onChange={handleChange} className="input-field min-h-[100px]" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input name="deadline" type="date" value={formData.deadline} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget range</label>
            <input name="budgetRange" value={formData.budgetRange} onChange={handleChange} className="input-field" placeholder="e.g. ₹50,000 – ₹1,00,000" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Optional file upload</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
          />
        </div>

        <div className="flex items-center justify-end">
          <button type="submit" disabled={loading} className="btn-primary !py-2.5 !px-6 disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomRequestForm;
