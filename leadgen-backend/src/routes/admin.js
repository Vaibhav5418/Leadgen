const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');
const authenticate = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// All routes in this router require authentication and Admin role
router.use(authenticate);
router.use(requireAdmin);

// Helper to normalize user role
const getUserRole = (user) => {
  if (user.email === 'akshay@kology.co' || user.isAdmin === true || user.role === 'admin') {
    return 'admin';
  }
  if (user.role === 'manager') {
    return 'manager';
  }
  return 'employee';
};

// Helper for permissions mapping
const getPermissionsForRole = (role) => {
  switch (role) {
    case 'admin':
      return [
        { key: 'admin_panel', label: 'Admin Panel Access', description: 'Full administrative control over users, roles, and project allocations' },
        { key: 'all_projects', label: 'All Projects Access', description: 'Unrestricted visibility and management of all client projects' },
        { key: 'role_management', label: 'Role Management', description: 'Assign and change user roles across the organization' },
        { key: 'project_assignment', label: 'Project Assignment', description: 'Assign or revoke project access for team members' },
        { key: 'view_all_reports', label: 'All Analytics & Reports', description: 'Access master dashboards, employee performance, and client reports' },
        { key: 'export_data', label: 'Data & Export Access', description: 'Export contacts, activities, and analytical summaries' }
      ];
    case 'manager':
      return [
        { key: 'all_projects_view', label: 'View All Projects', description: 'View and monitor campaigns across all projects' },
        { key: 'team_performance', label: 'Team Performance View', description: 'View cross-team performance metrics and touchpoints' },
        { key: 'manage_campaigns', label: 'Manage Campaigns', description: 'Create and edit campaign ICPs, channels, and allocations' },
        { key: 'manage_contacts', label: 'Manage Prospects & Contacts', description: 'Import and organize prospect lists and pipeline stages' },
        { key: 'log_activities', label: 'Log Activities', description: 'Record calls, LinkedIn touches, and email outreach' }
      ];
    case 'employee':
    default:
      return [
        { key: 'assigned_projects_only', label: 'Assigned Projects Only', description: 'Access strictly limited to explicitly allocated projects' },
        { key: 'manage_assigned_contacts', label: 'Assigned Contacts Management', description: 'View and update prospects in allocated projects' },
        { key: 'log_activities', label: 'Log Activities', description: 'Log outbound activities and update contact stages' },
        { key: 'view_assigned_reports', label: 'Assigned Reports View', description: 'View performance and metrics for allocated projects' }
      ];
  }
};

// ==========================================
// 1. ADMIN DASHBOARD OVERVIEW
// ==========================================
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalProjects,
      activeProjects,
      allUsers,
      allProjects,
      recentRoleChanges,
      recentProjectAssignments,
      recentLogs
    ] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Project.countDocuments({ status: 'active' }),
      User.find().select('_id name email role isAdmin status createdAt lastLogin').lean(),
      Project.find().select('_id companyName status createdBy teamMembers').lean(),
      AuditLog.find({ action: 'ROLE_CHANGED' }).sort({ createdAt: -1 }).limit(6).lean(),
      AuditLog.find({ action: { $in: ['PROJECT_ASSIGNED', 'PROJECT_REMOVED'] } }).sort({ createdAt: -1 }).limit(6).lean(),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).lean()
    ]);

    // Calculate role breakdown
    let adminCount = 0;
    let managerCount = 0;
    let employeeCount = 0;
    let activeEmployees = 0;

    allUsers.forEach((u) => {
      const effectiveRole = getUserRole(u);
      if (effectiveRole === 'admin') adminCount++;
      else if (effectiveRole === 'manager') managerCount++;
      else employeeCount++;

      if (u.status !== 'suspended' && u.status !== 'inactive') {
        activeEmployees++;
      }
    });

    // Calculate total project assignments (sum of unique employee allocations across all projects)
    let totalAssignments = 0;
    allProjects.forEach((p) => {
      if (Array.isArray(p.teamMembers)) {
        totalAssignments += p.teamMembers.length;
      }
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalEmployees: totalUsers,
          activeEmployees,
          totalProjects,
          activeProjects,
          totalAssignments,
          roleBreakdown: {
            admin: adminCount,
            manager: managerCount,
            employee: employeeCount
          }
        },
        recentRoleChanges,
        recentProjectAssignments,
        recentLogs
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to load admin dashboard overview'
    });
  }
});

