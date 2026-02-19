import mongoose from 'mongoose';
import { REQUEST_STATUS } from '../utils/constants.js';

const serviceRequestSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client ID is required']
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  requirements: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: Object.values(REQUEST_STATUS),
    default: REQUEST_STATUS.PENDING
  },
  assignedDeveloperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  estimatedPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  approvedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
serviceRequestSchema.index({ clientId: 1 });
serviceRequestSchema.index({ serviceId: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ assignedDeveloperId: 1 });
serviceRequestSchema.index({ createdAt: -1 });

// Compound index for client queries
serviceRequestSchema.index({ clientId: 1, status: 1 });

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

export default ServiceRequest;

