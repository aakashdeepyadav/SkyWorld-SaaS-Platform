import mongoose from 'mongoose';
import { DELIVERY_STATUS, PAYMENT_STATUS, PROJECT_STATUS, SERVICE_CATEGORIES } from '../utils/constants.js';

const PROJECT_PROGRESS_BY_STATUS = Object.freeze({
  [PROJECT_STATUS.PLANNING]: 25,
  [PROJECT_STATUS.IN_PROGRESS]: 50,
  [PROJECT_STATUS.REVIEW]: 75,
  [PROJECT_STATUS.COMPLETED]: 100,
  [PROJECT_STATUS.CANCELLED]: 0
});

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  serviceRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    default: undefined
  },
  customRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomRequest',
    default: undefined
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [10000, 'Description cannot exceed 10000 characters']
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client ID is required']
  },
  developerIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  serviceType: {
    type: String,
    enum: Object.values(SERVICE_CATEGORIES)
  },
  plan: {
    type: String,
    trim: true
  },
  advancePaid: {
    type: Boolean,
    default: false
  },
  finalPaid: {
    type: Boolean,
    default: false
  },
  totalPlanPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  status: {
    type: String,
    enum: Object.values(PROJECT_STATUS),
    default: PROJECT_STATUS.PLANNING
  },
  deliveryStatus: {
    type: String,
    enum: Object.values(DELIVERY_STATUS),
    default: DELIVERY_STATUS.PENDING
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  budget: {
    type: Number,
    min: 0,
    default: 0
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  milestones: [milestoneSchema]
}, {
  timestamps: true
});

projectSchema.pre('validate', function (next) {
  if (this.serviceRequestId == null) this.serviceRequestId = undefined;
  if (this.customRequestId == null) this.customRequestId = undefined;
  if (Object.prototype.hasOwnProperty.call(PROJECT_PROGRESS_BY_STATUS, this.status)) {
    this.progress = PROJECT_PROGRESS_BY_STATUS[this.status];
  }
  next();
});

projectSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {};
  const set = update.$set || {};
  const nextStatus = update.status ?? set.status;

  // Progress is status-derived and should not be manually set.
  if (update.progress !== undefined) {
    delete update.progress;
  }
  if (set.progress !== undefined) {
    delete set.progress;
  }

  if (Object.prototype.hasOwnProperty.call(PROJECT_PROGRESS_BY_STATUS, nextStatus)) {
    set.progress = PROJECT_PROGRESS_BY_STATUS[nextStatus];
  }

  if (Object.keys(set).length > 0) {
    update.$set = set;
  } else if (update.$set) {
    delete update.$set;
  }

  this.setUpdate(update);
  next();
});

// Indexes
projectSchema.index(
  { serviceRequestId: 1 },
  { unique: true, partialFilterExpression: { serviceRequestId: { $type: 'objectId' } } }
);
projectSchema.index(
  { customRequestId: 1 },
  { partialFilterExpression: { customRequestId: { $type: 'objectId' } } }
);
projectSchema.index({ clientId: 1 });
projectSchema.index({ developerIds: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ title: 'text', description: 'text' });

const Project = mongoose.model('Project', projectSchema);

export default Project;

