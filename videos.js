const VIDEOS = [
  {
    id: '1O6uYZ6APwpLHhoxyERxK8VPvlG5DXMAh',
    title: 'Vendhu Thanindhathu Kaadu',
    category: 'movies',
    tags: ['Simbu movies'],
    date: '2024-01-01',
  },
];

module.exports = (req, res) => {
  const videos = VIDEOS.map(v => ({
    ...v,
    embedUrl:  `https://drive.google.com/file/d/${v.id}/preview`,
    thumbnail: `https://drive.google.com/thumbnail?id=${v.id}&sz=w640`,
  }));
  res.json({ videos, total: videos.length });
};
