import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../context/CatalogContext';
import toast from 'react-hot-toast';
import { formatINR } from '../../utils/currency';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  CheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const formatCategory = (value = '') =>
  value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const Checkout = () => {
  const { findPlan, PLAN_CATALOG } = useCatalog();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);

  const serviceSlug = searchParams.get('service');
  const serviceId = searchParams.get('serviceId');
  const planSlug = searchParams.get('plan');

  const catalogPlan = useMemo(() => findPlan(serviceSlug, planSlug), [serviceSlug, planSlug]);
  const catalogCategory = useMemo(() => PLAN_CATALOG[serviceSlug] || null, [serviceSlug]);

  const { data: services = [], isLoading: servicesLoading } = useQuery(
    ['checkout-services'],
    async () => {
      const response = await api.get('/services');
      return response.data?.services || [];
    },
    { staleTime: 30 * 1000 }
  );

  const service = useMemo(() => {
    if (serviceId) {
      const exactMatch = services.find((item) => item._id === serviceId);
      if (exactMatch) return exactMatch;
    }
    const candidates = services.filter((item) => item.category === serviceSlug);
    if (!candidates.length) return undefined;
    return [...candidates].sort(
      (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    )[0];
  }, [services, serviceId, serviceSlug]);

  const resolvedServiceSlug = service?.category || serviceSlug;

  const planName = catalogPlan?.name || formatCategory(planSlug || '');
  const planPrice = catalogPlan?.price || 0;
  const advanceAmount = Math.ceil(planPrice / 2);
  const finalAmount = planPrice - advanceAmount;
  const planDelivery = catalogPlan?.delivery || '';
  const serviceName = catalogCategory?.name || service?.name || formatCategory(serviceSlug || '');

  if (!catalogPlan || !catalogCategory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Invalid checkout</h1>
          <p className="text-sm text-gray-500 mt-1">This plan is no longer available.</p>
          <Link
            to={serviceSlug ? `/services/${serviceSlug}` : '/'}
            className="btn-primary mt-4 inline-flex"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  if (servicesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#37BBEC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Service unavailable</h1>
          <Link to="/" className="btn-primary mt-4 inline-flex">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const handlePay = async () => {
    if (planPrice <= 0) {
      toast.error('This plan is not available for checkout');
      return;
    }
    if (!window.Razorpay) {
      toast.error('Payment service not available');
      return;
    }
    setIsPaying(true);
    try {
      const { data } = await api.post('/payments/razorpay/order', {
        serviceType: resolvedServiceSlug,
        serviceId: service?._id,
        plan: planSlug,
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
        description: `${serviceName} — ${planName}`,
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
          } catch (error) {
            toast.error(error.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill,
        notes: { serviceType: resolvedServiceSlug, serviceId: service?._id || '', plan: planSlug },
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
          to={resolvedServiceSlug ? `/services/${resolvedServiceSlug}` : '/'}
          className="inline-flex items-center text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5 mr-1" /> Back
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[#37BBEC] px-6 py-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
            <div className="relative">
              <p className="text-sm font-medium text-white/70">{serviceName}</p>
              <h1 className="text-xl font-bold text-white mt-0.5">{planName}</h1>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Quick info row */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              {catalogPlan?.offerPercent > 0 && (
                <span className="text-gray-400 line-through text-xs">
                  {formatINR(catalogPlan.offerOriginalPrice)}
                </span>
              )}
              <span className="font-semibold text-gray-900">{formatINR(planPrice)}</span>
              {catalogPlan?.offerPercent > 0 && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {catalogPlan.offerPercent}% off
                </span>
              )}
              {planDelivery && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5" /> {planDelivery}
                  </span>
                </>
              )}
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

            {/* Features — compact, max 6 shown */}
            {catalogPlan?.features?.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {catalogPlan.features.slice(0, 6).map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-[13px] text-gray-600">
                      <CheckIcon
                        className="w-3.5 h-3.5 text-[#37BBEC] flex-shrink-0"
                        strokeWidth={3}
                      />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
                {catalogPlan.features.length > 6 && (
                  <p className="text-[11px] text-gray-400 mt-2">
                    +{catalogPlan.features.length - 6} more included
                  </p>
                )}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handlePay}
              disabled={isPaying || advanceAmount <= 0}
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
        </div>
      </div>
    </div>
  );
};

export default Checkout;
