const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const Project = require('../models/Project');
const { canAccessProject, isAdmin } = require('./projectAccess');

async function authorizeActivityAccess(req, activityId, options = {}) {
  if (!mongoose.Types.ObjectId.isValid(activityId)) {
    return { error: { status: 400, message: 'Invalid activity ID format' } };
  }

  const activityQuery = Activity.findById(activityId);
  const activity = options.lean ? await activityQuery.lean() : await activityQuery;
  if (!activity) {
    return { error: { status: 404, message: 'Activity not found' } };
  }

  const project = await Project.findById(activity.projectId);
  if (!project || !canAccessProject(req.user, project)) {
    return { error: { status: 403, message: 'Access denied' } };
  }

  if (options.requireOwner && !isAdmin(req.user) && activity.createdBy.toString() !== req.user._id.toString()) {
    return { error: { status: 403, message: options.ownerError || 'Cannot modify another user\'s activity' } };
  }

  return { activity, project };
}

module.exports = { authorizeActivityAccess };
