const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://njvgqybtgakgevnxmetf.supabase.co';
// Let's use the service key from .env.local
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

async function run() {
  console.log('--- FETCHING CARS AND IMAGES USING SERVICE KEY ---');
  try {
    const { data: cars, error } = await supabase
      .from('cars')
      .select('*, car_images(image_url, display_order)')
      .in('status', ['available', 'reserved'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cars:', error);
    } else {
      console.log(`Successfully fetched ${cars.length} cars.`);
      cars.forEach(car => {
        console.log(`Car: ${car.brand} ${car.model} (ID: ${car.id})`);
        console.log(`Thumbnail: ${car.thumbnail}`);
        console.log(`Images:`, car.car_images);
      });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  } finally {
    process.exit(0);
  }
}

run();
