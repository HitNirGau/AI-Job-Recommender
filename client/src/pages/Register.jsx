import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatUserError } from '../utils/errorFormatter';
import { FiUser, FiMail, FiLock, FiBookOpen, FiCalendar, FiPhone, FiArrowRight, FiEye, FiEyeOff, FiGlobe, FiChevronDown } from 'react-icons/fi';

const Register = () => {
  const navigate = useNavigate();
  const { sendRegisterOtp, verifyRegisterOtp, showToast } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
    branch: '',
    gradYear: '',
    phone: '',
    countryCode: '+91'
  });
  
  const [step, setStep] = useState('form'); // 'form' or 'otp'
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    const phoneWithCode = formData.phone ? `${formData.countryCode} ${formData.phone}` : '';
    const result = await sendRegisterOtp({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      college: formData.college,
      branch: formData.branch,
      gradYear: parseInt(formData.gradYear),
      phone: phoneWithCode
    });

    if (result.success) {
      setStep('otp');
    } else {
      setError(formatUserError(result.error, 'Registration failed. Please check your details and try again.'));
    }
    setLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      return setError('Please enter a valid 6-digit OTP code');
    }

    setLoading(true);
    const result = await verifyRegisterOtp(formData.email, otp);
    if (result.success) {
      showToast('Successfully registered your account! Welcome aboard.');
      navigate('/');
    } else {
      setError(formatUserError(result.error, 'OTP verification failed. Please try again.'));
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#090d16] p-4 overflow-hidden transition-colors duration-300">
      {/* Decorative blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-2xl p-8 rounded-3xl glass-panel border border-slate-200/30 dark:border-white/5 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-md text-white text-2xl font-bold mb-4">
            🤖
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {step === 'otp' ? 'Verify Email Address' : 'Create Account'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {step === 'otp' ? `Enter the 6-digit OTP sent to ${formData.email}` : 'Join CareerAI and match your resume to your dream job'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        {step === 'otp' ? (
          <form onSubmit={handleOtpSubmit} className="space-y-6 max-w-md mx-auto">
            <div className="space-y-2 text-center">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">6-Digit Verification Code</label>
              <input
                type="text"
                maxLength="6"
                required
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-2xl tracking-[0.5em] font-extrabold py-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-slate-800 dark:text-slate-100 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl neon-btn font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Verify OTP & Complete Registration</span>
                  <FiArrowRight />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setStep('form'); setError(''); }}
              className="w-full text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-center"
            >
              ← Back to registration details
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Highlighted registration rules */}
            <div className="imp-instruction text-xs space-y-1 border-l-4 border-indigo-500 bg-indigo-500/10 dark:bg-indigo-950/20 p-4 rounded-2xl">
              <p className="font-extrabold text-indigo-600 dark:text-cyan-400 flex items-center gap-1.5">
                📢 IMPORTANT REGISTRATION RULES
              </p>
              <ul className="list-disc list-inside text-slate-700 dark:text-slate-200 mt-1.5 space-y-1 font-medium">
                <li><strong>Valid Email:</strong> Must contain <code className="bg-indigo-500/15 dark:bg-indigo-500/30 px-1 py-0.5 rounded text-indigo-600 dark:text-cyan-400 font-mono">@</code> to receive OTP verification.</li>
                <li><strong>Password:</strong> Must contain at least 6 characters for security.</li>
                <li><strong>Country Code:</strong> Select your prefix (defaults to <code className="bg-indigo-500/15 dark:bg-indigo-500/30 px-1 py-0.5 rounded text-indigo-600 dark:text-cyan-400 font-mono">+91</code>) before writing your phone number.</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider pl-1">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FiUser />
                  </span>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm text-slate-900 dark:text-slate-100 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider pl-1">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FiMail />
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm text-slate-900 dark:text-slate-100 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* College */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider pl-1">College / University</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FiBookOpen />
                  </span>
                  <input
                    type="text"
                    name="college"
                    required
                    placeholder="IIT Bombay"
                    value={formData.college}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm text-slate-900 dark:text-slate-100 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider pl-1">Branch / Major</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FiBookOpen />
                  </span>
                  <input
                    type="text"
                    name="branch"
                    required
                    placeholder="Computer Science"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm text-slate-900 dark:text-slate-100 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Graduation Year */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider pl-1">Graduation Year</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FiCalendar />
                  </span>
                  <select
                    name="gradYear"
                    required
                    value={formData.gradYear}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm text-slate-900 dark:text-slate-100 transition-all cursor-pointer appearance-none font-semibold"
                  >
                    <option value="" disabled className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Select Graduation Year</option>
                    {Array.from({ length: 31 }, (_, i) => 2000 + i).map(year => (
                      <option key={year} value={year} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{year}</option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
                    <FiChevronDown />
                  </span>
                </div>
              </div>

              {/* Phone (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider pl-1">Phone Number (Optional)</label>
                <div className="flex gap-2">
                  {/* Country Code Select Dropdown */}
                  <div className="relative w-1/3">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <FiGlobe className="text-sm" />
                    </span>
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                      className="w-full pl-8 pr-6 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-xs text-slate-900 dark:text-slate-100 transition-all cursor-pointer appearance-none font-semibold"
                    >
                      <option value="+91" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">+91 (IN)</option>
                      <option value="+1" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">+1 (US)</option>
                      <option value="+44" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">+44 (UK)</option>
                      <option value="+61" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">+61 (AU)</option>
                      <option value="+971" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">+971 (AE)</option>
                      <option value="+49" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">+49 (DE)</option>
                      <option value="+33" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">+33 (FR)</option>
                      <option value="+81" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">+81 (JP)</option>
                      <option value="+65" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">+65 (SG)</option>
                    </select>
                    <span className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 pointer-events-none">
                      <FiChevronDown className="text-sm" />
                    </span>
                  </div>
                  {/* Phone Input Box */}
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <FiPhone />
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm text-slate-900 dark:text-slate-100 transition-all font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider pl-1">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FiLock />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm text-slate-900 dark:text-slate-100 transition-all font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider pl-1">Confirm Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FiLock />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm text-slate-900 dark:text-slate-100 transition-all font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
            </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 rounded-2xl neon-btn font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Register Account</span>
                <FiArrowRight />
              </>
            )}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
          Login instead
        </Link>
      </p>
      </div>
    </div>
  );
};

export default Register;
