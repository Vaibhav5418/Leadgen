const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const ProspectContact = require('../models/ProspectContact');
const ProjectContact = require('../models/ProjectContact');
const { fetchLinkedInDataMock } = require('../services/linkedin');
const authenticate = require('../middleware/auth');
const { getProjectAccessFilter } = require('../middleware/projectAccess');

// Helper to authorize contact access
async function authorizeContactAccess(req, contactId) {
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    throw new Error('Invalid contact ID format');
  }

  // Admin can access any contact
  if (req.user.isAdmin || req.user.role === 'admin') return true;

  // Check if contact belongs to a project the user has access to
  const projectFilter = getProjectAccessFilter(req.user);
  
  // Find projects the user has access to
  const Project = require('../models/Project');
  const userProjects = await Project.find(projectFilter).select('_id').lean();
  const projectIds = userProjects.map(p => p._id);

  // Check if the contact is linked to any of these projects
  const isLinked = await ProjectContact.exists({
    contactId: contactId,
    projectId: { $in: projectIds }
  });

  return !!isLinked;
}

// Get stored LinkedIn data
router.get('/:contactId', authenticate, async (req, res) => {
  try {
    const { contactId } = req.params;
    
    try {
      const isAuthorized = await authorizeContactAccess(req, contactId);
      if (!isAuthorized) {
        return res.status(403).json({ success: false, error: 'Access denied: You do not have permission to view this contact' });
      }
    } catch (e) {
      if (e.message === 'Invalid contact ID format') {
        return res.status(400).json({ success: false, error: e.message });
      }
      throw e;
    }

    // Try ProspectContact first (for project contacts), then Contact (for databank contacts)
    let contact = await ProspectContact.findById(contactId);
    if (!contact) {
      contact = await Contact.findById(contactId);
    }
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    res.json({
      success: true,
      data: {
        linkedinData: contact.linkedinData,
        lastLinkedInFetch: contact.lastLinkedInFetch
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve LinkedIn data' });
  }
});

// Fetch from LinkedIn (mock) and store
router.get('/fetch/:contactId', authenticate, async (req, res) => {
  try {
    const { contactId } = req.params;
    
    try {
      const isAuthorized = await authorizeContactAccess(req, contactId);
      if (!isAuthorized) {
        return res.status(403).json({ success: false, error: 'Access denied: You do not have permission to modify this contact' });
      }
    } catch (e) {
      if (e.message === 'Invalid contact ID format') {
        return res.status(400).json({ success: false, error: e.message });
      }
      throw e;
    }

    // Try ProspectContact first (for project contacts), then Contact (for databank contacts)
    let contact = await ProspectContact.findById(contactId);
    let isProspectContact = true;
    if (!contact) {
      contact = await Contact.findById(contactId);
      isProspectContact = false;
    }
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    
    // Check if we should fetch company LinkedIn data
    const fetchCompany = req.query.type === 'company';
    const linkedinUrl = fetchCompany && contact.companyLinkedinUrl
      ? contact.companyLinkedinUrl
      : (contact.personLinkedinUrl || contact.companyLinkedinUrl);
    
    if (!linkedinUrl) {
      return res.status(400).json({ success: false, error: 'No LinkedIn URL on this contact' });
    }

    const linkedinData = await fetchLinkedInDataMock(linkedinUrl);
    console.log('Fetched LinkedIn data:', linkedinData);
    console.log('Existing contact linkedinData:', contact.linkedinData);
    
    // Merge with existing LinkedIn data if it exists (to preserve both person and company data)
    if (contact.linkedinData && typeof contact.linkedinData === 'object') {
      contact.linkedinData = { ...contact.linkedinData, ...linkedinData };
    } else {
      contact.linkedinData = linkedinData;
    }
    
    contact.lastLinkedInFetch = new Date();
    const savedContact = await contact.save();
    console.log(`Saved ${isProspectContact ? 'prospect ' : ''}contact linkedinData:`, savedContact.linkedinData);

    // Convert to plain object to ensure all fields are included
    const contactObj = savedContact.toObject ? savedContact.toObject() : savedContact;

    res.json({
      success: true,
      data: {
        contact: contactObj,
        linkedinData: contactObj.linkedinData
      }
    });
  } catch (error) {
    console.error('LinkedIn fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch LinkedIn data' });
  }
});

module.exports = router;
