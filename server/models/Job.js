import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  salary: {
    type: String,
    default: 'Not Specified'
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: String,
    default: 'Entry level'
  },
  type: {
    type: String,
    enum: ['Remote', 'Hybrid', 'Onsite'],
    default: 'Onsite'
  },
  description: {
    type: String,
    default: ''
  },
  requiredSkills: {
    type: [String],
    default: []
  },
  applyLink: {
    type: String,
    default: '#'
  },
  source: {
    type: String,
    enum: ['jsearch', 'database'],
    default: 'database'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Job', JobSchema);
