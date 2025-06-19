const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Allow requests from your frontend
app.use(cors());

// Proxy requests to the real API
app.use('/api', createProxyMiddleware({
    target: 'http://ontheway.runasp.net',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '/api', // keeps the /api path
    },
}));

app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
});
