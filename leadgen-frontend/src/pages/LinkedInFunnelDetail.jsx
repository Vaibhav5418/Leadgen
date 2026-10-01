import { useParams, useNavigate } from 'react-router-dom';
import FunnelLayout from '../components/funnels/FunnelLayout';
import useFunnelResources from '../hooks/useFunnelResources';
import useFunnelData from '../hooks/useFunnelData';
import { FUNNEL_CONFIG } from '../config/funnelConfig';

export default function LinkedInFunnelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { project, contacts, activities, loading } = useFunnelResources(id, 'linkedin');
  const funnelData = useFunnelData('linkedin', contacts, activities);

  const funnelRows = FUNNEL_CONFIG.linkedin;

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
