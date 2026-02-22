import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatINR } from '../../utils/currency';

const formatCategory = (value = '') => (
  value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
);

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);

  const serviceSlug = searchParams.get('service');
  const serviceId = searchParams.get('serviceId');
  const plan = searchParams.get('plan');

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

  const serviceName = service?.name || formatCategory(serviceSlug || '');
  const resolvedServiceSlug = service?.category || serviceSlug;
  const serviceAmount = Number(service?.basePrice || 0);

  if (plan !== 'starter') {
    return (
      <div className="min-h-screen bg-surface-50 px-6 py-20">
        <div className="max-w-2xl mx-auto card text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid checkout session</h1>
          <p className="text-sm text-gray-500 mt-2">Please select a plan from the service page.</p>
          <Link to="/" className="btn-primary mt-6 inline-flex">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (servicesLoading) {
    return (
      <div className="min-h-screen bg-surface-50 px-6 py-20">
        <div className="max-w-3xl mx-auto card animate-pulse">
          <div className="h-6 bg-gray-100 rounded w-1/3 mb-3" />
          <div className="h-4 bg-gray-50 rounded w-1/2 mb-8" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="h-20 bg-gray-50 rounded-xl" />
            <div className="h-20 bg-gray-50 rounded-xl" />
            <div className="h-20 bg-gray-50 rounded-xl" />
            <div className="h-20 bg-gray-50 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-surface-50 px-6 py-20">
        <div className="max-w-2xl mx-auto card text-center">
          <h1 className="text-2xl font-bold text-gray-900">Service unavailable</h1>
          <p className="text-sm text-gray-500 mt-2">This service is currently unavailable for checkout.</p>
          <Link to="/" className="btn-primary mt-6 inline-flex">Back to Home</Link>
        </div>
      </div>
    );
  }

  const handlePay = async () => {
    if (serviceAmount <= 0) {
      toast.error('Starter checkout is unavailable for this service');
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
        plan: 'starter'
      });

      const { order, keyId, payment } = data;
      const phone = typeof user?.phone === 'string' ? user.phone.trim() : '';
      const prefill = {
        name: user?.name || '',
        email: user?.email || '',
        ...(phone ? { contact: phone } : {})
      };

      const checkout = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'SkyWorld Ventures',
        description: `${serviceName} Starter Plan`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post('/payments/razorpay/verify', {
              paymentId: payment._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            toast.success('Payment successful');
            navigate('/dashboard');
          } catch (error) {
            toast.error(error.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill,
        notes: {
          serviceType: resolvedServiceSlug,
          serviceId: service?._id || '',
          plan: 'starter'
        },
        theme: {
          color: '#0EA5E9'
        }
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
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to={resolvedServiceSlug ? `/services/${resolvedServiceSlug}` : '/'} className="text-sm text-primary-600 hover:text-primary-500">Back to service</Link>
        <div className="card mt-4">
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          <p className="text-sm text-gray-500 mt-1">Complete your starter plan payment securely.</p>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-400">Service</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{serviceName}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-400">Plan</p>
              <p className="text-sm font-medium text-gray-900 mt-1">Starter</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-400">Amount</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{formatINR(serviceAmount)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-400">Payment</p>
              <p className="text-sm font-medium text-gray-900 mt-1">Razorpay</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-gray-400">You will be redirected to your dashboard after payment.</p>
            <button
              onClick={handlePay}
              disabled={isPaying || serviceAmount <= 0}
              className="btn-primary !py-2.5 !px-5 disabled:opacity-50"
            >
              {isPaying ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
