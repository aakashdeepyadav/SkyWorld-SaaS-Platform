import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import { useCatalog } from '../../context/CatalogContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

const MonthlyCheckout = () => {
  const { findMonthlyPlan } = useCatalog();
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);

  const plan = useMemo(() => findMonthlyPlan(slug), [slug]);

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Invalid checkout</h1>
          <p className="text-sm text-gray-500 mt-1">This plan is not available.</p>
          <Link to="/plans/monthly" className="btn-primary mt-4 inline-flex">
            View Plans
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Sign in to continue</h1>
          <p className="text-sm text-gray-500 mt-1">You need an account to subscribe.</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link to={`/login?redirect=/checkout/monthly/${slug}`} className="btn-primary">
              Sign In
            </Link>
            <Link to={`/register?redirect=/checkout/monthly/${slug}`} className="btn-secondary">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handlePay = async () => {
    if (!window.Razorpay) {
      toast.error('Payment service not available. Please refresh.');
      return;
    }
    setIsPaying(true);
    try {
      const { data } = await api.post('/payments/razorpay/order', {
        serviceType: 'monthly',
        plan: plan.slug,
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
        description: `${plan.name} — Monthly Maintenance`,
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
            toast.success('Subscription activated!');
            navigate(projectId ? `/projects/${projectId}?meetingPrompt=1` : '/projects');
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill,
        notes: { serviceType: 'monthly', plan: plan.slug },
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
          to={`/plans/monthly/${plan.slug}`}
          className="inline-flex items-center text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5 mr-1" /> Back
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[#37BBEC] px-6 py-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Monthly Plan</p>
                <h1 className="text-xl font-bold text-white mt-0.5">{plan.name}</h1>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-white">{formatINR(plan.price)}</p>
                <p className="text-[11px] text-white/60">/month</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Quick stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-5 pb-5 border-b border-gray-100">
              {plan.responseTime && <span>Response: {plan.responseTime}</span>}
              {plan.updates && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{plan.updates} updates</span>
                </>
              )}
            </div>

            {/* Features — compact */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-5">
              {plan.features.slice(0, 8).map((f) => (
                <div key={f} className="flex items-center gap-1.5 text-[13px] text-gray-600">
                  <CheckIcon className="w-3.5 h-3.5 text-[#37BBEC] flex-shrink-0" strokeWidth={3} />
                  <span className="truncate">{f}</span>
                </div>
              ))}
            </div>
            {plan.features.length > 8 && (
              <p className="text-[11px] text-gray-400 mb-5">
                +{plan.features.length - 8} more included
              </p>
            )}

            {/* Not included — only show first few */}
            {plan.notIncluded?.length > 0 && (
              <div className="mb-5 pb-5 border-b border-gray-100">
                {plan.notIncluded.slice(0, 3).map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-[13px] text-gray-400">
                    <XMarkIcon
                      className="w-3.5 h-3.5 text-gray-300 flex-shrink-0"
                      strokeWidth={2.5}
                    />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Billing note */}
            <div className="flex items-center gap-2.5 mb-6 p-3 rounded-lg bg-[#37BBEC]/5 border border-[#37BBEC]/10">
              <CalendarDaysIcon className="w-4 h-4 text-[#37BBEC] flex-shrink-0" />
              <p className="text-[12px] text-gray-600">
                Monthly billing — cancel anytime with 7 days notice
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={handlePay}
              disabled={isPaying}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-[#37BBEC] hover:bg-[#2ea8d6] hover:shadow-lg hover:shadow-[#37BBEC]/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LockClosedIcon className="w-4 h-4" />
              {isPaying ? 'Processing...' : `Subscribe — ${formatINR(plan.price)}/mo`}
            </button>

            <p className="text-[11px] text-gray-400 text-center mt-2.5">
              Starts immediately. No long-term contracts.
            </p>
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
          <div className="flex items-center gap-1 text-[11px]">
            <CalendarDaysIcon className="w-3.5 h-3.5" /> Cancel anytime
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCheckout;
