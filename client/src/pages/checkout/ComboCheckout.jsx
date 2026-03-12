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
  TagIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const ComboCheckout = () => {
  const { findCombo, PLAN_CATALOG } = useCatalog();
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);

  const combo = useMemo(() => findCombo(slug), [slug]);

  if (!combo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Invalid checkout</h1>
          <p className="text-sm text-gray-500 mt-1">This combo is no longer available.</p>
          <Link to="/" className="btn-primary mt-4 inline-flex">
            Back to Home
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
          <p className="text-sm text-gray-500 mt-1">You need an account to purchase.</p>
          <div className="mt-4 flex items-center justify-center gap-3">
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

  const savings = combo.originalPrice - combo.price;
  const advanceAmount = Math.ceil(combo.price / 2);
  const finalAmount = combo.price - advanceAmount;

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
        notes: { serviceType: 'combo', plan: combo.slug },
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
          to={`/combos/${combo.slug}`}
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
                <p className="text-sm font-medium text-white/70">Combo Package</p>
                <h1 className="text-xl font-bold text-white mt-0.5">{combo.name}</h1>
              </div>
              <span className="text-xs font-bold text-white bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">
                Save {combo.discount}%
              </span>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Items */}
            <div className="space-y-2 mb-6">
              {resolvedItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.type === 'addon' ? (
                      <SparklesIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    ) : (
                      <CheckIcon className="w-4 h-4 text-[#37BBEC] flex-shrink-0" strokeWidth={3} />
                    )}
                    <span className="text-sm text-gray-700 truncate">{item.label}</span>
                  </div>
                  {item.planPrice ? (
                    <span className="text-sm text-gray-400 flex-shrink-0 ml-3">
                      {formatINR(item.planPrice)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 flex-shrink-0 ml-3">
                      Bonus
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Pricing summary */}
            <div className="border-t border-gray-100 pt-4 mb-6 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Original</span>
                <span className="text-gray-400 line-through">{formatINR(combo.originalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Discount</span>
                <span className="font-semibold text-emerald-600">-{formatINR(savings)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-extrabold text-gray-900">{formatINR(combo.price)}</span>
              </div>
            </div>

            {/* Payment split */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-xl bg-[#37BBEC]/5 border border-[#37BBEC]/15 p-4 text-center">
                <p className="text-[11px] font-semibold text-[#37BBEC] uppercase tracking-wider">
                  Pay Now
                </p>
                <p className="text-xl font-extrabold text-gray-900 mt-1">
                  {formatINR(advanceAmount)}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">50% advance</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  On Delivery
                </p>
                <p className="text-xl font-extrabold text-gray-300 mt-1">
                  {formatINR(finalAmount)}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">50% later</p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handlePay}
              disabled={isPaying}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-[#37BBEC] hover:bg-[#2ea8d6] hover:shadow-lg hover:shadow-[#37BBEC]/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LockClosedIcon className="w-4 h-4" />
              {isPaying ? 'Processing...' : `Pay ${formatINR(advanceAmount)}`}
            </button>

            <p className="text-[11px] text-gray-400 text-center mt-2.5">
              Remaining {formatINR(finalAmount)} after delivery & approval
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
            <TagIcon className="w-3.5 h-3.5" /> {combo.discount}% off
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComboCheckout;
