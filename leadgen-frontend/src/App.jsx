import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Projects from './pages/Projects';
import CreateProject from './pages/CreateProject';
import ProjectDetail from './pages/ProjectDetail';
import ProjectDashboard from './pages/ProjectDashboard';
import ProspectDashboard from './pages/ProspectDashboard';
import MasterDashboard from './pages/MasterDashboard';
import EmployeePerformance from './pages/EmployeePerformance';
import AdminPanel from './pages/AdminPanel';
import AdminRoute from './components/AdminRoute';
import Report from './pages/Report';
import LinkedInReport from './pages/LinkedInReport';
import ColdCallingReport from './pages/ColdCallingReport';
import EmailReport from './pages/EmailReport';
import MonthlyReport from './pages/MonthlyReport';
import FunnelProjects from './pages/FunnelProjects';
import LinkedInFunnelDetail from './pages/LinkedInFunnelDetail';
import ColdCallingFunnelDetail from './pages/ColdCallingFunnelDetail';
import EmailFunnelDetail from './pages/EmailFunnelDetail';

// Private Route Component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root path - Login page (will redirect to master dashboard if already logged in) */}
        <Route path="/" element={<Login />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route element={<Layout />}>
          {/* Redirect legacy /dashboard to /master-dashboard */}
          <Route
            path="/dashboard"
            element={<Navigate to="/master-dashboard" replace />}
          />

          <Route
            path="/master-dashboard"
            element={
              <PrivateRoute>
                <MasterDashboard />
              </PrivateRoute>
            }
          />

          {/* Admin Panel (Admin-Only Guarded Route) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />

          <Route
            path="/employee-performance"
            element={
              <PrivateRoute>
                <EmployeePerformance />
              </PrivateRoute>
            }
          />

          <Route
            path="/projects"
            element={
              <PrivateRoute>
                <Projects />
              </PrivateRoute>
            }
          />

          <Route
            path="/projects/dashboard"
            element={
              <PrivateRoute>
                <ProjectDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/prospects/dashboard"
            element={
              <PrivateRoute>
                <ProspectDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/projects/new"
            element={
              <PrivateRoute>
                <CreateProject />
              </PrivateRoute>
            }
          />

          <Route
            path="/projects/:id/edit"
            element={
              <PrivateRoute>
                <CreateProject />
              </PrivateRoute>
            }
          />

          <Route
            path="/projects/:id"
            element={
              <PrivateRoute>
                <ProjectDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="/projects/:id/funnel"
            element={
              <PrivateRoute>
                <Report />
              </PrivateRoute>
            }
          />

          <Route
            path="/projects/:id/linkedin-funnel"
            element={
              <PrivateRoute>
                <LinkedInReport />
              </PrivateRoute>
            }
          />

          <Route
            path="/projects/:id/cold-calling-funnel"
            element={
              <PrivateRoute>
                <ColdCallingReport />
              </PrivateRoute>
            }
          />

          <Route
            path="/projects/:id/email-funnel"
            element={
              <PrivateRoute>
                <EmailReport />
              </PrivateRoute>
            }
          />

          <Route
            path="/projects/:id/report"
            element={
              <PrivateRoute>
                <MonthlyReport />
              </PrivateRoute>
            }
          />

          <Route
            path="/funnel"
            element={
              <PrivateRoute>
                <FunnelProjects />
              </PrivateRoute>
            }
          />

          <Route
            path="/funnel/:id/linkedin"
            element={
              <PrivateRoute>
                <LinkedInFunnelDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="/funnel/:id/cold-calling"
            element={
              <PrivateRoute>
                <ColdCallingFunnelDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="/funnel/:id/email"
            element={
              <PrivateRoute>
                <EmailFunnelDetail />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
