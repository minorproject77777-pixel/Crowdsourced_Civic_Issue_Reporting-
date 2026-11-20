const mongoose = require('mongoose');

const resolutionFeedbackSchema = new mongoose.Schema(
  {
    issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
    citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    confirmed: { type: Boolean, required: true }, // true = fixed, false = still exists
    rating: { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, default: '' },
    reasonIfNotFixed: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ResolutionFeedback', resolutionFeedbackSchema);