// ==========================================
// 2. EMPLOYEE MANAGEMENT ENDPOINTS
// ==========================================

// Get all employees with search, filters, pagination, and assigned projects
router.get('/employees', async (req, res) => {
  try {
    const {
      search = '',
      role = '',
      status = '',
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    let filter = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchConditions = [
        { name: searchRegex },
        { email: searchRegex }
      ];

      if (mongoose.Types.ObjectId.isValid(search.trim())) {
        searchConditions.push({ _id: new mongoose.Types.ObjectId(search.trim()) });
      }

      filter.$or = searchConditions;
    }

    if (status && status.trim()) {
      filter.status = status.trim().toLowerCase();
    }

    if (role && role.trim()) {
      const targetRole = role.trim().toLowerCase();
      if (targetRole === 'admin') {
        filter.$or = [
          { role: 'admin' },
          { isAdmin: true },
          { email: 'akshay@kology.co' }
        ];
      } else if (targetRole === 'manager') {
        filter.role = 'manager';
        filter.isAdmin = { $ne: true };
        filter.email = { $ne: 'akshay@kology.co' };
      } else if (targetRole === 'employee') {
        filter.$and = [
          { $or: [{ role: 'employee' }, { role: { $exists: false } }, { role: null }, { role: '' }] },
          { isAdmin: { $ne: true } },
          { email: { $ne: 'akshay@kology.co' } }
        ];
      }
    }

    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch users and projects in parallel
    const [users, totalUsers, allProjects] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
      Project.find().select('_id companyName status createdBy teamMembers').lean()
    ]);

    // Map assigned projects and permissions to each user
    const employeesWithProjects = users.map((u) => {
      const userEmailLower = (u.email || '').toLowerCase();
      const userIdStr = (u._id || '').toString();
      const effectiveRole = getUserRole(u);

      // Find projects where user is assigned or creator
      const assignedProjects = allProjects.filter((p) => {
        const isCreator = p.createdBy && p.createdBy.toString() === userIdStr;
        const isMember = Array.isArray(p.teamMembers) && 
          p.teamMembers.some((e) => (e || '').toLowerCase() === userEmailLower);
        return isCreator || isMember;
      }).map((p) => ({
        _id: p._id,
        companyName: p.companyName,
        status: p.status,
        isCreator: p.createdBy && p.createdBy.toString() === userIdStr,
        isTeamMember: Array.isArray(p.teamMembers) && 
          p.teamMembers.some((e) => (e || '').toLowerCase() === userEmailLower)
      }));

      return {
        _id: u._id,
        name: u.name || u.email.split('@')[0],
        email: u.email,
        role: effectiveRole,
        isAdmin: effectiveRole === 'admin',
        status: u.status || 'active',
        lastLogin: u.lastLogin || null,
        createdAt: u.createdAt,
        assignedProjects,
        assignedProjectsCount: assignedProjects.length,
        permissions: getPermissionsForRole(effectiveRole)
      };
    });

    res.json({
      success: true,
      data: {
        employees: employeesWithProjects,
        pagination: {
          total: totalUsers,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalUsers / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch employee directory'
    });
  }
});

