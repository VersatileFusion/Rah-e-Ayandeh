const mongoose = require('mongoose');

const UniversitySchema = new mongoose.Schema({
  externalId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'نام برنامه اجباری است'],
    trim: true,
    maxlength: [100, 'نام برنامه نمی‌تواند بیش از 100 کاراکتر باشد']
  },
  description: {
    type: String,
    required: [true, 'توضیحات برنامه اجباری است'],
    maxlength: [2000, 'توضیحات نمی‌تواند بیش از 2000 کاراکتر باشد']
  },
  university: {
    type: String,
    required: [true, 'نام دانشگاه اجباری است'],
    trim: true
  },
  field: {
    type: String,
    required: [true, 'رشته تحصیلی اجباری است'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'محل دانشگاه اجباری است'],
    trim: true
  },
  deadline: {
    type: String,
    required: [true, 'مهلت ثبت‌نام اجباری است']
  },
  requirements: {
    type: [String],
    required: [true, 'شرایط پذیرش اجباری است']
  },
  source: {
    type: String,
    required: [true, 'منبع داده‌ها اجباری است'],
    enum: ['api1', 'api2']
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
UniversitySchema.index({
  name: 'text',
  description: 'text',
  university: 'text',
  field: 'text',
  location: 'text'
});

// Add single field indexes for frequently queried fields
UniversitySchema.index({ field: 1 });
UniversitySchema.index({ location: 1 });
UniversitySchema.index({ university: 1 });
UniversitySchema.index({ deadline: 1 });
UniversitySchema.index({ createdAt: -1 });
UniversitySchema.index({ updatedAt: -1 });

// Middleware to set updatedAt on save
UniversitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual ID to match the API format
UniversitySchema.virtual('id').get(function() {
  return this.externalId;
});

// Setting toJSON option to include virtuals and remove _id, __v
UniversitySchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    delete ret.externalId;
    return ret;
  }
});

module.exports = mongoose.model('University', UniversitySchema); 