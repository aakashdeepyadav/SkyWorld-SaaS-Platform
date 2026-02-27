import { CheckIcon, ClockIcon } from '@heroicons/react/24/solid';
import {
    ClipboardDocumentListIcon,
    CpuChipIcon,
    MagnifyingGlassCircleIcon,
    RocketLaunchIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

/**
 * Visual project pipeline tracker — shows the project's journey
 * through planning → in-progress → review → completed as an
 * animated, step-based timeline with a progress ring.
 */

const PIPELINE_STEPS = [
    { key: 'planning', label: 'Planning', icon: ClipboardDocumentListIcon, color: 'amber' },
    { key: 'in-progress', label: 'Development', icon: CpuChipIcon, color: 'primary' },
    { key: 'review', label: 'Review', icon: MagnifyingGlassCircleIcon, color: 'violet' },
    { key: 'completed', label: 'Delivered', icon: RocketLaunchIcon, color: 'emerald' },
];

const getStepIndex = (status) => {
    const idx = PIPELINE_STEPS.findIndex(s => s.key === status);
    return idx === -1 ? -1 : idx;
};

const COLOR_MAP = {
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', ring: 'ring-amber-400', fill: '#f59e0b' },
    primary: { bg: 'bg-primary-100', text: 'text-primary-600', ring: 'ring-primary-400', fill: '#0ea5e9' },
    violet: { bg: 'bg-violet-100', text: 'text-violet-600', ring: 'ring-violet-400', fill: '#8b5cf6' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', ring: 'ring-emerald-400', fill: '#10b981' },
};

// ─── Progress Ring SVG ──────────────────────────────────────────────
const ProgressRing = ({ progress, color }) => {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
                {/* Track */}
                <circle
                    cx="44" cy="44" r={radius}
                    fill="none"
                    strokeWidth="6"
                    className="stroke-gray-100 dark:stroke-surface-700"
                />
                {/* Progress arc */}
                <circle
                    cx="44" cy="44" r={radius}
                    fill="none"
                    strokeWidth="6"
                    strokeLinecap="round"
                    stroke={color}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{progress}%</span>
            </div>
        </div>
    );
};

// ─── Pipeline Step ──────────────────────────────────────────────────
const PipelineStep = ({ step, index, currentIndex, isCancelled }) => {
    const isCompleted = !isCancelled && index < currentIndex;
    const isCurrent = !isCancelled && index === currentIndex;
    const isPending = !isCancelled && index > currentIndex;
    const colors = COLOR_MAP[step.color];
    const Icon = step.icon;

    return (
        <div className="flex flex-col items-center relative group">
            {/* Circle */}
            <div
                className={`
          relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
          ${isCompleted
                        ? `${colors.bg} ${colors.text} ring-2 ${colors.ring}`
                        : isCurrent
                            ? `${colors.bg} ${colors.text} ring-2 ${colors.ring} animate-pulse-glow shadow-lg`
                            : isCancelled
                                ? 'bg-red-50 text-red-400 ring-1 ring-red-200'
                                : 'bg-gray-50 dark:bg-surface-700 text-gray-300 dark:text-gray-500 ring-1 ring-gray-200 dark:ring-surface-600'
                    }
        `}
            >
                {isCompleted ? (
                    <CheckIcon className="w-5 h-5" />
                ) : isCancelled && index >= currentIndex ? (
                    <XCircleIcon className="w-5 h-5" />
                ) : (
                    <Icon className="w-5 h-5" />
                )}
            </div>

            {/* Label */}
            <span className={`
        mt-2 text-xs font-medium text-center leading-tight whitespace-nowrap
        ${isCompleted || isCurrent
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-500'
                }
      `}>
                {step.label}
            </span>

            {/* Active indicator dot */}
            {isCurrent && (
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            )}
        </div>
    );
};

// ─── Milestone Timeline ─────────────────────────────────────────────
const MilestoneTimeline = ({ milestones }) => {
    if (!milestones?.length) return null;

    const completedCount = milestones.filter(m => m.completed).length;

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Milestones</h3>
                <span className="text-xs text-gray-400">
                    {completedCount}/{milestones.length} completed
                </span>
            </div>

            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-surface-700" />
                {/* Completed fill */}
                <div
                    className="absolute left-[11px] top-2 w-0.5 bg-gradient-to-b from-primary-400 to-emerald-400 transition-all duration-700"
                    style={{
                        height: milestones.length > 0
                            ? `${(completedCount / milestones.length) * 100}%`
                            : '0%'
                    }}
                />

                <div className="space-y-0">
                    {milestones.map((ms, i) => (
                        <div key={i} className="relative flex items-start pl-8 py-2.5 group">
                            {/* Dot */}
                            <div className={`
                absolute left-[6px] top-[14px] w-[12px] h-[12px] rounded-full border-2 transition-all duration-300
                ${ms.completed
                                    ? 'bg-emerald-500 border-emerald-500 scale-100'
                                    : 'bg-white dark:bg-surface-800 border-gray-300 dark:border-surface-600 group-hover:border-primary-400'
                                }
              `}>
                                {ms.completed && (
                                    <CheckIcon className="w-2 h-2 text-white absolute top-[1px] left-[1px]" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium leading-snug ${ms.completed
                                        ? 'text-gray-500 dark:text-gray-400 line-through'
                                        : 'text-gray-900 dark:text-white'
                                    }`}>
                                    {ms.title}
                                </p>
                                {ms.description && (
                                    <p className="text-xs text-gray-400 mt-0.5">{ms.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                    {ms.dueDate && (
                                        <span className="inline-flex items-center text-[10px] text-gray-400">
                                            <ClockIcon className="w-3 h-3 mr-0.5" />
                                            {new Date(ms.dueDate).toLocaleDateString()}
                                        </span>
                                    )}
                                    {ms.completedAt && (
                                        <span className="inline-flex items-center text-[10px] text-emerald-500">
                                            <CheckIcon className="w-3 h-3 mr-0.5" />
                                            {new Date(ms.completedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ─────────────────────────────────────────────────
const ProjectTracker = ({ project }) => {
    const currentIndex = getStepIndex(project.status);
    const isCancelled = project.status === 'cancelled';
    const progress = project.progress || 0;

    // Choose color for the ring based on current step
    const ringColor = isCancelled
        ? '#ef4444'
        : currentIndex >= 0
            ? COLOR_MAP[PIPELINE_STEPS[currentIndex].color].fill
            : '#d1d5db';

    return (
        <div className="card dark:bg-surface-800 dark:border-surface-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Project Status</h2>

            <div className="flex items-start gap-6">
                {/* Progress Ring */}
                <ProgressRing progress={progress} color={ringColor} />

                {/* Pipeline Steps */}
                <div className="flex-1 min-w-0">
                    {/* Steps row */}
                    <div className="flex items-start justify-between relative">
                        {/* Connector line */}
                        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-100 dark:bg-surface-700 z-0" />
                        {/* Completed fill */}
                        <div
                            className="absolute top-6 left-6 h-0.5 z-0 transition-all duration-700 ease-out"
                            style={{
                                width: isCancelled
                                    ? '0%'
                                    : currentIndex <= 0
                                        ? '0%'
                                        : `${(currentIndex / (PIPELINE_STEPS.length - 1)) * 100}%`,
                                background: `linear-gradient(90deg, ${COLOR_MAP.amber.fill}, ${ringColor})`,
                                maxWidth: 'calc(100% - 48px)',
                            }}
                        />
                        {PIPELINE_STEPS.map((step, i) => (
                            <PipelineStep
                                key={step.key}
                                step={step}
                                index={i}
                                currentIndex={currentIndex}
                                isCancelled={isCancelled}
                            />
                        ))}
                    </div>

                    {/* Cancelled banner */}
                    {isCancelled && (
                        <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
                            <XCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                This project has been cancelled
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Milestones Timeline */}
            <MilestoneTimeline milestones={project.milestones} />
        </div>
    );
};

export default ProjectTracker;
