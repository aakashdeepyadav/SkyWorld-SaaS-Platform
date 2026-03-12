import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { X, Calendar, Clock, CheckCircle, Video, User, Mail, Loader } from 'lucide-react';

const formatTime12 = (t) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const toIST_YYYY_MM_DD = (dateObj) =>
  dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

export default function MeetingModal() {
  const { user } = useAuth();
  const { closeModal } = useModal();

  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientName, setClientName] = useState(user?.name || '');
  const [clientEmail, setClientEmail] = useState(user?.email || '');
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const minDate = useMemo(() => toIST_YYYY_MM_DD(new Date()), []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return toIST_YYYY_MM_DD(d);
  }, []);

  // Fetch slots
  const fetchSlots = useCallback(async (date) => {
    if (!date) return;
    setLoadingSlots(true);
    try {
      const res = await api.get(`/meetings/slots/${date}`);
      setSlots(res.data.slots || []);
    } catch (error) {
      toast.error('Failed to load time slots');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  // Book meeting
  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !clientName || !clientEmail) {
      toast.error('Please fill all required fields');
      return;
    }

    setBooking(true);
    try {
      const res = await api.post('/meetings/book', {
        date: selectedDate,
        timeSlot: selectedSlot,
        clientName,
        clientEmail,
      });
      setConfirmed(res.data.meeting);
      toast.success('Meeting booked successfully!');
      setTimeout(() => closeModal(), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book meeting');
    } finally {
      setBooking(false);
    }
  };

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mx-auto">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-center text-gray-900">
            Meeting Confirmed!
          </h2>
          <p className="text-sm text-gray-600 text-center">
            Your meeting has been scheduled. Check your email for details.
          </p>
          <button
            onClick={closeModal}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-8 bg-black/50 flex items-center justify-center">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              Book a Meeting
            </h2>
            <button
              onClick={closeModal}
              className="p-1 hover:bg-gray-100:bg-surface-700 rounded-lg transition"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleBooking} className="p-6 space-y-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Your Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={minDate}
                max={maxDate}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                required
              />
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Available Time Slots
                </label>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader className="h-5 w-5 animate-spin text-primary-600" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No slots available for this date
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                          selectedSlot === slot
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200:bg-surface-600'
                        }`}
                      >
                        {formatTime12(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Meeting Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 flex items-start gap-2">
                <Video className="h-4 w-4 flex-shrink-0 mt-0.5" />
                This is a video call meeting. You'll receive a meeting link via email.
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50:bg-surface-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={booking || !selectedSlot}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {booking ? <Loader className="h-4 w-4 animate-spin" /> : 'Confirm Meeting'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
