const app = require('../server/src/app');

// Vercel Serverless Function entry point
module.exports = (req, res) => {
  // Ensure req.url retains /api prefix for Express routing if stripped or rewritten by Vercel
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};
