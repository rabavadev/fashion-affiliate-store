import defaultApp from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

const server = defaultApp.listen(PORT, () => {
  console.log(`[fashion-affiliate-backend] Server running on http://localhost:${PORT}`);
  console.log(`[fashion-affiliate-backend] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[fashion-affiliate-backend] Health check at http://localhost:${PORT}/api/health`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[fashion-affiliate-backend] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[fashion-affiliate-backend] HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('[fashion-affiliate-backend] SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('[fashion-affiliate-backend] HTTP server closed');
  });
});
