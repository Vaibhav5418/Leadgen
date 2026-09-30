export function buildLineChart(labels, reportData, series) {
  return {
    labels,
    datasets: series.map(({ key, label, borderColor, backgroundColor, transform }) => ({
      label,
      data: labels.map(period => {
        const value = reportData[period]?.[key] || 0;
        return transform ? transform(value) : value;
      }),
      borderColor,
      backgroundColor,
      tension: 0.4,
      fill: true
    }))
  };
}

export function buildBarChart(labels, reportData, series) {
  return {
    labels,
    datasets: series.map(({ key, label, backgroundColor }) => ({
      label,
      data: labels.map(period => reportData[period]?.[key] || 0),
      backgroundColor
    }))
  };
}

export function buildMeetingPipelineChart(labels, reportData, scheduledColor) {
  const values = (key) => labels.map(period => reportData[period]?.[key] || 0);

  return {
    labels,
    datasets: [
      {
        label: 'Meeting Proposed',
        data: values('meetingProposed'),
        backgroundColor: 'rgba(251, 191, 36, 0.8)'
      },
      {
        label: 'Meeting Scheduled',
        data: values('meetingScheduled'),
        backgroundColor: scheduledColor
      },
      {
        label: 'Meeting Completed',
        data: values('meetingCompleted'),
        backgroundColor: 'rgba(34, 197, 94, 0.8)'
      }
    ]
  };
}
