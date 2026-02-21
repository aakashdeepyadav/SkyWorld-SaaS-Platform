import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const SERVICES = {
  'web-development': { name: 'Web Development', price: 1499 },
  'app-development': { name: 'App Development', price: 2999 },
  'branding-creative': { name: 'Branding', price: 799 }
};

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);

  const serviceSlug = searchParams.get('service');
  const plan = searchParams.get('plan');

  const service = useMemo(() => SERVICES[serviceSlug], [serviceSlug]);

  if (!service || plan !== 'starter') {
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

  const handlePay = async () => {
    if (!window.Razorpay) {
      toast.error('Payment service not available');
      return;
    }
    setIsPaying(true);
    try {
      const { data } = await api.post('/payments/razorpay/order', {
        serviceType: serviceSlug,
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
        description: `${service.name} Starter Plan`,
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
          serviceType: serviceSlug,
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
        <Link to={`/services/${serviceSlug}`} className="text-sm text-primary-600 hover:text-primary-500">Back to service</Link>
        <div className="card mt-4">
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          <p className="text-sm text-gray-500 mt-1">Complete your starter plan payment securely.</p>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-400">Service</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{service.name}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-400">Plan</p>
              <p className="text-sm font-medium text-gray-900 mt-1">Starter</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-400">Amount</p>
              <p className="text-sm font-medium text-gray-900 mt-1">₹{service.price.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-400">Payment</p>
              <p className="text-sm font-medium text-gray-900 mt-1">Razorpay</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-gray-400">You will be redirected to your dashboard after payment.</p>
            <button onClick={handlePay} disabled={isPaying} className="btn-primary !py-2.5 !px-5 disabled:opacity-50">
              {isPaying ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