// Get single employee details
router.get('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID format'
      });
    }

    const [user, allProjects, userAuditLogs] = await Promise.all([
      User.findById(id).select('-password').lean(),
      Project.find().select('_id companyName status createdBy teamMembers channels campaignDetails').lean(),
      AuditLog.find({ targetUser: id }).sort({ createdAt: -1 }).limit(20).lean()
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    const effectiveRole = getUserRole(user);
    const userEmailLower = (user.email || '').toLowerCase();
    const userIdStr = user._id.toString();

    // Map projects
    const assignedProjects = allProjects.filter((p) => {
      const isCreator = p.createdBy && p.createdBy.toString() === userIdStr;
      const isMember = Array.isArray(p.teamMembers) && 
        p.teamMembers.some((e) => (e || '').toLowerCase() === userEmailLower);
      return isCreator || isMember;
    }).map((p) => ({
      _id: p._id,
      companyName: p.companyName,
      status: p.status,
      channels: p.channels || {},
      isCreator: p.createdBy && p.createdBy.toString() === userIdStr,
      isTeamMember: Array.isArray(p.teamMembers) && 
        p.teamMembers.some((e) => (e || '').toLowerCase() === userEmailLower)
    }));

    res.json({
      success: true,
      data: {
        employee: {
          _id: user._id,
          name: user.name || user.email.split('@')[0],
          email: user.email,
          role: effectiveRole,
          isAdmin: effectiveRole === 'admin',
          status: user.status || 'active',
          lastLogin: user.lastLogin || null,
          createdAt: user.createdAt,
          assignedProjects,
          assignedProjectsCount: assignedProjects.length,
          permissions: getPermissionsForRole(effectiveRole)
        },
        auditLogs: userAuditLogs
      }
    });
  } catch (error) {
    console.error('Error fetching employee details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch employee details'
    });
  }
});

// Update employee role (Admin only, cannot update self role)
router.put('/employees/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminUser = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID format'
      });
    }

    const normalizedRole = (role || '').toLowerCase().trim();
    if (!['admin', 'manager', 'employee'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be one of: admin, manager, employee'
      });
    }

    // Security check: Prevent modifying own role
    if (adminUser._id.toString() === id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot modify your own role to prevent accidental administrative lockout.'
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    const previousRole = getUserRole(targetUser);

    if (previousRole === normalizedRole) {
      return res.json({
        success: true,
        message: `Employee is already assigned role: ${normalizedRole}`,
        data: {
          id: targetUser._id,
          role: normalizedRole,
          isAdmin: normalizedRole === 'admin'
        }
      });
    }

    // Update target user
    targetUser.role = normalizedRole;
    targetUser.isAdmin = normalizedRole === 'admin';
    await targetUser.save();

    // Create Audit Log
    const auditEntry = await AuditLog.create({
      performedBy: adminUser._id,
      performedByName: adminUser.name || adminUser.email,
      performedByEmail: adminUser.email,
      targetUser: targetUser._id,
      targetUserName: targetUser.name || targetUser.email,
      targetUserEmail: targetUser.email,
      action: 'ROLE_CHANGED',
      previousValue: previousRole,
      newValue: normalizedRole,
      details: `Role updated from ${previousRole.toUpperCase()} to ${normalizedRole.toUpperCase()}`,
      ipAddress: req.ip || ''
    });

    res.json({
      success: true,
      message: `Role for ${targetUser.name || targetUser.email} successfully updated to ${normalizedRole}`,
      data: {
        user: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          role: normalizedRole,
          isAdmin: normalizedRole === 'admin'
        },
        auditLog: auditEntry
      }
    });
  } catch (error) {
    console.error('Error updating employee role:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update employee role'
    });
  }
});

// Update employee status (active / inactive / suspended)
router.put('/employees/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminUser = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID'
      });
    }

    const normalizedStatus = (status || '').toLowerCase().trim();
    if (!['active', 'inactive', 'suspended'].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be active, inactive, or suspended'
      });
    }

    if (adminUser._id.toString() === id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot modify your own status.'
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    const previousStatus = targetUser.status || 'active';
    targetUser.status = normalizedStatus;
    await targetUser.save();

    await AuditLog.create({
      performedBy: adminUser._id,
      performedByName: adminUser.name || adminUser.email,
      performedByEmail: adminUser.email,
      targetUser: targetUser._id,
      targetUserName: targetUser.name || targetUser.email,
      targetUserEmail: targetUser.email,
      action: 'USER_STATUS_UPDATED',
      previousValue: previousStatus,
      newValue: normalizedStatus,
      details: `Account status changed from ${previousStatus} to ${normalizedStatus}`,
      ipAddress: req.ip || ''
    });

    res.json({
      success: true,
      message: `Employee status updated to ${normalizedStatus}`,
      data: {
        id: targetUser._id,
        status: normalizedStatus
      }
    });
  } catch (error) {
    console.error('Error updating employee status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update employee status'
    });
  }
});

