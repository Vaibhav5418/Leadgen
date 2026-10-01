const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const ProspectContact = require('../models/ProspectContact');
const { fetchLinkedInDataMock } = require('../services/linkedin');
const authenticate = require('../middleware/auth');
const { validateContactAccess } = require('../middleware/contactAuthorization');

// Get stored LinkedIn data
router.get('/:contactId', authenticate, async (req, res) => {
  try {
    const { contactId } = req.params;
    
    const accessError = await validateContactAccess(req, contactId, 'Access denied: You do not have permission to view this contact');
    if (accessError) return res.status(accessError.status).json({ success: false, error: accessError.message });

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
    
    const accessError = await validateContactAccess(req, contactId, 'Access denied: You do not have permission to modify this contact');
    if (accessError) return res.status(accessError.status).json({ success: false, error: accessError.message });

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
