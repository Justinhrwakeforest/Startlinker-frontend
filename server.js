const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const buildPath = path.join(__dirname, 'build');
const indexPath = path.join(buildPath, 'index.html');

// Log server startup
console.log('Starting server...');
console.log('Build directory:', buildPath);
console.log('Build directory exists:', fs.existsSync(buildPath));
console.log('Index.html exists:', fs.existsSync(indexPath));

// Serve static files from the React app build directory
app.use(express.static(buildPath));

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API proxy - forward API requests to backend
app.use('/api', (req, res) => {
  const redirectUrl = `https://startlinker-backend.onrender.com${req.originalUrl}`;
  console.log(`Redirecting API request to: ${redirectUrl}`);
  res.redirect(redirectUrl);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    buildExists: fs.existsSync(buildPath),
    indexExists: fs.existsSync(indexPath)
  });
});

// Handle React routing, return all requests to React app
// This must be placed after all other routes
app.get('*', (req, res) => {
  console.log(`Serving index.html for route: ${req.path}`);
  
  // Check if index.html exists
  if (!fs.existsSync(indexPath)) {
    console.error('ERROR: index.html not found at:', indexPath);
    return res.status(404).send(`
      <html>
        <body>
          <h1>Build not found</h1>
          <p>The React build directory does not exist. Please ensure the build command has run successfully.</p>
          <p>Looking for: ${indexPath}</p>
        </body>
      </html>
    `);
  }
  
  res.sendFile(indexPath);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Serving React app from ${buildPath}`);
  
  if (!fs.existsSync(buildPath)) {
    console.error('WARNING: Build directory does not exist!');
    console.error('Make sure to run "npm run build" before starting the server.');
  }
});