// Assign one or multiple projects to an employee
router.post('/employees/:id/assign-projects', async (req, res) => {
  try {
    const { id } = req.params;
    const { projectIds } = req.body;
    const adminUser = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID'
      });
    }

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of project IDs to assign'
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    const employeeEmailLower = targetUser.email.toLowerCase().trim();

    // Fetch valid projects
    const validProjectIds = projectIds
      .filter((pid) => mongoose.Types.ObjectId.isValid(pid))
      .map((pid) => new mongoose.Types.ObjectId(pid));

    const projects = await Project.find({ _id: { $in: validProjectIds } });

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'None of the specified projects could be found'
      });
    }

    const assignedProjectNames = [];
    const auditPromises = [];

    for (const project of projects) {
      const existingMembers = Array.isArray(project.teamMembers) ? project.teamMembers : [];
      const isAlreadyMember = existingMembers.some(
        (e) => (e || '').toLowerCase() === employeeEmailLower
      );

      if (!isAlreadyMember) {
        // Add to teamMembers
        project.teamMembers = [...existingMembers, employeeEmailLower];
        await project.save();

        assignedProjectNames.push(project.companyName);

        // Audit log
        auditPromises.push(
          AuditLog.create({
            performedBy: adminUser._id,
            performedByName: adminUser.name || adminUser.email,
            performedByEmail: adminUser.email,
            targetUser: targetUser._id,
            targetUserName: targetUser.name || targetUser.email,
            targetUserEmail: targetUser.email,
            action: 'PROJECT_ASSIGNED',
            projectId: project._id,
            projectName: project.companyName,
            previousValue: 'Not Assigned',
            newValue: 'Assigned',
            details: `Assigned employee ${targetUser.name || targetUser.email} to project "${project.companyName}"`,
            ipAddress: req.ip || ''
          })
        );
      }
    }

    await Promise.all(auditPromises);

    res.json({
      success: true,
      message: `Successfully assigned ${assignedProjectNames.length} project(s) to ${targetUser.name || targetUser.email}`,
      data: {
        assignedCount: assignedProjectNames.length,
        assignedProjects: assignedProjectNames
      }
    });
  } catch (error) {
    console.error('Error assigning projects to employee:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to assign projects'
    });
  }
});

// Remove a project assignment from an employee
router.post('/employees/:id/remove-project', async (req, res) => {
  try {
    const { id } = req.params;
    const { projectId } = req.body;
    const adminUser = req.user;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee or project ID'
      });
    }

    const [targetUser, project] = await Promise.all([
      User.findById(id),
      Project.findById(projectId)
    ]);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const employeeEmailLower = targetUser.email.toLowerCase().trim();
    const existingMembers = Array.isArray(project.teamMembers) ? project.teamMembers : [];
    
    // Filter out employee email
    project.teamMembers = existingMembers.filter(
      (e) => (e || '').toLowerCase() !== employeeEmailLower
    );
    await project.save();

    // Create Audit Log
    await AuditLog.create({
      performedBy: adminUser._id,
      performedByName: adminUser.name || adminUser.email,
      performedByEmail: adminUser.email,
      targetUser: targetUser._id,
      targetUserName: targetUser.name || targetUser.email,
      targetUserEmail: targetUser.email,
      action: 'PROJECT_REMOVED',
      projectId: project._id,
      projectName: project.companyName,
      previousValue: 'Assigned',
      newValue: 'Removed',
      details: `Removed access for ${targetUser.name || targetUser.email} from project "${project.companyName}"`,
      ipAddress: req.ip || ''
    });

    res.json({
      success: true,
      message: `Successfully removed ${targetUser.name || targetUser.email} from project "${project.companyName}"`
    });
  } catch (error) {
    console.error('Error removing project from employee:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove project assignment'
    });
  }
});

// ==========================================
// 3. PROJECT ACCESS MANAGEMENT ENDPOINTS
// ==========================================

