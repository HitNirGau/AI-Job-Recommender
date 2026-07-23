import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['register', 'forgot', 'update_email'],
    required: true
  },
  tempData: {
    type: String, // Stringified JSON of registration fields
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Auto-delete after 10 minutes
  }
});

export default mongoose.model('Otp', OtpSchema);
