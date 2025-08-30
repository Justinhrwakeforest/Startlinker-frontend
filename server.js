const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// API proxy - forward API requests to backend
app.use('/api', (req, res) => {
  res.redirect(`https://startlinker-backend.onrender.com${req.originalUrl}`);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Handle React routing, return all requests to React app
// This must be placed after all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Serving React app from ${path.join(__dirname, 'build')}`);
});