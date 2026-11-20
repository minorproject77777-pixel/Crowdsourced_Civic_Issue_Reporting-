const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, default: 'AlertCircle' }, // lucide-react icon name
    defaultDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    categoryWeight: { type: Number, default: 10, min: 0, max: 30 }, // used in priority scoring
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
