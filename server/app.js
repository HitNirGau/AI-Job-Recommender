import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Load environment variables first
dotenv.config();

import connectDB from './config/db.js';

// Route Imports
import authRoutes from './routes/auth.js';
import resumeRoutes from './routes/resumes.js';
import jobRoutes from './routes/jobs.js';
import aiRoutes from './routes/ai.js';

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: '*' })); // Allow cross-origin client requests
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded resumes
app.use('/uploads', express.static('uploads'));

// Routes wiring
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/ai', aiRoutes);

// Base Health Check Route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'AI Resume Matcher API is running' });
});

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
