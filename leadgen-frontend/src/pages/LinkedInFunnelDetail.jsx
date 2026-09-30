import { useParams, useNavigate } from 'react-router-dom';
import FunnelLayout from '../components/funnels/FunnelLayout';
import useFunnelResources from '../hooks/useFunnelResources';
import useFunnelData from '../hooks/useFunnelData';

export default function LinkedInFunnelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { project, contacts, activities, loading } = useFunnelResources(id, 'linkedin');
  const funnelData = useFunnelData('linkedin', contacts, activities);

  const funnelRows = [
    { key: 'prospectData', label: 'Prospect Data', description: 'Total prospects from this project' },
    { key: 'connectionSent', label: 'Connection Sent', description: 'Connection requests sent' },
    { key: 'accepted', label: 'Accepted', description: 'Connections accepted' },
    { key: 'followups', label: 'Followups', description: 'Contacts with multiple messages' },
    { key: 'cip', label: 'CIP', description: 'Conversations in Progress' },
    { key: 'meetingProposed', label: 'Meeting Proposed', description: 'Meetings proposed' },
    { key: 'scheduled', label: 'Scheduled', description: 'Meetings scheduled' },
    { key: 'completed', label: 'Completed', description: 'Meetings completed' },
    { key: 'sql', label: 'SQL', description: 'Sales Qualified Leads' }
  ];

  return (
    <FunnelLayout 
      loading={loading}
      title="LinkedIn Funnel"
      project={project}
      navigate={navigate}
      id={id}
      funnelData={funnelData}
      funnelRows={funnelRows}
    />
  );
}
