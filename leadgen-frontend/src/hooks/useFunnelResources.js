import { useCallback, useEffect, useState } from 'react';
import API from '../api/axios';

export default function useFunnelResources(id, activityType) {
  const [project, setProject] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectResponse, contactsResponse, activitiesResponse] = await Promise.all([
        API.get(`/projects/${id}`),
        API.get(`/projects/${id}/project-contacts`),
        API.get(`/activities/project/${id}?limit=10000`)
      ]);

      if (projectResponse.data.success) setProject(projectResponse.data.data);
      if (contactsResponse.data.success) setContacts(contactsResponse.data.data || []);
      if (activitiesResponse.data.success) {
        const allActivities = activitiesResponse.data.data || [];
        setActivities(allActivities.filter(activity => activity.type === activityType));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [id, activityType]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  return { project, contacts, activities, loading, fetchData };
}
