const express = require('express');
const router = express.Router();
const { generatePersonalizedEmail, generatePersonalizedLinkedInMessage } = require('../services/aiService');
const authenticate = require('../middleware/auth');
const { requireProjectAccess } = require('../middleware/projectAccess');
const { getAIErrorResponse } = require('../utils/aiErrorHandler');

/**
 * Generate personalized email
 * POST /api/ai/generate-email
 * Body: { contactId, projectId, baseTemplate?, templateType? }
 * templateType: 'introduction-email' | 'follow-up-email' | 'value-proposition-email' | 'no-template'
 */
router.post('/generate-email', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const { contactId, projectId, baseTemplate, templateType } = req.body;

    if (!contactId) {
      return res.status(400).json({
        success: false,
        error: 'Contact ID is required'
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    if (baseTemplate && baseTemplate.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Base template exceeds maximum allowed length of 5000 characters'
      });
    }

    // Generate personalized email (templateType drives Introduction / Follow-up / Value Proposition style)
    const result = await generatePersonalizedEmail(contactId, projectId, baseTemplate, templateType);

    res.json({
      success: true,
      data: {
        emailContent: result.emailContent,
        emailSubject: result.emailSubject || '',
        emailBody: result.emailBody || result.emailContent,
        contactInfo: result.contactInfo
      }
    });
  } catch (error) {
    console.error('Error generating email:', error);
    
    const { statusCode, errorMessage } = getAIErrorResponse(error, 'Failed to generate personalized email');

    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * Generate personalized LinkedIn message
 * POST /api/ai/generate-linkedin
 * Body: { contactId, projectId, baseTemplate? }
 */
router.post('/generate-linkedin', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const { contactId, projectId, baseTemplate } = req.body;

    if (!contactId) {
      return res.status(400).json({
        success: false,
        error: 'Contact ID is required'
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    if (baseTemplate && baseTemplate.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Base template exceeds maximum allowed length of 5000 characters'
      });
    }

    // Generate personalized LinkedIn message
    const result = await generatePersonalizedLinkedInMessage(contactId, projectId, baseTemplate);

    res.json({
      success: true,
      data: {
        linkedInMessage: result.linkedInMessage,
        contactInfo: result.contactInfo
      }
    });
  } catch (error) {
    console.error('Error generating LinkedIn message:', error);
    
    const { statusCode, errorMessage } = getAIErrorResponse(error, 'Failed to generate personalized LinkedIn message');

    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

module.exports = router;
