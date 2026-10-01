const COMMON_METRICS = {
  accepted: activity => [
    'Interested',
    'Meeting Proposed',
    'Meeting Scheduled'
  ].includes(activity.status),
  cip: activity => activity.status === 'CIP',
  meetingProposed: activity => activity.status === 'Meeting Proposed',
  scheduled: activity => activity.status === 'Meeting Scheduled',
  completed: activity => activity.status === 'Meeting Completed'
};

const FUNNEL_CONFIGS = {
  email: {
    primaryMetric: 'emailSent',
    metrics: {
      emailSent: activity => Boolean(activity.emailDate),
      ...COMMON_METRICS,
      cip: activity => ['Interested', 'Out of Office'].includes(activity.status),
      scheduled: activity => activity.status === 'Meeting Scheduled' || Boolean(activity.nextActionDate),
      sql: activity => activity.status === 'Meeting Completed' || (
        activity.status === 'Interested' &&
        activity.conversationNotes &&
        activity.conversationNotes.length > 50
      )
    },
    isFollowup: activities => {
      const emailsWithNotes = activities.filter(activity => (
        activity.conversationNotes && activity.conversationNotes.trim() !== ''
      ));
      return emailsWithNotes.length > 1 || activities.length > 1;
    }
  },
  linkedin: {
    primaryMetric: 'connectionSent',
    metrics: {
      connectionSent: activity => activity.lnRequestSent === 'Yes' || activity.lnRequestSent === true,
      ...COMMON_METRICS,
      accepted: activity => activity.connected === 'Yes' || activity.connected === true,
      sql: activity => activity.status === 'Meeting Completed' || activity.status === 'Interested'
    },
    isFollowup: activities => activities.filter(activity => (
      activity.conversationNotes && activity.conversationNotes.trim() !== ''
    )).length > 1
  }
};

export function createInitialFunnelData(channel, prospectData = 0) {
  const primaryMetric = FUNNEL_CONFIGS[channel].primaryMetric;
  return {
    prospectData,
    [primaryMetric]: 0,
    accepted: 0,
    followups: 0,
    cip: 0,
    meetingProposed: 0,
    scheduled: 0,
    completed: 0,
    sql: 0
  };
}

export function calculateFunnelData({ channel, contacts, activities }) {
  const config = FUNNEL_CONFIGS[channel];
  const data = createInitialFunnelData(channel, contacts.length);
  const contactActivities = {};
  const metricSets = Object.fromEntries(
    Object.keys(config.metrics).map(metric => [metric, new Set()])
  );

  activities.forEach(activity => {
    if (!activity.contactId) return;
    const contactId = activity.contactId.toString();
    if (!contactActivities[contactId]) contactActivities[contactId] = [];
    contactActivities[contactId].push(activity);

    Object.entries(config.metrics).forEach(([metric, matches]) => {
      if (matches(activity)) metricSets[metric].add(contactId);
    });
  });

  data.followups = Object.values(contactActivities)
    .filter(activitiesForContact => config.isFollowup(activitiesForContact))
    .length;
  Object.entries(metricSets).forEach(([metric, contactsForMetric]) => {
    data[metric] = contactsForMetric.size;
  });

  return data;
}
