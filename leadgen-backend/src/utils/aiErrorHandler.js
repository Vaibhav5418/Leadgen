function getAIErrorResponse(error, defaultMessage) {
  let statusCode = 500;
  let errorMessage = defaultMessage;

  if (error.message?.includes('API key') || error.message?.includes('Groq API key')) {
    errorMessage = 'Groq API key is not configured. Please add GROQ_API_KEY to your .env file.';
  } else if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('billing')) {
    statusCode = 429;
    errorMessage = 'Groq API quota exceeded. Please check your Groq account billing and add credits.';
  } else if (error.message?.includes('Contact not found')) {
    statusCode = 404;
  } else if (error.message?.includes('Contact does not belong')) {
    statusCode = 403;
    errorMessage = 'Access denied: Contact does not belong to the specified project';
  } else {
    errorMessage = 'Unable to generate the requested content.';
  }

  return { statusCode, errorMessage };
}

module.exports = { getAIErrorResponse };
