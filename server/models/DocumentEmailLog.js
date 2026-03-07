import mongoose from 'mongoose';
import { ADMIN_DOCUMENT_TYPE_VALUES } from '../utils/documentEmail.js';

const documentEmailLogSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['mailersend'],
      default: 'mailersend',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent',
      required: true,
    },
    documentTypes: [
      {
        type: String,
        enum: ADMIN_DOCUMENT_TYPE_VALUES,
      },
    ],
    subject: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    messageId: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    errorMessage: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

documentEmailLogSchema.index({ createdAt: -1 });
documentEmailLogSchema.index({ provider: 1, status: 1, createdAt: -1 });
documentEmailLogSchema.index({ userId: 1, createdAt: -1 });
documentEmailLogSchema.index({ sentBy: 1, createdAt: -1 });

const DocumentEmailLog = mongoose.model('DocumentEmailLog', documentEmailLogSchema);

export default DocumentEmailLog;
