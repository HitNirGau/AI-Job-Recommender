import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatUserError } from '../utils/errorFormatter';
import { 
  FiBookmark, 
  FiSend, 
  FiCalendar, 
  FiXCircle, 
  FiAward, 
  FiTrash2, 
  FiEdit, 
  FiSave 
} from 'react-icons/fi';

const JobTracker = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNotesId, setEditingNotesId] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:5002/api/jobs/tracker');
      setApplications(res.data);
    } catch (err) {
      console.error(err);
      setError(formatUserError(err, 'Unable to load tracked applications. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (appId, newStatus) => {
    setError('');
    try {
      const res = await axios.put(`http://localhost:5002/api/jobs/tracker/${appId}`, { status: newStatus });
      setApplications(prev => prev.map(app => app._id === appId ? res.data : app));
      setMessage('Status updated successfully!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error(err);
      setError(formatUserError(err, 'Failed to update application status.'));
    }
  };

  const handleStartEditingNotes = (appId, currentNotes) => {
    setEditingNotesId(appId);
    setEditedNotes(currentNotes);
  };

  const handleSaveNotes = async (appId) => {
    setError('');
    try {
      const res = await axios.put(`http://localhost:5002/api/jobs/tracker/${appId}`, { notes: editedNotes });
      setApplications(prev => prev.map(app => app._id === appId ? res.data : app));
      setEditingNotesId('');
      setMessage('Notes saved successfully!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error(err);
      setError(formatUserError(err, 'Failed to save notes.'));
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (!window.confirm("Are you sure you want to stop tracking this job application?")) return;
    setError('');
    try {
      await axios.delete(`http://localhost:5002/api/jobs/tracker/${appId}`);
      setApplications(prev => prev.filter(app => app._id !== appId));
      setMessage('Job removed from tracker.');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error(err);
      setError(formatUserError(err, 'Failed to remove job from tracker.'));
    }
  };

  const columns = [
    { id: 'Saved', title: 'Saved Jobs', icon: <FiBookmark className="text-slate-450" />, color: 'border-slate-300 dark:border-slate-800' },
    { id: 'Applied', title: 'Applied', icon: <FiSend className="text-indigo-500" />, color: 'border-indigo-500/25' },
    { id: 'Interview Scheduled', title: 'Interviews', icon: <FiCalendar className="text-cyan-500" />, color: 'border-cyan-500/25' },
    { id: 'Rejected', title: 'Rejected', icon: <FiXCircle className="text-rose-500" />, color: 'border-rose-500/25' },
    { id: 'Offer Received', title: 'Offers', icon: <FiAward className="text-emerald-500" />, color: 'border-emerald-500/25' }
  ];

  return (
    <div className="space-y-6 pb-12 w-full">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Job Tracker</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kanban-style tracking pipeline for managing interviews, offers, and rejections</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {message && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-sm font-medium">
          ✓ {message}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-200/50 dark:bg-slate-800/40 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        /* Kanban pipeline board scroll container */
        <div className="flex flex-col lg:flex-row overflow-x-auto gap-4 items-start pb-4 scrollbar-none w-full">
          {columns.map((col) => {
            const colApps = applications.filter(app => app.status === col.id);
            return (
              <div 
                key={col.id} 
                className="w-full lg:w-[260px] flex-shrink-0 rounded-2xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/30 dark:border-white/5 p-4 space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-850 pb-2">
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-450">{col.title}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
                    {colApps.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-none">
                  {colApps.length > 0 ? (
                    colApps.map((app) => (
                      <div 
                        key={app._id} 
                        className={`p-4 rounded-xl bg-white dark:bg-[#121826]/70 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3`}
                      >
                        {/* Company & Title */}
                        <div>
                          <h4 className="font-bold text-xs text-slate-800 dark:text-white leading-tight">{app.jobId?.title}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{app.jobId?.company}</p>
                          <p className="text-[9px] font-semibold text-slate-400 mt-1">{app.jobId?.location}</p>
                        </div>

                        {/* Status Mover Action Buttons */}
                        <div className="flex flex-wrap gap-1 border-t border-b border-slate-100 dark:border-slate-800 py-2">
                          {columns.map((mo) => {
                            if (mo.id === col.id) return null;
                            return (
                              <button
                                key={mo.id}
                                onClick={() => handleUpdateStatus(app._id, mo.id)}
                                title={`Move to ${mo.title}`}
                                className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                              >
                                {mo.id.split(' ')[0]}
                              </button>
                            );
                          })}
                        </div>

                        {/* Application Notes Editor */}
                        <div className="space-y-1.5">
                          {editingNotesId === app._id ? (
                            <div className="space-y-1.5">
                              <textarea
                                value={editedNotes}
                                onChange={(e) => setEditedNotes(e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                rows="2"
                                placeholder="Add notes..."
                              />
                              <button
                                onClick={() => handleSaveNotes(app._id)}
                                className="w-full py-1.5 rounded-lg bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <FiSave /> Save
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-1 group">
                              <p className="text-[10px] text-slate-500 dark:text-slate-405 leading-relaxed break-words max-w-[130px]">
                                {app.notes ? app.notes : <span className="italic text-slate-400">No notes added.</span>}
                              </p>
                              <button 
                                onClick={() => handleStartEditingNotes(app._id, app.notes)}
                                className="text-slate-400 hover:text-indigo-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <FiEdit className="text-[10px]" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Card Actions Footer */}
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-[9px] text-slate-400">
                          <span>Updated: {new Date(app.updatedAt).toLocaleDateString()}</span>
                          <button 
                            onClick={() => handleDeleteApplication(app._id)}
                            className="text-rose-500 hover:bg-rose-500/10 p-1 rounded transition-colors cursor-pointer"
                          >
                            <FiTrash2 className="text-[10px]" />
                          </button>
                        </div>

                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                      <p className="text-[10px]">No applications</p>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobTracker;
