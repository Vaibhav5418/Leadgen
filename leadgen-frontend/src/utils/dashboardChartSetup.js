import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import { lazy } from 'react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export const Line = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));
export const Bar = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Bar })));
export const Doughnut = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Doughnut })));
export const Pie = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Pie })));
