const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'ایمیل نامعتبر است']
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  favorites: {
    universities: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
    }],
    jobs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    }],
  },
  applications: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'applications.itemType',
    },
    itemType: {
      type: String,
      enum: ['University', 'Job'],
      required: true,
    },
    status: {
      type: String,
      enum: ['applied', 'in-progress', 'accepted', 'rejected'],
      default: 'applied',
    },
    notes: String,
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: Date,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
  lastLogin: Date,
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user profile without sensitive info
userSchema.methods.getProfile = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    role: this.role,
    favorites: this.favorites,
    applications: this.applications,
    createdAt: this.createdAt,
  };
};

// Create and export the User model
const User = mongoose.model('User', userSchema);
module.exports = User; 