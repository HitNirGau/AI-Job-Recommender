import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiUploadCloud, 
  FiBriefcase, 
  FiCompass, 
  FiCheckSquare, 
  FiUser, 
  FiLogOut, 
  FiSun, 
  FiMoon, 
  FiMenu, 
  FiX 
} from 'react-icons/fi';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [darkTheme, setDarkTheme] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Check local storage or system preferences
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkTheme(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkTheme(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (darkTheme) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkTheme(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkTheme(true);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <FiHome className="text-lg" /> },
    { name: 'Resume Upload', path: '/resume', icon: <FiUploadCloud className="text-lg" /> },
    { name: 'AI Job Matching', path: '/jobs', icon: <FiBriefcase className="text-lg" /> },
    { name: 'AI Career Assistant', path: '/assistant', icon: <FiCompass className="text-lg" /> },
    { name: 'Job Tracker', path: '/tracker', icon: <FiCheckSquare className="text-lg" /> },
    { name: 'My Profile', path: '/profile', icon: <FiUser className="text-lg" /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-[#121826] border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="font-bold text-lg bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">CareerAI</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300"
          >
            {mobileOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div className={`lg:hidden fixed top-[65px] bottom-0 left-0 w-[260px] bg-white dark:bg-[#121826] border-r border-slate-200/50 dark:border-slate-800/50 z-40 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full justify-between p-4">
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 text-indigo-600 dark:text-cyan-400 font-semibold border-l-4 border-indigo-500' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <FiLogOut className="text-lg" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col justify-between w-[280px] h-[calc(100vh-2rem)] m-4 rounded-3xl glass-panel border border-slate-200/30 dark:border-white/5 p-6 sticky top-4 left-4 z-30">
        <div>
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-xl">
              🤖
            </div>
            <div>
              <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent leading-none">CareerAI</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Smart Job Matcher</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold shadow-md shadow-indigo-500/15' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/55 dark:hover:bg-slate-800/40 hover:translate-x-1'
                }`}
              >
                <span className="transition-transform group-hover:scale-110">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer & User Stats */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/50 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="max-w-[170px] overflow-hidden">
                <p className="text-sm font-semibold truncate leading-none text-slate-800 dark:text-slate-200">{user?.name || 'User Profile'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{user?.email || ''}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 hover:-translate-y-0.5 transition-all border border-transparent hover:border-rose-500/10 font-medium"
          >
            <FiLogOut className="text-lg" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
