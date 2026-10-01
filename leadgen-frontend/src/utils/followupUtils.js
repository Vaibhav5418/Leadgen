export function matchesFollowupMetric(activity, metric, today, tomorrow, dayAfterTomorrow, channel) {
  if (!activity.nextActionDate) return false;

  try {
    const date = new Date(activity.nextActionDate);
    if (Number.isNaN(date.getTime())) return false;
    date.setHours(0, 0, 0, 0);

    if (metric === 'followups') return true;
    if (metric === 'todayFollowups') return date >= today && date < tomorrow;
    if (metric === 'tomorrowFollowups') return date >= tomorrow && date < dayAfterTomorrow;
    if (metric === 'missedFollowups') return date < today;
    return false;
  } catch (dateError) {
    console.error(`Error parsing nextActionDate for ${channel} activity:`, dateError, activity);
    return false;
  }
}
