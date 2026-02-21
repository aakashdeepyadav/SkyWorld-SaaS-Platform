import mongoose from 'mongoose';
import { PAYMENT_STATUS } from '../utils/constants.js';

const paymentSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client ID is required']
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  customRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomRequest'
  },
  serviceRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest'
  },
  serviceType: {
    type: String,
    trim: true
  },
  plan: {
    type: String,
    enum: ['starter', 'custom']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  paymentMethod: {
    type: String,
    trim: true
  },
  transactionId: {
    type: String,
    sparse: true,
    unique: true
  },
  razorpayOrderId: {
    type: String,
    sparse: true,
    unique: true
  },
  razorpayPaymentId: {
    type: String,
    sparse: true
  },
  razorpaySignature: {
    type: String,
    sparse: true
  },
  stripePaymentIntentId: {
    type: String,
    sparse: true
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ clientId: 1 });
paymentSchema.index({ projectId: 1 });
paymentSchema.index({ customRequestId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ createdAt: -1 });

// Generate invoice number before saving
paymentSchema.pre('save', async function (next) {
  if (!this.invoiceNumber && this.status === PAYMENT_STATUS.COMPLETED) {
    const count = await mongoose.model('Payment').countDocuments();
    this.invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;

