const https = require('https');

const urls = [
  'https://njvgqybtgakgevnxmetf.supabase.co/storage/v1/object/public/car-images/avatars/avatar-AB0069-m8tm2accl8.png',
  'https://njvgqybtgakgevnxmetf.supabase.co/storage/v1/object/public/car-images/avatars/avatar-AB1475-qdsrva5b5km.jpeg',
  'https://njvgqybtgakgevnxmetf.supabase.co/storage/v1/object/public/car-images/avatars/avatar-ADMIN001-ehwxuebfq3a.jpeg'
];

urls.forEach((url, index) => {
  https.get(url, (res) => {
    console.log(`URL ${index + 1} Status: ${res.statusCode}`);
  }).on('error', (e) => {
    console.error(`URL ${index + 1} Error:`, e);
  });
});
