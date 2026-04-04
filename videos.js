// ============================================
// ADD YOUR GOOGLE DRIVE VIDEOS HERE
// 1. Upload to Google Drive
// 2. Right click > Share > Anyone with the link
// 3. Copy the file ID from the URL
// 4. Add an entry below
// ============================================
const VIDEOS = [
  {
    id: '1O6uYZ6APwpLHhoxyERxK8VPvlG5DXMAh',
    title: 'My First Video',
    category: 'personal',
    tags: ['personal'],
    date: '2024-01-01',
  },
  // Add more videos like this:
  // {
  //   id: 'YOUR_GOOGLE_DRIVE_FILE_ID',
  //   title: 'Video Title',
  //   category: 'movie', // movie, tv, personal, other
  //   tags: ['action', 'drama'],
  //   date: '2024-01-01',
  // },
];

exports.handler = async function(event, context) {
  const videos = VIDEOS.map(v => ({
    ...v,
    embedUrl:   `https://drive.google.com/file/d/${v.id}/preview`,
    thumbnail:  `https://drive.google.com/thumbnail?id=${v.id}&sz=w640`,
  }));

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ videos, total: videos.length }),
  };
};
