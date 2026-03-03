import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import { ADD_ONS } from '../../utils/planCatalog';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import MeetingPopup from '../../components/common/MeetingPopup';
import {
  ArrowLeftIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';

const AddOnCheckout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isPaying, setIsPaying] = useState(false);
  const [showMeetingPopup, setShowMeetingPopup] = useState(false);
  const [meetingAsked, setMeetingAsked] = useState(false);

  /* Pre-select add-on from query param (e.g. ?selected=Chatbot+integration) */
  const preSelected = searchParams.get('selected');

  const [selected, setSelected] = useState(() => {
    const initial = {};
    ADD_ONS.forEach((a) => {
      initial[a.label] = preSelected === a.label ? 1 : 0;
    });
    return initial;
  });

  const toggleAddOn = useCallback((label) => {
    setSelected((prev) => ({
      ...prev,
      [label]: prev[label] ? 0 : 1,
    }));
  }, []);

  const selectedItems = useMemo(() => ADD_ONS.filter((a) => selected[a.label] > 0), [selected]);

  const totalAmount = useMemo(
    () => selectedItems.reduce((sum, a) => sum + a.price * selected[a.label], 0),
    [selectedItems, selected]
  );

  const itemCount = selectedItems.length;

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 px-6 py-20">
        <div className="max-w-2xl mx-auto card dark:bg-surface-800 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sign in to continue</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            You need an account to purchase add-on services.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/login?redirect=/checkout/addons" className="btn-primary">
              Sign In
            </Link>
            <Link to="/register?redirect=/checkout/addons" className="btn-secondary">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handlePay = async () => {
    if (!meetingAsked) {
      setShowMeetingPopup(true);
      return;
    }
    if (totalAmount <= 0) {
      toast.error('Select at least one add-on');
      return;
    }
    if (!window.Razorpay) {
      toast.error('Payment service not available. Please refresh.');
      return;
    }
    setIsPaying(true);
    try {
      const description = selectedItems.map((a) => a.label).join(', ');
      const { data } = await api.post('/payments/razorpay/order', {
        serviceType: 'addon',
        plan: 'custom',
        amount: totalAmount,
      });
      const { order, keyId, payment } = data;
      const phone = typeof user?.phone === 'string' ? user.phone.trim() : '';
      const prefill = {
        name: user?.name || '',
        email: user?.email || '',
        ...(phone ? { contact: phone } : {}),
      };
      const checkout = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'SkyWorld Ventures',
        description: `Add-Ons: ${description}`.slice(0, 255),
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post('/payments/razorpay/verify', {
              paymentId: payment._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Payment successful!');
            navigate('/dashboard');
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill,
        notes: {
          serviceType: 'addon',
          plan: 'custom',
          addons: description.slice(0, 255),
        },
        theme: { color: '#F59E0B' },
      });
      checkout.on('payment.failed', (response) => {
        toast.error(response?.error?.description || 'Payment failed');
      });
      checkout.open();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start payment');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          to="/addons"
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back to Add-Ons
        </Link>

        <div className="card dark:bg-surface-800 dark:border-surface-700 overflow-hidden">
          {/* Header */}
          <div className="-mx-6 -mt-6 px-6 py-5 mb-6 bg-gradient-to-r from-amber-500 to-orange-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <ShoppingCartIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Add-On Checkout</h1>
                <p className="text-sm text-white/70">Select the extras you need</p>
              </div>
            </div>
          </div>

          {/* Add-on selector */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Available Add-Ons
            </h2>
            <div className="space-y-2.5">
              {ADD_ONS.map((addon) => {
                const isSelected = selected[addon.label] > 0;
                return (
                  <button
                    key={addon.label}
                    type="button"
                    onClick={() => toggleAddOn(addon.label)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
                        : 'bg-gray-50 dark:bg-surface-700 border-gray-100 dark:border-surface-600 hover:border-gray-200 dark:hover:border-surface-500'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-surface-600'
                      }`}
                    >
                      {isSelected ? (
                        <CheckIcon className="w-3.5 h-3.5" strokeWidth={3} />
                      ) : (
                        <PlusIcon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          isSelected
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {addon.label}
                      </p>
                      {addon.description && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                          {addon.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-sm font-bold flex-shrink-0 ${
                        isSelected
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {formatINR(addon.price)}
                      {addon.unit && (
                        <span className="text-[10px] font-normal text-gray-400">{addon.unit}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected items summary */}
          {itemCount > 0 && (
            <div className="mb-8 border-t border-gray-100 dark:border-surface-700 pt-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Your Selection ({itemCount} item{itemCount !== 1 ? 's' : ''})
              </h2>
              <div className="space-y-2">
                {selectedItems.map((addon) => (
                  <div key={addon.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{addon.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatINR(addon.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleAddOn(addon.label)}
                        className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <MinusIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pay button */}
          <div className="border-t border-gray-100 dark:border-surface-700 pt-6">
            {itemCount > 0 ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {formatINR(totalAmount)}
                  </span>
                </div>

                <button
                  onClick={handlePay}
                  disabled={isPaying}
                  className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <LockClosedIcon className="w-4 h-4" />
                  {isPaying ? 'Processing...' : `Pay ${formatINR(totalAmount)}`}
                </button>

                <p className="text-[11px] text-gray-400 text-center mt-3">
                  Full amount charged upfront. Add-ons are delivered alongside your project.
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                Select one or more add-ons above to continue.
              </p>
            )}
          </div>
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-6 mt-8 text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-1.5 text-xs">
            <ShieldCheckIcon className="w-4 h-4" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <LockClosedIcon className="w-4 h-4" />
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <CheckIcon className="w-4 h-4" />
            <span>Quality Guaranteed</span>
          </div>
        </div>
      </div>

      {/* Meeting popup */}
      <MeetingPopup
        show={showMeetingPopup}
        onClose={() => {
          setShowMeetingPopup(false);
          setMeetingAsked(true);
        }}
        onProceedToPayment={() => {
          setShowMeetingPopup(false);
          setMeetingAsked(true);
        }}
        redirectAfterMeeting="/checkout/addons"
      />
    </div>
  );
};

export default AddOnCheckout;
