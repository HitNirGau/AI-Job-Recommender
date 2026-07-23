import mongoose from 'mongoose';

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String
  },
  fileData: String,
  fileMimeType: String,
  cloudinaryId: String,
  rawText: String,
  parsedData: {
    contact_info: {
      email: String,
      phone: String,
      github: String,
      linkedin: String
    },
    skills: [String],
    sections: {
      experience: String,
      education: String,
      projects: String,
      skills: String
    }
  },
  atsAnalysis: {
    ats_friendly: String,
    ats_score: Number,
    issues: [String],
    details: mongoose.Schema.Types.Mixed
  },
  resumeScoring: {
    overall_score: Number,
    breakdown: mongoose.Schema.Types.Mixed
  },
  summary: {
    type: String,
    default: ''
  },
  suggestions: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Resume', ResumeSchema);
