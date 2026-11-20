const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BADGE_THRESHOLDS = [
  { points: 0, name: 'Civic Contributor' },
  { points: 100, name: 'Community Helper' },
  { points: 300, name: 'City Champion' },
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone number must be 10 digits'],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ['citizen', 'admin', 'staff'],
      default: 'citizen',
    },
    profileImage: { type: String, default: null },
    civicPoints: { type: Number, default: 0 },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    isActive: { type: Boolean, default: true },
    ward: { type: String, default: '' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.currentBadge = function currentBadge() {
  let badge = BADGE_THRESHOLDS[0].name;
  for (const tier of BADGE_THRESHOLDS) {
    if (this.civicPoints >= tier.points) badge = tier.name;
  }
  return badge;
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    profileImage: this.profileImage,
    civicPoints: this.civicPoints,
    badge: this.currentBadge(),
    department: this.department,
    ward: this.ward,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.BADGE_THRESHOLDS = BADGE_THRESHOLDS;
