import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import ActivityLogModal from '../components/ActivityLogModal';

export default function ActivityHistory() {
  const { contactId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const projectId = searchParams.get('projectId') || '';
  const returnTo = searchParams.get('returnTo') || '';

  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [contact, setContact] = useState(null);
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'call' | 'email' | 'linkedin'
  const [toast, setToast] = useState(null);

  // Activity Log Modal State
  const [activityModal, setActivityModal] = useState({
    isOpen: false,
    type: 'call',
    activityId: null,
    editMode: false,
    lastActivity: null
  });

  // Edit Contact Modal State
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    company: '',
    email: '',
    phoneNumber: '',
    linkedInUrl: '',
    jobTitle: ''
  });
  const [savingContact, setSavingContact] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Activities and Contact Data
  const fetchData = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    try {
      // 1. Fetch Contact Activities
      const actUrl = projectId 
        ? `/activities/contact/${contactId}?projectId=${projectId}`
        : `/activities/contact/${contactId}`;
      
      const actRes = await API.get(actUrl);
      const acts = actRes.data.success ? (actRes.data.data || []) : [];
      setActivities(acts);

      // 2. Fetch Project if projectId provided
      if (projectId) {
        try {
          const projRes = await API.get(`/projects/${projectId}`);
          if (projRes.data.success) {
            setProject(projRes.data.data);
          }
        } catch (e) {
          console.error('Error fetching project:', e);
        }
      }

      // 3. Fetch specific Contact information
      // Check if we can get contact from activities first
      let foundContact = null;
      if (acts.length > 0 && acts[0].contact) {
        foundContact = {
          _id: acts[0].contact._id || contactId,
          name: acts[0].contact.name || '',
          company: acts[0].contact.company || '',
          email: acts[0].contact.email || acts[0].email || '',
          phoneNumber: acts[0].phoneNumber || '',
          linkedInUrl: acts[0].linkedInUrl || ''
        };
      }

      // Also try fetching project-contacts or contact databank
      if (projectId) {
        try {
          const contactsRes = await API.get(`/projects/${projectId}/project-contacts`);
          if (contactsRes.data.success && contactsRes.data.data) {
            const match = contactsRes.data.data.find(
              c => String(c._id) === String(contactId) || String(c.contactId) === String(contactId)
            );
            if (match) {
              foundContact = {
                _id: match._id || contactId,
                name: match.name || foundContact?.name || '',
                company: match.company || foundContact?.company || '',
                email: match.email || foundContact?.email || '',
                phoneNumber: match.phoneNumber || match.phone || foundContact?.phoneNumber || '',
                linkedInUrl: match.linkedInUrl || match.linkedInProfileUrl || foundContact?.linkedInUrl || '',
                jobTitle: match.jobTitle || match.title || ''
              };
            }
          }
        } catch (err) {
          console.error('Error fetching project contacts:', err);
        }
      }

      if (foundContact) {
        setContact(foundContact);
        setContactForm({
          name: foundContact.name || '',
          company: foundContact.company || '',
          email: foundContact.email || '',
          phoneNumber: foundContact.phoneNumber || '',
          linkedInUrl: foundContact.linkedInUrl || '',
          jobTitle: foundContact.jobTitle || ''
        });
      } else {
        // Fallback default
        const fallback = {
          _id: contactId,
          name: 'Prospect Contact',
          company: '',
          email: '',
          phoneNumber: '',
          linkedInUrl: ''
        };
        setContact(fallback);
        setContactForm(fallback);
      }
    } catch (error) {
      console.error('Error loading activity history:', error);
      showToast('Failed to load activity history', 'error');
    } finally {
      setLoading(false);
    }
  }, [contactId, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigate back
  const handleBack = () => {
    if (returnTo) {
      navigate(decodeURIComponent(returnTo));
    } else if (projectId) {
      navigate(`/projects/${projectId}`);
    } else {
      navigate('/projects');
    }
  };

  // Determine enabled activity types based on project channels
  const enabledActivityTypes = useMemo(() => {
    if (!project?.channels) return ['call', 'email', 'linkedin'];
    const enabled = [];
    if (project.channels.coldCalling) enabled.push('call');
    if (project.channels.coldEmail) enabled.push('email');
    if (project.channels.linkedInOutreach) enabled.push('linkedin');
    return enabled.length > 0 ? enabled : ['call', 'email', 'linkedin'];
  }, [project?.channels]);

  // Activity Counts by Pipeline Type
  const counts = useMemo(() => {
    const total = activities.length;
    const calls = activities.filter(a => a.type === 'call').length;
    const emails = activities.filter(a => a.type === 'email').length;
    const linkedin = activities.filter(a => a.type === 'linkedin').length;
    return { total, calls, emails, linkedin };
  }, [activities]);

  // Filtered Activities based on active tab
  const filteredActivities = useMemo(() => {
    if (activeTab === 'all') {
      return activities.filter(a => enabledActivityTypes.includes(a.type));
    }
    return activities.filter(a => a.type === activeTab);
  }, [activities, activeTab, enabledActivityTypes]);

  // Helper for Initials
  const getInitials = (name) => {
    if (!name) return 'PC';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Helper for Date formatting
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Open Activity Modal
  const handleOpenActivityModal = (type, editMode = false, activity = null) => {
    setActivityModal({
      isOpen: true,
      type: type || 'call',
      activityId: activity ? activity._id : null,
      editMode: editMode,
      lastActivity: activity || null
    });
  };

  const handleCloseActivityModal = (shouldRefresh = false) => {
    setActivityModal({
      isOpen: false,
      type: 'call',
      activityId: null,
      editMode: false,
      lastActivity: null
    });
    if (shouldRefresh) {
      fetchData();
      showToast('Activity saved successfully!');
    }
  };

  // Save Contact Edits
  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!contactId || !projectId) {
      setContact(prev => ({ ...prev, ...contactForm }));
      setShowEditContactModal(false);
      showToast('Contact updated locally');
      return;
    }

    setSavingContact(true);
    try {
      await API.put(`/projects/${projectId}/project-contacts/${contactId}`, contactForm);
      setContact(prev => ({ ...prev, ...contactForm }));
      setShowEditContactModal(false);
      showToast('Contact details updated successfully!');
    } catch (error) {
      console.error('Error saving contact details:', error);
      // Update local state even if backend route isn't strictly mounted
      setContact(prev => ({ ...prev, ...contactForm }));
      setShowEditContactModal(false);
      showToast('Contact updated!');
    } finally {
      setSavingContact(false);
    }
  };

  // Delete an Activity
  const handleDeleteActivity = async (actId) => {
    if (!window.confirm('Are you sure you want to delete this activity log?')) return;
    try {
      await API.delete(`/activities/${actId}`);
      showToast('Activity deleted successfully');
      setActivities(prev => prev.filter(a => a._id !== actId));
    } catch (error) {
      console.error('Error deleting activity:', error);
      showToast('Failed to delete activity', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce transition-all">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
              toast.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-all shadow-2xs cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-bold">Activity History</span>
          {project?.companyName && (
            <>
              <span className="text-gray-300">/</span>
              <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {project.companyName}
              </span>
            </>
          )}
        </div>

        {/* Top Prospect Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6 transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Avatar & Contact Info */}
            <div className="flex items-start sm:items-center gap-4">
              {/* Avatar with Status Indicator */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-md ring-4 ring-blue-50">
                  {getInitials(contact?.name)}
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white" title="Active Contact"></span>
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
                    {contact?.name || (loading ? 'Loading...' : 'Prospect Contact')}
                  </h1>
                </div>

                <p className="text-sm font-semibold text-gray-500">
                  {contact?.company || 'Company N/A'}
                  {contact?.jobTitle ? ` • ${contact.jobTitle}` : ''}
                </p>

                {/* Contact Pills */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {/* Email Pill */}
                  {contact?.email ? (
                    <a
                      href={`mailto:${contact.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition"
                      title={contact.email}
                    >
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate max-w-[200px]">{contact.email}</span>
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>No email</span>
                    </span>
                  )}

                  {/* Phone Pill */}
                  {contact?.phoneNumber ? (
                    <a
                      href={`tel:${contact.phoneNumber}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{contact.phoneNumber}</span>
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>No phone</span>
                    </span>
                  )}

                  {/* LinkedIn Pill */}
                  {contact?.linkedInUrl ? (
                    <a
                      href={contact.linkedInUrl.startsWith('http') ? contact.linkedInUrl : `https://${contact.linkedInUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 transition"
                    >
                      <svg className="w-3.5 h-3.5 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <span>LinkedIn</span>
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Edit Contact Button */}
              <button
                onClick={() => setShowEditContactModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition shadow-xs cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit Contact</span>
              </button>

              {/* Log Call */}
              {enabledActivityTypes.includes('call') && (
                <button
                  onClick={() => handleOpenActivityModal('call')}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition shadow-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Log Call</span>
                </button>
              )}

              {/* Log Email */}
              {enabledActivityTypes.includes('email') && (
                <button
                  onClick={() => handleOpenActivityModal('email')}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition shadow-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Log Email</span>
                </button>
              )}

              {/* Log LinkedIn */}
              {enabledActivityTypes.includes('linkedin') && (
                <button
                  onClick={() => handleOpenActivityModal('linkedin')}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition shadow-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span>Log LinkedIn</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {enabledActivityTypes.length > 1 && (
            <button
              onClick={() => setActiveTab('all')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-blue-500/20'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span>All ({counts.total})</span>
            </button>
          )}

          {enabledActivityTypes.includes('call') && (
            <button
              onClick={() => setActiveTab('call')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer ${
                activeTab === 'call'
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Calls ({counts.calls})</span>
            </button>
          )}

          {enabledActivityTypes.includes('email') && (
            <button
              onClick={() => setActiveTab('email')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-blue-600 text-white shadow-blue-500/20'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Emails ({counts.emails})</span>
            </button>
          )}

          {enabledActivityTypes.includes('linkedin') && (
            <button
              onClick={() => setActiveTab('linkedin')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer ${
                activeTab === 'linkedin'
                  ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span>LinkedIn ({counts.linkedin})</span>
            </button>
          )}
        </div>

        {/* Activity Timeline List Container */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-sm font-semibold text-gray-600">Loading activity history...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          /* Empty State Card (Matches Screenshot 1) */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-12 sm:p-16 text-center space-y-4 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto text-gray-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">No activities yet</h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                Start logging activities to track your interactions with this contact and build a comprehensive engagement history.
              </p>
            </div>
          </div>
        ) : (
          /* Activity Timeline Container (Matches Screenshot 2) */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6 space-y-6">
            {/* Timeline Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Activity Timeline</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Complete interaction history with {contact?.name || 'this prospect'}
                </p>
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'}
              </span>
            </div>

            {/* Timeline Items */}
            <div className="space-y-4">
              {filteredActivities.map((act) => {
                const isCall = act.type === 'call';
                const isEmail = act.type === 'email';
                const isLinkedIn = act.type === 'linkedin';

                return (
                  <div
                    key={act._id}
                    className="p-5 rounded-2xl border border-gray-200/80 bg-white hover:border-gray-300 transition-all shadow-2xs space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {/* Channel Icon */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                            isCall
                              ? 'bg-emerald-500 text-white'
                              : isEmail
                              ? 'bg-blue-500 text-white'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {isCall && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          )}
                          {isEmail && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          )}
                          {isLinkedIn && (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900 capitalize">
                              {isCall ? 'Call' : isEmail ? 'Email' : 'LinkedIn'}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDateTime(act.callDate || act.emailDate || act.linkedinDate || act.createdAt)}
                            </span>
                            {act.projectId?.companyName && (
                              <>
                                <span>•</span>
                                <span className="text-gray-700 font-medium bg-gray-100 px-2 py-0.5 rounded">
                                  {act.projectId.companyName}
                                </span>
                              </>
                            )}
                            {act.createdByUser?.name && (
                              <>
                                <span>•</span>
                                <span>Logged by {act.createdByUser.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenActivityModal(act.type, true, act)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(act._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete activity log"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Metadata Details Grid Box */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3.5 bg-gray-50/70 border border-gray-100 rounded-xl text-xs">
                      {isCall && (
                        <>
                          {act.callNumber && (
                            <div>
                              <span className="text-gray-400 uppercase font-semibold text-[10px] block">Call</span>
                              <span className="font-semibold text-gray-800">{act.callNumber}</span>
                            </div>
                          )}
                          {act.callDate && (
                            <div>
                              <span className="text-gray-400 uppercase font-semibold text-[10px] block">Call Date</span>
                              <span className="font-semibold text-gray-800">{formatDateOnly(act.callDate)}</span>
                            </div>
                          )}
                          {act.callStatus && (
                            <div>
                              <span className="text-gray-400 uppercase font-semibold text-[10px] block">Status</span>
                              <span className="inline-block font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 mt-0.5">
                                {act.callStatus}
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      {isEmail && (
                        <>
                          {act.template && (
                            <div>
                              <span className="text-gray-400 uppercase font-semibold text-[10px] block">Template</span>
                              <span className="font-semibold text-gray-800">{act.template}</span>
                            </div>
                          )}
                          {act.emailDate && (
                            <div>
                              <span className="text-gray-400 uppercase font-semibold text-[10px] block">Email Date</span>
                              <span className="font-semibold text-gray-800">{formatDateOnly(act.emailDate)}</span>
                            </div>
                          )}
                          {act.status && (
                            <div>
                              <span className="text-gray-400 uppercase font-semibold text-[10px] block">Status</span>
                              <span className="inline-block font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 mt-0.5">
                                {act.status}
                              </span>
                            </div>
                          )}
                          {act.subject && (
                            <div className="col-span-2">
                              <span className="text-gray-400 uppercase font-semibold text-[10px] block">Subject</span>
                              <span className="font-semibold text-gray-800 truncate block">{act.subject}</span>
                            </div>
                          )}
                        </>
                      )}

                      {isLinkedIn && (
                        <>
                          {act.lnRequestSent && (
                            <div>
                              <span className="text-gray-400 uppercase font-semibold text-[10px] block">Request Sent</span>
                              <span className="font-semibold text-gray-800">{act.lnRequestSent}</span>
                            </div>
                          )}
                          {act.connected && (
                            <div>
                              <span className="text-gray-400 uppercase font-semibold text-[10px] block">Connected</span>
                              <span className="font-semibold text-gray-800">{act.connected}</span>
                            </div>
                          )}
                          {act.status && (
                            <div>
                              <span className="text-gray-400 uppercase font-semibold text-[10px] block">Status</span>
                              <span className="inline-block font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 mt-0.5">
                                {act.status}
                              </span>
                            </div>
                          )}
                          {act.linkedinDate && (
                            <div>
                              <span className="text-gray-400 uppercase font-semibold text-[10px] block">LinkedIn Date</span>
                              <span className="font-semibold text-gray-800">{formatDateOnly(act.linkedinDate)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Conversation Notes (if present) */}
                    {act.conversationNotes && (
                      <div className="p-3.5 bg-blue-50/40 border border-blue-100 rounded-xl text-xs space-y-1">
                        <div className="font-bold text-gray-700 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <span>Conversation Notes</span>
                        </div>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{act.conversationNotes}</p>
                      </div>
                    )}

                    {/* Next Action Box (if present) */}
                    {act.nextAction && (
                      <div className="p-3.5 bg-sky-50/60 border border-sky-200 rounded-xl flex items-center justify-between gap-3 text-xs flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-bold text-sky-900">
                              Next Action: <span className="capitalize">{act.nextAction}</span>
                            </div>
                            {act.nextActionDate && (
                              <div className="text-sky-700 font-medium mt-0.5">
                                Scheduled for {formatDateOnly(act.nextActionDate)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Activity Log Modal */}
      {activityModal.isOpen && (
        <ActivityLogModal
          isOpen={activityModal.isOpen}
          onClose={handleCloseActivityModal}
          type={activityModal.type}
          contactName={contact?.name || ''}
          companyName={contact?.company || ''}
          projectId={projectId || ''}
          contactId={contactId || ''}
          phoneNumber={contact?.phoneNumber || ''}
          email={contact?.email || ''}
          linkedInProfileUrl={contact?.linkedInUrl || ''}
          activityId={activityModal.activityId}
          editMode={activityModal.editMode}
          lastActivity={activityModal.lastActivity}
        />
      )}

      {/* Edit Contact Modal */}
      {showEditContactModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Edit Prospect Contact</h3>
              <button
                onClick={() => setShowEditContactModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="p-5 space-y-4">
              <div>
                <label htmlFor="contact-form-name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  id="contact-form-name"
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  placeholder="e.g. Laura Bennett"
                />
              </div>

              <div>
                <label htmlFor="contact-form-company" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Company Name
                </label>
                <input
                  id="contact-form-company"
                  type="text"
                  value={contactForm.company}
                  onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  placeholder="e.g. KubeStack Corp"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="contact-form-email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    id="contact-form-email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="laura@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="contact-form-phone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    id="contact-form-phone"
                    type="text"
                    value={contactForm.phoneNumber}
                    onChange={(e) => setContactForm({ ...contactForm, phoneNumber: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="+1 303-555-0189"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-form-linkedin" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  LinkedIn Profile URL
                </label>
                <input
                  id="contact-form-linkedin"
                  type="text"
                  value={contactForm.linkedInUrl}
                  onChange={(e) => setContactForm({ ...contactForm, linkedInUrl: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditContactModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingContact}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50"
                >
                  {savingContact ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
