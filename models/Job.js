const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  externalId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'عنوان شغلی اجباری است'],
    trim: true,
    maxlength: [100, 'عنوان شغلی نمی‌تواند بیش از 100 کاراکتر باشد']
  },
  company: {
    type: String,
    required: [true, 'نام شرکت اجباری است'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'محل کار اجباری است'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'نوع همکاری اجباری است'],
    trim: true
  },
  salary: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'توضیحات شغل اجباری است'],
    maxlength: [2000, 'توضیحات نمی‌تواند بیش از 2000 کاراکتر باشد']
  },
  requirements: {
    type: [String],
    required: [true, 'شرایط استخدام اجباری است']
  },
  source: {
    type: String,
    required: [true, 'منبع داده‌ها اجباری است'],
    enum: ['api1', 'api2']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add text index for searching
JobSchema.index({
  title: 'text',
  description: 'text',
  company: 'text',
  location: 'text'
});

// Add single field indexes for frequently queried fields
JobSchema.index({ type: 1 });
JobSchema.index({ location: 1 });
JobSchema.index({ company: 1 });
JobSchema.index({ isActive: 1 });
JobSchema.index({ createdAt: -1 });
JobSchema.index({ updatedAt: -1 });
// Compound index for active jobs sorted by date
JobSchema.index({ isActive: 1, createdAt: -1 });

// Middleware to set updatedAt on save
JobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual ID to match the API format
JobSchema.virtual('id').get(function() {
  return this.externalId;
});

// Setting toJSON option to include virtuals and remove _id, __v
JobSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    delete ret.externalId;
    return ret;
  }
});

module.exports = mongoose.model('Job', JobSchema); 