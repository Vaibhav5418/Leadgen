const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Administrator or user who performed the action
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByName: {
    type: String,
    trim: true,
    default: ''
  },
  performedByEmail: {
    type: String,
    lowercase: true,
    trim: true,
    default: ''
  },

  // Target user affected by the action
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetUserName: {
    type: String,
    trim: true,
    default: ''
  },
  targetUserEmail: {
    type: String,
    lowercase: true,
    trim: true,
    default: ''
  },

  // Action type
  action: {
    type: String,
    required: true,
    enum: [
      'ROLE_CHANGED',
      'PROJECT_ASSIGNED',
      'PROJECT_REMOVED',
      'ACCESS_UPDATED',
      'USER_STATUS_UPDATED',
      'USER_CREATED'
    ]
  },

  // Related project if action is project-specific
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  projectName: {
    type: String,
    trim: true,
    default: ''
  },

  // Previous and new values for state auditing
  previousValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // Human-readable change summary or notes
  details: {
    type: String,
    default: '',
    trim: true
  },

  // Client IP (optional)
  ipAddress: {
    type: String,
    default: ''
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes for rapid searching and filtering
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetUser: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
