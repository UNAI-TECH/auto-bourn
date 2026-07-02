const https = require('https');

const url = 'https://njvgqybtgakgevnxmetf.supabase.co/storage/v1/object/public/car-images/avatars/avatar-ADMIN001-bnudh1p3hef.jpeg';

https.get(url, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
}).on('error', (e) => {
  console.error(e);
});
