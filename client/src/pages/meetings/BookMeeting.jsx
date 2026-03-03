import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  VideoCameraIcon,
  UserIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

/* ── helpers ── */
const formatTime12 = (t) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const toIST_YYYY_MM_DD = (dateObj) =>
  dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const BookMeeting = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || null;

  /* ── State ── */
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientName, setClientName] = useState(user?.name || '');
  const [clientEmail, setClientEmail] = useState(user?.email || '');
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [checkingMeet, setCheckingMeet] = useState(true);
  const [meetReady, setMeetReady] = useState(false);
  const [meetStatusMessage, setMeetStatusMessage] = useState('Checking meeting service...');

  /* ── min date = today IST ── */
  const minDate = useMemo(() => toIST_YYYY_MM_DD(new Date()), []);

  /* ── max date = 30 days from today ── */
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return toIST_YYYY_MM_DD(d);
  }, []);

  useEffect(() => {
    const checkMeetStatus = async () => {
      setCheckingMeet(true);
      try {
        const { data } = await api.get('/meetings/status');
        setMeetReady(Boolean(data?.meetReady));
        setMeetStatusMessage(data?.message || 'Meeting status checked.');
      } catch {
        setMeetReady(false);
        setMeetStatusMessage(
          'Unable to verify Google Meet setup right now. Please try again shortly.'
        );
      } finally {
        setCheckingMeet(false);
      }
    };

    checkMeetStatus();
  }, []);

  /* ── Fetch available slots ── */
  const fetchSlots = useCallback(
    async (date) => {
      if (!meetReady) {
        toast.error('Meeting booking is temporarily unavailable.');
        return;
      }
      setSelectedDate(date);
      setSelectedSlot(null);
      if (!date) return;
      setLoadingSlots(true);
      try {
        const { data } = await api.get(`/meetings/slots?date=${date}`);
        setSlots(data.slots || []);
      } catch {
        toast.error('Failed to load available slots');
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [meetReady]
  );

  /* ── Book meeting ── */
  const handleBook = async () => {
    if (!meetReady) {
      toast.error(meetStatusMessage || 'Meeting booking is currently unavailable');
      return;
    }
    if (!selectedDate || !selectedSlot) {
      toast.error('Please select a date and time slot');
      return;
    }
    if (!clientName.trim() || !clientEmail.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setBooking(true);
    try {
      const { data } = await api.post('/meetings/book', {
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        date: selectedDate,
        startTime: selectedSlot.startTime,
      });
      setConfirmed(data.booking);
      toast.success('Meeting booked successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book meeting');
    } finally {
      setBooking(false);
    }
  };

  /* ── Confirmed view ── */
  if (confirmed) {
    const formattedDate = new Date(`${confirmed.date}T00:00:00`).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 px-4 py-12">
        <div className="max-w-lg mx-auto">
          <div className="card dark:bg-surface-800 dark:border-surface-700 text-center overflow-hidden">
            {/* Success header */}
            <div className="-mx-6 -mt-6 px-6 py-8 mb-6 bg-gradient-to-r from-emerald-500 to-teal-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
              <div className="relative">
                <CheckCircleIcon className="w-14 h-14 text-white mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-white">Meeting Confirmed!</h1>
                <p className="text-sm text-white/80 mt-1">
                  You will receive a confirmation email shortly.
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-surface-700 border border-gray-100 dark:border-surface-600">
                <CalendarDaysIcon className="w-5 h-5 text-sky-500 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Date</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formattedDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-surface-700 border border-gray-100 dark:border-surface-600">
                <ClockIcon className="w-5 h-5 text-violet-500 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Time</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatTime12(confirmed.startTime)} - {formatTime12(confirmed.endTime)} IST
                  </p>
                </div>
              </div>
              {confirmed.meetLink && (
                <a
                  href={confirmed.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"
                >
                  <VideoCameraIcon className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                      Meeting Link
                    </p>
                    <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                      Join Google Meet
                    </p>
                  </div>
                </a>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {redirectTo ? (
                <Link
                  to={redirectTo}
                  className="flex-1 py-3 px-5 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 transition-all text-center text-sm"
                >
                  Continue to Payment
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="flex-1 py-3 px-5 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 transition-all text-center text-sm"
                >
                  Go to Dashboard
                </Link>
              )}
              <button
                onClick={() => {
                  setConfirmed(null);
                  setSelectedDate('');
                  setSelectedSlot(null);
                  setSlots([]);
                }}
                className="flex-1 py-3 px-5 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 transition-all text-sm"
              >
                Book Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Not logged in ── */
  if (!user) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 px-6 py-20">
        <div className="max-w-2xl mx-auto card dark:bg-surface-800 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sign in to book a meeting
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            You need an account to schedule a meeting with our team.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/login?redirect=/book-meeting" className="btn-primary">
              Sign In
            </Link>
            <Link to="/register?redirect=/book-meeting" className="btn-secondary">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main booking form ── */
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Back link */}
        <Link
          to={redirectTo || '/'}
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back
        </Link>

        <div className="card dark:bg-surface-800 dark:border-surface-700 overflow-hidden">
          {/* Header */}
          <div className="-mx-6 -mt-6 px-6 py-5 mb-6 bg-gradient-to-r from-sky-500 to-indigo-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <VideoCameraIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Book a Meeting</h1>
                <p className="text-sm text-white/70">Schedule a 30-min call with our team.</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div
              className={`rounded-xl border p-3 text-sm ${
                checkingMeet
                  ? 'bg-gray-50 dark:bg-surface-700 border-gray-200 dark:border-surface-600 text-gray-500 dark:text-gray-400'
                  : meetReady
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300'
              }`}
            >
              {checkingMeet ? 'Checking Google Meet setup...' : meetStatusMessage}
            </div>
          </div>

          {/* Step 1: Your details */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Your Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  <UserIcon className="w-3.5 h-3.5 inline mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  <EnvelopeIcon className="w-3.5 h-3.5 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Pick a date */}
          <div className="mb-8 border-t border-gray-100 dark:border-surface-700 pt-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              <CalendarDaysIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Select a Date
            </h2>
            <input
              type="date"
              value={selectedDate}
              min={minDate}
              max={maxDate}
              onChange={(e) => fetchSlots(e.target.value)}
              disabled={!meetReady || checkingMeet}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 outline-none transition-all"
            />
          </div>

          {/* Step 3: Pick a slot */}
          {selectedDate && (
            <div className="mb-8 border-t border-gray-100 dark:border-surface-700 pt-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                <ClockIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Available Time Slots
              </h2>

              {loadingSlots ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-11 rounded-xl bg-gray-100 dark:bg-surface-700 animate-pulse"
                    />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 rounded-xl bg-gray-50 dark:bg-surface-700 border border-gray-100 dark:border-surface-600">
                  <ClockIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No available slots for this date. Try another date.
                  </p>
                </div>
              ) : (
                <>
                  {/* Morning slots */}
                  {slots.some((s) => Number(s.startTime.split(':')[0]) < 12) && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">
                        Morning
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                        {slots
                          .filter((s) => Number(s.startTime.split(':')[0]) < 12)
                          .map((slot) => (
                            <button
                              key={slot.startTime}
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all
                                ${
                                  selectedSlot?.startTime === slot.startTime
                                    ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/25'
                                    : 'bg-white dark:bg-surface-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-surface-600 hover:border-sky-300 dark:hover:border-sky-500/50'
                                }`}
                            >
                              {formatTime12(slot.startTime)}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Afternoon slots */}
                  {slots.some((s) => Number(s.startTime.split(':')[0]) >= 12) && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">
                        Afternoon
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                        {slots
                          .filter((s) => Number(s.startTime.split(':')[0]) >= 12)
                          .map((slot) => (
                            <button
                              key={slot.startTime}
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all
                                ${
                                  selectedSlot?.startTime === slot.startTime
                                    ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/25'
                                    : 'bg-white dark:bg-surface-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-surface-600 hover:border-sky-300 dark:hover:border-sky-500/50'
                                }`}
                            >
                              {formatTime12(slot.startTime)}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Summary + Book button */}
          {selectedSlot && (
            <div className="border-t border-gray-100 dark:border-surface-700 pt-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 mb-5">
                <CalendarDaysIcon className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime12(selectedSlot.startTime)} - {formatTime12(selectedSlot.endTime)}{' '}
                    IST (30 min)
                  </p>
                </div>
              </div>

              <button
                onClick={handleBook}
                disabled={booking || !meetReady || checkingMeet}
                className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <VideoCameraIcon className="w-5 h-5" />
                {booking ? 'Booking...' : 'Confirm Meeting'}
              </button>

              <p className="text-[11px] text-gray-400 text-center mt-3">
                You will receive a confirmation email with the Google Meet link.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookMeeting;
