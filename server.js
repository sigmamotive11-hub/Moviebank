// Local dev server only — not used on Vercel
require('dotenv').config();
const path = require('path');
const app = require('./api/index');

// Serve static frontend locally
const express = require('express');
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MovieSafe running at http://localhost:${PORT}`);
});
