import { useEffect, useState } from 'react';
import { calculateFunnelData, createInitialFunnelData } from '../utils/funnelCalculations';

export default function useFunnelData(channel, contacts, activities) {
  const [funnelData, setFunnelData] = useState(() => createInitialFunnelData(channel));

  useEffect(() => {
    if (contacts.length > 0 || activities.length > 0) {
      setFunnelData(calculateFunnelData({ channel, contacts, activities }));
    }
  }, [channel, contacts, activities]);

  return funnelData;
}
