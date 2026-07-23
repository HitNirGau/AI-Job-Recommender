/**
 * Converts backend errors, Axios errors, or JavaScript exceptions into clean,
 * polite, user-friendly messages suitable for displaying on screen.
 * Filters out internal developer jargon like ports, server URLs, stack traces, and database names.
 *
 * @param {any} err - The error object or string captured in catch blocks
 * @param {string} defaultMessage - Fallback user message if error details are unavailable
 * @returns {string} User-readable error string
 */
export function formatUserError(err, defaultMessage = 'An unexpected error occurred. Please try again.') {
  if (!err) return defaultMessage;

  // 1. If error is a simple string, clean any developer jargon
  if (typeof err === 'string') {
    return cleanDeveloperJargon(err, defaultMessage);
  }

  // 2. Extract message from Axios response payload if present
  const responseData = err.response?.data;
  let backendMsg = '';

  if (typeof responseData === 'string') {
    backendMsg = responseData;
  } else if (responseData) {
    if (responseData.msg) {
      backendMsg = responseData.msg;
    } else if (responseData.error) {
      backendMsg = responseData.error;
    } else if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
      backendMsg = responseData.errors.map(e => e.msg || e.message || e).join('. ');
    } else if (responseData.detail) {
      backendMsg = typeof responseData.detail === 'string' ? responseData.detail : JSON.stringify(responseData.detail);
    }
  }

  if (backendMsg) {
    return cleanDeveloperJargon(backendMsg, defaultMessage);
  }

  // 3. Handle standard HTTP status codes
  const status = err.response?.status;
  if (status === 401) {
    return 'Your session has expired or you are unauthorized. Please log in again.';
  } else if (status === 403) {
    return 'You do not have permission to perform this action.';
  } else if (status === 404) {
    return 'The requested resource could not be found.';
  } else if (status === 413) {
    return 'File size is too large. Please upload a smaller file.';
  } else if (status === 429) {
    return 'Service is currently experiencing high demand. Please try again in a few moments.';
  } else if (status >= 500) {
    return 'Our servers encountered an issue while processing your request. Please try again shortly.';
  }

  // 4. Handle Network / Connection errors
  if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || err.message?.includes('ECONNREFUSED')) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }

  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // 5. Fallback to general error message
  if (err.message) {
    return cleanDeveloperJargon(err.message, defaultMessage);
  }

  return defaultMessage;
}

/**
 * Filter out developer technical jargon (port numbers, python scripts, stack traces, node modules, etc.)
 */
function cleanDeveloperJargon(text, fallback) {
  if (!text || typeof text !== 'string') return fallback;

  // List of technical patterns to sanitize
  const devPatterns = [
    /Python NLP Service/i,
    /http:\/\/127\.0\.0\.1/i,
    /http:\/\/localhost/i,
    /AxiosError/i,
    /ECONNREFUSED/i,
    /MongoDB/i,
    /JSEARCH_API_KEY/i,
    /GEMINI_API_KEY/i,
    /Cast to ObjectId/i,
    /TypeError:/i,
    /ReferenceError:/i,
    /SyntaxError:/i,
    /Server error/i
  ];

  const containsDevJargon = devPatterns.some(pattern => pattern.test(text));

  if (containsDevJargon) {
    if (text.toLowerCase().includes('nlp') || text.toLowerCase().includes('parse') || text.toLowerCase().includes('resume')) {
      return 'Unable to process resume at this time. Please check your document format (PDF or DOCX) and try again.';
    }
    if (text.toLowerCase().includes('job') || text.toLowerCase().includes('jsearch')) {
      return 'Job service is temporarily operating in fallback mode. Showing saved database jobs.';
    }
    if (text.toLowerCase().includes('key') || text.toLowerCase().includes('api')) {
      return 'Service is operating in fallback mode. Please try again later.';
    }
    return fallback;
  }

  return text;
}
