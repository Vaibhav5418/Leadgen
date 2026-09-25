import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function useReportData(projectId, activityType) {
  const [project, setProject] = useState(null);
  const [activities, setActivities] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [viewMode, setViewMode] = useState(activityType === 'call' || activityType === 'all' ? 'day' : 'month');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const projectResponse = await API.get(`/projects/${projectId}`);
      if (projectResponse.data.success) {
        setProject(projectResponse.data.data);
      }

      const activitiesResponse = await API.get(`/activities/project/${projectId}?limit=10000`);
      if (activitiesResponse.data.success) {
        const allActivities = activitiesResponse.data.data || [];
        if (activityType === 'all') {
          setActivities(allActivities);
        } else {
          setActivities(allActivities.filter(a => a.type === activityType));
        }
      }

      const contactsResponse = await API.get(`/projects/${projectId}/project-contacts`);
      if (contactsResponse.data.success) {
        setContacts(contactsResponse.data.data || []);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  useEffect(() => {
    const handleFocus = () => {
      if (projectId && !loading) {
        fetchData();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [projectId, loading]);

  const getActivityDate = (activity) => {
    if (activityType === 'call' && activity.callDate) return new Date(activity.callDate);
    if (activityType === 'email' && activity.emailDate) return new Date(activity.emailDate);
    if (activityType === 'linkedin' && activity.linkedinDate) return new Date(activity.linkedinDate);
    if (activityType === 'all') {
        if (activity.type === 'call' && activity.callDate) return new Date(activity.callDate);
        if (activity.type === 'email' && activity.emailDate) return new Date(activity.emailDate);
        if (activity.type === 'linkedin' && activity.linkedinDate) return new Date(activity.linkedinDate);
    }
    return new Date(activity.createdAt);
  };

  const getDayKey = (date) => {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear().toString().slice(-2);
    return `${day} ${month} '${year}`;
  };

  const getMonthKey = (date) => {
    const d = new Date(date);
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear().toString().slice(-2);
    return `${month} '${year}`;
  };

  const getYearKey = (date) => {
    const d = new Date(date);
    return d.getFullYear().toString();
  };

  const getDays = () => {
    const days = new Set();
    
    activities.forEach(activity => {
      const date = getActivityDate(activity);
      if (date && !Number.isNaN(date.getTime())) {
        days.add(getDayKey(date));
      }
    });

    contacts.forEach(contact => {
      if (contact.createdAt) {
        days.add(getDayKey(new Date(contact.createdAt)));
      }
    });

    return Array.from(days).sort((a, b) => {
      const dateA = new Date(a.replace(/^(\d{1,2})\s+([A-Za-z]{3})\s+'(\d{2})$/, '$2 $1, 20$3'));
      const dateB = new Date(b.replace(/^(\d{1,2})\s+([A-Za-z]{3})\s+'(\d{2})$/, '$2 $1, 20$3'));
      return dateA - dateB;
    });
  };

  const getMonths = () => {
    const months = new Set();
    
    activities.forEach(activity => {
      const date = getActivityDate(activity);
      if (date && !Number.isNaN(date.getTime())) {
        months.add(getMonthKey(date));
      }
    });

    contacts.forEach(contact => {
      if (contact.createdAt) {
        months.add(getMonthKey(new Date(contact.createdAt)));
      }
    });

    return Array.from(months).sort((a, b) => {
      const [monthA, yearA] = a.split(" '");
      const [monthB, yearB] = b.split(" '");
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
      return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
    });
  };

  const getYears = () => {
    const years = new Set();
    
    activities.forEach(activity => {
      const date = getActivityDate(activity);
      if (date && !Number.isNaN(date.getTime())) {
        years.add(getYearKey(date));
      }
    });

    contacts.forEach(contact => {
      if (contact.createdAt) {
        years.add(getYearKey(new Date(contact.createdAt)));
      }
    });

    return Array.from(years).sort();
  };

  return {
    project,
    activities,
    contacts,
    loading,
    lastUpdated,
    viewMode,
    setViewMode,
    getDayKey,
    getMonthKey,
    getYearKey,
    getDays,
    getMonths,
    getYears,
    fetchData
  };
}
