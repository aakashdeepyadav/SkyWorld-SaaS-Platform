import mongoose from 'mongoose';
import { PAYMENT_PHASE, PAYMENT_STATUS } from '../utils/constants.js';

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
    trim: true,
    maxlength: [100, 'Service type cannot exceed 100 characters']
  },
  plan: {
    type: String,
    trim: true,
    maxlength: [100, 'Plan name cannot exceed 100 characters']
  },
  paymentPhase: {
    type: String,
    enum: Object.values(PAYMENT_PHASE),
    default: PAYMENT_PHASE.ADVANCE
  },
  totalPlanPrice: {
    type: Number,
    min: 0
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true,
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  paymentMethod: {
    type: String,
    trim: true,
    enum: ['razorpay', 'stripe', 'manual', 'bank_transfer', null]
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
// `razorpayPaymentId` already has index options on the schema path (`sparse`),
// so declaring it again here causes duplicate-index warnings in Mongoose.
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

