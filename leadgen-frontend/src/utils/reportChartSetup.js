import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { standardChartOptions } from './chartOptions';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export const barChartOptions = {
  ...standardChartOptions,
  scales: {
    ...standardChartOptions.scales,
    x: { ...standardChartOptions.scales.x, stacked: true },
    y: { ...standardChartOptions.scales.y, stacked: true }
  }
};
