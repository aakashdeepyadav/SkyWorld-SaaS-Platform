import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  fileName: {
    type: String,
    required: true,
    maxlength: [500, 'File name cannot exceed 500 characters']
  },
  fileUrl: {
    type: String,
    required: true,
    maxlength: [2048, 'File URL cannot exceed 2048 characters']
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
    trim: true,
    maxlength: [10000, 'Message content cannot exceed 10000 characters']
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

