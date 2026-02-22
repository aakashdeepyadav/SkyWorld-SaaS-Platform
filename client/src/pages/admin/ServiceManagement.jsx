import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { formatINR } from '../../utils/currency';

const CATEGORIES = [
    { value: 'app-development', label: 'App Development' },
    { value: 'web-development', label: 'Web Development' },
    { value: 'branding-creative', label: 'Branding & Creative' },
];

const ServiceManagement = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', category: '', basePrice: '' });
    const [errors, setErrors] = useState({});

    const { data, isLoading } = useQuery('admin-services', async () => {
        const res = await api.get('/services?isActive=true');
        return res.data.services || [];
    });

    const validate = () => {
        const errs = {};
        if (!formData.name.trim()) errs.name = 'Name is required';
        else if (formData.name.trim().length > 100) errs.name = 'Max 100 characters';
        if (!formData.category) errs.category = 'Category is required';
        if (formData.basePrice && (isNaN(formData.basePrice) || Number(formData.basePrice) < 0)) errs.basePrice = 'Invalid price';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const saveMutation = useMutation(
        async () => {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                category: formData.category,
                basePrice: formData.basePrice ? Number(formData.basePrice) : 0,
            };
            if (editing) {
                return api.put(`/services/${editing._id}`, payload);
            }
            return api.post('/services', payload);
        },
        {
            onSuccess: () => {
                toast.success(editing ? 'Service updated' : 'Service created');
                queryClient.invalidateQueries('admin-services');
                closeModal();
            },
            onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
        }
    );

    const deleteMutation = useMutation(
        async (id) => api.delete(`/services/${id}`),
        {
            onSuccess: () => {
                toast.success('Service deactivated');
                queryClient.invalidateQueries('admin-services');
            },
            onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
        }
    );

    const openCreate = () => {
        setEditing(null);
        setFormData({ name: '', description: '', category: '', basePrice: '' });
        setErrors({});
        setIsModalOpen(true);
    };

    const openEdit = (service) => {
        setEditing(service);
        setFormData({
            name: service.name,
            description: service.description || '',
            category: service.category,
            basePrice: service.basePrice || '',
        });
        setErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditing(null);
        setErrors({});
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        saveMutation.mutate();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Service Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage platform services offered to clients.</p>
                </div>
                <button onClick={openCreate} className="btn-primary inline-flex items-center">
                    <PlusIcon className="w-4 h-4 mr-1.5" /> Add Service
                </button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card animate-pulse">
                            <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
                            <div className="h-3 bg-gray-50 rounded w-3/4" />
                        </div>
                    ))}
                </div>
            ) : data?.length === 0 ? (
                <div className="card text-center py-16">
                    <WrenchScrewdriverIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No services yet</p>
                    <button onClick={openCreate} className="btn-primary mt-4">
                        <PlusIcon className="w-4 h-4 mr-1 inline" /> Create First Service
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.map(service => (
                        <div key={service._id} className="card group">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-900">{service.name}</h3>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(service)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                        <PencilSquareIcon className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(`Deactivate "${service.name}"?`)) deleteMutation.mutate(service._id);
                                        }}
                                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            </div>
                            {service.description && (
                                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{service.description}</p>
                            )}
                            <div className="flex items-center justify-between text-xs">
                                <span className="badge-primary capitalize">{service.category?.replace('-', ' ')}</span>
                                {service.basePrice > 0 && <span className="font-medium text-gray-600">{formatINR(service.basePrice)}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Service' : 'New Service'}</h2>
                            <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                <XMarkIcon className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="svcName" className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                                <input
                                    id="svcName"
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className={`input-field ${errors.name ? 'border-red-400' : ''}`}
                                    maxLength={100}
                                    placeholder="e.g., Custom iOS App Development"
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                            </div>
                            <div>
                                <label htmlFor="svcDesc" className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                                <textarea
                                    id="svcDesc"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="input-field resize-none"
                                    rows={3}
                                    maxLength={500}
                                    placeholder="Briefly describe this service..."
                                />
                            </div>
                            <div>
                                <label htmlFor="svcCat" className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                                <select
                                    id="svcCat"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className={`input-field ${errors.category ? 'border-red-400' : ''}`}
                                >
                                    <option value="">Select category...</option>
                                    {CATEGORIES.map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                                {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                            </div>
                            <div>
                                <label htmlFor="svcPrice" className="block text-sm font-medium text-gray-700 mb-1.5">Base Price (INR)</label>
                                <input
                                    id="svcPrice"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.basePrice}
                                    onChange={e => setFormData({ ...formData, basePrice: e.target.value })}
                                    className={`input-field ${errors.basePrice ? 'border-red-400' : ''}`}
                                    placeholder="0.00"
                                />
                                {errors.basePrice && <p className="mt-1 text-xs text-red-500">{errors.basePrice}</p>}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                                <button type="submit" disabled={saveMutation.isLoading} className="btn-primary disabled:opacity-50">
                                    {saveMutation.isLoading ? 'Saving...' : editing ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceManagement;
