import { useParams, useNavigate } from 'react-router-dom';
import FunnelLayout from '../components/funnels/FunnelLayout';
import useFunnelResources from '../hooks/useFunnelResources';
import useFunnelData from '../hooks/useFunnelData';
import { FUNNEL_CONFIG } from '../config/funnelConfig';

export default function EmailFunnelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { project, contacts, activities, loading } = useFunnelResources(id, 'email');
  const funnelData = useFunnelData('email', contacts, activities);

  const funnelRows = FUNNEL_CONFIG.email;

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
