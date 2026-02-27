import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
    WrenchScrewdriverIcon,
    CurrencyRupeeIcon,
    TagIcon,
} from '@heroicons/react/24/outline';
import { formatINR } from '../../utils/currency';

const CATEGORIES = [
    { value: 'app-development', label: 'App Development', color: 'violet' },
    { value: 'web-development', label: 'Web Development', color: 'sky' },
    { value: 'branding-creative', label: 'Branding & Creative', color: 'amber' },
];

const CATEGORY_STYLES = {
    'app-development': {
        bg: 'bg-violet-50 dark:bg-violet-500/10',
        text: 'text-violet-600 dark:text-violet-400',
        border: 'border-violet-200 dark:border-violet-500/30',
        badge: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300',
    },
    'web-development': {
        bg: 'bg-sky-50 dark:bg-sky-500/10',
        text: 'text-sky-600 dark:text-sky-400',
        border: 'border-sky-200 dark:border-sky-500/30',
        badge: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300',
    },
    'branding-creative': {
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-500/30',
        badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
    },
};

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
            if (editing) return api.put(`/services/${editing._id}`, payload);
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

    const serviceCount = data?.length || 0;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service Management</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {serviceCount > 0 ? `${serviceCount} active service${serviceCount > 1 ? 's' : ''}` : 'Manage platform services offered to clients.'}
                    </p>
                </div>
                <button onClick={openCreate} className="btn-primary inline-flex items-center gap-1.5">
                    <PlusIcon className="w-4 h-4" /> Add Service
                </button>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card dark:bg-surface-800 animate-pulse">
                            <div className="h-4 bg-gray-100 dark:bg-surface-700 rounded w-1/2 mb-3" />
                            <div className="h-3 bg-gray-50 dark:bg-surface-700 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-gray-50 dark:bg-surface-700 rounded w-1/3" />
                        </div>
                    ))}
                </div>
            ) : data?.length === 0 ? (
                <div className="card dark:bg-surface-800 text-center py-20">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-surface-700 flex items-center justify-center">
                        <WrenchScrewdriverIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No services yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first service to get started.</p>
                    <button onClick={openCreate} className="btn-primary mt-6 inline-flex items-center gap-1.5">
                        <PlusIcon className="w-4 h-4" /> Create First Service
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {data.map(service => {
                        const styles = CATEGORY_STYLES[service.category] || CATEGORY_STYLES['web-development'];
                        return (
                            <div
                                key={service._id}
                                className={`card dark:bg-surface-800 dark:border-surface-700 group relative border-l-4 ${styles.border} hover:shadow-md transition-all duration-200`}
                            >
                                {/* Top row: name + actions */}
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug pr-2">{service.name}</h3>
                                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEdit(service)}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <PencilSquareIcon className="w-4 h-4 text-gray-400" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Deactivate "${service.name}"?`)) deleteMutation.mutate(service._id);
                                            }}
                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Deactivate"
                                        >
                                            <TrashIcon className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* Description */}
                                {service.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">{service.description}</p>
                                )}

                                {/* Footer: category + price */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-surface-700">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${styles.badge}`}>
                                        <TagIcon className="w-3 h-3" />
                                        {service.category?.replace(/-/g, ' ')}
                                    </span>
                                    {service.basePrice > 0 && (
                                        <span className="inline-flex items-center gap-0.5 text-sm font-bold text-gray-900 dark:text-white">
                                            <CurrencyRupeeIcon className="w-3.5 h-3.5 text-gray-400" />
                                            {formatINR(service.basePrice).replace('₹', '')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Modal ──────────────────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    <div
                        className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in border border-gray-100 dark:border-surface-700"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editing ? 'Edit Service' : 'New Service'}</h2>
                                <p className="text-xs text-gray-400 mt-0.5">{editing ? 'Update service details below.' : 'Fill in the details to create a new service.'}</p>
                            </div>
                            <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                                <XMarkIcon className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label htmlFor="svcName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
                                <input
                                    id="svcName"
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className={`input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white ${errors.name ? 'border-red-400 dark:border-red-500' : ''}`}
                                    maxLength={100}
                                    placeholder="e.g., Custom iOS App Development"
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="svcDesc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                                <textarea
                                    id="svcDesc"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white resize-none"
                                    rows={3}
                                    maxLength={500}
                                    placeholder="Briefly describe this service..."
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label htmlFor="svcCat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                                <select
                                    id="svcCat"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className={`input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white ${errors.category ? 'border-red-400 dark:border-red-500' : ''}`}
                                >
                                    <option value="">Select category...</option>
                                    {CATEGORIES.map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                                {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                            </div>

                            {/* Price */}
                            <div>
                                <label htmlFor="svcPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Base Price (INR)</label>
                                <div className="relative">
                                    <CurrencyRupeeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="svcPrice"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.basePrice}
                                        onChange={e => setFormData({ ...formData, basePrice: e.target.value })}
                                        className={`input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white pl-9 ${errors.basePrice ? 'border-red-400 dark:border-red-500' : ''}`}
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.basePrice && <p className="mt-1 text-xs text-red-500">{errors.basePrice}</p>}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-surface-700">
                                <button type="button" onClick={closeModal} className="btn-secondary dark:bg-surface-700 dark:text-gray-300 dark:border-surface-600 dark:hover:bg-surface-600">Cancel</button>
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