// Get all projects with detailed assigned employees
router.get('/projects', async (req, res) => {
  try {
    const {
      search = '',
      status = '',
      page = 1,
      limit = 50
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    let filter = {};
    if (search && search.trim()) {
      filter.companyName = { $regex: search.trim(), $options: 'i' };
    }
    if (status && status.trim()) {
      filter.status = status.trim();
    }

    const [projects, totalProjects, allUsers] = await Promise.all([
      Project.find(filter)
        .populate('createdBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Project.countDocuments(filter),
      User.find().select('_id name email role isAdmin status').lean()
    ]);

    // Create a fast lookup map for users by lowercase email and ObjectId
    const userByEmail = new Map();
    const userById = new Map();
    allUsers.forEach((u) => {
      userByEmail.set((u.email || '').toLowerCase(), u);
      userById.set(u._id.toString(), u);
    });

    const projectsWithMembers = projects.map((p) => {
      const teamMemberEmails = Array.isArray(p.teamMembers) ? p.teamMembers : [];
      
      const assignedEmployees = teamMemberEmails.map((email) => {
        const emailLower = (email || '').toLowerCase();
        const foundUser = userByEmail.get(emailLower);
        if (foundUser) {
          return {
            _id: foundUser._id,
            name: foundUser.name || foundUser.email.split('@')[0],
            email: foundUser.email,
            role: getUserRole(foundUser),
            status: foundUser.status || 'active',
            isRegistered: true
          };
        }
        return {
          _id: null,
          name: email.split('@')[0],
          email: email,
          role: 'employee',
          status: 'unregistered',
          isRegistered: false
        };
      });

      return {
        _id: p._id,
        companyName: p.companyName,
        industry: p.industry || '',
        status: p.status,
        channels: p.channels || {},
        createdBy: p.createdBy ? {
          _id: p.createdBy._id,
          name: p.createdBy.name || p.createdBy.email,
          email: p.createdBy.email
        } : null,
        teamMemberEmails,
        assignedEmployees,
        assignedCount: assignedEmployees.length,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      };
    });

    res.json({
      success: true,
      data: {
        projects: projectsWithMembers,
        pagination: {
          total: totalProjects,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalProjects / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin projects:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch projects access list'
    });
  }
});

// Assign multiple employees to a project
router.post('/projects/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeEmails, userIds } = req.body;
    const adminUser = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    let emailsToAdd = [];

    if (Array.isArray(employeeEmails)) {
      emailsToAdd = employeeEmails.map((e) => (e || '').toLowerCase().trim()).filter(Boolean);
    }

    if (Array.isArray(userIds) && userIds.length > 0) {
      const validUserIds = userIds.filter((uid) => mongoose.Types.ObjectId.isValid(uid));
      const users = await User.find({ _id: { $in: validUserIds } }).select('email');
      const resolvedEmails = users.map((u) => u.email.toLowerCase().trim());
      emailsToAdd = Array.from(new Set([...emailsToAdd, ...resolvedEmails]));
    }

    if (emailsToAdd.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one employee email or ID to assign'
      });
    }

    const currentMembers = Array.isArray(project.teamMembers) 
      ? project.teamMembers.map((e) => (e || '').toLowerCase().trim()) 
      : [];

    const newlyAddedEmails = [];
    const updatedMembersSet = new Set(currentMembers);

    for (const email of emailsToAdd) {
      if (!updatedMembersSet.has(email)) {
        updatedMembersSet.add(email);
        newlyAddedEmails.push(email);
      }
    }

    project.teamMembers = Array.from(updatedMembersSet);
    await project.save();

    // Create Audit Logs for newly added users
    if (newlyAddedEmails.length > 0) {
      const usersInfo = await User.find({ email: { $in: newlyAddedEmails } }).select('_id name email');
      const userMap = new Map(usersInfo.map(u => [u.email.toLowerCase(), u]));

      await Promise.all(
        newlyAddedEmails.map((email) => {
          const u = userMap.get(email);
          return AuditLog.create({
            performedBy: adminUser._id,
            performedByName: adminUser.name || adminUser.email,
            performedByEmail: adminUser.email,
            targetUser: u ? u._id : null,
            targetUserName: u ? (u.name || u.email) : email,
            targetUserEmail: email,
            action: 'PROJECT_ASSIGNED',
            projectId: project._id,
            projectName: project.companyName,
            previousValue: 'Not Assigned',
            newValue: 'Assigned',
            details: `Assigned employee ${email} to project "${project.companyName}"`,
            ipAddress: req.ip || ''
          });
        })
      );
    }

    res.json({
      success: true,
      message: `Successfully assigned ${newlyAddedEmails.length} employee(s) to project "${project.companyName}"`,
      data: {
        totalMembers: project.teamMembers.length,
        addedCount: newlyAddedEmails.length,
        teamMembers: project.teamMembers
      }
    });
  } catch (error) {
    console.error('Error assigning members to project:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to assign employees to project'
    });
  }
});

