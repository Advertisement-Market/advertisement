const { createProxyMiddleware } = require('http-proxy-middleware');

// Proxy all backend routes to Spring Boot on port 8080
module.exports = function(app) {
  const target = 'http://localhost:8080';
  const proxyConfig = { target, changeOrigin: true };

  app.use('/api', createProxyMiddleware(proxyConfig));    // /api/v1/assets, /api/health
  app.use('/auth', createProxyMiddleware(proxyConfig));   // /auth/login, /auth/register, /auth/refresh, /auth/logout
};