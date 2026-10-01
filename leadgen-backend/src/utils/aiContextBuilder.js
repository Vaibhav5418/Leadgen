function buildContactInfo(contact) {
  return {
    name: contact.name || 'there',
    title: contact.title || '',
    company: contact.company || '',
    industry: contact.industry || '',
    location: contact.city || contact.state || contact.country || '',
    keywords: contact.keywords || '',
    website: contact.website || '',
    linkedInUrl: contact.personLinkedinUrl || contact.companyLinkedinUrl || '',
    email: contact.email || '',
    technologies: contact.technologies || '',
    seoDescription: contact.seoDescription || '',
    employees: contact.employees || '',
    annualRevenue: contact.annualRevenue || ''
  };
}

function buildProjectContext(project) {
  if (!project) return '';

  return `
Project Context:
- Company: ${project.companyName || ''}
- Industry: ${project.industry || ''}
- Services Offered: ${project.campaignDetails?.servicesOffered ? Object.keys(project.campaignDetails.servicesOffered).filter(k => project.campaignDetails.servicesOffered[k]).join(', ') : ''}
- Expectations: ${project.campaignDetails?.expectationsFromUs || ''}
`;
}

function buildActivityContext(previousActivities, includeConnectionStatus = false) {
  if (!previousActivities || previousActivities.length === 0) return '';

  const recentActivity = previousActivities[0];
  return `
Previous Interaction Context:
- Last Activity Type: ${recentActivity.type || 'N/A'}
- Last Status: ${recentActivity.status || 'N/A'}
- Last Conversation Notes: ${recentActivity.conversationNotes || 'N/A'}
- Last Template Used: ${recentActivity.template || 'N/A'}${includeConnectionStatus ? `
- Connection Status: ${recentActivity.connected || 'N/A'}` : ''}
`;
}

function buildAIContext({ contact, project, previousActivities }, options = {}) {
  return {
    contactInfo: buildContactInfo(contact),
    projectInfo: buildProjectContext(project),
    activityContext: buildActivityContext(previousActivities, options.includeConnectionStatus)
  };
}

module.exports = {
  buildAIContext,
  buildContactInfo,
  buildProjectContext,
  buildActivityContext
};
