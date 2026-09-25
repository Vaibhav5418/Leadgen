import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import FunnelLayout from '../components/funnels/FunnelLayout';

// Version: 2.0 - Updated funnel stages (10 stages)
export default function ColdCallingFunnelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState({
    prospectData: 0,
    callsAttempted: 0,
    callsConnected: 0,
    decisionMakerReached: 0,
    interested: 0,
    detailsShared: 0,
    demoBooked: 0,
    demoCompleted: 0,
    sql: 0,
    won: 0
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (id && (contacts.length > 0 || activities.length > 0)) {
      calculateFunnelData();
    } else if (id && contacts.length === 0 && activities.length === 0) {
      // Initialize with zero values if no data
      setFunnelData({
        prospectData: 0,
        callsAttempted: 0,
        callsConnected: 0,
        decisionMakerReached: 0,
        interested: 0,
        detailsShared: 0,
        demoBooked: 0,
        demoCompleted: 0,
        sql: 0,
        won: 0
      });
    }
  }, [id, contacts, activities]);

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

      // Fetch all call activities for the project
      const activitiesResponse = await API.get(`/activities/project/${id}?limit=10000`);
      if (activitiesResponse.data.success) {
        const allActivities = activitiesResponse.data.data || [];
        const callActivities = allActivities.filter(a => a.type === 'call');
        setActivities(callActivities);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateFunnelData = () => {
    console.log('Calculating funnel data...', { contactsCount: contacts.length, activitiesCount: activities.length });
    
    const data = {
      prospectData: contacts.length, // Total prospects from project
      callsAttempted: 0,
      callsConnected: 0,
      decisionMakerReached: 0,
      interested: 0,
      detailsShared: 0,
      demoBooked: 0,
      demoCompleted: 0,
      sql: 0,
      won: 0
    };

    if (activities.length === 0) {
      console.log('No activities found, setting default data');
      setFunnelData(data);
      return;
    }

    // Calculate metrics using Sets to track unique contacts at each stage
    const callsAttemptedSet = new Set();
    const callsConnectedSet = new Set();
    const decisionMakerReachedSet = new Set();
    const interestedSet = new Set();
    const detailsSharedSet = new Set();
    const demoBookedSet = new Set();
    const demoCompletedSet = new Set();
    const sqlSet = new Set();
    const wonSet = new Set();

    activities.forEach(activity => {
      const contactId = activity.contactId?.toString();
      if (!contactId) return;

      // Calls Attempted - if callDate exists, it means a call was attempted
      if (activity.callDate) {
        callsAttemptedSet.add(contactId);
      }

      // Calls Connected - if callStatus indicates a connection (not Ring, Busy, Hang Up, Switch Off, Invalid)
      const connectedStatuses = ['Interested', 'Not Interested', 'Call Back', 'Future', 'Details Shared', 'Demo Booked', 'Demo Completed', 'Existing'];
      if (activity.callStatus && connectedStatuses.includes(activity.callStatus)) {
        callsConnectedSet.add(contactId);
      }

      // Decision Maker Reached - if callStatus indicates decision maker engagement
      const decisionMakerStatuses = ['Interested', 'Details Shared', 'Demo Booked', 'Demo Completed'];
      if (activity.callStatus && decisionMakerStatuses.includes(activity.callStatus)) {
        decisionMakerReachedSet.add(contactId);
      }

      // Interested - if callStatus is 'Interested'
      if (activity.callStatus === 'Interested') {
        interestedSet.add(contactId);
      }

      // Details Shared - if callStatus is 'Details Shared'
      if (activity.callStatus === 'Details Shared') {
        detailsSharedSet.add(contactId);
      }

      // Demo Booked - if callStatus is 'Demo Booked'
      if (activity.callStatus === 'Demo Booked') {
        demoBookedSet.add(contactId);
      }

      // Demo Completed - if callStatus is 'Demo Completed'
      if (activity.callStatus === 'Demo Completed') {
        demoCompletedSet.add(contactId);
      }

      // SQL (Sales Qualified Lead) - if callStatus is 'Demo Completed' or 'Interested' with high engagement
      if (activity.callStatus === 'Demo Completed' || 
          (activity.callStatus === 'Interested' && activity.conversationNotes && activity.conversationNotes.length > 50) ||
          activity.status === 'SQL') {
        sqlSet.add(contactId);
      }

      // WON - if status is 'WON'
      if (activity.status === 'WON') {
        wonSet.add(contactId);
      }
    });

    // Set final counts
    data.callsAttempted = callsAttemptedSet.size;
    data.callsConnected = callsConnectedSet.size;
    data.decisionMakerReached = decisionMakerReachedSet.size;
    data.interested = interestedSet.size;
    data.detailsShared = detailsSharedSet.size;
    data.demoBooked = demoBookedSet.size;
    data.demoCompleted = demoCompletedSet.size;
    data.sql = sqlSet.size;
    data.won = wonSet.size;

    console.log('Funnel data calculated:', data);
    console.log('Stage breakdown:', {
      callsAttempted: data.callsAttempted,
      callsConnected: data.callsConnected,
      decisionMakerReached: data.decisionMakerReached,
      interested: data.interested,
      detailsShared: data.detailsShared,
      demoBooked: data.demoBooked,
      demoCompleted: data.demoCompleted,
      sql: data.sql,
      won: data.won
    });
    setFunnelData(data);
  };

  // Updated 10-stage funnel configuration
  const funnelRows = [
    { key: 'prospectData', label: 'Prospect Data', description: 'Total prospects from this project' },
    { key: 'callsAttempted', label: 'Calls Attempted', description: 'Total calls made to prospects' },
    { key: 'callsConnected', label: 'Calls Connected', description: 'Calls where contact answered' },
    { key: 'decisionMakerReached', label: 'Decision Maker Reached', description: 'Reached decision maker' },
    { key: 'interested', label: 'Interested', description: 'Prospects showing interest' },
    { key: 'detailsShared', label: 'Details Shared', description: 'Product/service details shared' },
    { key: 'demoBooked', label: 'Demo Booked', description: 'Demos scheduled' },
    { key: 'demoCompleted', label: 'Demo Completed', description: 'Demos successfully completed' },
    { key: 'sql', label: 'SQL', description: 'Sales Qualified Leads' },
    { key: 'won', label: 'WON', description: 'Deals closed successfully' }
  ];

  // Debug: Log funnel rows to verify they're correct
  useEffect(() => {
    console.log('Funnel rows configured:', funnelRows.length, 'stages');
    console.log('Stage labels:', funnelRows.map(r => r.label));
  }, []);

  return (
    <FunnelLayout 
      loading={loading}
      title="Cold Calling Funnel"
      project={project}
      navigate={navigate}
      id={id}
      funnelData={funnelData}
      funnelRows={funnelRows}
    />
  );
}