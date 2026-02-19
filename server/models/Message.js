import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  attachments: [attachmentSchema],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ projectId: 1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ recipientId: 1 });
messageSchema.index({ isRead: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ projectId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;

