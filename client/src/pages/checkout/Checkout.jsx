import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../context/CatalogContext';
import toast from 'react-hot-toast';
import { formatINR } from '../../utils/currency';
import MeetingPopup from '../../components/common/MeetingPopup';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  CreditCardIcon,
  CheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { CodeBracketIcon, DevicePhoneMobileIcon, PaintBrushIcon } from '@heroicons/react/24/solid';

const formatCategory = (value = '') =>
  value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const SERVICE_META = {
  'web-development': {
    icon: CodeBracketIcon,
    gradient: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50 dark:bg-sky-500/10',
    text: 'text-sky-600 dark:text-sky-400',
  },
  'app-development': {
    icon: DevicePhoneMobileIcon,
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    text: 'text-violet-600 dark:text-violet-400',
  },
  'branding-creative': {
    icon: PaintBrushIcon,
    gradient: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
  },
};

const Checkout = () => {
  const { findPlan, PLAN_CATALOG } = useCatalog();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);
  const [showMeetingPopup, setShowMeetingPopup] = useState(false);
  const [meetingAsked, setMeetingAsked] = useState(false);

  const serviceSlug = searchParams.get('service');
  const serviceId = searchParams.get('serviceId');
  const planSlug = searchParams.get('plan');

  /* ─── Resolve plan from catalog ─── */
  const catalogPlan = useMemo(() => findPlan(serviceSlug, planSlug), [serviceSlug, planSlug]);
  const catalogCategory = useMemo(() => PLAN_CATALOG[serviceSlug] || null, [serviceSlug]);

  /* ─── Fetch DB service for serviceId ─── */
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
  const meta = SERVICE_META[resolvedServiceSlug] || SERVICE_META['web-development'];
  const Icon = meta.icon;

  /* ─── Plan details (from catalog, not from DB) ─── */
  const planName = catalogPlan?.name || formatCategory(planSlug || '');
  const planPrice = catalogPlan?.price || 0;
  const advanceAmount = Math.ceil(planPrice / 2);
  const finalAmount = planPrice - advanceAmount;
  const planDelivery = catalogPlan?.delivery || '';
  const serviceName = catalogCategory?.name || service?.name || formatCategory(serviceSlug || '');

  /* ─── Invalid plan ─── */
  if (!catalogPlan || !catalogCategory) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 px-6 py-20">
        <div className="max-w-2xl mx-auto card dark:bg-surface-800 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Invalid checkout session
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            The selected plan is not available. Please choose a plan from the service page.
          </p>
          <Link
            to={serviceSlug ? `/services/${serviceSlug}` : '/'}
            className="btn-primary mt-6 inline-flex"
          >
            Back to {serviceSlug ? 'Service' : 'Home'}
          </Link>
        </div>
      </div>
    );
  }

  if (servicesLoading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="card dark:bg-surface-800 animate-pulse">
            <div className="h-6 bg-gray-100 dark:bg-surface-700 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-50 dark:bg-surface-700 rounded w-1/2 mb-8" />
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-gray-50 dark:bg-surface-700 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 px-6 py-20">
        <div className="max-w-2xl mx-auto card dark:bg-surface-800 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service unavailable</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            This service is currently unavailable for checkout.
          </p>
          <Link to="/" className="btn-primary mt-6 inline-flex">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const handlePay = async () => {
    // Show meeting popup once before first payment attempt
    if (!meetingAsked) {
      setShowMeetingPopup(true);
      return;
    }
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
            await api.post('/payments/razorpay/verify', {
              paymentId: payment._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Payment successful!');
            navigate('/dashboard');
          } catch (error) {
            toast.error(error.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill,
        notes: { serviceType: resolvedServiceSlug, serviceId: service?._id || '', plan: planSlug },
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
        {/* Back link */}
        <Link
          to={resolvedServiceSlug ? `/services/${resolvedServiceSlug}` : '/'}
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back to service
        </Link>

        {/* Main checkout card */}
        <div className="card dark:bg-surface-800 dark:border-surface-700 overflow-hidden">
          {/* Gradient header strip */}
          <div
            className={`-mx-6 -mt-6 px-6 py-5 mb-6 bg-[#37BBEC] relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Checkout</h1>
                <p className="text-sm text-white/70">Complete your payment securely.</p>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Order Summary
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-700 border border-gray-100 dark:border-surface-600">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  Service
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1.5">
                  {serviceName}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-700 border border-gray-100 dark:border-surface-600">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  Plan
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {planName}
                  </span>
                  {catalogPlan?.popular && (
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}
                    >
                      Popular
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-700 border border-gray-100 dark:border-surface-600">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  Total Price
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1.5">
                  {formatINR(planPrice)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-700 border border-gray-100 dark:border-surface-600">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  {planDelivery ? 'Delivery' : 'Payment via'}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  {planDelivery ? (
                    <>
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {planDelivery}
                      </span>
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Razorpay
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 50/50 Split Breakdown */}
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

          {/* Features summary */}
          {catalogPlan?.features?.length > 0 && (
            <div className="mb-8 border-t border-gray-100 dark:border-surface-700 pt-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                What you get
              </h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {catalogPlan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" strokeWidth={3} />
                    <span className="text-gray-700 dark:text-gray-300">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advance Payment */}
          <div className="border-t border-gray-100 dark:border-surface-700 pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Plan Price
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatINR(planPrice)}
              </span>
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
              disabled={isPaying || advanceAmount <= 0}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-[#37BBEC] hover:bg-[#2ea8d6] hover:shadow-lg hover:shadow-[#37BBEC]/25 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              <LockClosedIcon className="w-4 h-4" />
              {isPaying ? 'Processing...' : `Pay Advance ${formatINR(advanceAmount)}`}
            </button>

            <p className="text-[11px] text-gray-400 text-center mt-3">
              Remaining {formatINR(finalAmount)} will be collected after project delivery &amp; your
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
            <CheckIcon className="w-4 h-4" />
            <span>Instant Delivery</span>
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
        redirectAfterMeeting={window.location.pathname + window.location.search}
      />
    </div>
  );
};

export default Checkout;
