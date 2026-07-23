import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatUserError } from '../utils/errorFormatter';
import { FiSave, FiPlus, FiTrash, FiLink, FiBook, FiCode, FiAward, FiLock, FiMail } from 'react-icons/fi';

const Profile = () => {
  const { user, updateUserProfile, requestEmailUpdate, verifyEmailUpdate, updatePassword } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    college: '',
    branch: '',
    gradYear: '',
    skills: [],
    certifications: [],
    projects: [],
    socialLinks: {
      github: '',
      linkedin: '',
      portfolio: '',
      leetcode: '',
      codeforces: '',
      hackerrank: ''
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState('');
  const [newProj, setNewProj] = useState({ title: '', desc: '', url: '', technologies: '' });

  // Security & Account update state variables
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [secPassword, setSecPassword] = useState('');
  const [secConfirmPassword, setSecConfirmPassword] = useState('');
  const [secLoading, setSecLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState({ type: '', text: '' });
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        college: user.college || '',
        branch: user.branch || '',
        gradYear: user.gradYear || '',
        skills: user.skills || [],
        certifications: user.certifications || [],
        projects: user.projects || [],
        socialLinks: {
          github: user.socialLinks?.github || '',
          linkedin: user.socialLinks?.linkedin || '',
          portfolio: user.socialLinks?.portfolio || '',
          leetcode: user.socialLinks?.leetcode || '',
          codeforces: user.socialLinks?.codeforces || '',
          hackerrank: user.socialLinks?.hackerrank || ''
        }
      });
    }
  }, [user]);

  const handleGeneralChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleSocialChange = (e) => {
    setProfileData({
      ...profileData,
      socialLinks: {
        ...profileData.socialLinks,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const result = await updateUserProfile(profileData);
    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } else {
      setMessage({ type: 'error', text: formatUserError(result.error, 'Failed to update profile. Please try again.') });
    }
    setLoading(false);
  };

  // Skill Managers
  const addSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter(s => s !== skillToRemove)
    });
  };

  // Certification Managers
  const addCert = () => {
    if (newCert.trim() && !profileData.certifications.includes(newCert.trim())) {
      setProfileData({
        ...profileData,
        certifications: [...profileData.certifications, newCert.trim()]
      });
      setNewCert('');
    }
  };

  const removeCert = (certToRemove) => {
    setProfileData({
      ...profileData,
      certifications: profileData.certifications.filter(c => c !== certToRemove)
    });
  };

  // Project Managers
  const handleProjChange = (e) => {
    setNewProj({
      ...newProj,
      [e.target.name]: e.target.value
    });
  };

  const addProject = () => {
    if (newProj.title.trim()) {
      const techArray = newProj.technologies
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
        
      setProfileData({
        ...profileData,
        projects: [
          ...profileData.projects,
          {
            title: newProj.title.trim(),
            desc: newProj.desc.trim(),
            url: newProj.url.trim(),
            technologies: techArray
          }
        ]
      });
      setNewProj({ title: '', desc: '', url: '', technologies: '' });
    }
  };

  const removeProject = (index) => {
    setProfileData({
      ...profileData,
      projects: profileData.projects.filter((_, i) => i !== index)
    });
  };

  const handleRequestEmailOtp = async (e) => {
    e.preventDefault();
    setSecurityMessage({ type: '', text: '' });
    if (!newEmail || !newEmail.includes('@')) {
      return setSecurityMessage({ type: 'error', text: 'Please enter a valid email address containing @' });
    }
    setSecLoading(true);
    const res = await requestEmailUpdate(newEmail);
    if (res.success) {
      setEmailOtpSent(true);
      setSecurityMessage({ type: 'success', text: 'Verification OTP sent to new email address!' });
    } else {
      setSecurityMessage({ type: 'error', text: formatUserError(res.error, 'Failed to request email update OTP.') });
    }
    setSecLoading(false);
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setSecurityMessage({ type: '', text: '' });
    if (emailOtp.length !== 6) {
      return setSecurityMessage({ type: 'error', text: 'Please enter a valid 6-digit OTP code' });
    }
    setSecLoading(true);
    const res = await verifyEmailUpdate(emailOtp);
    if (res.success) {
      setEmailOtpSent(false);
      setNewEmail('');
      setEmailOtp('');
      setSecurityMessage({ type: 'success', text: 'Email address updated successfully!' });
    } else {
      setSecurityMessage({ type: 'error', text: formatUserError(res.error, 'Failed to verify email update OTP.') });
    }
    setSecLoading(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setSecurityMessage({ type: '', text: '' });
    if (secPassword.length < 6) {
      return setSecurityMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
    }
    if (secPassword !== secConfirmPassword) {
      return setSecurityMessage({ type: 'error', text: 'Passwords do not match' });
    }
    setSecLoading(true);
    const res = await updatePassword(secPassword, secConfirmPassword);
    if (res.success) {
      setSecPassword('');
      setSecConfirmPassword('');
      setSecurityMessage({ type: 'success', text: 'Password updated successfully!' });
    } else {
      setSecurityMessage({ type: 'error', text: formatUserError(res.error, 'Failed to update password.') });
    }
    setSecLoading(false);
  };

  const tabs = [
    { id: 'general', name: 'General Information', icon: <FiBook /> },
    { id: 'skills', name: 'Skills & Achievements', icon: <FiCode /> },
    { id: 'projects', name: 'Projects', icon: <FiAward /> },
    { id: 'socials', name: 'Links & Socials', icon: <FiLink /> },
    { id: 'security', name: 'Account & Security', icon: <FiLock /> }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Profile Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure your personal and technical details for AI job matching</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="neon-btn px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <FiSave className="text-lg" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl text-sm font-medium border ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
        }`}>
          {message.type === 'success' ? '✓' : '⚠️'} {message.text}
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar Tabs */}
        <div className="w-full lg:w-1/4 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 bg-slate-100/50 dark:bg-slate-900/25 p-2 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 sticky top-4 z-10 scrollbar-none h-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-full text-left whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-[#121826] text-indigo-600 dark:text-cyan-400 shadow-sm border border-slate-200/50 dark:border-slate-800/50'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/20'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Form Body Cards */}
        <div className="flex-1 bg-white dark:bg-[#121826]/40 border border-slate-200/30 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">General Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleGeneralChange}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleGeneralChange}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">College</label>
                  <input
                    type="text"
                    name="college"
                    value={profileData.college}
                    onChange={handleGeneralChange}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Branch / Major</label>
                  <input
                    type="text"
                    name="branch"
                    value={profileData.branch}
                    onChange={handleGeneralChange}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Graduation Year</label>
                  <select
                    name="gradYear"
                    value={profileData.gradYear}
                    onChange={handleGeneralChange}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="" disabled>Select Graduation Year</option>
                    {Array.from({ length: 31 }, (_, i) => 2000 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-8">
              {/* Dynamic Skill Tags */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Technical Skills</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a skill (e.g. React, Docker)"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                    className="flex-1 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100"
                  />
                  <button
                    onClick={addSkill}
                    className="px-4 py-3 rounded-2xl bg-indigo-500 text-white font-semibold flex items-center gap-1 hover:bg-indigo-600 transition-colors cursor-pointer text-sm"
                  >
                    <FiPlus /> Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {profileData.skills.length > 0 ? (
                    profileData.skills.map((skill, index) => (
                      <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 text-xs font-bold border border-indigo-500/10">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="hover:text-rose-500 font-normal">×</button>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500">No skills added yet.</p>
                  )}
                </div>
              </div>

              {/* Dynamic Certifications */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Certifications</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a certification (e.g. AWS Certified Developer)"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCert()}
                    className="flex-1 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100"
                  />
                  <button
                    onClick={addCert}
                    className="px-4 py-3 rounded-2xl bg-indigo-500 text-white font-semibold flex items-center gap-1 hover:bg-indigo-600 transition-colors cursor-pointer text-sm"
                  >
                    <FiPlus /> Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {profileData.certifications.length > 0 ? (
                    profileData.certifications.map((cert, index) => (
                      <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200/50 dark:border-slate-700">
                        {cert}
                        <button onClick={() => removeCert(cert)} className="hover:text-rose-500 font-normal">×</button>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500">No certifications added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-6">
              <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Personal & Academic Projects</h3>
              
              {/* Project display list */}
              <div className="space-y-4 mb-8">
                {profileData.projects.length > 0 ? (
                  profileData.projects.map((project, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">{project.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{project.desc}</p>
                        {project.url && (
                          <a href={project.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline mt-2 inline-flex items-center gap-1">
                            Link <FiLink className="text-[10px]" />
                          </a>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {project.technologies.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => removeProject(idx)} className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer">
                        <FiTrash />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">No projects added yet.</p>
                )}
              </div>

              {/* Add Project Form segment */}
              <div className="p-5 rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Add New Project</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="title"
                    placeholder="Project Title"
                    value={newProj.title}
                    onChange={handleProjChange}
                    className="px-4 py-2.5 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-sm text-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    name="url"
                    placeholder="Project Link (GitHub / Live)"
                    value={newProj.url}
                    onChange={handleProjChange}
                    className="px-4 py-2.5 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-sm text-slate-800 dark:text-slate-100"
                  />
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="technologies"
                      placeholder="Technologies used (comma-separated: React, Node, SQL)"
                      value={newProj.technologies}
                      onChange={handleProjChange}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-sm text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <textarea
                      name="desc"
                      rows="3"
                      placeholder="Brief description of project goals and achievements..."
                      value={newProj.desc}
                      onChange={handleProjChange}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-sm text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addProject}
                  className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold flex items-center justify-center gap-1 hover:bg-indigo-600 transition-colors text-xs cursor-pointer"
                >
                  <FiPlus /> Add Project
                </button>
              </div>
            </div>
          )}

          {activeTab === 'socials' && (
            <div className="space-y-6">
              <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Social Profiles & Integrations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">GitHub Profile Link</label>
                  <input
                    type="url"
                    name="github"
                    placeholder="https://github.com/username"
                    value={profileData.socialLinks.github}
                    onChange={handleSocialChange}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">LinkedIn Profile Link</label>
                  <input
                    type="url"
                    name="linkedin"
                    placeholder="https://linkedin.com/in/username"
                    value={profileData.socialLinks.linkedin}
                    onChange={handleSocialChange}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Portfolio Link</label>
                  <input
                    type="url"
                    name="portfolio"
                    placeholder="https://username.dev"
                    value={profileData.socialLinks.portfolio}
                    onChange={handleSocialChange}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">LeetCode Profile Link</label>
                  <input
                    type="url"
                    name="leetcode"
                    placeholder="https://leetcode.com/username"
                    value={profileData.socialLinks.leetcode}
                    onChange={handleSocialChange}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Codeforces Profile Link</label>
                  <input
                    type="url"
                    name="codeforces"
                    placeholder="https://codeforces.com/profile/username"
                    value={profileData.socialLinks.codeforces}
                    onChange={handleSocialChange}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">HackerRank Profile Link</label>
                  <input
                    type="url"
                    name="hackerrank"
                    placeholder="https://hackerrank.com/username"
                    value={profileData.socialLinks.hackerrank}
                    onChange={handleSocialChange}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">
              <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Account & Security Settings</h3>

              {securityMessage.text && (
                <div className={`p-4 rounded-2xl text-sm font-medium border ${
                  securityMessage.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                }`}>
                  {securityMessage.type === 'success' ? '✓' : '⚠️'} {securityMessage.text}
                </div>
              )}

              {/* 1. Email Address Update via OTP */}
              <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/60 dark:border-slate-800 space-y-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                    <FiMail className="text-indigo-500" /> Update Registered Email Address
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Current Email: <strong className="text-slate-800 dark:text-slate-200">{user?.email}</strong>. Email update requires 6-digit OTP verification.
                  </p>
                </div>

                {!emailOtpSent ? (
                  <form onSubmit={handleRequestEmailOtp} className="space-y-3 max-w-md">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">New Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="newemail@example.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={secLoading}
                      className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold text-xs hover:bg-indigo-600 cursor-pointer disabled:opacity-75"
                    >
                      {secLoading ? 'Sending OTP...' : 'Send OTP to New Email'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyEmailOtp} className="space-y-3 max-w-md">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      OTP Code sent to <span className="underline">{newEmail}</span>. Please enter the 6-digit code below:
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">6-Digit OTP Code</label>
                      <input
                        type="text"
                        maxLength="6"
                        required
                        placeholder="123456"
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center text-xl tracking-[0.4em] font-extrabold py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={secLoading}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 cursor-pointer disabled:opacity-75"
                      >
                        {secLoading ? 'Verifying...' : 'Verify OTP & Update Email'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailOtpSent(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 2. Password Update */}
              <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/60 dark:border-slate-800 space-y-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                    <FiLock className="text-indigo-500" /> Change Account Password
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Password must contain at least 6 characters.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={secPassword}
                      onChange={(e) => setSecPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={secConfirmPassword}
                      onChange={(e) => setSecConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={secLoading}
                    className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold text-xs hover:bg-indigo-600 cursor-pointer disabled:opacity-75"
                  >
                    {secLoading ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
