const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const authenticate = require('../middleware/auth');

// Simple memory-based rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;

// Initialize Groq client (will be created when API key is available)
let groq = null;

// Function to get or create Groq client
function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Groq API key is not configured');
  }
  
  if (!groq) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
  
  return groq;
}

// Analyze company website using ChatGPT
router.post('/analyze', authenticate, async (req, res) => {
  try {
    // Rate Limiting
    const userId = req.user._id.toString();
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    
    if (now > userLimit.resetTime) {
      userLimit.count = 1;
      userLimit.resetTime = now + RATE_LIMIT_WINDOW;
    } else {
      userLimit.count++;
      if (userLimit.count > MAX_REQUESTS) {
        return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
      }
    }
    rateLimitMap.set(userId, userLimit);
    console.log('=== Company Analysis Request ===');
    console.log('Request body:', req.body);
    
    const { companyName, website, prompt: userPrompt } = req.body;

    if (!website) {
      return res.status(400).json({
        success: false,
        error: 'Website URL is required'
      });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('Groq API key is not configured');
      return res.status(500).json({
        success: false,
        error: 'Groq API key is not configured. Please add GROQ_API_KEY to your .env file.'
      });
    }
    
    console.log('Groq API key found, proceeding with analysis...');

    // Validate Website URL (Basic SSRF / Format Protection)
    const normalizedWebsite = website.startsWith('http') ? website : `https://${website}`;
    let parsedUrl;
    try {
      parsedUrl = new URL(normalizedWebsite);
      const host = parsedUrl.hostname.toLowerCase();
      // Block common internal/private IP ranges or localhost
      if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.startsWith('192.168.') || host.startsWith('10.') || host.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
         return res.status(400).json({ success: false, error: 'Invalid or restricted website URL' });
      }
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid website URL format' });
    }

    const derivedCompanyName = companyName || parsedUrl.hostname.replace(/^www\./, '');

    // Create prompt for Groq model (allows user override)
    const defaultPrompt = `
Analyze the following company website as a business expert:

Website URL: ${normalizedWebsite}

Carefully review the website content including:
- Homepage messaging
- Services / Products
- Value propositions
- Target audience
- Positioning and claims

Provide a structured analysis with the following sections:

- Company Overview (What they do, target customers, market focus)
- Company's Core Offering (Primary services, solutions, value)
- Other Important Business Information (ICP, revenue model, differentiators, red flags)

Formatting Rules:
- Return ONLY a valid JSON object. Do not include markdown code blocks or explanatory text.
- The JSON object must strictly follow this exact structure:
{
  "companyOverview": "String describing the overview",
  "coreOffering": "String describing the core offerings",
  "businessConsiderations": "String describing other business information"
}
- Base conclusions strictly on website content and reasonable inference
- Keep language professional and concise`;

    const prompt = userPrompt?.trim()
      ? `${userPrompt.trim()}\n\nWebsite URL: ${normalizedWebsite}`
      : defaultPrompt;

    // Get Groq client
    const groqClient = getGroqClient();
    
    // Call Groq API (OpenAI-compatible chat.completions)
    const modelCandidates = [
      'llama-3.3-70b-versatile',   // recommended current
      'llama-3.2-11b-text-preview' // lightweight fallback
    ];

    let completion;
    let lastErr;
    for (const model of modelCandidates) {
      try {
        completion = await groqClient.chat.completions.create({
          model,
      messages: [
        {
          role: 'system',
          content: 'You are a Business Expert specializing in company analysis and market research. Provide detailed, professional, and actionable insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.7
    });
        lastErr = null;
        break;
      } catch (modelErr) {
        lastErr = modelErr;
        // try next model if decommissioned/unavailable
        if (!(modelErr?.message?.includes('model') || modelErr?.code === 'model_decommissioned')) {
          break;
        }
      }
    }

    if (!completion && lastErr) {
      throw lastErr;
    }

    const analysisText = completion.choices[0].message.content;

    // Parse the analysis into structured format safely
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
      // Validate schema
      if (!analysis.companyOverview && !analysis.coreOffering) {
        throw new Error('Invalid JSON schema returned');
      }
    } catch (parseError) {
      console.error('Failed to parse AI JSON response:', parseError);
      return res.status(500).json({ success: false, error: 'Failed to process AI analysis properly.' });
    }

    res.json({
      success: true,
      data: {
        companyName: derivedCompanyName,
        website: normalizedWebsite,
        analysis,
        fullText: analysisText,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('=== Error analyzing company ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error type:', error.constructor.name);
    console.error('Error status:', error.status);
    console.error('Error code:', error.code);
    
    // Provide more specific error messages
    let errorMessage;
    let statusCode = 500;
    
    // Check for quota/billing errors (429 status)
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('billing')) {
      statusCode = 429;
      errorMessage = 'Groq API quota exceeded. Please check your Groq account billing and add credits.';
    } else if (error.message?.includes('API key') || error.message?.includes('Invalid API key') || error.status === 401) {
      statusCode = 401;
      errorMessage = 'Groq API key is invalid or not configured. Please check your .env file.';
    } else if (error.message?.includes('rate limit') || error.code === 'rate_limit_exceeded') {
      statusCode = 429;
      errorMessage = 'Groq API rate limit exceeded. Please try again later.';
    } else if (error.message?.includes('insufficient_quota') || error.code === 'insufficient_quota') {
      statusCode = 429;
      errorMessage = 'Groq API quota exceeded. Please check your Groq account balance.';
    } else {
      // Do not expose raw error messages
      errorMessage = 'An error occurred during company analysis.';
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

// Get cached analysis for a company (if stored in database)
router.get('/:companyName', authenticate, async (req, res) => {
  try {
    const { companyName } = req.params;
    const decodedCompanyName = decodeURIComponent(companyName);

    // For now, we'll return a message that analysis needs to be generated
    // In the future, you could store analyses in the database
    res.json({
      success: true,
      message: 'Analysis not cached. Please generate analysis using POST /analyze',
      companyName: decodedCompanyName
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analysis.'
    });
  }
});

module.exports = router;
