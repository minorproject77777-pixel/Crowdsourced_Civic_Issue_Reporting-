const mongoose = require('mongoose');

const STATUSES = [
  'REPORTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'REOPENED',
  'REJECTED',
];

const PRIORITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['before', 'progress', 'after'], default: 'before' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
  {
    issueId: { type: String, required: true, unique: true }, // e.g. CF-1001
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, required: true, trim: true },

    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    address: { type: String, required: true, trim: true },
    ward: { type: String, default: '' },

    priority: { type: String, enum: PRIORITY_LEVELS, default: 'LOW' },
    priorityScore: { type: Number, default: 0, min: 0, max: 100 },
    priorityOverridden: { type: Boolean, default: false },
    severity: { type: Number, default: 5, min: 1, max: 10 },

    status: { type: String, enum: STATUSES, default: 'REPORTED' },

    images: { type: [imageSchema], default: [] },

    upvoteCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },

    aiClassification: {
      category: String,
      severity: Number,
      confidence: Number,
      recommendedDepartment: String,
    },

    staffRemarks: [
      {
        text: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    rejectionReason: { type: String, default: null },
    reopenReason: { type: String, default: null },
    reopenCount: { type: Number, default: 0 },

    resolvedAt: { type: Date, default: null },
    citizenVerifiedAt: { type: Date, default: null },
    citizenRating: { type: Number, min: 1, max: 5, default: null },
    citizenFeedback: { type: String, default: null },
  },
  { timestamps: true }
);

issueSchema.index({ location: '2dsphere' });
issueSchema.index({ status: 1 });
issueSchema.index({ category: 1 });
issueSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Issue', issueSchema);
module.exports.STATUSES = STATUSES;
module.exports.PRIORITY_LEVELS = PRIORITY_LEVELS;
