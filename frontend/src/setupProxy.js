const { createProxyMiddleware } = require('http-proxy-middleware');

// Only proxy API requests to the backend to avoid proxying static assets (e.g. /favicon.ico)
module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
    })
  );
};