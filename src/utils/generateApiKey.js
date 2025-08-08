const crypto = require('crypto');

/**
 * Generate a secure API key
 * @param {number} length - Length of the API key (default: 32)
 * @returns {string} - Generated API key
 */
function generateApiKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a formatted API key with prefix
 * @param {string} prefix - Prefix for the API key (default: 'pdf')
 * @param {number} length - Length of the random part (default: 32)
 * @returns {string} - Formatted API key
 */
function generateFormattedApiKey(prefix = 'pdf', length = 32) {
  const randomPart = crypto.randomBytes(length).toString('hex');
  return `${prefix}_${randomPart}`;
}

// If run directly, generate and display an API key
if (require.main === module) {
  const apiKey = generateFormattedApiKey('html2pdf', 32);
  console.log('🔑 Generated API Key:');
  console.log(apiKey);
  console.log('\n📋 Add this to your environment variables:');
  console.log(`API_KEY=${apiKey}`);
  console.log('\n🔒 Keep this key secure and never commit it to version control!');
}

module.exports = {
  generateApiKey,
  generateFormattedApiKey
};