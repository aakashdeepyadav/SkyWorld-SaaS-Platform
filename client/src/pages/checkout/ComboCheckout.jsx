import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import { findCombo, PLAN_CATALOG } from '../../utils/planCatalog';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  CheckIcon,
  TagIcon,
  ClockIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const GRADIENT_MAP = {
  'from-amber-500 to-orange-500': 'linear-gradient(135deg, #f59e0b, #f97316)',
  'from-emerald-500 to-teal-600': 'linear-gradient(135deg, #10b981, #0d9488)',
  'from-violet-500 to-purple-600': 'linear-gradient(135deg, #8b5cf6, #9333ea)',
};

const ComboCheckout = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);

  const combo = useMemo(() => findCombo(slug), [slug]);

  if (!combo) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 px-6 py-20">
        <div className="max-w-2xl mx-auto card dark:bg-surface-800 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Invalid checkout session
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            The combo package you selected is no longer available.
          </p>
          <Link to="/" className="btn-primary mt-6 inline-flex">
            Back to Home
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
            You need an account to complete your purchase.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to={`/login?redirect=/checkout/combo/${slug}`} className="btn-primary">
              Sign In
            </Link>
            <Link to={`/register?redirect=/checkout/combo/${slug}`} className="btn-secondary">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const gradientCSS = GRADIENT_MAP[combo.gradient] || 'linear-gradient(135deg, #0ea5e9, #6366f1)';
  const savings = combo.originalPrice - combo.price;
  const advanceAmount = Math.ceil(combo.price / 2);
  const finalAmount = combo.price - advanceAmount;

  /* Resolve included items */
  const resolvedItems = combo.includes.map((item) => {
    if (item.addOn) return { ...item, type: 'addon' };
    const cat = PLAN_CATALOG[item.category];
    const plan = cat?.plans.find((p) => p.slug === item.plan);
    return {
      ...item,
      type: 'plan',
      catName: cat?.name,
      planName: plan?.name,
      planPrice: plan?.price,
    };
  });

  const handlePay = async () => {
    if (!window.Razorpay) {
      toast.error('Payment service not available. Please refresh.');
      return;
    }
    setIsPaying(true);
    try {
      const { data } = await api.post('/payments/razorpay/order', {
        serviceType: 'combo',
        plan: combo.slug,
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
        description: `${combo.name} — Combo Package`,
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
        notes: { serviceType: 'combo', plan: combo.slug },
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
          to={`/combos/${combo.slug}`}
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back to {combo.name}
        </Link>

        {/* Main checkout card */}
        <div className="card dark:bg-surface-800 dark:border-surface-700 overflow-hidden">
          {/* Gradient header */}
          <div
            className="-mx-6 -mt-6 px-6 py-5 mb-6 relative overflow-hidden"
            style={{ background: gradientCSS }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <TagIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Checkout</h1>
                <p className="text-sm text-white/70">
                  {combo.name} &middot; Save {combo.discount}%
                </p>
              </div>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Package Contents
            </h2>
            <div className="space-y-2.5">
              {resolvedItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-surface-700 border border-gray-100 dark:border-surface-600"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.type === 'addon' ? (
                      <SparklesIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    ) : (
                      <CheckIcon
                        className="w-4 h-4 text-emerald-500 flex-shrink-0"
                        strokeWidth={3}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.label}
                      </p>
                      {item.catName && <p className="text-[11px] text-gray-400">{item.catName}</p>}
                    </div>
                  </div>
                  {item.planPrice ? (
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 ml-3">
                      {formatINR(item.planPrice)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex-shrink-0 ml-3">
                      Bonus
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-8 border-t border-gray-100 dark:border-surface-700 pt-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Pricing
            </h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Original total</span>
                <span className="text-gray-400 line-through">{formatINR(combo.originalPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Combo discount ({combo.discount}%)
                </span>
                <span className="font-semibold" style={{ color: `rgb(${combo.color})` }}>
                  -{formatINR(savings)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-surface-700">
                <span className="font-semibold text-gray-900 dark:text-white">Combo price</span>
                <span className="text-lg font-extrabold text-gray-900 dark:text-white">
                  {formatINR(combo.price)}
                </span>
              </div>
            </div>
          </div>

          {/* 50/50 Split */}
          <div className="mb-8 border-t border-gray-100 dark:border-surface-700 pt-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Payment Schedule
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      50% Advance
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Pay now to start your project
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatINR(advanceAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-surface-700 border border-gray-100 dark:border-surface-600">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-300 dark:bg-surface-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      50% on Delivery
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Pay after reviewing your project
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-400 dark:text-gray-500">
                  {formatINR(finalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="flex items-center gap-3 mb-8 p-4 rounded-xl bg-gray-50 dark:bg-surface-700 border border-gray-100 dark:border-surface-600">
            <ClockIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Estimated delivery: {combo.delivery}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Timeline starts after advance payment
              </p>
            </div>
          </div>

          {/* Pay button */}
          <div className="border-t border-gray-100 dark:border-surface-700 pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Package Price</span>
              <span className="text-sm text-gray-500">{formatINR(combo.price)}</span>
            </div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Pay Now (50% Advance)
              </span>
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {formatINR(advanceAmount)}
              </span>
            </div>

            <button
              onClick={handlePay}
              disabled={isPaying}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: gradientCSS }}
            >
              <LockClosedIcon className="w-4 h-4" />
              {isPaying ? 'Processing...' : `Pay Advance ${formatINR(advanceAmount)}`}
            </button>

            <p className="text-[11px] text-gray-400 text-center mt-3">
              Remaining {formatINR(finalAmount)} will be collected after delivery &amp; your
              approval.
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
            <TagIcon className="w-4 h-4" />
            <span>Save {combo.discount}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComboCheckout;
