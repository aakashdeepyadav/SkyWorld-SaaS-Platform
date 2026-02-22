import mongoose from 'mongoose';
import { CUSTOM_REQUEST_STATUS, SERVICE_CATEGORIES } from '../utils/constants.js';

const customRequestSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client ID is required']
  },
  serviceType: {
    type: String,
    enum: Object.values(SERVICE_CATEGORIES),
    required: [true, 'Service type is required']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  businessName: {
    type: String,
    trim: true
  },
  projectDescription: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true
  },
  requiredFeatures: {
    type: String,
    trim: true
  },
  deadline: {
    type: Date
  },
  budgetRange: {
    type: String,
    trim: true
  },
  expectedPrice: {
    type: Number,
    min: 0
  },
  fileUrl: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  fileType: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: Object.values(CUSTOM_REQUEST_STATUS),
    default: CUSTOM_REQUEST_STATUS.PENDING
  },
  quotedPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  quotedAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

customRequestSchema.index({ clientId: 1 });
customRequestSchema.index({ serviceType: 1 });
customRequestSchema.index({ status: 1 });
customRequestSchema.index({ createdAt: -1 });

const CustomRequest = mongoose.model('CustomRequest', customRequestSchema);

export default CustomRequest;
