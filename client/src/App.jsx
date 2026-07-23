import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResumeUpload from './pages/ResumeUpload';
import JobRecommender from './pages/JobRecommender';
import AiAssistant from './pages/AiAssistant';
import JobTracker from './pages/JobTracker';
import Profile from './pages/Profile';

// Helper component for protecting private routes
const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-[#090d16]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium animate-pulse">Loading CareerAI...</p>
        </div>
      </div>
    );
  }

  return token ? children : <Navigate to="/login" />;
};

// Main Layout wrapping sidebar and main content pane
const PrivateLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc] dark:bg-[#090d16] transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-6 lg:h-screen lg:overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

const ToastNotification = () => {
  const { toast } = useAuth();
  if (!toast || !toast.message) return null;

  return (
    <div className={`fixed top-5 right-5 z-[9999] max-w-sm w-full p-4 rounded-2xl border shadow-xl flex items-center gap-3 transition-all duration-300 animate-pulse ${
      toast.type === 'error' 
        ? 'bg-rose-500/10 border-rose-500/35 text-rose-500 backdrop-blur-md' 
        : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-500 backdrop-blur-md'
    }`}>
      <span className="text-lg">{toast.type === 'error' ? '⚠️' : '✓'}</span>
      <span className="text-xs font-semibold">{toast.message}</span>
    </div>
  );
};

function AppContent() {
  return (
    <Router>
      <ToastNotification />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <PrivateRoute>
            <PrivateLayout>
              <Dashboard />
            </PrivateLayout>
          </PrivateRoute>
        } />
        
        <Route path="/resume" element={
          <PrivateRoute>
            <PrivateLayout>
              <ResumeUpload />
            </PrivateLayout>
          </PrivateRoute>
        } />

        <Route path="/jobs" element={
          <PrivateRoute>
            <PrivateLayout>
              <JobRecommender />
            </PrivateLayout>
          </PrivateRoute>
        } />

        <Route path="/assistant" element={
          <PrivateRoute>
            <PrivateLayout>
              <AiAssistant />
            </PrivateLayout>
          </PrivateRoute>
        } />

        <Route path="/tracker" element={
          <PrivateRoute>
            <PrivateLayout>
              <JobTracker />
            </PrivateLayout>
          </PrivateRoute>
        } />

        <Route path="/profile" element={
          <PrivateRoute>
            <PrivateLayout>
              <Profile />
            </PrivateLayout>
          </PrivateRoute>
        } />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
