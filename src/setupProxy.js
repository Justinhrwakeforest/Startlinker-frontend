const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://13.50.234.250',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', details: err.message });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying request:', req.method, req.url, '-> http://localhost:8000' + req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('Proxy response:', proxyRes.statusCode, req.url);
      }
    })
  );
  
  app.use(
    '/messaging',
    createProxyMiddleware({
      target: 'http://13.50.234.250',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      pathRewrite: {
        '^/messaging': '/messaging'
      }
    })
  );
  
  app.use(
    '/media',
    createProxyMiddleware({
      target: 'http://13.50.234.250',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug'
    })
  );
};