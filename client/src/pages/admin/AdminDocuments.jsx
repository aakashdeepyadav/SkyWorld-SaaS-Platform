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
  ArrowLeftIcon,
  FolderOpenIcon,
  ClockIcon,
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
    description: 'Latest invoice for completed payment on selected project.',
  },
  {
    id: 'payment-receipt',
    label: 'Payment Receipt',
    description: 'Acknowledgement receipt for the most recent completed payment.',
  },
  {
    id: 'project-stage',
    label: 'Project Stage Report',
    description: 'Current delivery and payment stage summary for the project.',
  },
];

const STATUS_COLORS = {
  planning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400',
  review: 'bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400',
};

const StepIndicator = ({ currentStep }) => {
  const steps = [
    { num: 1, label: 'Select Client' },
    { num: 2, label: 'Choose Project' },
    { num: 3, label: 'Select Documents' },
  ];

  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${currentStep >= step.num
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-400 dark:bg-surface-700 dark:text-gray-500'
              }`}
          >
            {currentStep > step.num ? '✓' : step.num}
          </div>
          <span
            className={`text-sm font-medium hidden sm:inline ${currentStep >= step.num
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-400 dark:text-gray-500'
              }`}
          >
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div
              className={`w-8 h-px ${currentStep > step.num
                  ? 'bg-primary-400'
                  : 'bg-gray-200 dark:bg-surface-700'
                }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const AdminDocuments = () => {
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedDocs, setSelectedDocs] = useState(['agreement', 'project-stage']);
  const [customMessage, setCustomMessage] = useState('');

  // Step 1: Fetch client list
  const { data, isLoading: loadingClients, refetch, isFetching } = useQuery(
    ['admin-doc-recipients', search],
    async () => {
      const params = new URLSearchParams({ role: 'client', limit: '30' });
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

  // Step 2: Fetch projects for selected user
  const {
    data: projectData,
    isLoading: loadingProjects,
  } = useQuery(
    ['admin-user-projects', selectedUserId],
    async () => {
      const response = await api.get(`/admin/documents/user-projects/${selectedUserId}`);
      return response.data;
    },
    { enabled: !!selectedUserId && step >= 2 }
  );

  const userProjects = projectData?.projects || [];

  const selectedProject = useMemo(
    () => userProjects.find((p) => p._id === selectedProjectId) || null,
    [userProjects, selectedProjectId]
  );

  const toggleDocument = (documentType) => {
    setSelectedDocs((prev) =>
      prev.includes(documentType)
        ? prev.filter((item) => item !== documentType)
        : [...prev, documentType]
    );
  };

  const sendMutation = useMutation(
    async () =>
      api.post('/admin/documents/send', {
        userId: selectedUserId,
        projectId: selectedProjectId || undefined,
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
    if (!selectedUserId) return toast.error('Select a client first');
    if (!selectedDocs.length) return toast.error('Select at least one document');
    sendMutation.mutate();
  };

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    setSelectedProjectId('');
    setStep(2);
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    setStep(3);
  };

  const goBack = () => {
    if (step === 3) {
      setSelectedProjectId('');
      setStep(2);
    } else if (step === 2) {
      setSelectedUserId('');
      setStep(1);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Dispatch</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Send agreement, invoice, receipt, and project stage documents to clients.
        </p>
      </div>

      <StepIndicator currentStep={step} />

      {/* ─── STEP 1: Select Client ─────────────────────────────── */}
      {step === 1 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Select Client
            </h2>
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client by name or email"
              className="input-field !pl-10 !py-2.5"
            />
          </div>

          <div className="border border-gray-100 dark:border-surface-700 rounded-xl overflow-hidden">
            {loadingClients ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading clients...</div>
            ) : recipients.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No clients found</div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100 dark:divide-surface-700">
                {recipients.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => handleSelectUser(user._id)}
                    className="w-full text-left px-4 py-3 transition-colors hover:bg-primary-50 dark:hover:bg-primary-500/10 flex items-center gap-3"
                  >
                    <UserCircleIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── STEP 2: Choose Project ─────────────────────────────── */}
      {step === 2 && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={goBack} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Projects for {selectedUser?.name || 'Client'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{selectedUser?.email}</p>
            </div>
          </div>

          {loadingProjects ? (
            <div className="p-6 text-sm text-gray-500 dark:text-gray-400 text-center">
              Loading projects...
            </div>
          ) : userProjects.length === 0 ? (
            <div className="p-6 text-center">
              <FolderOpenIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No projects found for this client.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                You can still send general documents without selecting a project.
              </p>
              <button
                onClick={() => setStep(3)}
                className="btn-secondary mt-4 !text-sm"
              >
                Continue Without Project
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userProjects.map((project) => {
                const statusClass =
                  STATUS_COLORS[project.status] ||
                  'bg-gray-100 text-gray-800 dark:bg-surface-700 dark:text-gray-300';
                const progress = Number(project.progress || 0);
                const hasPayment = !!project.latestPayment;

                return (
                  <button
                    key={project._id}
                    type="button"
                    onClick={() => handleSelectProject(project._id)}
                    className="w-full text-left border border-gray-200 dark:border-surface-700 rounded-xl p-4 hover:border-primary-300 dark:hover:border-primary-500/40 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {project.title || 'Untitled Project'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {project.serviceType || 'General'} • {project.plan || 'Custom'}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 capitalize ${statusClass}`}
                      >
                        {(project.status || 'planning').replace(/-/g, ' ')}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 dark:bg-surface-700 rounded-full h-1.5">
                        <div
                          className="bg-primary-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 w-8 text-right">
                        {progress}%
                      </span>
                    </div>

                    {/* Payment & delivery info */}
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {(project.deliveryStatus || 'pending').replace(/^\w/, (c) =>
                          c.toUpperCase()
                        )}
                      </span>
                      {hasPayment && (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          Payment received
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              <div className="pt-3 border-t border-gray-100 dark:border-surface-700">
                <button
                  onClick={() => setStep(3)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Skip — send general documents without a specific project
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── STEP 3: Select Documents & Send ─────────────────────── */}
      {step === 3 && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={goBack} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Select Documents
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedUser?.name}
                {selectedProject ? ` → ${selectedProject.title || 'Project'}` : ' → General'}
              </p>
            </div>
          </div>

          {/* Summary card */}
          <div className="mb-5 p-4 rounded-xl border border-primary-200/60 dark:border-primary-500/20 bg-primary-50/50 dark:bg-primary-500/5">
            <div className="flex items-start gap-3">
              <UserCircleIcon className="w-8 h-8 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedUser?.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">{selectedUser?.email}</p>
                {selectedProject && (
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 font-medium">
                    Project: {selectedProject.title || 'Untitled'}
                    <span className="text-gray-400 dark:text-gray-500 font-normal">
                      {' '}
                      • {(selectedProject.status || 'planning').replace(/-/g, ' ')}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Document cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DOCUMENT_OPTIONS.map((option) => {
              const checked = selectedDocs.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleDocument(option.id)}
                  className={`text-left border rounded-xl p-4 transition-all ${checked
                      ? 'border-primary-300 bg-primary-50/70 dark:border-primary-500/50 dark:bg-primary-500/10'
                      : 'border-gray-200 dark:border-surface-700 hover:border-gray-300 dark:hover:border-surface-600'
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {option.description}
                      </p>
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

          {/* Custom message */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Admin note (optional)
            </label>
            <textarea
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              maxLength={1000}
              placeholder="Add a short note to include in the email body..."
              className="input-field !py-2.5"
            />
            <p className="text-xs text-gray-400 mt-1">{customMessage.length}/1000</p>
          </div>

          {/* Delivery info + Send */}
          <div className="mt-5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <EnvelopeIcon className="w-3.5 h-3.5" />
            Delivered via MailerSend
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-surface-700 pt-4">
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
      )}
    </div>
  );
};

export default AdminDocuments;
