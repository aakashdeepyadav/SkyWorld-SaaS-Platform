import mongoose from 'mongoose';
import { SERVICE_CATEGORIES } from '../utils/constants.js';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: Object.values(SERVICE_CATEGORIES),
    required: [true, 'Service category is required']
  },
  basePrice: {
    type: Number,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
// name index auto-created by unique: true in schema
serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });

const Service = mongoose.model('Service', serviceSchema);

export default Service;

