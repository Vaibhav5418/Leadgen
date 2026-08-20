import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

export default function AdminPanel() {
  // Current logged in admin
  const currentAdmin = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  // Navigation tabs: 'overview' | 'employees' | 'projects' | 'roles' | 'audit'
  const [activeTab, setActiveTab] = useState('overview');

  // Global loading and error states
  const [loadingStats, setLoadingStats] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [toast, setToast] = useState(null);

  // Employee state
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState('');
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState('');
  const [employeePage, setEmployeePage] = useState(1);
  const [employeePagination, setEmployeePagination] = useState({ total: 0, totalPages: 1 });

  // Projects state
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('');
  const [projectPage, setProjectPage] = useState(1);
  const [projectPagination, setProjectPagination] = useState({ total: 0, totalPages: 1 });

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditPagination, setAuditPagination] = useState({ total: 0, totalPages: 1 });

  // Modals state
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState('employee');
  const [updatingRole, setUpdatingRole] = useState(false);

  const [assignProjectsUser, setAssignProjectsUser] = useState(null);
  const [allAvailableProjects, setAllAvailableProjects] = useState([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [savingProjectAssignments, setSavingProjectAssignments] = useState(false);

  const [projectMembersModal, setProjectMembersModal] = useState(null);
  const [allAvailableEmployees, setAllAvailableEmployees] = useState([]);
  const [selectedEmployeeEmails, setSelectedEmployeeEmails] = useState([]);
  const [savingProjectMembers, setSavingProjectMembers] = useState(false);

  const [accessDetailsUser, setAccessDetailsUser] = useState(null);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState(null);

  // Show auto-dismissing toast
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Fetch dashboard summary
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await API.get('/admin/dashboard');
      if (res.data?.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard stats:', err);
      showToast(err.response?.data?.error || 'Failed to load dashboard overview', 'error');
    } finally {
      setLoadingStats(false);
    }
  }, [showToast]);

  // Fetch employees list
  const fetchEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      const params = {
        search: employeeSearch,
        role: employeeRoleFilter,
        status: employeeStatusFilter,
        page: employeePage,
        limit: 25
      };
      const res = await API.get('/admin/employees', { params });
      if (res.data?.success) {
        setEmployees(res.data.data.employees || []);
        setEmployeePagination(res.data.data.pagination || { total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      showToast(err.response?.data?.error || 'Failed to load employees', 'error');
    } finally {
      setLoadingEmployees(false);
    }
  }, [employeeSearch, employeeRoleFilter, employeeStatusFilter, employeePage, showToast]);

  // Fetch projects list
  const fetchProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const params = {
        search: projectSearch,
        status: projectStatusFilter,
        page: projectPage,
        limit: 25
      };
      const res = await API.get('/admin/projects', { params });
      if (res.data?.success) {
        setProjects(res.data.data.projects || []);
        setProjectPagination(res.data.data.pagination || { total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch admin projects:', err);
      showToast(err.response?.data?.error || 'Failed to load projects access list', 'error');
    } finally {
      setLoadingProjects(false);
    }
  }, [projectSearch, projectStatusFilter, projectPage, showToast]);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoadingAuditLogs(true);
      const params = {
        search: auditSearch,
        action: auditActionFilter,
        page: auditPage,
        limit: 30
      };
      const res = await API.get('/admin/audit-logs', { params });
      if (res.data?.success) {
        setAuditLogs(res.data.data.logs || []);
        setAuditPagination(res.data.data.pagination || { total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      showToast(err.response?.data?.error || 'Failed to load audit trail', 'error');
    } finally {
      setLoadingAuditLogs(false);
    }
  }, [auditSearch, auditActionFilter, auditPage, showToast]);

  // Initial load
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Tab-dependent load
  useEffect(() => {
    if (activeTab === 'employees') {
      fetchEmployees();
    } else if (activeTab === 'projects') {
      fetchProjects();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, fetchEmployees, fetchProjects, fetchAuditLogs]);

  // Helper to open Role Update Modal
  const handleOpenRoleModal = (user) => {
    setRoleModalUser(user);
    setSelectedNewRole(user.role || 'employee');
  };

  // Submit role update
  const handleSaveRole = async () => {
    if (!roleModalUser) return;
    try {
      setUpdatingRole(true);
      const res = await API.put(`/admin/employees/${roleModalUser._id}/role`, {
        role: selectedNewRole
      });
      if (res.data?.success) {
        showToast(res.data.message || 'Role updated successfully', 'success');
        setRoleModalUser(null);
        fetchEmployees();
        fetchDashboardStats();
      }
    } catch (err) {
      console.error('Failed to update role:', err);
      showToast(err.response?.data?.error || 'Failed to update role', 'error');
    } finally {
      setUpdatingRole(false);
    }
  };

  // Helper to open Assign Projects Modal for an employee
  const handleOpenAssignProjects = async (user) => {
    try {
      setAssignProjectsUser(user);
      const currentIds = (user.assignedProjects || []).map((p) => p._id);
      setSelectedProjectIds(currentIds);

      const res = await API.get('/admin/projects?limit=100');
      if (res.data?.success) {
        setAllAvailableProjects(res.data.data.projects || []);
      }
    } catch (err) {
      console.error('Failed to prepare project assignment modal:', err);
      showToast('Failed to load project catalog', 'error');
    }
  };

  // Submit project assignments for an employee
  const handleSaveProjectAssignments = async () => {
    if (!assignProjectsUser) return;
    try {
      setSavingProjectAssignments(true);
      const res = await API.post(`/admin/employees/${assignProjectsUser._id}/assign-projects`, {
        projectIds: selectedProjectIds
      });
      if (res.data?.success) {
        showToast(res.data.message || 'Project assignments updated', 'success');
        setAssignProjectsUser(null);
        fetchEmployees();
        fetchDashboardStats();
      }
    } catch (err) {
      console.error('Failed to assign projects:', err);
      showToast(err.response?.data?.error || 'Failed to assign projects', 'error');
    } finally {
      setSavingProjectAssignments(false);
    }
  };

  // Helper to open Assign Members Modal for a project
  const handleOpenProjectMembersModal = async (project) => {
    try {
      setProjectMembersModal(project);
      const currentEmails = project.teamMemberEmails || [];
      setSelectedEmployeeEmails(currentEmails);

      const res = await API.get('/admin/employees?limit=100');
      if (res.data?.success) {
        setAllAvailableEmployees(res.data.data.employees || []);
      }
    } catch (err) {
      console.error('Failed to prepare employee list for project modal:', err);
      showToast('Failed to load employee list', 'error');
    }
  };

  // Save members to a project
  const handleSaveProjectMembers = async () => {
    if (!projectMembersModal) return;
    try {
      setSavingProjectMembers(true);
      const res = await API.post(`/admin/projects/${projectMembersModal._id}/members`, {
        employeeEmails: selectedEmployeeEmails
      });
      if (res.data?.success) {
        showToast(res.data.message || 'Project team updated successfully', 'success');
        setProjectMembersModal(null);
        fetchProjects();
        fetchDashboardStats();
      }
    } catch (err) {
      console.error('Failed to assign members to project:', err);
      showToast(err.response?.data?.error || 'Failed to assign employees', 'error');
    } finally {
      setSavingProjectMembers(false);
    }
  };

  // Execute member removal from project
  const handleConfirmDeleteMember = async () => {
    if (!confirmDeleteMember) return;
    const { projectId, email } = confirmDeleteMember;
    try {
      const res = await API.delete(`/admin/projects/${projectId}/members/${encodeURIComponent(email)}`);
      if (res.data?.success) {
        showToast(res.data.message || 'Team member removed', 'success');
        setConfirmDeleteMember(null);
        fetchProjects();
        fetchDashboardStats();
      }
    } catch (err) {
      console.error('Failed to remove member from project:', err);
      showToast(err.response?.data?.error || 'Failed to remove employee', 'error');
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Time ago helper
  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Role Badge helper (unified design matching application theme)
  const renderRoleBadge = (role) => {
    const r = (role || 'employee').toLowerCase();
    if (r === 'admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
          Admin
        </span>
      );
    }
    if (r === 'manager') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          Manager
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
        Employee
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce transition-all">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
              toast.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Top Header Section (Matching Projects.jsx and MasterDashboard.jsx) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Admin Panel
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage user roles, project assignments, employee permissions, and system audit logs
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Quick Refresh Button */}
            <button
              onClick={() => {
                fetchDashboardStats();
                if (activeTab === 'employees') fetchEmployees();
                if (activeTab === 'projects') fetchProjects();
                if (activeTab === 'audit') fetchAuditLogs();
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition font-medium text-xs shadow-2xs"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>
        </div>

        {/* Global Summary KPI Cards (Consistent with Projects.jsx & EmployeePerformance.jsx) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Total Employees */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm p-5 sm:p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-white/80 border border-blue-100 flex items-center justify-center shadow-2xs">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-white/70 border border-blue-100 px-2.5 py-1 rounded-full shadow-2xs">
                Team Size
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 leading-tight">
              {loadingStats ? '...' : dashboardData?.stats?.totalEmployees || 0}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600 mt-1.5">
              <span>Total Employees</span>
              <span className="text-emerald-700 font-semibold">
                {dashboardData?.stats?.activeEmployees || 0} Active
              </span>
            </div>
          </div>

          {/* Total Projects */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 shadow-sm p-5 sm:p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-white/80 border border-purple-100 flex items-center justify-center shadow-2xs">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-purple-700 bg-white/70 border border-purple-100 px-2.5 py-1 rounded-full shadow-2xs">
                Portfolio
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 leading-tight">
              {loadingStats ? '...' : dashboardData?.stats?.totalProjects || 0}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600 mt-1.5">
              <span>Total Client Projects</span>
              <span className="text-emerald-700 font-semibold">
                {dashboardData?.stats?.activeProjects || 0} Active
              </span>
            </div>
          </div>

          {/* Role Breakdown Distribution */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 shadow-sm p-5 sm:p-6 transition-all hover:shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-white/80 border border-emerald-100 flex items-center justify-center shadow-2xs">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-white/70 border border-emerald-100 px-2.5 py-1 rounded-full shadow-2xs">
                Role Tiers
              </span>
            </div>
            
            <div className="pt-2">
              <div className="flex items-center gap-3 text-xs text-gray-700 font-medium">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-purple-700">
                    {dashboardData?.stats?.roleBreakdown?.admin || 0}
                  </span>
                  <span className="text-gray-600 text-xs">Admins</span>
                </div>
                <span className="text-gray-300 font-bold">•</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-blue-700">
                    {dashboardData?.stats?.roleBreakdown?.manager || 0}
                  </span>
                  <span className="text-gray-600 text-xs">Mgrs</span>
                </div>
                <span className="text-gray-300 font-bold">•</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-800">
                    {dashboardData?.stats?.roleBreakdown?.employee || 0}
                  </span>
                  <span className="text-gray-600 text-xs">Emps</span>
                </div>
              </div>
              <div className="w-full bg-white/80 h-2 rounded-full mt-3 flex overflow-hidden border border-emerald-100">
                <div
                  className="bg-purple-600 h-full"
                  style={{
                    width: `${
                      ((dashboardData?.stats?.roleBreakdown?.admin || 0) /
                        (dashboardData?.stats?.totalEmployees || 1)) *
                      100
                    }%`
                  }}
                  title="Admins"
                ></div>
                <div
                  className="bg-blue-600 h-full"
                  style={{
                    width: `${
                      ((dashboardData?.stats?.roleBreakdown?.manager || 0) /
                        (dashboardData?.stats?.totalEmployees || 1)) *
                      100
                    }%`
                  }}
                  title="Managers"
                ></div>
                <div
                  className="bg-gray-400 h-full"
                  style={{
                    width: `${
                      ((dashboardData?.stats?.roleBreakdown?.employee || 0) /
                        (dashboardData?.stats?.totalEmployees || 1)) *
                      100
                    }%`
                  }}
                  title="Employees"
                ></div>
              </div>
            </div>
          </div>

          {/* Project Assignments */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 shadow-sm p-5 sm:p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-white/80 border border-amber-100 flex items-center justify-center shadow-2xs">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-amber-700 bg-white/70 border border-amber-100 px-2.5 py-1 rounded-full shadow-2xs">
                Assignments
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 leading-tight">
              {loadingStats ? '...' : dashboardData?.stats?.totalAssignments || 0}
            </div>
            <div className="text-xs text-gray-600 mt-1.5">
              Active Employee-to-Project Allocations
            </div>
          </div>
        </div>

        {/* Global Navigation Tabs (Fully responsive & fits without scroll on PC/monitors) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-1.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-center ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="truncate">Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-center ${
              activeTab === 'employees'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="truncate">Employees</span>
            {dashboardData?.stats?.totalEmployees ? (
              <span
                className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold shrink-0 ${
                  activeTab === 'employees' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {dashboardData.stats.totalEmployees}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-center ${
              activeTab === 'projects'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="truncate">Project Access</span>
            {dashboardData?.stats?.totalProjects ? (
              <span
                className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold shrink-0 ${
                  activeTab === 'projects' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {dashboardData.stats.totalProjects}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-center ${
              activeTab === 'roles'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="truncate">Roles & Permissions</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-center col-span-2 sm:col-span-1 ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">Audit Trail</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions Bar */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Administrative Operations
                </h3>
                <span className="text-xs text-gray-400 font-medium">Quick Access</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('employees')}
                  className="flex items-start gap-3.5 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-2xs">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition">
                      Manage User Roles
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Promote or adjust employee roles to Admin, Manager, or Employee.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('projects')}
                  className="flex items-start gap-3.5 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/40 transition text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-2xs">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition">
                      Allocate Project Access
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Assign team members to client campaigns and manage team rosters.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('audit')}
                  className="flex items-start gap-3.5 p-4 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-2xs">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition">
                      Inspect Audit Trail
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Review administrative actions, timestamped changes, and historical logs.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Split Feed: Recent Role Changes & Recent Project Assignments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Role Changes */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Recent Role Changes
                  </h3>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-3">
                  {dashboardData?.recentRoleChanges && dashboardData.recentRoleChanges.length > 0 ? (
                    dashboardData.recentRoleChanges.map((log) => (
                      <div
                        key={log._id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200/70"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                            {log.targetUserName ? log.targetUserName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {log.targetUserName || log.targetUserEmail}
                            </p>
                            <p className="text-xs text-gray-500">
                              By {log.performedByName || log.performedByEmail} • {timeAgo(log.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700 capitalize font-medium">
                            {log.previousValue || 'employee'}
                          </span>
                          <span className="text-xs text-gray-400">→</span>
                          {renderRoleBadge(log.newValue)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-400 text-sm">
                      No recent role changes recorded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Project Assignments */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Recent Project Assignments
                  </h3>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-3">
                  {dashboardData?.recentProjectAssignments && dashboardData.recentProjectAssignments.length > 0 ? (
                    dashboardData.recentProjectAssignments.map((log) => (
                      <div
                        key={log._id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200/70"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                              log.action === 'PROJECT_ASSIGNED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {log.action === 'PROJECT_ASSIGNED' ? '+' : '−'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {log.targetUserName || log.targetUserEmail}
                            </p>
                            <p className="text-xs text-gray-500">
                              Project:{' '}
                              <span className="font-medium text-gray-800">
                                {log.projectName || 'Project'}
                              </span>{' '}
                              • {timeAgo(log.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            log.action === 'PROJECT_ASSIGNED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {log.action === 'PROJECT_ASSIGNED' ? 'Assigned' : 'Removed'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-400 text-sm">
                      No project allocations recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: EMPLOYEE MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'employees' && (
          <div className="space-y-5">
            {/* Search & Filter Header */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => {
                    setEmployeeSearch(e.target.value);
                    setEmployeePage(1);
                  }}
                  placeholder="Search by name, email, or employee ID..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                <svg
                  className="w-4 h-4 text-gray-400 absolute left-3.5 top-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Role Filter */}
                <select
                  value={employeeRoleFilter}
                  onChange={(e) => {
                    setEmployeeRoleFilter(e.target.value);
                    setEmployeePage(1);
                  }}
                  className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admins Only</option>
                  <option value="manager">Managers Only</option>
                  <option value="employee">Employees Only</option>
                </select>

                {/* Status Filter */}
                <select
                  value={employeeStatusFilter}
                  onChange={(e) => {
                    setEmployeeStatusFilter(e.target.value);
                    setEmployeePage(1);
                  }}
                  className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>

                <button
                  onClick={fetchEmployees}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition"
                  title="Refresh List"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Employees Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3.5 px-5">Employee / User</th>
                      <th className="py-3.5 px-4">System Role</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Assigned Projects</th>
                      <th className="py-3.5 px-4">Last Login</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingEmployees ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Loading employees directory...</span>
                          </div>
                        </td>
                      </tr>
                    ) : employees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          No employees matched the specified filters.
                        </td>
                      </tr>
                    ) : (
                      employees.map((emp) => (
                        <tr key={emp._id} className="hover:bg-blue-50/30 transition">
                          {/* User Avatar & Info */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                                {emp.name ? emp.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900 truncate">
                                    {emp.name || 'User'}
                                  </p>
                                  {emp._id === currentAdmin.id && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                      You
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">{emp.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            {renderRoleBadge(emp.role)}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                emp.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : emp.status === 'suspended'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  emp.status === 'active'
                                    ? 'bg-emerald-500'
                                    : emp.status === 'suspended'
                                    ? 'bg-red-500'
                                    : 'bg-gray-400'
                                }`}
                              ></span>
                              <span className="capitalize">{emp.status || 'Active'}</span>
                            </span>
                          </td>

                          {/* Assigned Projects */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                              {emp.role === 'admin' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  All Projects (Admin)
                                </span>
                              ) : emp.assignedProjects && emp.assignedProjects.length > 0 ? (
                                <>
                                  {emp.assignedProjects.slice(0, 2).map((p) => (
                                    <span
                                      key={p._id}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 truncate max-w-[120px]"
                                      title={p.companyName}
                                    >
                                      {p.companyName}
                                    </span>
                                  ))}
                                  {emp.assignedProjects.length > 2 && (
                                    <button
                                      onClick={() => setAccessDetailsUser(emp)}
                                      className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                                    >
                                      +{emp.assignedProjects.length - 2} more
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-gray-400 italic">No assigned projects</span>
                              )}
                            </div>
                          </td>

                          {/* Last Login */}
                          <td className="py-4 px-4 whitespace-nowrap text-xs text-gray-500">
                            {emp.lastLogin ? formatDate(emp.lastLogin) : 'No login recorded'}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {/* Change Role Button */}
                              <button
                                onClick={() => handleOpenRoleModal(emp)}
                                disabled={emp._id === currentAdmin.id}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 text-xs font-medium rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                                title={
                                  emp._id === currentAdmin.id
                                    ? 'You cannot change your own admin role'
                                    : 'Change employee role'
                                }
                              >
                                Edit Role
                              </button>

                              {/* Assign Projects Button */}
                              <button
                                onClick={() => handleOpenAssignProjects(emp)}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition"
                              >
                                Assign Projects
                              </button>

                              {/* View Permissions & Access Details */}
                              <button
                                onClick={() => setAccessDetailsUser(emp)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                title="View Permissions Breakdown"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {employeePagination.totalPages > 1 && (
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
                  <span>
                    Showing page {employeePagination.page} of {employeePagination.totalPages} ({employeePagination.total} employees)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEmployeePage((prev) => Math.max(1, prev - 1))}
                      disabled={employeePage <= 1}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setEmployeePage((prev) => Math.min(employeePagination.totalPages, prev + 1))}
                      disabled={employeePage >= employeePagination.totalPages}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PROJECT ACCESS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'projects' && (
          <div className="space-y-5">
            {/* Search & Filter Header */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => {
                    setProjectSearch(e.target.value);
                    setProjectPage(1);
                  }}
                  placeholder="Search projects by company name or industry..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                <svg
                  className="w-4 h-4 text-gray-400 absolute left-3.5 top-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={projectStatusFilter}
                  onChange={(e) => {
                    setProjectStatusFilter(e.target.value);
                    setProjectPage(1);
                  }}
                  className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>

                <button
                  onClick={fetchProjects}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition"
                  title="Refresh Projects"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Projects Cards List */}
            <div className="space-y-4">
              {loadingProjects ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm font-medium text-gray-600">Loading project access data...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-200 text-gray-400">
                  No projects found.
                </div>
              ) : (
                projects.map((proj) => (
                  <div
                    key={proj._id}
                    className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200 shadow-2xs hover:border-blue-200 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900">{proj.companyName}</h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              proj.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {proj.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Industry: <span className="font-medium text-gray-700">{proj.industry || 'Not specified'}</span> • Created by{' '}
                          <span className="font-medium text-gray-700">{proj.createdBy?.name || proj.createdBy?.email || 'Admin'}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleOpenProjectMembersModal(proj)}
                        className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm self-start sm:self-auto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        + Assign Employees
                      </button>
                    </div>

                    {/* Assigned Employees List */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Assigned Team Members ({proj.assignedEmployees?.length || 0})
                        </span>
                        <span className="text-xs text-gray-400 hidden sm:inline">
                          Authorized team members for this campaign
                        </span>
                      </div>

                      {proj.assignedEmployees && proj.assignedEmployees.length > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          {proj.assignedEmployees.map((emp, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                            >
                              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                                {emp.name ? emp.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <span className="font-semibold text-gray-800">{emp.name || emp.email}</span>
                              <span className="text-[10px] text-gray-400 font-mono">({emp.email})</span>
                              {renderRoleBadge(emp.role)}
                              <button
                                onClick={() =>
                                  setConfirmDeleteMember({
                                    projectId: proj._id,
                                    projectName: proj.companyName,
                                    email: emp.email
                                  })
                                }
                                className="ml-1 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                title={`Remove ${emp.email} from project`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center text-xs text-gray-400">
                          No team members assigned yet. Click <strong>+ Assign Employees</strong> to authorize team members.
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {projectPagination.totalPages > 1 && (
              <div className="p-4 bg-white rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
                <span>
                  Showing page {projectPagination.page} of {projectPagination.totalPages} ({projectPagination.total} projects)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setProjectPage((prev) => Math.max(1, prev - 1))}
                    disabled={projectPage <= 1}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setProjectPage((prev) => Math.min(projectPagination.totalPages, prev + 1))}
                    disabled={projectPage >= projectPagination.totalPages}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ROLES & PERMISSIONS MATRIX */}
        {/* ========================================================================= */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200 shadow-2xs">
              <div className="max-w-3xl mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Role & Access Control Matrix</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The system enforces strict role-based access control (RBAC). Below is the comprehensive matrix detailing authorized capabilities for each role tier across administrative, project, and analytics modules.
                </p>
              </div>

              {/* Roles Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {/* Admin Role */}
                <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Tier 1</span>
                    {renderRoleBadge('admin')}
                  </div>
                  <h4 className="text-base font-bold text-purple-950 mb-1">System Administrator</h4>
                  <p className="text-xs text-purple-800 leading-relaxed mb-4">
                    Full superuser privileges across the platform. Has access to all projects, user management, and security logs.
                  </p>
                  <ul className="space-y-2 text-xs text-purple-900 font-medium">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                      Access Admin Panel & Audit Trail
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                      Assign & Change Employee Roles
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                      Unrestricted access to all Projects
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                      Master Dashboard & Performance Reports
                    </li>
                  </ul>
                </div>

                {/* Manager Role */}
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Tier 2</span>
                    {renderRoleBadge('manager')}
                  </div>
                  <h4 className="text-base font-bold text-blue-950 mb-1">Team Manager</h4>
                  <p className="text-xs text-blue-800 leading-relaxed mb-4">
                    Campaign and team supervisor. Can monitor all projects and team activities, but cannot alter administrative security roles.
                  </p>
                  <ul className="space-y-2 text-xs text-blue-900 font-medium">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      View & Monitor all active projects
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      View Employee Performance Analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      Manage Campaign Channels & ICPs
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                      No Admin Panel / Role assignment access
                    </li>
                  </ul>
                </div>

                {/* Employee Role */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Tier 3</span>
                    {renderRoleBadge('employee')}
                  </div>
                  <h4 className="text-base font-bold text-gray-900 mb-1">Outbound Employee</h4>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    Standard team contributor. Access is strictly confined to projects they are explicitly assigned to by an Administrator.
                  </p>
                  <ul className="space-y-2 text-xs text-gray-700 font-medium">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                      Access only assigned client projects
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                      Log touches (Calls, Emails, LinkedIn)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                      Update assigned prospect pipeline stages
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                      Zero access to unassigned projects or Admin Panel
                    </li>
                  </ul>
                </div>
              </div>

              {/* Comprehensive Capability Matrix Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                      <th className="py-3 px-4">Feature / Platform Capability</th>
                      <th className="py-3 px-4 text-center">Admin</th>
                      <th className="py-3 px-4 text-center">Manager</th>
                      <th className="py-3 px-4 text-center">Employee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-gray-800">Admin Panel Access</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Full Access</td>
                      <td className="py-3 px-4 text-center text-red-500 font-bold">✕ Denied</td>
                      <td className="py-3 px-4 text-center text-red-500 font-bold">✕ Denied</td>
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="py-3 px-4 font-semibold text-gray-800">User & Role Management</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Full Control</td>
                      <td className="py-3 px-4 text-center text-red-500 font-bold">✕ Denied</td>
                      <td className="py-3 px-4 text-center text-red-500 font-bold">✕ Denied</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-gray-800">Project Allocation & Access</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ All Projects</td>
                      <td className="py-3 px-4 text-center text-blue-600 font-bold">✓ All Projects View</td>
                      <td className="py-3 px-4 text-center text-amber-600 font-bold">Assigned Only</td>
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="py-3 px-4 font-semibold text-gray-800">Master Dashboard Analytics</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Full Access</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Full Access</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Full Access</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-gray-800">Employee Performance Analytics</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ All Team Members</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ All Team Members</td>
                      <td className="py-3 px-4 text-center text-amber-600 font-bold">Self + Assigned</td>
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="py-3 px-4 font-semibold text-gray-800">Prospect & Activity Operations</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Global</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Global</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Assigned Only</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-gray-800">Audit Trail History</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Full Access</td>
                      <td className="py-3 px-4 text-center text-red-500 font-bold">✕ Denied</td>
                      <td className="py-3 px-4 text-center text-red-500 font-bold">✕ Denied</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: AUDIT & ACTIVITY LOG */}
        {/* ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-5">
            {/* Filter Bar */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => {
                    setAuditSearch(e.target.value);
                    setAuditPage(1);
                  }}
                  placeholder="Search audit trail by user, admin, project, details..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                <svg
                  className="w-4 h-4 text-gray-400 absolute left-3.5 top-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={auditActionFilter}
                  onChange={(e) => {
                    setAuditActionFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Action Types</option>
                  <option value="ROLE_CHANGED">Role Changed</option>
                  <option value="PROJECT_ASSIGNED">Project Assigned</option>
                  <option value="PROJECT_REMOVED">Project Removed</option>
                  <option value="USER_STATUS_UPDATED">Status Updated</option>
                </select>

                <button
                  onClick={fetchAuditLogs}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition"
                  title="Refresh Audit Logs"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3.5 px-5">Timestamp</th>
                      <th className="py-3.5 px-4">Action</th>
                      <th className="py-3.5 px-4">Target Employee</th>
                      <th className="py-3.5 px-4">Project / Resource</th>
                      <th className="py-3.5 px-4">Change Summary</th>
                      <th className="py-3.5 px-5">Performed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingAuditLogs ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Loading audit trail...</span>
                          </div>
                        </td>
                      </tr>
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          No audit trail records found.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-blue-50/30 transition">
                          {/* Timestamp */}
                          <td className="py-3.5 px-5 whitespace-nowrap text-xs">
                            <p className="font-semibold text-gray-800">{formatDate(log.createdAt)}</p>
                            <p className="text-[11px] text-gray-400">{timeAgo(log.createdAt)}</p>
                          </td>

                          {/* Action Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                log.action === 'ROLE_CHANGED'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : log.action === 'PROJECT_ASSIGNED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : log.action === 'PROJECT_REMOVED'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {log.action?.replace(/_/g, ' ')}
                            </span>
                          </td>

                          {/* Target User */}
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-gray-900 text-xs">
                              {log.targetUserName || log.targetUserEmail || 'N/A'}
                            </p>
                            {log.targetUserEmail && (
                              <p className="text-[11px] text-gray-400 font-mono">{log.targetUserEmail}</p>
                            )}
                          </td>

                          {/* Project */}
                          <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                            {log.projectName || '—'}
                          </td>

                          {/* Change Summary Diff */}
                          <td className="py-3.5 px-4 text-xs">
                            <div className="flex items-center gap-2">
                              {log.previousValue && (
                                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 line-through">
                                  {String(log.previousValue)}
                                </span>
                              )}
                              {log.previousValue && log.newValue && <span>→</span>}
                              {log.newValue && (
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                                  {String(log.newValue)}
                                </span>
                              )}
                              {!log.previousValue && !log.newValue && (
                                <span className="text-gray-500">{log.details || '—'}</span>
                              )}
                            </div>
                          </td>

                          {/* Performed By */}
                          <td className="py-3.5 px-5 whitespace-nowrap text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">
                                {log.performedByName || log.performedByEmail}
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400">{log.performedByEmail}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {auditPagination.totalPages > 1 && (
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
                  <span>
                    Showing page {auditPagination.page} of {auditPagination.totalPages} ({auditPagination.total} audit logs)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
                      disabled={auditPage <= 1}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setAuditPage((prev) => Math.min(auditPagination.totalPages, prev + 1))}
                      disabled={auditPage >= auditPagination.totalPages}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CHANGE ROLE MODAL */}
      {/* ========================================================================= */}
      {roleModalUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Change Employee Role</h3>
                  <p className="text-xs text-gray-500">Update system authorization tier</p>
                </div>
              </div>
              <button
                onClick={() => setRoleModalUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Target Employee Info */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 mb-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {roleModalUser.name ? roleModalUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{roleModalUser.name || 'User'}</p>
                <p className="text-xs text-gray-500">{roleModalUser.email}</p>
              </div>
            </div>

            {/* Role Options */}
            <div className="space-y-3 mb-6">
              {/* Admin Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedNewRole === 'admin'
                    ? 'bg-purple-50/70 border-purple-500 ring-2 ring-purple-500/20'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={selectedNewRole === 'admin'}
                  onChange={(e) => setSelectedNewRole(e.target.value)}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-purple-950">Administrator</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-800">
                      Full Access
                    </span>
                  </div>
                  <p className="text-xs text-purple-900/80 mt-0.5">
                    Unrestricted access to the Admin Panel, role assignments, and all projects.
                  </p>
                </div>
              </label>

              {/* Manager Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedNewRole === 'manager'
                    ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="manager"
                  checked={selectedNewRole === 'manager'}
                  onChange={(e) => setSelectedNewRole(e.target.value)}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-blue-950">Manager</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-200 text-blue-800">
                      Supervisor
                    </span>
                  </div>
                  <p className="text-xs text-blue-900/80 mt-0.5">
                    Can monitor all active projects and team metrics. Cannot access Admin Panel.
                  </p>
                </div>
              </label>

              {/* Employee Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedNewRole === 'employee'
                    ? 'bg-gray-100 border-gray-400 ring-2 ring-gray-400/20'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="employee"
                  checked={selectedNewRole === 'employee'}
                  onChange={(e) => setSelectedNewRole(e.target.value)}
                  className="mt-1 text-gray-600 focus:ring-gray-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">Employee</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-700">
                      Assigned Only
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Restricted strictly to projects explicitly assigned to them by an administrator.
                  </p>
                </div>
              </label>
            </div>

            {/* Warning when promoting to Admin */}
            {selectedNewRole === 'admin' && roleModalUser.role !== 'admin' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-5 text-xs text-amber-800 flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  <strong>Caution:</strong> Promoting this user to Administrator will grant them full administrative control over all system assets.
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                disabled={updatingRole}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {updatingRole ? 'Updating...' : 'Save & Apply Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN PROJECTS TO EMPLOYEE */}
      {/* ========================================================================= */}
      {assignProjectsUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Assign Projects</h3>
                  <p className="text-xs text-gray-500">
                    Select projects for {assignProjectsUser.name || assignProjectsUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignProjectsUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Actions / Select All */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="text-gray-500">
                Selected: <strong className="text-gray-900">{selectedProjectIds.length}</strong> projects
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProjectIds(allAvailableProjects.map((p) => p._id))}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Select All
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedProjectIds([])}
                  className="text-gray-500 hover:underline font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Project Selection List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-gray-100 max-h-96">
              {allAvailableProjects.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">Loading projects catalog...</div>
              ) : (
                allAvailableProjects.map((proj) => {
                  const isChecked = selectedProjectIds.includes(proj._id);
                  return (
                    <label
                      key={proj._id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? 'bg-blue-50/70 border-blue-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjectIds((prev) => [...prev, proj._id]);
                            } else {
                              setSelectedProjectIds((prev) => prev.filter((id) => id !== proj._id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{proj.companyName}</p>
                          <p className="text-xs text-gray-500">
                            {proj.industry ? `${proj.industry} • ` : ''}
                            Status: <span className="capitalize font-medium">{proj.status}</span>
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                          proj.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {proj.status}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setAssignProjectsUser(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProjectAssignments}
                disabled={savingProjectAssignments}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {savingProjectAssignments ? 'Saving...' : 'Save Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ASSIGN EMPLOYEES TO A PROJECT */}
      {/* ========================================================================= */}
      {projectMembersModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Assign Employees to {projectMembersModal.companyName}
                  </h3>
                  <p className="text-xs text-gray-500">Authorize team members for this campaign</p>
                </div>
              </div>
              <button
                onClick={() => setProjectMembersModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Employee Selection List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-gray-100 max-h-96">
              {allAvailableEmployees.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">Loading employee directory...</div>
              ) : (
                allAvailableEmployees.map((emp) => {
                  const empEmailLower = (emp.email || '').toLowerCase();
                  const isChecked = selectedEmployeeEmails.some(
                    (e) => (e || '').toLowerCase() === empEmailLower
                  );
                  return (
                    <label
                      key={emp._id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? 'bg-blue-50/70 border-blue-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployeeEmails((prev) => [...prev, empEmailLower]);
                            } else {
                              setSelectedEmployeeEmails((prev) =>
                                prev.filter((em) => (em || '').toLowerCase() !== empEmailLower)
                              );
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {emp.name ? emp.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{emp.name || 'User'}</p>
                          <p className="text-xs text-gray-500 font-mono">{emp.email}</p>
                        </div>
                      </div>
                      <div>{renderRoleBadge(emp.role)}</div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setProjectMembersModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProjectMembers}
                disabled={savingProjectMembers}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {savingProjectMembers ? 'Assigning...' : 'Save Team Members'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EMPLOYEE ACCESS BREAKDOWN DRAWER/MODAL */}
      {/* ========================================================================= */}
      {accessDetailsUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Employee Access & Permissions</h3>
                  <p className="text-xs text-gray-500">{accessDetailsUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setAccessDetailsUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Profile Summary Card */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-2xs">
                  {accessDetailsUser.name ? accessDetailsUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{accessDetailsUser.name || 'User'}</h4>
                  <p className="text-xs text-gray-500">{accessDetailsUser.email}</p>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">ID: {accessDetailsUser._id}</p>
                </div>
              </div>
              <div>{renderRoleBadge(accessDetailsUser.role)}</div>
            </div>

            {/* Assigned Projects List */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Authorized Projects ({accessDetailsUser.assignedProjects?.length || 0})
                </h4>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {accessDetailsUser.role === 'admin' ? (
                  <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-800 border border-purple-200 font-medium">
                    This user has the <strong>Admin</strong> role and has full, unrestricted access to all campaigns in the system.
                  </div>
                ) : accessDetailsUser.assignedProjects && accessDetailsUser.assignedProjects.length > 0 ? (
                  accessDetailsUser.assignedProjects.map((p) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs"
                    >
                      <span className="font-semibold text-gray-800">{p.companyName}</span>
                      <span className="capitalize px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-medium text-[11px]">
                        {p.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic py-2">No projects assigned yet.</p>
                )}
              </div>
            </div>

            {/* Effective Permissions Matrix */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Effective System Permissions
              </h4>
              <div className="space-y-2">
                {(accessDetailsUser.permissions || []).map((perm, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-0.5">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {perm.label}
                    </div>
                    <p className="text-gray-500 pl-5 text-[11px]">{perm.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6 pt-3 border-t border-gray-100 text-right">
              <button
                type="button"
                onClick={() => setAccessDetailsUser(null)}
                className="px-5 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CONFIRM MEMBER REMOVAL FROM PROJECT */}
      {/* ========================================================================= */}
      {confirmDeleteMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Remove Project Access?</h3>
            <p className="text-xs text-gray-600 mb-5 leading-relaxed">
              Are you sure you want to revoke access for{' '}
              <strong className="text-gray-900">{confirmDeleteMember.email}</strong> from project{' '}
              <strong className="text-gray-900">"{confirmDeleteMember.projectName}"</strong>? The employee will immediately lose access to this project.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteMember(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMember}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
              >
                Yes, Revoke Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
