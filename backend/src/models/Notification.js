const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'ISSUE_VERIFIED',
        'ISSUE_ASSIGNED',
        'WORK_STARTED',
        'ISSUE_RESOLVED',
        'VERIFY_RESOLUTION',
        'ISSUE_REOPENED',
        'ISSUE_REJECTED',
        'COMMENT',
        'GENERAL',
      ],
      default: 'GENERAL',
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
