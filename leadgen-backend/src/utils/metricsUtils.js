const DEFAULT_CONVERSION_METRICS = {
  total: 0,
  won: 0,
  lost: 0,
  meetings: 0,
  sql: 0,
  cip: 0
};

function buildActivityMetricsAggregation() {
  return [
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$createdBy',
        name: { $first: '$user.name' },
        email: { $first: '$user.email' },
        activityCount: { $sum: 1 },
        calls: { $sum: { $cond: [{ $eq: ['$type', 'call'] }, 1, 0] } },
        emails: { $sum: { $cond: [{ $eq: ['$type', 'email'] }, 1, 0] } },
        linkedin: { $sum: { $cond: [{ $eq: ['$type', 'linkedin'] }, 1, 0] } }
      }
    }
  ];
}

function buildConversionMetricsStage() {
  return {
    $group: {
      _id: null,
      total: { $sum: 1 },
      won: { $sum: { $cond: [{ $eq: ['$stage', 'WON'] }, 1, 0] } },
      lost: { $sum: { $cond: [{ $eq: ['$stage', 'Lost'] }, 1, 0] } },
      meetings: {
        $sum: {
          $cond: [{ $in: ['$stage', ['Meeting Scheduled', 'Meeting Completed', 'In-Person Meeting']] }, 1, 0]
        }
      },
      sql: { $sum: { $cond: [{ $eq: ['$stage', 'SQL'] }, 1, 0] } },
      cip: { $sum: { $cond: [{ $eq: ['$stage', 'CIP'] }, 1, 0] } }
    }
  };
}

function calculateConversionRates(conversionData) {
  const data = getConversionData(conversionData);
  return {
    winRate: data.total > 0 ? ((data.won / data.total) * 100).toFixed(1) : 0,
    meetingRate: data.total > 0 ? ((data.meetings / data.total) * 100).toFixed(1) : 0
  };
}

function getConversionData(conversionData) {
  return conversionData || { ...DEFAULT_CONVERSION_METRICS };
}

function buildActivityTrendData(activityTrends) {
  const trendData = {};
  activityTrends.forEach(item => {
    const date = item._id.date;
    if (!trendData[date]) trendData[date] = { call: 0, email: 0, linkedin: 0 };
    trendData[date][item._id.type] = item.count;
  });

  const trendLabels = Object.keys(trendData).sort((a, b) => a.localeCompare(b));
  return {
    trendData,
    trendLabels,
    trendCallData: trendLabels.map(date => trendData[date].call || 0),
    trendEmailData: trendLabels.map(date => trendData[date].email || 0),
    trendLinkedInData: trendLabels.map(date => trendData[date].linkedin || 0)
  };
}

function addProjectTeamMembers(teamMemberEmails, project) {
  if (project.teamMembers && Array.isArray(project.teamMembers)) {
    project.teamMembers.forEach(email => {
      if (email && email.trim()) teamMemberEmails.add(email.toLowerCase().trim());
    });
  }
  if (project.assignedTo && project.assignedTo.trim()) {
    teamMemberEmails.add(project.assignedTo.toLowerCase().trim());
  }
}

module.exports = {
  addProjectTeamMembers,
  buildActivityMetricsAggregation,
  buildActivityTrendData,
  buildConversionMetricsStage,
  calculateConversionRates,
  getConversionData
};
