const mongoose = require('mongoose');

const upvoteSchema = new mongoose.Schema(
  {
    issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// One user can only upvote an issue once
upvoteSchema.index({ issue: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Upvote', upvoteSchema);
