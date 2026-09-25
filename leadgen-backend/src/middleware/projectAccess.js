const Project = require('../models/Project');

const isAdmin = (user) => {
  return user.isAdmin === true || user.role === 'admin' || user.email === 'akshay@kology.co';
};

const canAccessProject = (user, project) => {
  if (isAdmin(user)) return true;
  if (project.createdBy && project.createdBy.toString() === user._id.toString()) return true;
  if (project.teamMembers && project.teamMembers.includes(user.email)) return true;
  return false;
};

const getProjectAccessFilter = (user) => {
  if (isAdmin(user)) return {};
  return {
    $or: [
      { createdBy: user._id },
      { teamMembers: user.email }
    ]
  };
};

const requireProjectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId || req.body.projectId;
    
    if (!projectId) {
       return res.status(400).json({ success: false, error: 'Project ID is required' });
    }
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    if (!canAccessProject(req.user, project)) {
      return res.status(403).json({ success: false, error: 'Access denied to this project' });
    }
    
    req.project = project; // Make it available for downstream handlers
    next();
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid project ID format' });
    }
    return res.status(500).json({ success: false, error: 'Error checking project access' });
  }
};

module.exports = {
  isAdmin,
  canAccessProject,
  getProjectAccessFilter,
  requireProjectAccess
};
