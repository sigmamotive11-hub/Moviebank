const express = require('express');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let cache = { videos: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000;

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..')));

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/videos', async (req, res) => {
  const now = Date.now();
  if (cache.videos && (now - cache.timestamp) < CACHE_TTL) {
    res.set('Cache-Control', 'public, max-age=300');
    return res.json({ videos: cache.videos, total: cache.videos.length });
  }
  try {
    const result = await cloudinary.api.resources({
      resource_type: 'video',
      max_results: 100,
      context: true,
      tags: true,
    });
    const videos = result.resources.map((v) => ({
      id:         v.public_id,
      title:      v.context?.custom?.caption || formatTitle(v.public_id),
      url:        v.secure_url,
      thumbnail:  cloudinary.url(v.public_id, {
                    resource_type: 'video',
                    format: 'jpg',
                    transformation: [{ width: 640, height: 360, crop: 'fill' }],
                  }),
      duration:   v.duration || 0,
      format:     v.format,
      bytes:      v.bytes,
      tags:       v.tags || [],
      created_at: v.created_at,
    }));
    videos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    cache.videos = videos;
    cache.timestamp = now;
    res.set('Cache-Control', 'public, max-age=300');
    res.json({ videos, total: videos.length });
  } catch (err) {
    console.error('Cloudinary error:', err);
    res.status(500).json({ error: 'Failed to fetch videos', message: err.message });
  }
});

// Fallback — serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

function formatTitle(publicId) {
  return publicId.split('/').pop().replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));

module.exports = app;
