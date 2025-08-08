const rateLimit = require('express-rate-limit');

/**
 * API Key Authentication Middleware
 * Validates API key from Authorization header or x-api-key header
 */
const authenticateApiKey = (req, res, next) => {
  // Get API key from headers
  const apiKey = req.headers['x-api-key'] || 
                 req.headers['authorization']?.replace('Bearer ', '') ||
                 req.query.api_key; // Allow query parameter for testing

  // Get expected API key from environment
  const expectedApiKey = process.env.API_KEY;

  // Check if API key is configured
  if (!expectedApiKey) {
    console.error('⚠️  API_KEY environment variable not configured');
    return res.status(500).json({
      success: false,
      error: 'Server configuration error',
      message: 'API authentication not properly configured'
    });
  }

  // Check if API key was provided
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'API key is required. Provide it via x-api-key header, Authorization: Bearer header, or api_key query parameter.'
    });
  }

  // Validate API key
  if (apiKey !== expectedApiKey) {
    console.warn(`🚫 Invalid API key attempt from ${req.ip}: ${apiKey.substring(0, 8)}...`);
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
      message: 'The provided API key is not valid.'
    });
  }

  // Log successful authentication (don't log the full key)
  console.log(`✅ API key authenticated from ${req.ip}`);
  next();
};

/**
 * Optional: More restrictive rate limiting for API key users
 */
const apiKeyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT_MAX) || 500, // Higher limit for authenticated users
  message: {
    success: false,
    error: 'Rate limit exceeded',
    message: 'יותר מדי בקשות עם מפתח API זה, אנא נסה שוב מאוחר יותר.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use API key as identifier instead of IP
  keyGenerator: (req) => {
    return req.headers['x-api-key'] || 
           req.headers['authorization']?.replace('Bearer ', '') || 
           req.ip;
  }
});

/**
 * Combined middleware: rate limiting + API key auth
 */
const authenticatedRateLimit = [apiKeyRateLimit, authenticateApiKey];

/**
 * Health check bypass - allows unauthenticated health checks
 */
const bypassHealthCheck = (req, res, next) => {
  if (req.path === '/api/health') {
    return next();
  }
  return authenticateApiKey(req, res, next);
};

module.exports = {
  authenticateApiKey,
  apiKeyRateLimit,
  authenticatedRateLimit,
  bypassHealthCheck
};