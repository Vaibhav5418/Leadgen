export const COLD_CALLING_REPORT_COLUMNS = [
  { key: 'dataAllocated', label: 'Data Allocated', section: 'DRA', bold: false },
  { key: 'interested', label: 'Interested', section: 'DRA', bold: true },
  { key: 'notInterested', label: 'Not Interested', section: 'DRA', bold: true },
  { key: 'ring', label: 'Ring', section: 'DRA', bold: false },
  { key: 'busy', label: 'Busy', section: 'DRA', bold: false, highlight: true },
  { key: 'hangUp', label: 'Hang Up', section: 'DRA', bold: false },
  { key: 'callBack', label: 'Call Back', section: 'DRA', bold: false },
  { key: 'switchOff', label: 'Switch Off', section: 'DRA', bold: false },
  { key: 'detailsShared', label: 'Detailed Shared', section: 'Cold Calling', bold: true, highlight: true },
  { key: 'future', label: 'Future', section: 'Cold Calling', bold: false },
  { key: 'invalid', label: 'Invalid', section: 'Cold Calling', bold: false },
  { key: 'demoBooked', label: 'Demo Booked', section: 'Cold Calling', bold: true, highlight: true, highlightDark: true },
  { key: 'followUps', label: 'Follow Ups', section: 'Cold Calling', bold: true },
  { key: 'totalCalls', label: 'Total Calls', section: 'Cold Calling', bold: true },
  { key: 'freshCalls', label: '(Fresh Calls + FollowUpS)', section: 'Cold Calling', bold: false, isFormula: true }
];

export const CALL_STATUS_BY_METRIC = {
  interested: 'Interested',
  notInterested: 'Not Interested',
  ring: 'Ring',
  busy: 'Busy',
  hangUp: 'Hang Up',
  callBack: 'Call Back',
  switchOff: 'Switch Off',
  detailsShared: 'Details Shared',
  future: 'Future',
  invalid: 'Invalid',
  demoBooked: 'Demo Booked'
};
