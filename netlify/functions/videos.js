const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let cache = { videos: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000;

exports.handler = async function(event, context) {
  const now = Date.now();

  if (cache.videos && (now - cache.timestamp) < CACHE_TTL) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      body: JSON.stringify({ videos: cache.videos, total: cache.videos.length }),
    };
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      body: JSON.stringify({ videos, total: videos.length }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to fetch videos', message: err.message }),
    };
  }
};

function formatTitle(publicId) {
  return publicId.split('/').pop().replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
