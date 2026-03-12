import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import { useCatalog } from '../../context/CatalogContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  CheckIcon,
  PlusIcon,
  XMarkIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const AddOnCheckout = () => {
  const { ADD_ONS } = useCatalog();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isPaying, setIsPaying] = useState(false);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Sign in to continue</h1>
          <p className="text-sm text-gray-500 mt-1">You need an account to purchase add-ons.</p>
          <div className="mt-4 flex items-center justify-center gap-3">
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
            const verifyRes = await api.post('/payments/razorpay/verify', {
              paymentId: payment._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            const projectId = verifyRes?.data?.payment?.projectId;
            toast.success('Payment successful!');
            navigate(projectId ? `/projects/${projectId}?meetingPrompt=1` : '/projects');
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
        theme: { color: '#37BBEC' },
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-5 py-10">
        <Link
          to="/addons"
          className="inline-flex items-center text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5 mr-1" /> Back
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[#37BBEC] px-6 py-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
            <div className="relative">
              <p className="text-sm font-medium text-white/70">Extras</p>
              <h1 className="text-xl font-bold text-white mt-0.5">Add-Ons</h1>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Add-on selector */}
            <div className="space-y-2 mb-6">
              {ADD_ONS.map((addon) => {
                const isSelected = selected[addon.label] > 0;
                return (
                  <button
                    key={addon.label}
                    type="button"
                    onClick={() => toggleAddOn(addon.label)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#37BBEC]/5 border-[#37BBEC]/20'
                        : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[#37BBEC] text-white' : 'bg-gray-200'
                      }`}
                    >
                      {isSelected ? (
                        <CheckIcon className="w-3 h-3" strokeWidth={3} />
                      ) : (
                        <PlusIcon className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <span
                      className={`text-sm flex-1 truncate ${
                        isSelected ? 'font-medium text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      {addon.label}
                    </span>
                    <span
                      className={`text-sm font-bold flex-shrink-0 ${
                        isSelected ? 'text-[#37BBEC]' : 'text-gray-400'
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

            {/* Selected summary */}
            {itemCount > 0 && (
              <div className="border-t border-gray-100 pt-4 mb-6">
                <div className="space-y-1.5">
                  {selectedItems.map((addon) => (
                    <div key={addon.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate">{addon.label}</span>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className="font-semibold text-gray-900">
                          {formatINR(addon.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleAddOn(addon.label)}
                          className="w-4 h-4 rounded flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <XMarkIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            {itemCount > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-extrabold text-gray-900">
                    {formatINR(totalAmount)}
                  </span>
                </div>

                <button
                  onClick={handlePay}
                  disabled={isPaying}
                  className="w-full py-3.5 rounded-xl font-semibold text-white bg-[#37BBEC] hover:bg-[#2ea8d6] hover:shadow-lg hover:shadow-[#37BBEC]/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <LockClosedIcon className="w-4 h-4" />
                  {isPaying ? 'Processing...' : `Pay ${formatINR(totalAmount)}`}
                </button>

                <p className="text-[11px] text-gray-400 text-center mt-2.5">
                  Full amount upfront — delivered with your project
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-3">
                Select add-ons above to continue
              </p>
            )}
          </div>
        </div>

        {/* Trust */}
        <div className="flex items-center justify-center gap-5 mt-6 text-gray-400">
          <div className="flex items-center gap-1 text-[11px]">
            <ShieldCheckIcon className="w-3.5 h-3.5" /> Secure
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <LockClosedIcon className="w-3.5 h-3.5" /> Encrypted
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOnCheckout;
