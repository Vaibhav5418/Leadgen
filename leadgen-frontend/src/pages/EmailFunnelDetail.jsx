import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FunnelLayout from '../components/funnels/FunnelLayout';
import useFunnelResources from '../hooks/useFunnelResources';

export default function EmailFunnelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { project, contacts, activities, loading } = useFunnelResources(id, 'email');
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

  useEffect(() => {
    if (contacts.length > 0 || activities.length > 0) calculateFunnelData();
  }, [contacts, activities]);

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

  return (
    <FunnelLayout 
      loading={loading}
      title="Email Funnel"
      project={project}
      navigate={navigate}
      id={id}
      funnelData={funnelData}
      funnelRows={funnelRows}
    />
  );
}
