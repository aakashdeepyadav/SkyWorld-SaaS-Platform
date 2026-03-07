import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import toast from 'react-hot-toast';
import {
  EnvelopeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

const DOCUMENT_OPTIONS = [
  {
    id: 'agreement',
    label: 'Service Agreement',
    description: 'Formal engagement terms with scope and commercial clauses.',
  },
  {
    id: 'invoice',
    label: 'Invoice',
    description: 'Latest invoice for completed payment on the account.',
  },
  {
    id: 'payment-receipt',
    label: 'Payment Receipt',
    description: 'Acknowledgement receipt for the most recent completed payment.',
  },
  {
    id: 'project-stage',
    label: 'Project Stage Report',
    description: 'Current delivery and payment stage summary for active projects.',
  },
];

const AdminDocuments = () => {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedDocs, setSelectedDocs] = useState(['agreement', 'project-stage']);
  const [customMessage, setCustomMessage] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery(
    ['admin-doc-recipients', search],
    async () => {
      const params = new URLSearchParams({
        role: 'client',
        limit: '30',
      });
      if (search.trim()) params.set('search', search.trim());
      const response = await api.get(`/admin/documents/recipients?${params}`);
      return response.data;
    },
    { keepPreviousData: true }
  );

  const recipients = data?.recipients || [];

  const selectedUser = useMemo(
    () => recipients.find((user) => user._id === selectedUserId) || null,
    [recipients, selectedUserId]
  );

  const toggleDocument = (documentType) => {
    setSelectedDocs((previous) => {
      if (previous.includes(documentType)) {
        return previous.filter((item) => item !== documentType);
      }
      return [...previous, documentType];
    });
  };

  const sendMutation = useMutation(
    async () =>
      api.post('/admin/documents/send', {
        userId: selectedUserId,
        documents: selectedDocs,
        customMessage: customMessage.trim(),
      }),
    {
      onSuccess: (response) => {
        const sentCount = response.data?.sent?.length || 0;
        const skipped = response.data?.skipped || [];
        toast.success(`Sent ${sentCount} document${sentCount === 1 ? '' : 's'} successfully`);
        if (skipped.length) {
          toast((t) => (
            <div className="text-sm">
              <p className="font-semibold">Some documents were skipped:</p>
              <ul className="mt-1 list-disc list-inside">
                {skipped.slice(0, 3).map((item) => (
                  <li key={`${item.type}-${item.reason}`}>{item.reason}</li>
                ))}
              </ul>
            </div>
          ));
        }
        setCustomMessage('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send documents');
      },
    }
  );

  const handleSend = () => {
    if (!selectedUserId) {
      toast.error('Select a client before sending');
      return;
    }
    if (!selectedDocs.length) {
      toast.error('Select at least one document');
      return;
    }
    sendMutation.mutate();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Dispatch</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Send agreement, invoice, payment receipt, and project stage documents manually through MailerSend.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">1. Select Client</h2>
            <button
              onClick={() => refetch()}
              className="btn-secondary !py-1.5 !px-3 !text-xs"
              disabled={isFetching}
            >
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="relative mb-4">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search client by name or email"
              className="input-field !pl-10 !py-2.5"
            />
          </div>

          <div className="border border-gray-100 dark:border-surface-700 rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading clients...</div>
            ) : recipients.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No clients found</div>
            ) : (
              <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-100 dark:divide-surface-700">
                {recipients.map((user) => {
                  const active = selectedUserId === user._id;
                  return (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => setSelectedUserId(user._id)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        active
                          ? 'bg-primary-50 dark:bg-primary-500/10'
                          : 'hover:bg-gray-50 dark:hover:bg-surface-800'
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 card">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">2. Recipient Preview</h2>
          {selectedUser ? (
            <div className="p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/10">
              <div className="flex items-start gap-3">
                <UserCircleIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedUser.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{selectedUser.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">{selectedUser.role}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-gray-100 dark:border-surface-700 bg-gray-50 dark:bg-surface-800 text-sm text-gray-500 dark:text-gray-400">
              Select a client from the list to continue.
            </div>
          )}

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <EnvelopeIcon className="w-4 h-4" />
              MailerSend delivery
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Each click sends one email with all selected attachments. Monthly MailerSend usage will update in Admin Analytics.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">3. Select Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DOCUMENT_OPTIONS.map((option) => {
            const checked = selectedDocs.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleDocument(option.id)}
                className={`text-left border rounded-xl p-4 transition-all ${
                  checked
                    ? 'border-primary-300 bg-primary-50/70 dark:border-primary-500/50 dark:bg-primary-500/10'
                    : 'border-gray-200 dark:border-surface-700 hover:border-gray-300 dark:hover:border-surface-600'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{option.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.description}</p>
                  </div>
                  {checked ? (
                    <CheckCircleIcon className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                  ) : (
                    <DocumentTextIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Admin note (optional)
          </label>
          <textarea
            rows={4}
            value={customMessage}
            onChange={(event) => setCustomMessage(event.target.value)}
            maxLength={1000}
            placeholder="Add a short note to include in the email body..."
            className="input-field !py-2.5"
          />
          <p className="text-xs text-gray-400 mt-1">{customMessage.length}/1000</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-surface-700 pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedDocs.length} document{selectedDocs.length === 1 ? '' : 's'} selected
          </p>
          <button
            onClick={handleSend}
            disabled={sendMutation.isLoading}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
            {sendMutation.isLoading ? 'Sending...' : 'Send Documents'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDocuments;