// Remove a specific employee from a project
router.delete('/projects/:id/members/:email', async (req, res) => {
  try {
    const { id, email } = req.params;
    const adminUser = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const targetEmailLower = decodeURIComponent(email || '').toLowerCase().trim();
    const currentMembers = Array.isArray(project.teamMembers) ? project.teamMembers : [];
    
    project.teamMembers = currentMembers.filter(
      (e) => (e || '').toLowerCase().trim() !== targetEmailLower
    );
    await project.save();

    // Look up target user if registered
    const targetUser = await User.findOne({ email: targetEmailLower });

    await AuditLog.create({
      performedBy: adminUser._id,
      performedByName: adminUser.name || adminUser.email,
      performedByEmail: adminUser.email,
      targetUser: targetUser ? targetUser._id : null,
      targetUserName: targetUser ? (targetUser.name || targetUser.email) : targetEmailLower,
      targetUserEmail: targetEmailLower,
      action: 'PROJECT_REMOVED',
      projectId: project._id,
      projectName: project.companyName,
      previousValue: 'Assigned',
      newValue: 'Removed',
      details: `Removed access for ${targetEmailLower} from project "${project.companyName}"`,
      ipAddress: req.ip || ''
    });

    res.json({
      success: true,
      message: `Removed ${targetEmailLower} from project "${project.companyName}"`,
      data: {
        teamMembers: project.teamMembers
      }
    });
  } catch (error) {
    console.error('Error removing member from project:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove employee from project'
    });
  }
});

// ==========================================
// 4. AUDIT & ACTIVITY TRAIL
// ==========================================

// Get audit logs with search, action filters, and pagination
router.get('/audit-logs', async (req, res) => {
  try {
    const {
      action = '',
      search = '',
      startDate = '',
      endDate = '',
      page = 1,
      limit = 50
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    let filter = {};

    if (action && action.trim()) {
      filter.action = action.trim();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { performedByName: searchRegex },
        { performedByEmail: searchRegex },
        { targetUserName: searchRegex },
        { targetUserEmail: searchRegex },
        { projectName: searchRegex },
        { details: searchRegex }
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [logs, totalLogs] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total: totalLogs,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalLogs / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve audit log records'
    });
  }
});

// ==========================================
// 5. PERMISSIONS REFERENCE MATRIX
// ==========================================
router.get('/permissions-matrix', (req, res) => {
  res.json({
    success: true,
    data: {
      roles: [
        {
          role: 'admin',
          label: 'Administrator',
          description: 'Full system ownership, employee role configuration, project allocation, and audit log inspection.',
          badgeColor: 'purple',
          permissions: getPermissionsForRole('admin')
        },
        {
          role: 'manager',
          label: 'Manager',
          description: 'Campaign management, cross-project monitoring, prospect allocation, and team oversight.',
          badgeColor: 'blue',
          permissions: getPermissionsForRole('manager')
        },
        {
          role: 'employee',
          label: 'Employee',
          description: 'Restricted access limited strictly to explicitly assigned projects and tasks.',
          badgeColor: 'gray',
          permissions: getPermissionsForRole('employee')
        }
      ]
    }
  });
});

module.exports = router;
