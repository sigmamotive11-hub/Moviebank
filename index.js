const express = require('express');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');

const app = express();

// ── CORS ──
app.use(cors());
app.use(express.json());

// ── CLOUDINARY CONFIG ──
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── IN-MEMORY CACHE ──
let cache = { videos: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ── ROUTES ──

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Fetch all videos from Cloudinary
app.get('/api/videos', async (req, res) => {
  const now = Date.now();

  // Return cached data if still fresh
  if (cache.videos && (now - cache.timestamp) < CACHE_TTL) {
    res.set('Cache-Control', 'public, max-age=300');
    return res.json({ videos: cache.videos, total: cache.videos.length, cached: true });
  }

  try {
    const result = await cloudinary.api.resources({
      resource_type: 'video',
      max_results: 100,
      context: true,
      tags: true,
    });

    const videos = result.resources.map((v) => ({
      id:          v.public_id,
      title:       v.context?.custom?.caption || formatTitle(v.public_id),
      url:         v.secure_url,
      thumbnail:   cloudinary.url(v.public_id, {
                     resource_type: 'video',
                     format: 'jpg',
                     transformation: [{ width: 640, height: 360, crop: 'fill' }],
                   }),
      duration:    v.duration || 0,
      format:      v.format,
      width:       v.width,
      height:      v.height,
      bytes:       v.bytes,
      tags:        v.tags || [],
      created_at:  v.created_at,
    }));

    // Sort newest first
    videos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Store in cache
    cache.videos = videos;
    cache.timestamp = now;

    res.set('Cache-Control', 'public, max-age=300');
    res.json({ videos, total: videos.length });
  } catch (err) {
    console.error('Cloudinary error:', err);
    res.status(500).json({ error: 'Failed to fetch videos', message: err.message });
  }
});

// Helper: turn "my_cool_video/title" into "My Cool Video Title"
function formatTitle(publicId) {
  return publicId
    .split('/').pop()
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = app;
