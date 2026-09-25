import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import FunnelStageCard from '../components/FunnelStageCard';

export default function EmailFunnelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState({
    prospectData: 0,
    emailSent: 0,
    accepted: 0,
    followups: 0,
    cip: 0,
    meetingProposed: 0,
    scheduled: 0,
    completed: 0,
    sql: 0
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (contacts.length > 0 || activities.length > 0) {
      calculateFunnelData();
    }
  }, [contacts, activities]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch project details
      const projectResponse = await API.get(`/projects/${id}`);
      if (projectResponse.data.success) {
        setProject(projectResponse.data.data);
      }

      // Fetch project contacts
      const contactsResponse = await API.get(`/projects/${id}/project-contacts`);
      if (contactsResponse.data.success) {
        setContacts(contactsResponse.data.data || []);
      }

      // Fetch all email activities for the project
      const activitiesResponse = await API.get(`/activities/project/${id}?limit=10000`);
      if (activitiesResponse.data.success) {
        const allActivities = activitiesResponse.data.data || [];
        const emailActivities = allActivities.filter(a => a.type === 'email');
        setActivities(emailActivities);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateFunnelData = () => {
    const data = {
      prospectData: contacts.length, // Total prospects from project
      emailSent: 0,
      accepted: 0,
      followups: 0,
      cip: 0,
      meetingProposed: 0,
      scheduled: 0,
      completed: 0,
      sql: 0
    };

    // Group activities by contact
    const contactActivities = {};
    activities.forEach(activity => {
      if (!activity.contactId) return;
      const contactId = activity.contactId.toString();
      if (!contactActivities[contactId]) {
        contactActivities[contactId] = [];
      }
      contactActivities[contactId].push(activity);
    });

    // Calculate metrics
    const emailSentSet = new Set();
    const acceptedSet = new Set();
    const cipSet = new Set();
    const meetingProposedSet = new Set();
    const scheduledSet = new Set();
    const completedSet = new Set();
    const sqlSet = new Set();

    activities.forEach(activity => {
      const contactId = activity.contactId?.toString();
      if (!contactId) return;

      // Email Sent - if emailDate exists, it means an email was sent
      if (activity.emailDate) {
        emailSentSet.add(contactId);
      }

      // Accepted - if status is 'Interested' or 'Meeting Proposed' or 'Meeting Scheduled'
      if (activity.status === 'Interested' || 
          activity.status === 'Meeting Proposed' || 
          activity.status === 'Meeting Scheduled') {
        acceptedSet.add(contactId);
      }

      // Conversations in Progress (CIP) - if status indicates ongoing conversation
      if (activity.status === 'Interested' || activity.status === 'Out of Office') {
        cipSet.add(contactId);
      }

      // Meeting Proposed - if status is 'Meeting Proposed'
      if (activity.status === 'Meeting Proposed') {
        meetingProposedSet.add(contactId);
      }

      // Meeting Scheduled - if status is 'Meeting Scheduled' or nextActionDate is set
      if (activity.status === 'Meeting Scheduled' || activity.nextActionDate) {
        scheduledSet.add(contactId);
      }

      // Meeting Completed - if status is 'Meeting Completed'
      if (activity.status === 'Meeting Completed') {
        completedSet.add(contactId);
      }

      // SQL (Sales Qualified Lead) - if status is 'Meeting Completed' or 'Interested' with high engagement
      if (activity.status === 'Meeting Completed' || 
          (activity.status === 'Interested' && activity.conversationNotes && activity.conversationNotes.length > 50)) {
        sqlSet.add(contactId);
      }
    });

    // Calculate followups (contacts with more than one email)
    Object.keys(contactActivities).forEach(contactId => {
      const contactActs = contactActivities[contactId];
      const emailsWithNotes = contactActs.filter(a => a.conversationNotes && a.conversationNotes.trim() !== '');
      if (emailsWithNotes.length > 1 || contactActs.length > 1) {
        data.followups++;
      }
    });

    data.emailSent = emailSentSet.size;
    data.accepted = acceptedSet.size;
    data.cip = cipSet.size;
    data.meetingProposed = meetingProposedSet.size;
    data.scheduled = scheduledSet.size;
    data.completed = completedSet.size;
    data.sql = sqlSet.size;

    setFunnelData(data);
  };

  const funnelRows = [
    { key: 'prospectData', label: 'Prospect Data', description: 'Total prospects from this project' },
    { key: 'emailSent', label: 'Email Sent', description: 'Emails sent to prospects' },
    { key: 'accepted', label: 'Accepted', description: 'Emails accepted/responded' },
    { key: 'followups', label: 'Followups', description: 'Contacts with multiple emails' },
    { key: 'cip', label: 'CIP', description: 'Conversations in Progress' },
    { key: 'meetingProposed', label: 'Meeting Proposed', description: 'Meetings proposed' },
    { key: 'scheduled', label: 'Scheduled', description: 'Meetings scheduled' },
    { key: 'completed', label: 'Completed', description: 'Meetings completed' },
    { key: 'sql', label: 'SQL', description: 'Sales Qualified Leads' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading funnel data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-4">
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={() => navigate(`/projects/${id}`)}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200 mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Prospect Management
          </button>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                Email Funnel - {project?.companyName || 'Project'}
              </h1>
            </div>
            {project?.website && (
              <a 
                href={project.website.startsWith('http') ? project.website : `http://${project.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {project.website}
              </a>
            )}
          </div>
        </div>

        {/* Enterprise Funnel Visualization - Compact */}
        <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200 rounded-lg shadow-lg p-4 backdrop-blur-sm">
          <div className="mb-3 text-center">
            <h2 className="text-base font-bold text-gray-800 mb-0.5">Sales Funnel Performance</h2>
            <p className="text-[10px] text-gray-600">Conversion metrics and pipeline health</p>
          </div>
          
          <div className="flex flex-col items-center space-y-0.5">
            {funnelRows.map((row, index) => {
              const value = funnelData[row.key] || 0;
              const maxValue = funnelData.prospectData || 1;
              const percentage = maxValue > 0 ? ((value / maxValue) * 100) : 0;
              
              // Calculate width based on funnel position (wider at top, narrower at bottom)
              const funnelWidths = [96, 88, 78, 68, 58, 48, 38, 28, 20]; // Progressive narrowing
              const actualWidth = funnelWidths[index] || 15;
              
              // Enterprise color scheme based on stage
              let bgGradient = '';
              let textColor = 'text-white';
              let borderColor = '';
              let shadowColor = '';
              let iconBg = '';
              
              if (index === 0) {
                bgGradient = 'from-blue-600 via-blue-500 to-cyan-500';
                borderColor = 'border-blue-400';
                shadowColor = 'shadow-blue-500/30';
                iconBg = 'bg-blue-400/30';
              } else if (index >= 5) {
                bgGradient = 'from-cyan-600 via-cyan-500 to-teal-500';
                borderColor = 'border-cyan-400';
                shadowColor = 'shadow-cyan-500/30';
                iconBg = 'bg-cyan-400/30';
              } else {
                bgGradient = 'from-slate-600 via-slate-500 to-gray-500';
                borderColor = 'border-slate-400';
                shadowColor = 'shadow-slate-500/30';
                iconBg = 'bg-slate-400/30';
              }
              
              // Icons for each stage
              const icons = [
                '👥', '📧', '✅', '🔄', '💬', '📅', '📆', '✓', '🎯'
              ];
              
              return (
                <FunnelStageCard
                  key={row.key}
                  row={row}
                  index={index}
                  actualWidth={actualWidth}
                  bgGradient={bgGradient}
                  borderColor={borderColor}
                  shadowColor={shadowColor}
                  iconBg={iconBg}
                  textColor={textColor}
                  icon={icons[index]}
                  value={value}
                  maxValue={maxValue}
                  percentage={percentage}
                  isLast={index === funnelRows.length - 1}
                />
              );
            })}
          </div>
        </div>
        
        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes progressFill {
            from {
              width: 0%;
            }
          }
          
          .shadow-3xl {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          }
        `}</style>

        {/* Enterprise Summary Cards - Compact */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="group relative bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-xl p-4 shadow-xl hover:shadow-blue-500/30 transition-all duration-500 transform hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-white/90 uppercase tracking-wider">Total Prospects</div>
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span className="text-base">👥</span>
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white mb-0.5 drop-shadow-lg">{funnelData.prospectData.toLocaleString()}</div>
              <div className="text-[10px] text-white/80 font-medium">Pipeline foundation</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30"></div>
          </div>
          
          <div className="group relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 rounded-xl p-4 shadow-xl hover:shadow-emerald-500/30 transition-all duration-500 transform hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-white/90 uppercase tracking-wider">Conversion Rate</div>
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span className="text-base">📈</span>
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white mb-0.5 drop-shadow-lg">
                {funnelData.prospectData > 0 
                  ? ((funnelData.completed / funnelData.prospectData) * 100).toFixed(1) 
                  : 0}%
              </div>
              <div className="text-[10px] text-white/80 font-medium">Meetings completed</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30"></div>
          </div>
          
          <div className="group relative bg-gradient-to-br from-cyan-600 via-cyan-500 to-teal-500 rounded-xl p-4 shadow-xl hover:shadow-cyan-500/30 transition-all duration-500 transform hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-white/90 uppercase tracking-wider">SQL Rate</div>
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span className="text-base">🎯</span>
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white mb-0.5 drop-shadow-lg">
                {funnelData.prospectData > 0 
                  ? ((funnelData.sql / funnelData.prospectData) * 100).toFixed(1) 
                  : 0}%
              </div>
              <div className="text-[10px] text-white/80 font-medium">Sales qualified leads</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
