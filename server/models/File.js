import mongoose from 'mongoose';
import { FILE_TYPES } from '../utils/constants.js';

const fileSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader ID is required']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  originalName: {
    type: String,
    required: [true, 'Original file name is required']
  },
  fileType: {
    type: String,
    enum: Object.values(FILE_TYPES),
    required: [true, 'File type is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: 0
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  cloudinaryPublicId: {
    type: String,
    sparse: true
  },
  storageProvider: {
    type: String,
    enum: ['cloudinary', 's3', 'local'],
    default: 'cloudinary'
  },
  mimeType: {
    type: String
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
fileSchema.index({ projectId: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ createdAt: -1 });
fileSchema.index({ cloudinaryPublicId: 1 }, { sparse: true });

const File = mongoose.model('File', fileSchema);

export default File;
