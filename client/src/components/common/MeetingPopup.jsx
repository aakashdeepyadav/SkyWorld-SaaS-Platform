import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { VideoCameraIcon, XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

/**
 * A popup that appears before payment asking if the user wants to
 * book a meeting with the team first.
 *
 * Props:
 *  - show: boolean — whether to show the popup
 *  - onClose: () => void — called when user clicks No / closes
 *  - onProceedToPayment: () => void — called when user clicks No (same as close; proceed to pay)
 *  - redirectAfterMeeting: string — the URL to redirect back to after booking (current checkout page)
 */
const MeetingPopup = ({ show, onClose, onProceedToPayment, redirectAfterMeeting }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // Small delay for enter animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [show]);

  if (!show) return null;

  const handleYes = () => {
    setVisible(false);
    setTimeout(() => {
      navigate(`/book-meeting?redirect=${encodeURIComponent(redirectAfterMeeting)}`);
    }, 200);
  };

  const handleNo = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
      onProceedToPayment?.();
    }, 200);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'
          }`}
        onClick={handleNo}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
      >
        <div
          className="pointer-events-auto w-full max-w-md bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-surface-700 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 bg-[#37BBEC]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <button
              onClick={handleNo}
              className="absolute top-3 right-3 p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Talk to Us First?</h2>
                <p className="text-sm text-white/75">Before you pay</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
              Would you like to <strong>book a free 30-minute meeting</strong> with our team to
              discuss your requirements before making the payment?
            </p>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 mb-5">
              <VideoCameraIcon className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Get a Google Meet link instantly. Discuss scope, timeline, and customization before
                committing.
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleYes}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-[#37BBEC] hover:bg-[#2ea8d6] transition-all duration-200 active:scale-[0.98] text-sm flex items-center justify-center gap-2"
              >
                <VideoCameraIcon className="w-4 h-4" />
                Yes, Book Meeting
              </button>
              <button
                onClick={handleNo}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 transition-all duration-200 active:scale-[0.98] text-sm"
              >
                No, Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MeetingPopup;
