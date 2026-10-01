const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectContact = require('../models/ProjectContact');
const { getProjectAccessFilter } = require('./projectAccess');

async function authorizeContactAccess(req, contactId) {
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    throw new Error('Invalid contact ID format');
  }
  if (req.user.isAdmin || req.user.role === 'admin') return true;

  const userProjects = await Project.find(getProjectAccessFilter(req.user)).select('_id').lean();
  const isLinked = await ProjectContact.exists({
    contactId,
    projectId: { $in: userProjects.map(project => project._id) }
  });
  return !!isLinked;
}

async function validateContactAccess(req, contactId, deniedMessage) {
  try {
    const isAuthorized = await authorizeContactAccess(req, contactId);
    return isAuthorized ? null : { status: 403, message: deniedMessage };
  } catch (error) {
    if (error.message === 'Invalid contact ID format') {
      return { status: 400, message: error.message };
    }
    throw error;
  }
}

module.exports = { authorizeContactAccess, validateContactAccess };
