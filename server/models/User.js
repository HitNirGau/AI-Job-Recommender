import mongoose from 'mongoose';

const EducationSchema = new mongoose.Schema({
  degree: String,
  school: String,
  startYear: Number,
  endYear: Number,
  gpa: String
});

const ProjectSchema = new mongoose.Schema({
  title: String,
  desc: String,
  url: String,
  technologies: [String]
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  college: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  gradYear: {
    type: Number,
    required: true
  },
  phone: String,
  skills: [String],
  education: [EducationSchema],
  certifications: [String],
  projects: [ProjectSchema],
  socialLinks: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    leetcode: { type: String, default: '' },
    codeforces: { type: String, default: '' },
    hackerrank: { type: String, default: '' }
  },
  profilePicture: {
    type: String,
    default: ''
  },
  pastSearches: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', UserSchema);
