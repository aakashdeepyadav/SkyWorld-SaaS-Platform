import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import { findMonthlyPlan } from '../../utils/planCatalog';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ArrowPathIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

const MonthlyCheckout = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);

  const plan = useMemo(() => findMonthlyPlan(slug), [slug]);

  if (!plan) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 px-6 py-20">
        <div className="max-w-2xl mx-auto card dark:bg-surface-800 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Invalid checkout session
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            The maintenance plan you selected is not available.
          </p>
          <Link to="/plans/monthly" className="btn-primary mt-6 inline-flex">
            View Plans
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 px-6 py-20">
        <div className="max-w-2xl mx-auto card dark:bg-surface-800 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sign in to continue</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            You need an account to subscribe to a maintenance plan.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
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
            await api.post('/payments/razorpay/verify', {
              paymentId: payment._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Subscription activated!');
            navigate('/dashboard');
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill,
        notes: { serviceType: 'monthly', plan: plan.slug },
        theme: { color: '#0EA5E9' },
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
          to={`/plans/monthly/${plan.slug}`}
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back to {plan.name}
        </Link>

        {/* Main checkout card */}
        <div className="card dark:bg-surface-800 dark:border-surface-700 overflow-hidden">
          {/* Header */}
          <div className="-mx-6 -mt-6 px-6 py-5 mb-6 bg-gradient-to-r from-sky-500 to-indigo-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <CalendarDaysIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Subscribe</h1>
                <p className="text-sm text-white/70">{plan.name} &middot; Monthly Plan</p>
              </div>
            </div>
          </div>

          {/* Plan summary */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Plan Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-700 border border-gray-100 dark:border-surface-600">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  Plan
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {plan.name}
                  </span>
                  {plan.popular && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      Popular
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-700 border border-gray-100 dark:border-surface-600">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  Billing
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1.5">
                  {formatINR(plan.price)}/month
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-700 border border-gray-100 dark:border-surface-600">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  Response Time
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {plan.responseTime}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-700 border border-gray-100 dark:border-surface-600">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  Updates Included
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <ArrowPathIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {plan.updates}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mb-8 border-t border-gray-100 dark:border-surface-700 pt-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              What you get every month
            </h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <CheckIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" strokeWidth={3} />
                  <span className="text-gray-700 dark:text-gray-300">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Not included */}
          {plan.notIncluded?.length > 0 && (
            <div className="mb-8 border-t border-gray-100 dark:border-surface-700 pt-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Not included
              </h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {plan.notIncluded.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <XMarkIcon
                      className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0"
                      strokeWidth={2.5}
                    />
                    <span className="text-gray-400 dark:text-gray-500">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Billing info */}
          <div className="mb-8 border-t border-gray-100 dark:border-surface-700 pt-6">
            <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20">
              <div className="flex items-start gap-3">
                <CalendarDaysIcon className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Monthly billing — cancel anytime
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs leading-relaxed">
                    First month charged today. We&apos;ll send a renewal reminder before each
                    billing cycle. You can pause or cancel with 7 days notice.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pay button */}
          <div className="border-t border-gray-100 dark:border-surface-700 pt-6">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                First Month
              </span>
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {formatINR(plan.price)}
              </span>
            </div>

            <button
              onClick={handlePay}
              disabled={isPaying}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LockClosedIcon className="w-4 h-4" />
              {isPaying ? 'Processing...' : `Subscribe — ${formatINR(plan.price)}/month`}
            </button>

            <p className="text-[11px] text-gray-400 text-center mt-3">
              Your plan starts immediately after payment. No long-term contracts.
            </p>
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
            <CalendarDaysIcon className="w-4 h-4" />
            <span>Cancel Anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCheckout;
