const supabaseUrl = 'https://njvgqybtgakgevnxmetf.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMjczOTEsImV4cCI6MjA5NTYwMzM5MX0.s_0wNQ89cGbqFytmLspR8YFLuKRitY9ry1ToXMQ-WUc';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

async function testWithKey(name, key) {
  const url = `${supabaseUrl}/rest/v1/cars?select=id,brand,model,thumbnail,car_images(image_url)&limit=2`;
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    if (!res.ok) {
      console.log(`${name} failed with status:`, res.status, await res.text());
      return;
    }
    const data = await res.json();
    console.log(`${name} fetched:`, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`${name} error:`, err.message);
  }
}

async function run() {
  await testWithKey('ANON KEY', anonKey);
  await testWithKey('SERVICE KEY', serviceKey);
}

run();
