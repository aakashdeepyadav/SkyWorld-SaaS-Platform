import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const NewRequest = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [formData, setFormData] = useState({
        serviceId: '',
        title: '',
        description: '',
        requirements: '',
    });
    const [errors, setErrors] = useState({});

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
        if (!formData.title.trim()) errs.title = 'Title is required';
        else if (formData.title.trim().length < 5) errs.title = 'Title must be at least 5 characters';
        else if (formData.title.trim().length > 100) errs.title = 'Title must be under 100 characters';
        if (!formData.description.trim()) errs.description = 'Description is required';
        else if (formData.description.trim().length < 20) errs.description = 'Description must be at least 20 characters';
        if (formData.requirements.length > 2000) errs.requirements = 'Requirements must be under 2000 characters';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            await api.post('/requests', {
                serviceId: formData.serviceId,
                title: formData.title.trim(),
                description: formData.description.trim(),
                requirements: formData.requirements.trim(),
            });
            toast.success('Service request submitted successfully');
            navigate('/requests');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                Back
            </button>

            <div className="card">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">New Service Request</h1>
                <p className="text-sm text-gray-500 mb-8">Describe your project and we'll match you with the right team.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Service Selection */}
                    <div>
                        <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 mb-1.5">Service Type</label>
                        {servicesLoading ? (
                            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                        ) : (
                            <select
                                id="serviceId"
                                name="serviceId"
                                value={formData.serviceId}
                                onChange={handleChange}
                                className={`input-field ${errors.serviceId ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                            >
                                <option value="">Select a service...</option>
                                {services.map(s => (
                                    <option key={s._id} value={s._id}>{s.name} — {s.category}</option>
                                ))}
                            </select>
                        )}
                        {errors.serviceId && <p className="mt-1 text-xs text-red-500">{errors.serviceId}</p>}
                    </div>

                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">Project Title</label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., E-commerce mobile app for organic products"
                            className={`input-field ${errors.title ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                            maxLength={100}
                        />
                        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Describe your project goals, target audience, and key features..."
                            className={`input-field resize-none ${errors.description ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                            maxLength={5000}
                        />
                        {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                        <p className="mt-1 text-xs text-gray-400">{formData.description.length}/5000</p>
                    </div>

                    {/* Requirements */}
                    <div>
                        <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Technical Requirements <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            id="requirements"
                            name="requirements"
                            value={formData.requirements}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Specific technologies, integrations, deadlines, budget range..."
                            className={`input-field resize-none ${errors.requirements ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                            maxLength={2000}
                        />
                        {errors.requirements && <p className="mt-1 text-xs text-red-500">{errors.requirements}</p>}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewRequest;
